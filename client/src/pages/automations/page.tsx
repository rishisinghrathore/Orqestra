import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { Add01Icon, FlashIcon } from "@hugeicons/core-free-icons"

const AutomationsPage = () => {
  return (
    <EmptyWorkspacePage
      icon={FlashIcon}
      title="No automations yet"
      description="Hook up your favorite tools and let the automation magic begin."
      primaryAction={{
        label: "Create automation",
        icon: Add01Icon,
        to: "/automations/new",
      }}
    />
  )
}

export default AutomationsPage
