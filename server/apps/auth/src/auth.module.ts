import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { WorkspaceModule } from '@app/workspace';
import { WorkflowModule } from '@app/workflow';
import { AuthController } from './auth.controller';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { DataModelController } from './data-model.controller';
import { OrganizationAccessService } from './organization-access.service';
import { WorkflowController } from './workflow.controller';
import { AUTH, createAuth } from './auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(__dirname, '../../../../.env'),
      ],
    }),
    WorkspaceModule,
    WorkflowModule,
  ],
  controllers: [
    AuthController,
    BillingController,
    DataModelController,
    WorkflowController,
  ],
  providers: [
    {
      provide: AUTH,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createAuth(config),
    },
    BillingService,
    OrganizationAccessService,
  ],
  exports: [AUTH],
})
export class AuthModule {}
