import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { InboxIcon, UserAdd01Icon } from "@hugeicons/core-free-icons"

const MessagesPage = () => {
  return (
    <EmptyWorkspacePage
      icon={InboxIcon}
      title="Inbox is empty"
      description="Customer conversations from your Business Profile will appear here once connected."
      primaryAction={{ label: "Invite team", icon: UserAdd01Icon }}
    />
  )
}

export default MessagesPage
