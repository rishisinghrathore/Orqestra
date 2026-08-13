import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { FolderCloudIcon, Upload04Icon } from "@hugeicons/core-free-icons"

const StoragePage = () => {
  return (
    <EmptyWorkspacePage
      icon={FolderCloudIcon}
      title="No files yet"
      description="Upload files or connect a source to start filling this workspace storage."
      primaryAction={{ label: "Upload files", icon: Upload04Icon }}
    />
  )
}

export default StoragePage
