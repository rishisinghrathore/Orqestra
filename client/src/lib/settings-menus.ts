import {
  Audit01Icon,
  Building01Icon,
  CreditCardIcon,
  DatabaseExportIcon,
  DatabaseIcon,
  GaugeIcon,
  Globe02Icon,
  HierarchyIcon,
  Key01Icon,
  Notification03Icon,
  PaintBoardIcon,
  PuzzleIcon,
  SecurityCheckIcon,
  SquareLock01Icon,
  UserAccountIcon,
  UserMultiple02Icon,
  WebhookIcon,
} from "@hugeicons/core-free-icons"

export const settingsMenus = [
  {
    title: "Account",
    items: [
      { id: "personal", title: "Personal", icon: UserAccountIcon },
      { id: "appearance", title: "Appearance", icon: PaintBoardIcon },
      { id: "notifications", title: "Notifications", icon: Notification03Icon },
    ],
  },
  {
    title: "Workspace",
    items: [
      { id: "organization", title: "Organization", icon: Building01Icon },
      { id: "team", title: "Team", icon: UserMultiple02Icon },
      { id: "billing", title: "Billing", icon: CreditCardIcon },
      { id: "domains", title: "Domains", icon: Globe02Icon },
      { id: "data-model", title: "Data Models", icon: DatabaseIcon },
    ],
  },
  {
    title: "Connections",
    items: [
      { id: "plugin", title: "Plugin", icon: PuzzleIcon },
      { id: "api-keys", title: "API Keys", icon: Key01Icon },
      { id: "webhooks", title: "Webhooks", icon: WebhookIcon },
    ],
  },
  {
    title: "Security & Data",
    items: [
      { id: "security", title: "Security", icon: SecurityCheckIcon },
      { id: "sso", title: "SSO", icon: SquareLock01Icon },
      { id: "roles", title: "Roles & Permissions", icon: HierarchyIcon },
      { id: "audit-log", title: "Audit Log", icon: Audit01Icon },
      { id: "data-export", title: "Data & Export", icon: DatabaseExportIcon },
      {
        id: "monitoring",
        title: "Monitoring & Observability",
        icon: GaugeIcon,
      },
    ],
  },
] as const

export type SettingsSection =
  (typeof settingsMenus)[number]["items"][number]["id"]
