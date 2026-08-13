import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, type JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import {
  MessageQueue,
  type JobHandler,
  type JobOptions,
} from './message-queue.constants';

@Injectable()
export class MessageQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessageQueueService.name);
  private connection!: IORedis;
  private readonly queues = new Map<MessageQueue, Queue>();
  private readonly workers = new Map<MessageQueue, Worker>();
  private readonly handlers = new Map<
    MessageQueue,
    Map<string, JobHandler>
  >();

  constructor(private readonly config: ConfigService) {
    for (const queueName of Object.values(MessageQueue)) {
      this.handlers.set(queueName, new Map());
    }
  }

  onModuleInit() {
    const redisUrl = this.config.get<string>(
      'REDIS_URL',
      'redis://127.0.0.1:6379',
    );
    this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

    for (const queueName of Object.values(MessageQueue)) {
      this.queues.set(
        queueName,
        new Queue(queueName, { connection: this.connection }),
      );
    }

    if (this.config.get<string>('WORKFLOW_PROCESS_JOBS', 'true') === 'true') {
      this.startWorkers();
    }
  }

  registerHandler<T>(
    queueName: MessageQueue,
    jobName: string,
    handler: JobHandler<T>,
  ) {
    const queueHandlers = this.handlers.get(queueName);
    if (!queueHandlers) {
      throw new Error(`Unknown queue: ${queueName}`);
    }
    queueHandlers.set(jobName, handler as JobHandler);
  }

  async add<T>(
    queueName: MessageQueue,
    jobName: string,
    data: T,
    options?: JobOptions,
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Unknown queue: ${queueName}`);
    }

    const jobOptions: JobsOptions = {
      jobId: options?.jobId,
      delay: options?.delay,
      attempts: options?.attempts ?? 3,
      removeOnComplete: true,
      removeOnFail: 100,
    };

    await queue.add(jobName, data, jobOptions);
  }

  private startWorkers() {
    for (const queueName of Object.values(MessageQueue)) {
      const worker = new Worker(
        queueName,
        async (job) => {
          const handler = this.handlers.get(queueName)?.get(job.name);
          if (!handler) {
            throw new Error(
              `No handler registered for ${queueName}/${job.name}`,
            );
          }
          await handler(job.data);
        },
        { connection: this.connection },
      );

      worker.on('failed', (job, error) => {
        this.logger.error(
          `Job ${job?.name} failed on ${queueName}: ${error.message}`,
        );
      });

      this.workers.set(queueName, worker);
    }

    this.logger.log('Workflow job workers started');
  }

  async onModuleDestroy() {
    await Promise.all([...this.workers.values()].map((worker) => worker.close()));
    await Promise.all([...this.queues.values()].map((queue) => queue.close()));
    await this.connection?.quit();
  }
}
