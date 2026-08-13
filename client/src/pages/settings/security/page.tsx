import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { SecurityCheckIcon, UserAdd01Icon } from "@hugeicons/core-free-icons"

const SecuritySettingsPage = () => {
  return (
    <EmptyWorkspacePage
      icon={SecurityCheckIcon}
      title="No security settings yet"
      description="Invite teammates or connect a data source to start configuring workspace security."
      primaryAction={{ label: "Invite team", icon: UserAdd01Icon }}
    />
  )
}

export default SecuritySettingsPage
