import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import {
  DatabaseIcon,
  GaugeIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"

const MonitoringPage = () => {
  return (
    <EmptyWorkspacePage
      icon={GaugeIcon}
      title="No monitoring data yet"
      description="Connect a source to start tracking workspace health, latency, and observability."
      primaryAction={{ label: "Connect source", icon: DatabaseIcon }}
      secondaryAction={{
        label: "Invite team",
        icon: UserAdd01Icon,
        variant: "outline",
      }}
    />
  )
}

export default MonitoringPage
