import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { FieldMetadataService } from './data-model/field-metadata.service';
import { ObjectMetadataService } from './data-model/object-metadata.service';
import { RecordService } from './data-model/record.service';
import { PG_POOL } from './workspace.constants';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Pool({
          connectionString: config.get<string>(
            'DATABASE_URL',
            'postgresql://postgres:postgres@localhost:5432/agentic',
          ),
        }),
    },
    ObjectMetadataService,
    FieldMetadataService,
    RecordService,
  ],
  exports: [PG_POOL, ObjectMetadataService, FieldMetadataService, RecordService],
})
export class WorkspaceModule {}
