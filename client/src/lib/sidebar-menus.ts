import {
  ApiIcon,
  BookOpen01Icon,
  BubbleChatIcon,
  CustomerService01Icon,
  DashboardSquare01Icon,
  FlashIcon,
  FolderCloudIcon,
  Link01Icon,
  SettingsIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons"

export const sidebarMenus = [
  {
    title: "Overview",
    items: [
      { title: "Home", to: "/", icon: DashboardSquare01Icon },
      { title: "Chat", to: "/chat", icon: BubbleChatIcon },
    ],
  },
  {
    title: "Workspace",
    items: [
      { title: "Integrations", to: "/integrations", icon: Link01Icon },
      { title: "Automations", to: "/automations", icon: FlashIcon },
      { title: "Tasks", to: "/tasks", icon: Task01Icon },
      { title: "Storage", to: "/storage", icon: FolderCloudIcon },
      { title: "Settings", to: "/settings/organization", icon: SettingsIcon },
    ],
  },

] as const

export const sidebarFooterMenus = [
  { title: "Documentation", icon: BookOpen01Icon },
  { title: "API Reference", icon: ApiIcon },
  { title: "Support", icon: CustomerService01Icon },
] as const

export type SidebarSection = (typeof sidebarMenus)[number]["title"]
export type SidebarRoute = (typeof sidebarMenus)[number]["items"][number]["to"]
