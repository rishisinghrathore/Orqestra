import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { WorkflowModule } from '@app/workflow';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(__dirname, '../../../../.env'),
      ],
    }),
    WorkflowModule,
  ],
})
export class WorkflowWorkerModule {}
