import { isAxiosError } from "axios"

import { api } from "@/lib/axios"

export type BillingInvoice = {
  id: string
  number: string | null
  status: string | null
  currency: string
  amountDue: number
  amountPaid: number
  created: number
  periodStart: number
  periodEnd: number
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  description: string | null
}

export type BillingPayment = {
  id: string
  status: string
  paid: boolean
  refunded: boolean
  currency: string
  amount: number
  amountRefunded: number
  created: number
  description: string | null
  receiptUrl: string | null
  paymentMethod: string | null
  cardBrand: string | null
  cardLast4: string | null
}

function billingError(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message
    )
  }
  if (error instanceof Error) return error.message
  return fallback
}

export async function syncBillingSubscriptions(organizationId: string) {
  try {
    const { data } = await api.post<{ synced: number }>(
      "/api/billing/sync",
      null,
      { params: { organizationId } }
    )
    return data
  } catch (error) {
    throw new Error(billingError(error, "Failed to sync subscriptions"))
  }
}

export async function listBillingInvoices(organizationId: string) {
  try {
    const { data } = await api.get<{ invoices: BillingInvoice[] }>(
      "/api/billing/invoices",
      { params: { organizationId } }
    )
    return data.invoices ?? []
  } catch (error) {
    throw new Error(billingError(error, "Failed to load invoices"))
  }
}

export async function listBillingPayments(organizationId: string) {
  try {
    const { data } = await api.get<{ payments: BillingPayment[] }>(
      "/api/billing/payments",
      { params: { organizationId } }
    )
    return data.payments ?? []
  } catch (error) {
    throw new Error(billingError(error, "Failed to load payments"))
  }
}
