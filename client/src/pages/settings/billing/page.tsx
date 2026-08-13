import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  listBillingInvoices,
  listBillingPayments,
  syncBillingSubscriptions,
  type BillingInvoice,
  type BillingPayment,
} from "@/api/billing"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import {
  PricingSection1,
  type PricingPlanCard,
} from "@/components/pro-blocks/landing-page/pricing-sections/pricing-section-1"
import { authClient, subscription } from "@/lib/auth-client"

const BILLING_PLANS = [
  {
    id: "trial",
    name: "Trial",
    description: "Free for 7 days when you create a workspace",
    badge: "Auto-started",
    seats: 2,
    purchasable: false,
    ctaLabel: "Workspace trial",
    features: [
      {
        name: "Up to 2 seats",
        tooltip: "Invite up to 2 members during the trial",
      },
      {
        name: "2 projects",
        tooltip: "Create and manage up to 2 projects",
      },
      {
        name: "1 GB storage",
        tooltip: "Starter storage for trial workspaces",
      },
      {
        name: "Cancels after 7 days",
        tooltip: "Upgrade to Basic or Pro before the trial ends to keep access",
      },
    ],
    pricing: {
      monthly: 0,
      annually: 0,
    },
    variant: "secondary" as const,
  },
  {
    id: "basic",
    name: "Basic",
    description: "Essential workspace features for small teams",
    seats: 10,
    features: [
      {
        name: "Up to 10 seats",
        tooltip: "Invite up to 10 members in this workspace",
      },
      {
        name: "5 projects",
        tooltip: "Create and manage up to 5 projects",
      },
      {
        name: "10 GB storage",
        tooltip: "Secure cloud storage for workspace files",
      },
    ],
    pricing: {
      monthly: 9,
      annually: 90,
    },
    variant: "secondary" as const,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Advanced features for growing teams in workspace",
    badge: "Most popular",
    seats: 20,
    features: [
      {
        name: "Up to 20 seats",
        tooltip: "Invite up to 20 members in this workspace",
      },
      {
        name: "20 projects",
        tooltip: "Create and manage up to 20 projects",
      },
      {
        name: "50 GB storage",
        tooltip: "Expanded storage for larger teams",
      },
    ],
    pricing: {
      monthly: 29,
      annually: 290,
    },
    variant: "default" as const,
    highlighted: true,
  },
] satisfies Array<PricingPlanCard & { seats: number }>

type SubscriptionRow = {
  id: string
  plan: string
  status: string
  stripeSubscriptionId?: string | null
  seats?: number | null
  cancelAtPeriodEnd?: boolean | null
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)

const formatDate = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

