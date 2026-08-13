import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { SquareLock01Icon, UserAdd01Icon } from "@hugeicons/core-free-icons"

const SsoPage = () => {
  return (
    <EmptyWorkspacePage
      icon={SquareLock01Icon}
      title="No SSO configured yet"
      description="Invite teammates or connect an identity provider to start signing in with SSO."
      primaryAction={{ label: "Invite team", icon: UserAdd01Icon }}
    />
  )
}

export default SsoPage
