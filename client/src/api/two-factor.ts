import { authClient } from "@/lib/auth-client"

export type EnableTwoFactorResult = {
  totpURI: string
  backupCodes: string[]
}

export const twoFactorKeys = {
  all: ["two-factor"] as const,
}

export async function enableTwoFactor(password: string) {
  const { data, error } = await authClient.twoFactor.enable({ password })
  if (error) {
    throw new Error(error.message ?? "Failed to enable two-factor authentication")
  }
  return data as EnableTwoFactorResult
}

export async function verifyTotpSetup(code: string) {
  const { data, error } = await authClient.twoFactor.verifyTotp({ code })
  if (error) {
    throw new Error(error.message ?? "Invalid authenticator code")
  }
  return data
}

export async function verifyTotpLogin(input: {
  code: string
  trustDevice?: boolean
}) {
  const { data, error } = await authClient.twoFactor.verifyTotp({
    code: input.code,
    trustDevice: input.trustDevice,
  })
  if (error) {
    throw new Error(error.message ?? "Invalid authenticator code")
  }
  return data
}

export async function verifyBackupCodeLogin(input: {
  code: string
  trustDevice?: boolean
}) {
  const { data, error } = await authClient.twoFactor.verifyBackupCode({
    code: input.code,
    trustDevice: input.trustDevice,
  })
  if (error) {
    throw new Error(error.message ?? "Invalid backup code")
  }
  return data
}

export async function disableTwoFactor(password: string) {
  const { data, error } = await authClient.twoFactor.disable({ password })
  if (error) {
    throw new Error(error.message ?? "Failed to disable two-factor authentication")
  }
  return data
}
