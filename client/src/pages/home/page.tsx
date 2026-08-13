import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { DashboardSquare01Icon } from "@hugeicons/core-free-icons"

const HomePage = () => {
  return (
    <EmptyWorkspacePage
      icon={DashboardSquare01Icon}
      title="Workspace is ready"
      description="Invite teammates or connect a data source to start filling this view."
    />
  )
}

export default HomePage
