import { useParams } from "react-router-dom"
import PagePlaceholder from "@/components/page-placeholder"
import { settingsMenus } from "@/lib/settings-menus"

const SettingsSectionPage = () => {
  const { section } = useParams<{ section: string }>()
  const item = settingsMenus
    .flatMap((group) => group.items)
    .find((menu) => menu.id === section)

  return (
    <PagePlaceholder
      title={item?.title ?? "Settings"}
      description={
        item
          ? `${item.title} settings are coming soon.`
          : "This settings section was not found."
      }
    />
  )
}

export default SettingsSectionPage
