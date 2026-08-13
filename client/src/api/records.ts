import { isAxiosError } from "axios"

import { api } from "@/lib/axios"

export type ObjectRecord = {
  id: string
  createdAt: string
  updatedAt: string
  fields: Record<string, unknown>
}

function recordsError(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message
    )
  }
  if (error instanceof Error) return error.message
  return fallback
}

export async function listObjectRecords(
  organizationId: string,
  objectId: string
) {
  try {
    const { data } = await api.get<{ records: ObjectRecord[] }>(
      `/api/data-model/objects/${objectId}/records`,
      { params: { organizationId } }
    )
    return data.records ?? []
  } catch (error) {
    throw new Error(recordsError(error, "Failed to load records"))
  }
}

export async function createObjectRecord(
  organizationId: string,
  objectId: string,
  fields: Record<string, string | number | boolean | null>
) {
  try {
    const { data } = await api.post<{ record: ObjectRecord }>(
      `/api/data-model/objects/${objectId}/records`,
      { fields },
      { params: { organizationId } }
    )
    return data.record
  } catch (error) {
    throw new Error(recordsError(error, "Failed to create record"))
  }
}

export async function deleteObjectRecord(
  organizationId: string,
  objectId: string,
  recordId: string
) {
  try {
    await api.delete(
      `/api/data-model/objects/${objectId}/records/${recordId}`,
      { params: { organizationId } }
    )
  } catch (error) {
    throw new Error(recordsError(error, "Failed to delete record"))
  }
}
