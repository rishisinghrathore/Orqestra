import MetricLineChart, {
  type MetricPoint,
} from "@/pages/home/components/metric-line-chart"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

const series = (
  values: number[]
): MetricPoint[] =>
  days.map((label, index) => ({
    label,
    value: values[index] ?? 0,
  }))

const analyticsMetrics = [
  {
    id: "link",
    title: "Link",
    description: "Clicks this week",
    color: "var(--chart-1)",
    data: series([420, 510, 480, 620, 590, 710, 680]),
  },
  {
    id: "url",
    title: "URL",
    description: "Short URLs created",
    color: "var(--chart-2)",
    data: series([86, 92, 78, 110, 104, 128, 119]),
  },
  {
    id: "redirect",
    title: "Redirect",
    description: "Successful redirects",
    color: "var(--chart-3)",
    data: series([980, 1120, 1050, 1280, 1210, 1340, 1295]),
  },
  {
    id: "platform",
    title: "Platform",
    description: "Active platforms",
    color: "var(--chart-4)",
    data: series([12, 14, 13, 16, 15, 18, 17]),
  },
] as const

const AnalyticsLineCharts = () => {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-medium tracking-tight">Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Weekly trends for links, URLs, redirects, and platforms.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {analyticsMetrics.map((metric) => {
          const total = metric.data.reduce(
            (sum, point) => sum + point.value,
            0
          )
          return (
            <MetricLineChart
              key={metric.id}
              title={metric.title}
              description={metric.description}
              totalLabel={total.toLocaleString()}
              data={[...metric.data]}
              color={metric.color}
            />
          )
        })}
      </div>
    </section>
  )
}

export default AnalyticsLineCharts
