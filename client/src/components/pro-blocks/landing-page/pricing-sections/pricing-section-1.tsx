import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import type { VariantProps } from "class-variance-authority"
import { CheckIcon, InformationCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
export type PricingFeature = {
  name: string
  tooltip: string
}

export type PricingPlanCard = {
  id: string
  name: string
  description: string
  badge?: string
  features: PricingFeature[]
  pricing: {
    monthly: number
    annually: number
  }
  variant?: VariantProps<typeof buttonVariants>["variant"]
  highlighted?: boolean
  /** When false, the plan cannot be purchased (e.g. auto-assigned trial). */
  purchasable?: boolean
  ctaLabel?: string
}

export type PricingSection1Props = {
  plans?: PricingPlanCard[]
  billingPeriod?: "monthly" | "annually"
  onBillingPeriodChange?: (period: "monthly" | "annually") => void
  currentPlanId?: string | null
  upgradingPlanId?: string | null
  loading?: boolean
  onSelectPlan?: (planId: string, annual: boolean) => void
  className?: string
}

const defaultPlans: PricingPlanCard[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Perfect for individuals and small projects",
    features: [
      {
        name: "Up to 5 team members",
        tooltip:
          "Collaborate with up to 5 team members on unlimited projects",
      },
      {
        name: "10GB storage space",
        tooltip: "Secure cloud storage for all your project files and assets",
      },
      {
        name: "Basic analytics",
        tooltip: "Access to essential metrics and performance tracking",
      },
    ],
    pricing: {
      monthly: 29,
      annually: 290,
    },
    variant: "secondary",
  },
  {
    id: "standard",
    name: "Standard",
    description: "Ideal for growing teams and businesses",
    badge: "Most popular",
    features: [
      {
        name: "Up to 20 team members",
        tooltip: "Scale your team with expanded collaboration capabilities",
      },
      {
        name: "50GB storage space",
        tooltip: "More storage for larger projects and asset libraries",
      },
      {
        name: "Advanced analytics",
        tooltip: "Detailed insights with custom reporting and dashboards",
      },
      {
        name: "Priority support",
        tooltip: "Get help within 24 hours from our dedicated support team",
      },
    ],
    pricing: {
      monthly: 49,
      annually: 490,
    },
    variant: "default",
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    description: "For large enterprises and advanced",
    features: [
      {
        name: "Unlimited team members",
        tooltip: "No limits on team size or collaboration",
      },
      {
        name: "250GB storage space",
        tooltip: "Enterprise-grade storage with advanced security",
      },
      {
        name: "Custom analytics",
        tooltip: "Tailored analytics solutions with API access",
      },
      {
        name: "24/7 premium support",
        tooltip:
          "Round-the-clock dedicated support with 4-hour response time",
      },
      {
        name: "White-labeling",
        tooltip: "Custom branding and white-label solutions",
      },
    ],
    pricing: {
      monthly: 99,
      annually: 990,
    },
    variant: "secondary",
  },
]

export function PricingSection1({
  plans = defaultPlans,
  billingPeriod: controlledPeriod,
  onBillingPeriodChange,
  currentPlanId = null,
  upgradingPlanId = null,
  loading = false,
  onSelectPlan,
  className,
}: PricingSection1Props) {
  const [uncontrolledPeriod, setUncontrolledPeriod] = React.useState<
    "monthly" | "annually"
  >("monthly")

  const billingPeriod = controlledPeriod ?? uncontrolledPeriod

  const setBillingPeriod = (value: string) => {
    const next = value === "annually" ? "annually" : "monthly"
    onBillingPeriodChange?.(next)
    if (controlledPeriod === undefined) {
      setUncontrolledPeriod(next)
    }
  }

  const columnsClass =
    plans.length === 2
      ? "lg:max-w-3xl lg:grid-cols-2"
      : "lg:max-w-5xl lg:grid-cols-3"

  return (
    <section
      className={cn("w-full", className)}
      aria-labelledby="pricing-section-title"
    >
      <div className="flex flex-col items-center gap-8">
        <Tabs
          value={billingPeriod}
          onValueChange={setBillingPeriod}
          className="w-fit"
        >
          <TabsList className="h-10 rounded-full bg-muted">
            <TabsTrigger
              value="monthly"
              className="rounded-full px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Monthly
            </TabsTrigger>
            <TabsTrigger
              value="annually"
              className="rounded-full px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Annually <Badge variant="outline">Save ~17%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading plans…</p>
        ) : (
          <div
            className={cn(
              "grid w-full grid-cols-1 gap-4",
              columnsClass
            )}
          >
            {plans.map((plan, index) => {
              const isCurrent = currentPlanId === plan.id
              const isUpgrading = upgradingPlanId === plan.id
              const canPurchase = plan.purchasable !== false

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "rounded-xl p-6 shadow-xs lg:p-8",
                    plan.highlighted && "border-2 border-primary"
                  )}
                >
                  <CardContent className="flex flex-col gap-8 p-0">
                    <div className="flex flex-col gap-6">
                      <div className="relative flex flex-col gap-3">
                        {plan.badge ? (
                          <Badge className="absolute top-1 right-0 w-fit">
                            {plan.badge}
                          </Badge>
                        ) : null}
                        <h3
                          className={cn(
                            "font-semibold",
                            plan.highlighted && "text-primary"
                          )}
                        >
                          {plan.name}
                          {isCurrent ? (
                            <Badge
                              variant="secondary"
                              className="ml-2 capitalize"
                            >
                              Current
                            </Badge>
                          ) : null}
                        </h3>
                        <p className="text-muted-foreground">
                          {plan.description}
                        </p>
                      </div>

                      <div className="flex items-end gap-0.5">
                        <span className="text-5xl font-medium tracking-tight">
                          ${plan.pricing[billingPeriod]}
                        </span>
                        <span className="text-base text-muted-foreground">
                          /{billingPeriod === "monthly" ? "month" : "year"}
                        </span>
                      </div>

                      <Button
                        variant={plan.variant ?? "secondary"}
                        className="w-full"
                        size="lg"
                        disabled={
                          isCurrent ||
                          !canPurchase ||
                          upgradingPlanId !== null ||
                          !onSelectPlan
                        }
                        onClick={() =>
                          onSelectPlan?.(
                            plan.id,
                            billingPeriod === "annually"
                          )
                        }
                      >
                        {isUpgrading ? (
                          <Spinner className="size-4" />
                        ) : isCurrent ? (
                          "Current plan"
                        ) : !canPurchase ? (
                          (plan.ctaLabel ?? "Included")
                        ) : (
                          (plan.ctaLabel ?? "Upgrade")
                        )}
                      </Button>
                    </div>

                    <div className="flex flex-col gap-4">
                      <p className="text-sm font-medium">
                        {index === 0
                          ? "What's included:"
                          : `Everything in ${plans[index - 1]?.name}, plus:`}
                      </p>
                      <div className="flex flex-col gap-4">
                        {plan.features.map((feature) => (
                          <div
                            key={feature.name}
                            className="flex items-center gap-2"
                          >
                            <HugeiconsIcon
                              icon={CheckIcon}
                              className="size-5 text-primary"
                            />
                            <span className="flex-1 text-sm font-medium leading-5 text-muted-foreground">
                              {feature.name}
                            </span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger
                                  aria-label={`More information about ${feature.name}`}
                                >
                                  <HugeiconsIcon
                                    icon={InformationCircleIcon}
                                    className="size-4 cursor-pointer text-muted-foreground opacity-70 hover:opacity-100"
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>{feature.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
