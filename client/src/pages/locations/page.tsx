import { EmptyWorkspacePage } from "@/components/empty-workspace-page"
import {
  Add01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons"

const LocationsPage = () => {
  return (
    <EmptyWorkspacePage
      icon={Location01Icon}
      title="No locations yet"
      description="Add a Google Business Profile location or connect a source to start managing listings."
      primaryAction={{ label: "Add location", icon: Add01Icon }}
    />
  )
}

export default LocationsPage
