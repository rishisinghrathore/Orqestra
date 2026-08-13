import type { IconSvgElement } from "@hugeicons/react"
import {
  AnalyticsUpIcon,
  Calendar01Icon,
  Link01Icon,
  Location01Icon,
  Tag01Icon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons"

export type IntegrationFeature = {
  title: string
  description: string
  icon: IconSvgElement
}

export type IntegrationConnectionSetting = {
  id: string
  title: string
  description: string
  connected: boolean
}

export type Integration = {
  id: string
  title: string
  vendor: string
  shortDescription: string
  overview: string
  howItWorks: string[]
  logo: string
  category: string
  steps: number
  documentationUrl?: string
  features: IntegrationFeature[]
  connectionSettings: IntegrationConnectionSetting[]
  connected?: boolean
  connectedOn?: string
  connectedBy?: string
}

const defaultFeatures = (
  items: Array<[string, string, IconSvgElement]>
): IntegrationFeature[] =>
  items.map(([featureTitle, description, icon]) => ({
    title: featureTitle,
    description,
    icon,
  }))

const defaultConnectionSettings = (
  title: string,
  connected: boolean
): IntegrationConnectionSetting[] => [
  {
    id: "workspace",
    title: `Link your workspace ${title} account`,
    description: `Connect ${title} to sync data with your PlaceOps workspace.`,
    connected,
  },
  {
    id: "personal",
    title: "Connect personal account",
    description:
      "Allow individual team members to link their personal accounts.",
    connected: false,
  },
  {
    id: "search",
    title: "Personal connected search",
    description:
      "Enable search across connected personal accounts in your workspace.",
    connected: false,
  },
]

const defaultHowItWorks = (title: string) => [
  `The ${title} integration lets you connect your workspace in a few guided steps. Once connected, PlaceOps can sync data automatically and keep your team aligned without manual exports or duplicate entry.`,
  `Use ${title} with automations to trigger workflows when records change, send updates to your team, and keep location, customer, and performance data flowing between tools in real time.`,
]

const createIntegration = (
  integration: Omit<
    Integration,
    "howItWorks" | "connectionSettings" | "features" | "steps"
  > & {
    features: IntegrationFeature[]
    steps?: number
    howItWorks?: string[]
    connectionSettings?: IntegrationConnectionSetting[]
  }
): Integration => ({
  ...integration,
  steps: integration.steps ?? 4,
  howItWorks: integration.howItWorks ?? defaultHowItWorks(integration.title),
  connectionSettings:
    integration.connectionSettings ??
    defaultConnectionSettings(integration.title, integration.connected ?? false),
})

export const integrations: Integration[] = [
  createIntegration({
    id: "google-business",
    title: "Google Business Profile",
    vendor: "Google",
    shortDescription:
      "A business listing platform to manage locations, reviews, posts, and performance across Google Search and Maps.",
    overview:
      "Google Business Profile API lets PlaceOps sync locations, reviews, posts, media, and performance data. Connect once to keep listings accurate and respond to customer feedback from one workspace.",
    logo: "/integrations/google-business.svg",
    category: "Local SEO",
    documentationUrl: "https://developers.google.com/my-business",
    connected: false,
    connectedOn: "12 Dec 2025",
    connectedBy: "Workspace Admin",
    features: defaultFeatures([
      [
        "Locations",
        "Import and manage business locations across your workspace.",
        Location01Icon,
      ],
      [
        "Reviews",
        "Sync reviews and respond to customer feedback in one place.",
        UserMultiple02Icon,
      ],
      [
        "Performance",
        "Track views, searches, and listing health metrics.",
        AnalyticsUpIcon,
      ],
    ]),
  }),
  createIntegration({
    id: "google-drive",
    title: "Google Drive",
    vendor: "Google",
    shortDescription:
      "A cloud storage service for attaching files to locations, posts, and workspace media.",
    overview:
      "Google Drive API lets PlaceOps attach shared files to locations, posts, and media workflows. Keep assets accessible to your team without leaving the workspace.",
    logo: "/integrations/google-drive.svg",
    category: "Productivity",
    documentationUrl: "https://developers.google.com/drive",
    features: defaultFeatures([
      [
        "Files",
        "Attach Drive files to locations, posts, and workspace media.",
        Link01Icon,
      ],
      [
        "Folders",
        "Browse shared folders and keep assets organized.",
        Tag01Icon,
      ],
    ]),
  }),
  createIntegration({
    id: "google-calendar",
    title: "Google Calendar",
    vendor: "Google",
    shortDescription:
      "A calendar service to sync events, availability, and reminders across your workspace.",
    overview:
      "Google Calendar API lets PlaceOps sync events and availability so posts, appointments, and reminders stay aligned with your team's schedule.",
    logo: "/integrations/google-calendar.svg",
    category: "Productivity",
    documentationUrl: "https://developers.google.com/calendar",
    connected: false,
    connectedOn: "8 Jan 2026",
    connectedBy: "Workspace Admin",
    features: defaultFeatures([
      [
        "Events",
        "Sync calendar events with posts and reminders.",
        Calendar01Icon,
      ],
      [
        "Availability",
        "Keep appointment availability aligned across tools.",
        UserMultiple02Icon,
      ],
    ]),
  }),
  createIntegration({
    id: "google-analytics",
    title: "Google Analytics",
    vendor: "Google",
    shortDescription:
      "An analytics platform for tracking traffic, conversions, and performance insights.",
    overview:
      "Google Analytics API brings traffic, conversion, and performance insights into PlaceOps so you can measure what drives results for each location and campaign.",
    logo: "/integrations/google-analytics.svg",
    category: "Analytics",
    documentationUrl: "https://developers.google.com/analytics",
    features: defaultFeatures([
      [
        "Traffic",
        "Track visits and engagement across connected properties.",
        AnalyticsUpIcon,
      ],
      [
        "Conversions",
        "Monitor goals and conversion performance over time.",
        Tag01Icon,
      ],
    ]),
  }),
  createIntegration({
    id: "zoho",
    title: "Zoho",
    vendor: "Zoho",
    shortDescription:
      "A CRM platform for syncing contacts, deals, and customer activity with your workspace.",
    overview:
      "Zoho CRM API syncs contacts, deals, and customer activity with PlaceOps so sales and location teams stay aligned on every account and opportunity.",
    logo: "/integrations/zoho.svg",
    category: "CRM",
    documentationUrl: "https://www.zoho.com/crm/developer/docs",
    features: defaultFeatures([
      [
        "Contacts",
        "Import contacts and keep customer records up to date.",
        UserMultiple02Icon,
      ],
      [
        "Deals",
        "Sync pipeline activity with workspace workflows.",
        Tag01Icon,
      ],
    ]),
  }),
  createIntegration({
    id: "hubspot",
    title: "HubSpot",
    vendor: "HubSpot",
    shortDescription:
      "A CRM and marketing platform for syncing contacts, deals, and campaign activity.",
    overview:
      "HubSpot API connects marketing, sales, and customer data to PlaceOps so teams can act on the same contact and deal context without switching tools.",
    logo: "/integrations/hubspot.svg",
    category: "CRM",
    documentationUrl: "https://developers.hubspot.com",
    features: defaultFeatures([
      [
        "Contacts",
        "Sync HubSpot contacts with workspace records.",
        UserMultiple02Icon,
      ],
      [
        "Marketing",
        "Bring campaign and engagement data into your workspace.",
        AnalyticsUpIcon,
      ],
    ]),
  }),
  createIntegration({
    id: "zoom",
    title: "Zoom",
    vendor: "Zoom",
    shortDescription:
      "A video conferencing platform for syncing meetings, recordings, and availability.",
    overview:
      "Zoom API keeps meetings, recordings, and availability in sync so your team can schedule, join, and follow up without leaving PlaceOps.",
    logo: "/integrations/zoom.svg",
    category: "Communication",
    documentationUrl: "https://developers.zoom.us",
    features: defaultFeatures([
      [
        "Meetings",
        "Sync scheduled meetings with workspace calendars.",
        Calendar01Icon,
      ],
      [
        "Recordings",
        "Attach meeting recordings to customer records.",
        Link01Icon,
      ],
    ]),
  }),
  createIntegration({
    id: "github",
    title: "GitHub",
    vendor: "GitHub",
    shortDescription:
      "A developer platform for syncing repositories, issues, and pull requests.",
    overview:
      "GitHub API links repositories, issues, and pull requests to workspace workflows for teams that ship product alongside operations work.",
    logo: "/integrations/github.svg",
    category: "Developer Tools",
    documentationUrl: "https://docs.github.com/en/rest",
    features: defaultFeatures([
      [
        "Repositories",
        "Connect repos and track linked work items.",
        Link01Icon,
      ],
      [
        "Issues",
        "Sync issues and pull requests with workspace tasks.",
        Tag01Icon,
      ],
    ]),
  }),
]

export const integrationMap = new Map(
  integrations.map((integration) => [integration.id, integration])
)

export const getIntegration = (id: string) => integrationMap.get(id)

export const availableIntegrations = integrations.filter(
  (integration) => !integration.connected
)

export const connectedIntegrations = integrations.filter(
  (integration) => integration.connected
)
