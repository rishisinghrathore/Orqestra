import { isAxiosError } from "axios"

import { api } from "@/lib/axios"
import { authClient } from "@/lib/auth-client"

export type Account = {
  id: string
  providerId: string
  accountId: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export const accountKeys = {
  all: ["accounts"] as const,
  list: () => [...accountKeys.all, "list"] as const,
}

export async function listAccounts() {
  const { data, error } = await authClient.listAccounts()
  if (error) {
    throw new Error(error.message ?? "Failed to load accounts")
  }
  return (data ?? []) as Account[]
}

export async function setPassword(newPassword: string) {
  try {
    const { data } = await api.post("/api/account/set-password", {
      newPassword,
    })
    return data
  } catch (error) {
    if (isAxiosError(error)) {
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ??
        error.message
      throw new Error(message)
    }
    throw error
  }
}
