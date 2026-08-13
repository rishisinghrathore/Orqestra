export const USER_FIELD_TYPES = [
  'TEXT',
  'NUMBER',
  'BOOLEAN',
  'DATE',
  'DATETIME',
  'SELECT',
] as const;

export type UserFieldType = (typeof USER_FIELD_TYPES)[number];

export const SYSTEM_FIELD_TYPES = ['UUID'] as const;

export type FieldType = UserFieldType | (typeof SYSTEM_FIELD_TYPES)[number];

export const isUserFieldType = (value: string): value is UserFieldType =>
  (USER_FIELD_TYPES as readonly string[]).includes(value);

export const sqlTypeForField = (type: FieldType): string => {
  switch (type) {
    case 'UUID':
      return 'uuid';
    case 'NUMBER':
      return 'numeric';
    case 'BOOLEAN':
      return 'boolean';
    case 'DATE':
      return 'date';
    case 'DATETIME':
      return 'timestamptz';
    case 'TEXT':
    case 'SELECT':
      return 'text';
    default:
      throw new Error(`Unsupported field type: ${type}`);
  }
};

export const fieldTypeLabel = (type: string): string => {
  switch (type) {
    case 'UUID':
      return 'UUID';
    case 'NUMBER':
      return 'Number';
    case 'BOOLEAN':
      return 'Boolean';
    case 'DATE':
      return 'Date';
    case 'DATETIME':
      return 'Date and Time';
    case 'SELECT':
      return 'Select';
    case 'TEXT':
      return 'Text';
    default:
      return type;
  }
};
