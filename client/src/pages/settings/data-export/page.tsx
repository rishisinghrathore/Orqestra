import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import {
  DatabaseExportIcon,
  DatabaseIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"

const DataExportPage = () => {
  return (
    <EmptyWorkspacePage
      icon={DatabaseExportIcon}
      title="No exports yet"
      description="Connect a source or invite teammates to start exporting workspace data."
      primaryAction={{ label: "Connect source", icon: DatabaseIcon }}
      secondaryAction={{
        label: "Invite team",
        icon: UserAdd01Icon,
        variant: "outline",
      }}
    />
  )
}

export default DataExportPage
