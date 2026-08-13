import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { AuthController } from './auth.controller';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
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
  ],
  controllers: [AuthController, BillingController],
  providers: [
    {
      provide: AUTH,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createAuth(config),
    },
    BillingService,
  ],
  exports: [AUTH],
})
export class AuthModule {}
