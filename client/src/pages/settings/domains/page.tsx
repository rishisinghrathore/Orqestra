import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { Add01Icon, Globe02Icon } from "@hugeicons/core-free-icons"

const DomainsPage = () => {
  return (
    <EmptyWorkspacePage
      icon={Globe02Icon}
      title="No domains yet"
      description="Add a custom domain or connect a source to start routing this workspace."
      primaryAction={{ label: "Add domain", icon: Add01Icon }}
    />
  )
}

export default DomainsPage
