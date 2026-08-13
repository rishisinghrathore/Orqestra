import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { StarIcon, UserAdd01Icon } from "@hugeicons/core-free-icons"

const ReviewsPage = () => {
  return (
    <EmptyWorkspacePage
      icon={StarIcon}
      title="No reviews yet"
      description="Connect a listing to monitor feedback and reply with AI-assisted responses."
      primaryAction={{ label: "Invite team", icon: UserAdd01Icon }}
    />
  )
}

export default ReviewsPage
