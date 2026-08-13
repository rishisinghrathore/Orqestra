import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import {
  AnalyticsUpIcon,
  DatabaseIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"

const PerformancePage = () => {
  return (
    <EmptyWorkspacePage
      icon={AnalyticsUpIcon}
      title="No performance data yet"
      description="Connect a listing to track views, searches, calls, directions, and listing health."
      primaryAction={{ label: "Connect source", icon: DatabaseIcon }}
      secondaryAction={{
        label: "Invite team",
        icon: UserAdd01Icon,
        variant: "outline",
      }}
    />
  )
}

export default PerformancePage
