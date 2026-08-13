import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { Add01Icon, WebhookIcon } from "@hugeicons/core-free-icons"

const WebhooksPage = () => {
  return (
    <EmptyWorkspacePage
      icon={WebhookIcon}
      title="No webhooks yet"
      description="Create a webhook or connect a source to start sending workspace events to your tools."
      primaryAction={{ label: "Add webhook", icon: Add01Icon }}
    />
  )
}

export default WebhooksPage
