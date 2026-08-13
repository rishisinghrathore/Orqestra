import { ChartBar as RevenueChartBar } from "@/components/examples/c-chart-1"
import { ChartBar as MarketShareChartBar } from "@/components/examples/c-chart-2"
import { Chart3D as ForecastChartBar } from "@/components/examples/c-chart-8"

const chartContainerClassName =
  "h-[500px] overflow-hidden rounded-lg border border-border bg-background outline-2 outline-offset-2 outline-secondary"

const chartWrapperClassName =
  "flex h-full flex-col [&>div]:h-full [&>div]:max-w-none [&>div]:border-0 [&>div]:shadow-none [&>div]:outline-none"

export function HomeRevenueChart() {
  return (
    <div className={chartContainerClassName}>
      <div className={chartWrapperClassName}>
        <RevenueChartBar />
      </div>
    </div>
  )
}

export function HomeMarketShareChart() {
  return (
    <div className={chartContainerClassName}>
      <div className={chartWrapperClassName}>
        <MarketShareChartBar />
      </div>
    </div>
  )
}

export function HomeForecastChart() {
  return (
    <div className={chartContainerClassName}>
      <div className={chartWrapperClassName}>
        <ForecastChartBar />
      </div>
    </div>
  )
}
