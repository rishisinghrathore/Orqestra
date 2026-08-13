import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Channel = "email" | "slack" | "inApp"

type NotificationItem = {
  id: string
  label: string
  channels: Record<Channel, boolean>
}

type NotificationSection = {
  id: string
  title: string
  items: NotificationItem[]
}

type TabId = "projects" | "messages" | "reports" | "system"

const CHANNELS: { id: Channel; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "slack", label: "Slack" },
  { id: "inApp", label: "In-app" },
]

const INITIAL_DATA: Record<TabId, NotificationSection[]> = {
  projects: [
    {
      id: "task-activity",
      title: "Task activity",
      items: [
        {
          id: "task-assigned",
          label: "Task assigned to you",
          channels: { email: true, slack: false, inApp: true },
        },
        {
          id: "due-date",
          label: "Due date approaching",
          channels: { email: true, slack: false, inApp: false },
        },
        {
          id: "status-changed",
          label: "Status changed",
          channels: { email: false, slack: false, inApp: true },
        },
        {
          id: "mentioned-comment",
          label: "Mentioned in a comment",
          channels: { email: true, slack: true, inApp: true },
        },
        {
          id: "file-attachment",
          label: "File attachment added",
          channels: { email: false, slack: false, inApp: false },
        },
      ],
    },
    {
      id: "project-updates",
      title: "Project updates",
      items: [
        {
          id: "milestone-completed",
          label: "Milestone completed",
          channels: { email: true, slack: false, inApp: true },
        },
        {
          id: "sprint-ended",
          label: "Sprint ended",
          channels: { email: false, slack: false, inApp: false },
        },
        {
          id: "new-member",
          label: "New member added to project",
          channels: { email: false, slack: false, inApp: true },
        },
        {
          id: "project-archived",
          label: "Project archived",
          channels: { email: true, slack: false, inApp: false },
        },
      ],
    },
  ],
  messages: [
    {
      id: "direct-messages",
      title: "Direct messages",
      items: [
        {
          id: "new-dm",
          label: "New direct message",
          channels: { email: false, slack: true, inApp: true },
        },
        {
          id: "reaction",
          label: "Reaction to your message",
          channels: { email: false, slack: false, inApp: true },
        },
        {
          id: "thread-reply",
          label: "Thread reply",
          channels: { email: false, slack: false, inApp: true },
        },
      ],
    },
    {
      id: "channel-activity",
      title: "Channel activity",
      items: [
        {
          id: "mentioned-channel",
          label: "Mentioned in channel",
          channels: { email: true, slack: true, inApp: true },
        },
        {
          id: "added-to-channel",
          label: "Added to a channel",
          channels: { email: false, slack: false, inApp: true },
        },
        {
          id: "announcement",
          label: "New announcement posted",
          channels: { email: true, slack: true, inApp: true },
        },
      ],
    },
  ],
  reports: [
    {
      id: "scheduled-reports",
      title: "Scheduled reports",
      items: [
        {
          id: "weekly-summary",
          label: "Weekly activity summary",
          channels: { email: true, slack: false, inApp: false },
        },
        {
          id: "monthly-report",
          label: "Monthly performance report",
          channels: { email: true, slack: false, inApp: false },
        },
        {
          id: "usage-digest",
          label: "Usage statistics digest",
          channels: { email: false, slack: false, inApp: true },
        },
      ],
    },
  ],
  system: [
    {
      id: "account-activity",
      title: "Account activity",
      items: [
        {
          id: "new-device",
          label: "New device login",
          channels: { email: true, slack: false, inApp: true },
        },
        {
          id: "password-changed",
          label: "Password changed",
          channels: { email: true, slack: false, inApp: false },
        },
        {
          id: "api-key",
          label: "API key created or revoked",
          channels: { email: true, slack: false, inApp: true },
        },
        {
          id: "billing",
          label: "Billing and invoice updates",
          channels: { email: true, slack: false, inApp: false },
        },
      ],
    },
    {
      id: "service-updates",
      title: "Service updates",
      items: [
        {
          id: "maintenance",
          label: "Scheduled maintenance",
          channels: { email: true, slack: true, inApp: true },
        },
        {
          id: "incident",
          label: "Incident notifications",
          channels: { email: true, slack: true, inApp: true },
        },
        {
          id: "changelog",
          label: "Product changelog",
          channels: { email: false, slack: false, inApp: true },
        },
      ],
    },
  ],
}

const NotificationMatrix = ({
  sections,
  onToggle,
}: {
  sections: NotificationSection[]
  onToggle: (sectionId: string, itemId: string, channel: Channel) => void
}) => (
  <div className="space-y-8">
    {sections.map((section, sectionIndex) => (
      <div key={section.id}>
        {sectionIndex > 0 ? <Separator className="mb-8" /> : null}
        <div>
          <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,3.5rem)] items-center gap-2 pb-3">
            <p className="text-sm font-medium">{section.title}</p>
            {CHANNELS.map((channel) => (
              <span
                key={channel.id}
                className="text-center text-xs font-medium text-muted-foreground"
              >
                {channel.label}
              </span>
            ))}
          </div>
          <div className="divide-y divide-border border-t border-border">
            {section.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_repeat(3,3.5rem)] items-center gap-2 py-3.5"
              >
                <span className="text-sm text-foreground/90">{item.label}</span>
                {CHANNELS.map((channel) => (
                  <div key={channel.id} className="flex justify-center">
                    <Checkbox
                      checked={item.channels[channel.id]}
                      onCheckedChange={() =>
                        onToggle(section.id, item.id, channel.id)
                      }
                      aria-label={`${item.label} via ${channel.label}`}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
)

const NotificationsSettingsPage = () => {
  const [prefs, setPrefs] = useState(INITIAL_DATA)

  const toggleChannel = (
    tab: TabId,
    sectionId: string,
    itemId: string,
    channel: Channel
  ) => {
    setPrefs((current) => ({
      ...current,
      [tab]: current[tab].map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              items: section.items.map((item) =>
                item.id !== itemId
                  ? item
                  : {
                      ...item,
                      channels: {
                        ...item.channels,
                        [channel]: !item.channels[channel],
                      },
                    }
              ),
            }
      ),
    }))
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notification Channels
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick where each type of update lands so nothing important gets
            missed.
          </p>
        </div>

        <Tabs defaultValue="projects" className="gap-6">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {(Object.keys(prefs) as TabId[]).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-2">
              <NotificationMatrix
                sections={prefs[tab]}
                onToggle={(sectionId, itemId, channel) =>
                  toggleChannel(tab, sectionId, itemId, channel)
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}

export default NotificationsSettingsPage