const BillingSettingsPage = () => {
  const { data: activeOrganization } = authClient.useActiveOrganization()
  const organizationId = activeOrganization?.id
  const [searchParams, setSearchParams] = useSearchParams()
  const purchaseToastShown = useRef(false)

  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([])
  const [invoices, setInvoices] = useState<BillingInvoice[]>([])
  const [payments, setPayments] = useState<BillingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [tablesLoading, setTablesLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">(
    "monthly"
  )
  const [error, setError] = useState<string | null>(null)

  const activeSubscription = useMemo(() => {
    const active = subscriptions.find((sub) => sub.status === "active")
    if (active) return active
    return subscriptions.find((sub) => sub.status === "trialing") ?? null
  }, [subscriptions])

  const currentPlanId = activeSubscription?.plan?.toLowerCase() ?? null

  const loadSubscriptions = useCallback(async () => {
    if (!organizationId) {
      setSubscriptions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await syncBillingSubscriptions(organizationId)
    } catch {
      // Sync is best-effort when webhooks are unavailable.
    }

    const { data, error: listError } = await subscription.list({
      query: {
        referenceId: organizationId,
        customerType: "organization",
      },
    })

    if (listError) {
      setError(listError.message ?? "Failed to load subscriptions")
      setSubscriptions([])
      setLoading(false)
      return
    }

    setSubscriptions((data as SubscriptionRow[] | null) ?? [])
    setLoading(false)
  }, [organizationId])

  const loadBillingHistory = useCallback(async () => {
    if (!organizationId) {
      setInvoices([])
      setPayments([])
      setTablesLoading(false)
      return
    }

    setTablesLoading(true)

    try {
      const [invoiceRows, paymentRows] = await Promise.all([
        listBillingInvoices(organizationId),
        listBillingPayments(organizationId),
      ])
      setInvoices(invoiceRows)
      setPayments(paymentRows)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load billing history"
      )
      setInvoices([])
      setPayments([])
    } finally {
      setTablesLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    void loadSubscriptions()
    void loadBillingHistory()
  }, [loadSubscriptions, loadBillingHistory])

  useEffect(() => {
    if (loading || purchaseToastShown.current) return

    const purchased = searchParams.get("purchased")
    const planId = searchParams.get("plan")
    if (purchased !== "1" || !planId) return

    purchaseToastShown.current = true
    const plan = BILLING_PLANS.find((p) => p.id === planId)

    toast.add({
      type: "success",
      title: "Plan purchased",
      description: plan
        ? `You're now on the ${plan.name} plan.`
        : "Your subscription was updated successfully.",
    })

    const next = new URLSearchParams(searchParams)
    next.delete("purchased")
    next.delete("plan")
    setSearchParams(next, { replace: true })
  }, [loading, searchParams, setSearchParams])

  const onUpgrade = async (planId: string, annual: boolean) => {
    if (!organizationId || planId === "trial") return

    const plan = BILLING_PLANS.find((p) => p.id === planId)
    if (!plan || plan.purchasable === false) return

    setUpgrading(planId)
    setError(null)

    const billingUrl = `${window.location.origin}/settings/billing?purchased=1&plan=${planId}`

    // Flat-rate plans: quantity stays 1. Seat caps live in plan.limits (Basic 10 / Pro 20).
    // Passing seats here would multiply Stripe qty × unit price.
    const { error: upgradeError } = await subscription.upgrade({
      plan: planId,
      annual,
      customerType: "organization",
      referenceId: organizationId,
      subscriptionId: activeSubscription?.stripeSubscriptionId ?? undefined,
      successUrl: billingUrl,
      cancelUrl: `${window.location.origin}/settings/billing`,
      returnUrl: billingUrl,
    })

    if (upgradeError) {
      setError(upgradeError.message ?? "Failed to start upgrade")
      setUpgrading(null)
      toast.add({
        type: "error",
        title: "Upgrade failed",
        description: upgradeError.message ?? "Failed to start upgrade",
      })
    }
  }

  if (!organizationId) {
    return (
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
        <div className="flex w-full max-w-5xl flex-col gap-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Select a workspace to manage billing.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-5xl flex-col gap-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your workspace subscription, invoices, and payment methods.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-medium">Plans</h2>
            <p className="text-sm text-muted-foreground">
              Choose a plan for {activeOrganization?.name ?? "this workspace"}.
            </p>
          </div>

          <PricingSection1
            plans={BILLING_PLANS}
            billingPeriod={billingPeriod}
            onBillingPeriodChange={setBillingPeriod}
            currentPlanId={currentPlanId}
            upgradingPlanId={upgrading}
            loading={loading}
            onSelectPlan={(planId, annual) => void onUpgrade(planId, annual)}
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-medium">Invoices</h2>
            <p className="text-sm text-muted-foreground">
              Invoices issued for this workspace.
            </p>
          </div>

          <div className="rounded-lg border border-border">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead >Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tablesLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Loading invoices…
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No invoices yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.number ?? invoice.id}
                      </TableCell>
                      <TableCell>{formatDate(invoice.created)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {invoice.status ?? "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatMoney(invoice.amountDue, invoice.currency)}
                      </TableCell>
                      <TableCell className="">
                        {invoice.hostedInvoiceUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            render={
                              <a
                                href={invoice.hostedInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                              />
                            }
                          >
                            View
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-medium">Payments</h2>
            <p className="text-sm text-muted-foreground">
              Successful and attempted charges for this workspace.
            </p>
          </div>

          <div className="rounded-lg border border-border">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead >Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tablesLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      Loading payments…
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      No payments yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="truncate font-mono text-sm">
                        {payment.id}
                      </TableCell>
                      <TableCell>{formatDate(payment.created)}</TableCell>
                      <TableCell className="capitalize">
                        {payment.cardBrand && payment.cardLast4
                          ? `${payment.cardBrand} ···· ${payment.cardLast4}`
                          : (payment.paymentMethod ?? "—")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {payment.refunded
                            ? "refunded"
                            : payment.paid
                              ? "paid"
                              : payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatMoney(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>
                        {payment.receiptUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            render={
                              <a
                                href={payment.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                              />
                            }
                          >
                            Receipt
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default BillingSettingsPage
