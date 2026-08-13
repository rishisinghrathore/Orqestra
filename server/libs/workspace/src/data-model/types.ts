import type { FieldType } from '../sql/field-types';

export type SelectOption = {
  value: string;
  label: string;
};

export type FieldMetadataRow = {
  id: string;
  organization_id: string;
  object_metadata_id: string;
  name: string;
  label: string;
  type: FieldType;
  is_custom: boolean;
  is_nullable: boolean;
  is_system: boolean;
  default_value: string | null;
  options: SelectOption[] | null;
  position: number;
  created_at: Date;
  updated_at: Date;
};

export type ObjectMetadataRow = {
  id: string;
  organization_id: string;
  name_singular: string;
  name_plural: string;
  label_singular: string;
  label_plural: string;
  description: string;
  is_custom: boolean;
  is_active: boolean;
  target_table_name: string;
  created_at: Date;
  updated_at: Date;
};

export type ObjectWithFields = ObjectMetadataRow & {
  fields: FieldMetadataRow[];
  records: number;
};
