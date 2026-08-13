import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { Image01Icon, Upload04Icon } from "@hugeicons/core-free-icons"

const MediaPage = () => {
  return (
    <EmptyWorkspacePage
      icon={Image01Icon}
      title="No media yet"
      description="Upload photos and videos, or connect a source to fill your listing gallery."
      primaryAction={{ label: "Upload media", icon: Upload04Icon }}
    />
  )
}

export default MediaPage
