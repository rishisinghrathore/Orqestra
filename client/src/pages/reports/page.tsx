import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import {
  BarChartIcon,
  DatabaseIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"

const ReportsPage = () => {
  return (
    <EmptyWorkspacePage
      icon={BarChartIcon}
      title="No reports yet"
      description="Connect a data source to summarize performance and engagement across locations."
      primaryAction={{ label: "Connect source", icon: DatabaseIcon }}
      secondaryAction={{
        label: "Invite team",
        icon: UserAdd01Icon,
        variant: "outline",
      }}
    />
  )
}

export default ReportsPage
