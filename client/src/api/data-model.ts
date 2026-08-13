import { isAxiosError } from "axios"

import { api } from "@/lib/axios"

export type ObjectApp = "custom" | "standard"

export type SelectOption = {
  value: string
  label: string
}

export type DataObjectField = {
  id: string
  key: string
  name: string
  app: ObjectApp
  dataType: string
  type: string
  isCustom: boolean
  isSystem: boolean
  options: SelectOption[] | null
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

export const USER_FIELD_TYPES = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "BOOLEAN", label: "Boolean" },
  { value: "DATE", label: "Date" },
  { value: "DATETIME", label: "Date and Time" },
  { value: "SELECT", label: "Select" },
] as const

function dataModelError(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message
    )
  }
  if (error instanceof Error) return error.message
  return fallback
}

export async function listDataObjects(organizationId: string) {
  try {
    const { data } = await api.get<{ objects: DataObject[] }>(
      "/api/data-model/objects",
      { params: { organizationId } }
    )
    return data.objects ?? []
  } catch (error) {
    throw new Error(dataModelError(error, "Failed to load objects"))
  }
}

export async function getDataObject(
  organizationId: string,
  objectId: string
) {
  try {
    const { data } = await api.get<DataObject>(
      `/api/data-model/objects/${objectId}`,
      { params: { organizationId } }
    )
    return data
  } catch (error) {
    throw new Error(dataModelError(error, "Failed to load object"))
  }
}

export async function createDataObject(
  organizationId: string,
  input: {
    singularName: string
    pluralName: string
    description: string
  }
) {
  try {
    const { data } = await api.post<DataObject>(
      "/api/data-model/objects",
      input,
      { params: { organizationId } }
    )
    return data
  } catch (error) {
    throw new Error(dataModelError(error, "Failed to create object"))
  }
}

export async function updateDataObject(
  organizationId: string,
  objectId: string,
  patch: Partial<
    Pick<DataObject, "singularName" | "pluralName" | "description">
  >
) {
  try {
    const { data } = await api.patch<DataObject>(
      `/api/data-model/objects/${objectId}`,
      patch,
      { params: { organizationId } }
    )
    return data
  } catch (error) {
    throw new Error(dataModelError(error, "Failed to update object"))
  }
}

export async function deleteDataObject(
  organizationId: string,
  objectId: string
) {
  try {
    await api.delete(`/api/data-model/objects/${objectId}`, {
      params: { organizationId },
    })
  } catch (error) {
    throw new Error(dataModelError(error, "Failed to delete object"))
  }
}

export async function createDataObjectField(
  organizationId: string,
  objectId: string,
  input: {
    name: string
    type: string
    options?: SelectOption[]
  }
) {
  try {
    const { data } = await api.post<DataObjectField>(
      `/api/data-model/objects/${objectId}/fields`,
      input,
      { params: { organizationId } }
    )
    return data
  } catch (error) {
    throw new Error(dataModelError(error, "Failed to add field"))
  }
}

export async function updateDataObjectField(
  organizationId: string,
  fieldId: string,
  patch: {
    label?: string
    options?: SelectOption[]
  }
) {
  try {
    const { data } = await api.patch<DataObjectField>(
      `/api/data-model/fields/${fieldId}`,
      patch,
      { params: { organizationId } }
    )
    return data
  } catch (error) {
    throw new Error(dataModelError(error, "Failed to update field"))
  }
}

export async function deleteDataObjectField(
  organizationId: string,
  fieldId: string
) {
  try {
    await api.delete(`/api/data-model/fields/${fieldId}`, {
      params: { organizationId },
    })
  } catch (error) {
    throw new Error(dataModelError(error, "Failed to delete field"))
  }
}
