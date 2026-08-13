import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { Add01Icon, FileEditIcon } from "@hugeicons/core-free-icons"

const PostsPage = () => {
  return (
    <EmptyWorkspacePage
      icon={FileEditIcon}
      title="No posts yet"
      description="Create and schedule Google Business updates, offers, and events from this view."
      primaryAction={{ label: "Create post", icon: Add01Icon }}
    />
  )
}

export default PostsPage
