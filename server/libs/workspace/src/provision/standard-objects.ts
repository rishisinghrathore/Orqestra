import type { FieldType } from '../sql/field-types';

export type StandardFieldSeed = {
  name: string;
  label: string;
  type: FieldType;
  isNullable: boolean;
  isSystem: boolean;
  position: number;
};

export type StandardObjectSeed = {
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  description: string;
  targetTableName: string;
  fields: StandardFieldSeed[];
};

const timestamps = (
  start: number,
): StandardFieldSeed[] => [
  {
    name: 'created_at',
    label: 'Creation date',
    type: 'DATETIME',
    isNullable: false,
    isSystem: true,
    position: start,
  },
  {
    name: 'updated_at',
    label: 'Last update',
    type: 'DATETIME',
    isNullable: false,
    isSystem: true,
    position: start + 1,
  },
  {
    name: 'deleted_at',
    label: 'Deleted at',
    type: 'DATETIME',
    isNullable: true,
    isSystem: true,
    position: start + 2,
  },
];

const idField = (position = 0): StandardFieldSeed => ({
  name: 'id',
  label: 'Id',
  type: 'UUID',
  isNullable: false,
  isSystem: true,
  position,
});

export const STANDARD_OBJECTS: StandardObjectSeed[] = [
  {
    nameSingular: 'company',
    namePlural: 'companies',
    labelSingular: 'Company',
    labelPlural: 'Companies',
    description: 'Companies associated with this workspace.',
    targetTableName: 'company',
    fields: [
      idField(),
      {
        name: 'name',
        label: 'Name',
        type: 'TEXT',
        isNullable: false,
        isSystem: false,
        position: 1,
      },
      {
        name: 'domain',
        label: 'Domain',
        type: 'TEXT',
        isNullable: true,
        isSystem: false,
        position: 2,
      },
      ...timestamps(3),
    ],
  },
  {
    nameSingular: 'person',
    namePlural: 'people',
    labelSingular: 'Person',
    labelPlural: 'People',
    description: 'People associated with companies in this workspace.',
    targetTableName: 'person',
    fields: [
      idField(),
      {
        name: 'first_name',
        label: 'First name',
        type: 'TEXT',
        isNullable: true,
        isSystem: false,
        position: 1,
      },
      {
        name: 'last_name',
        label: 'Last name',
        type: 'TEXT',
        isNullable: true,
        isSystem: false,
        position: 2,
      },
      {
        name: 'email',
        label: 'Email',
        type: 'TEXT',
        isNullable: true,
        isSystem: false,
        position: 3,
      },
      {
        name: 'company_id',
        label: 'Company',
        type: 'UUID',
        isNullable: true,
        isSystem: false,
        position: 4,
      },
      ...timestamps(5),
    ],
  },
  {
    nameSingular: 'note',
    namePlural: 'notes',
    labelSingular: 'Note',
    labelPlural: 'Notes',
    description: 'Notes captured in this workspace.',
    targetTableName: 'note',
    fields: [
      idField(),
      {
        name: 'body',
        label: 'Body',
        type: 'TEXT',
        isNullable: false,
        isSystem: false,
        position: 1,
      },
      {
        name: 'author_id',
        label: 'Author',
        type: 'TEXT',
        isNullable: true,
        isSystem: false,
        position: 2,
      },
      ...timestamps(3),
    ],
  },
  {
    nameSingular: 'workflow',
    namePlural: 'workflows',
    labelSingular: 'Workflow',
    labelPlural: 'Workflows',
    description: 'Automated workflows in this workspace.',
    targetTableName: 'workflow',
    fields: [
      idField(),
      {
        name: 'name',
        label: 'Name',
        type: 'TEXT',
        isNullable: true,
        isSystem: false,
        position: 1,
      },
      {
        name: 'last_published_version_id',
        label: 'Last published version',
        type: 'UUID',
        isNullable: true,
        isSystem: true,
        position: 2,
      },
      {
        name: 'statuses',
        label: 'Statuses',
        type: 'TEXT',
        isNullable: true,
        isSystem: true,
        position: 3,
      },
      {
        name: 'position',
        label: 'Position',
        type: 'NUMBER',
        isNullable: false,
        isSystem: true,
        position: 4,
      },
      ...timestamps(5),
    ],
  },
  {
    nameSingular: 'workflowVersion',
    namePlural: 'workflowVersions',
    labelSingular: 'Workflow version',
    labelPlural: 'Workflow versions',
    description: 'Published and draft versions of a workflow.',
    targetTableName: 'workflow_version',
    fields: [
      idField(),
      {
        name: 'name',
        label: 'Name',
        type: 'TEXT',
        isNullable: true,
        isSystem: false,
        position: 1,
      },
      {
        name: 'trigger',
        label: 'Trigger',
        type: 'TEXT',
        isNullable: true,
        isSystem: true,
        position: 2,
      },
      {
        name: 'steps',
        label: 'Steps',
        type: 'TEXT',
        isNullable: true,
        isSystem: true,
        position: 3,
      },
      {
        name: 'status',
        label: 'Status',
        type: 'TEXT',
        isNullable: false,
        isSystem: false,
        position: 4,
      },
      {
        name: 'workflow_id',
        label: 'Workflow',
        type: 'UUID',
        isNullable: false,
        isSystem: true,
        position: 5,
      },
      {
        name: 'position',
        label: 'Position',
        type: 'NUMBER',
        isNullable: false,
        isSystem: true,
        position: 6,
      },
      ...timestamps(7),
    ],
  },
  {
    nameSingular: 'workflowRun',
    namePlural: 'workflowRuns',
    labelSingular: 'Workflow run',
    labelPlural: 'Workflow runs',
    description: 'Execution history for workflows.',
    targetTableName: 'workflow_run',
    fields: [
      idField(),
      {
        name: 'name',
        label: 'Name',
        type: 'TEXT',
        isNullable: true,
        isSystem: false,
        position: 1,
      },
      {
        name: 'status',
        label: 'Status',
        type: 'TEXT',
        isNullable: false,
        isSystem: false,
        position: 2,
      },
      {
        name: 'enqueued_at',
        label: 'Enqueued at',
        type: 'DATETIME',
        isNullable: true,
        isSystem: true,
        position: 3,
      },
      {
        name: 'started_at',
        label: 'Started at',
        type: 'DATETIME',
        isNullable: true,
        isSystem: true,
        position: 4,
      },
      {
        name: 'ended_at',
        label: 'Ended at',
        type: 'DATETIME',
        isNullable: true,
        isSystem: true,
        position: 5,
      },
      {
        name: 'state',
        label: 'State',
        type: 'TEXT',
        isNullable: false,
        isSystem: true,
        position: 6,
      },
      {
        name: 'step_logs',
        label: 'Step logs',
        type: 'TEXT',
        isNullable: true,
        isSystem: true,
        position: 7,
      },
      {
        name: 'workflow_id',
        label: 'Workflow',
        type: 'UUID',
        isNullable: false,
        isSystem: true,
        position: 8,
      },
      {
        name: 'workflow_version_id',
        label: 'Workflow version',
        type: 'UUID',
        isNullable: true,
        isSystem: true,
        position: 9,
      },
      ...timestamps(10),
    ],
  },
  {
    nameSingular: 'workflowAutomatedTrigger',
    namePlural: 'workflowAutomatedTriggers',
    labelSingular: 'Workflow trigger',
    labelPlural: 'Workflow triggers',
    description: 'Automated triggers attached to workflows.',
    targetTableName: 'workflow_automated_trigger',
    fields: [
      idField(),
      {
        name: 'type',
        label: 'Type',
        type: 'TEXT',
        isNullable: false,
        isSystem: false,
        position: 1,
      },
      {
        name: 'settings',
        label: 'Settings',
        type: 'TEXT',
        isNullable: false,
        isSystem: true,
        position: 2,
      },
      {
        name: 'workflow_id',
        label: 'Workflow',
        type: 'UUID',
        isNullable: false,
        isSystem: true,
        position: 3,
      },
      ...timestamps(4),
    ],
  },
];

export const CUSTOM_OBJECT_SYSTEM_FIELDS: StandardFieldSeed[] = [
  idField(),
  ...timestamps(1),
];
