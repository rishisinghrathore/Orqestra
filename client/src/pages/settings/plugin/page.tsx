import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import { Add01Icon, PuzzleIcon } from "@hugeicons/core-free-icons"

const PluginPage = () => {
  return (
    <EmptyWorkspacePage
      icon={PuzzleIcon}
      title="No plugins yet"
      description="Install a plugin or connect a source to extend this workspace."
      primaryAction={{ label: "Add plugin", icon: Add01Icon }}
    />
  )
}

export default PluginPage
