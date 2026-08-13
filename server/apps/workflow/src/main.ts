import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { WorkflowWorkerModule } from './workflow-worker.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkflowWorkerModule);
  const config = app.get(ConfigService);
  const port = Number(config.get<string | number>('WORKFLOW_PORT', 3002));
  await app.listen(port);
  console.log(`Workflow worker listening on http://localhost:${port}`);
}

bootstrap();
