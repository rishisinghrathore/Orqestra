import { authClient } from "@/lib/auth-client"

export type UserSession = {
  id: string
  token: string
  userId: string
  expiresAt: string | Date
  createdAt: string | Date
  updatedAt: string | Date
  ipAddress?: string | null
  userAgent?: string | null
}

export type DeviceType = "mobile" | "tablet" | "laptop"

export const sessionKeys = {
  all: ["sessions"] as const,
  list: () => [...sessionKeys.all, "list"] as const,
}

export async function listSessions() {
  const { data, error } = await authClient.listSessions()
  if (error) {
    throw new Error(error.message ?? "Failed to load sessions")
  }
  return (data ?? []) as UserSession[]
}

export async function revokeSession(token: string) {
  const { data, error } = await authClient.revokeSession({ token })
  if (error) {
    throw new Error(error.message ?? "Failed to revoke session")
  }
  return data
}

export function getDeviceType(userAgent?: string | null): DeviceType {
  if (!userAgent?.trim()) return "laptop"

  const ua = userAgent

  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) {
    return "tablet"
  }

  if (
    /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(
      ua
    )
  ) {
    return "mobile"
  }

  return "laptop"
}

export function formatDeviceType(type: DeviceType) {
  if (type === "mobile") return "Mobile"
  if (type === "tablet") return "Tablet"
  return "Laptop"
}

/** Lightweight device label from a user-agent string. */
export function formatUserAgent(userAgent?: string | null) {
  if (!userAgent?.trim()) return "Unknown device"

  const ua = userAgent
  let browser = "Browser"
  if (/Edg\//i.test(ua)) browser = "Edge"
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome"
  else if (/Firefox\//i.test(ua)) browser = "Firefox"
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari"

  let os = "Unknown OS"
  if (/Windows/i.test(ua)) os = "Windows"
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS"
  else if (/Android/i.test(ua)) os = "Android"
  else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS"
  else if (/Linux/i.test(ua)) os = "Linux"

  return `${browser} on ${os}`
}

export function formatSessionDate(value: string | Date | null | undefined) {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
