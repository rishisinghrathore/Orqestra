import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import {
  Building01Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"

const ProfilePage = () => {
  return (
    <EmptyWorkspacePage
      icon={Building01Icon}
      title="No business profile yet"
      description="Keep business info, hours, categories, and attributes accurate once a profile is connected."
      primaryAction={{ label: "Edit profile", icon: PencilEdit01Icon }}
    />
  )
}

export default ProfilePage
