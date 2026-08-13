import type { SelectOption } from "@/api/data-model"

export type ObjectApp = "custom" | "standard"

export type DataObjectField = {
  id: string
  name: string
  app: ObjectApp
  dataType: string
  type?: string
  isCustom?: boolean
  isSystem?: boolean
  options?: SelectOption[] | null
}

export type DataObjectRelation = {
  id: string
  name: string
  app: ObjectApp
  type: string
}

export type DataObject = {
  id: string
  singularName: string
  pluralName: string
  description: string
  app: ObjectApp
  records: number
  fields: DataObjectField[]
  relations: DataObjectRelation[]
}

export {
  USER_FIELD_TYPES,
  createDataObject,
  createDataObjectField,
  deleteDataObject,
  deleteDataObjectField,
  getDataObject,
  listDataObjects,
  updateDataObject,
  updateDataObjectField,
} from "@/api/data-model"
export type { SelectOption } from "@/api/data-model"
