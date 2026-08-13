import { useState } from "react"
import { Frame, FramePanel } from "@/components/reui/frame"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type AuditEvent = {
  id: string
  user: string
  email: string
  action: string
  summary: string
  target: string
  browser: string
  device: "Desktop" | "Mobile" | "Tablet"
  os: string
  ip: string
  location: string
  timestamp: string
}

const auditEvents: AuditEvent[] = [
  {
    id: "evt_01",
    user: "Sarah Chen",
    email: "sarah@placeops.io",
    action: "Invited",
    summary: "Sent a workspace invite to Marcus Johnson as Member",
    target: "marcus@placeops.io",
    browser: "Chrome 131",
    device: "Desktop",
    os: "macOS Sequoia",
    ip: "104.28.14.92",
    location: "San Francisco, US",
    timestamp: "2 minutes ago",
  },
  {
    id: "evt_02",
    user: "Marcus Johnson",
    email: "marcus@placeops.io",
    action: "Updated",
    summary: "Changed Emily Park's role from Member to Admin",
    target: "role:admin",
    browser: "Safari 18",
    device: "Desktop",
    os: "macOS Sonoma",
    ip: "73.22.118.44",
    location: "Austin, US",
    timestamp: "15 minutes ago",
  },
  {
    id: "evt_03",
    user: "Emily Park",
    email: "emily@placeops.io",
    action: "Connected",
    summary: "Connected Google Business Profile for 12 locations",
    target: "integration:google",
    browser: "Chrome 131",
    device: "Mobile",
    os: "iOS 18.2",
    ip: "172.58.203.11",
    location: "Seattle, US",
    timestamp: "1 hour ago",
  },
  {
    id: "evt_04",
    user: "David Kim",
    email: "david@placeops.io",
    action: "Revoked",
    summary: "Revoked production API key used by the reviews sync job",
    target: "api-key:pk_live_…8f2a",
    browser: "Firefox 134",
    device: "Desktop",
    os: "Windows 11",
    ip: "185.199.108.55",
    location: "London, UK",
    timestamp: "3 hours ago",
  },
  {
    id: "evt_05",
    user: "Sofia Davis",
    email: "sofia@placeops.io",
    action: "Created",
    summary: "Created Locations object with 8 default fields",
    target: "object:locations",
    browser: "Edge 131",
    device: "Desktop",
    os: "Windows 11",
    ip: "91.198.174.23",
    location: "Berlin, DE",
    timestamp: "5 hours ago",
  },
  {
    id: "evt_06",
    user: "Alex Rivera",
    email: "alex@placeops.io",
    action: "Exported",
    summary: "Exported 4,218 review records as CSV",
    target: "data:reviews.csv",
    browser: "Chrome 130",
    device: "Tablet",
    os: "iPadOS 18.1",
    ip: "35.201.12.88",
    location: "Toronto, CA",
    timestamp: "Yesterday",
  },
  {
    id: "evt_07",
    user: "Jordan Lee",
    email: "jordan@placeops.io",
    action: "Enabled",
    summary: "Enabled Okta SSO and required it for all members",
    target: "sso:okta",
    browser: "Chrome 131",
    device: "Desktop",
    os: "Ubuntu 24.04",
    ip: "34.102.136.180",
    location: "Singapore, SG",
    timestamp: "Yesterday",
  },
  {
    id: "evt_08",
    user: "Sarah Chen",
    email: "sarah@placeops.io",
    action: "Deleted",
    summary: "Deleted outbound webhook endpoint for Slack alerts",
    target: "webhook:wh_9c2e",
    browser: "Safari 18",
    device: "Mobile",
    os: "iOS 18.2",
    ip: "104.28.14.92",
    location: "San Francisco, US",
    timestamp: "2 days ago",
  },
  {
    id: "evt_09",
    user: "Marcus Johnson",
    email: "marcus@placeops.io",
    action: "Signed in",
    summary: "Signed in with email and password from a new device",
    target: "session:new",
    browser: "Samsung Internet 27",
    device: "Mobile",
    os: "Android 15",
    ip: "49.36.221.10",
    location: "Mumbai, IN",
    timestamp: "2 days ago",
  },
  {
    id: "evt_10",
    user: "Emily Park",
    email: "emily@placeops.io",
    action: "Updated",
    summary: "Updated organization billing email and company address",
    target: "billing:profile",
    browser: "Chrome 131",
    device: "Desktop",
    os: "macOS Sequoia",
    ip: "172.58.203.11",
    location: "Seattle, US",
    timestamp: "3 days ago",
  },
  {
    id: "evt_01",
    user: "Sarah Chen",
    email: "sarah@placeops.io",
    action: "Invited",
    summary: "Sent a workspace invite to Marcus Johnson as Member",
    target: "marcus@placeops.io",
    browser: "Chrome 131",
    device: "Desktop",
    os: "macOS Sequoia",
    ip: "104.28.14.92",
    location: "San Francisco, US",
    timestamp: "2 minutes ago",
  },
  {
    id: "evt_02",
    user: "Marcus Johnson",
    email: "marcus@placeops.io",
    action: "Updated",
    summary: "Changed Emily Park's role from Member to Admin",
    target: "role:admin",
    browser: "Safari 18",
    device: "Desktop",
    os: "macOS Sonoma",
    ip: "73.22.118.44",
    location: "Austin, US",
    timestamp: "15 minutes ago",
  },
  {
    id: "evt_03",
    user: "Emily Park",
    email: "emily@placeops.io",
    action: "Connected",
    summary: "Connected Google Business Profile for 12 locations",
    target: "integration:google",
    browser: "Chrome 131",
    device: "Mobile",
    os: "iOS 18.2",
    ip: "172.58.203.11",
    location: "Seattle, US",
    timestamp: "1 hour ago",
  },
  {
    id: "evt_04",
    user: "David Kim",
    email: "david@placeops.io",
    action: "Revoked",
    summary: "Revoked production API key used by the reviews sync job",
    target: "api-key:pk_live_…8f2a",
    browser: "Firefox 134",
    device: "Desktop",
    os: "Windows 11",
    ip: "185.199.108.55",
    location: "London, UK",
    timestamp: "3 hours ago",
  },
  {
    id: "evt_05",
    user: "Sofia Davis",
    email: "sofia@placeops.io",
    action: "Created",
    summary: "Created Locations object with 8 default fields",
    target: "object:locations",
    browser: "Edge 131",
    device: "Desktop",
    os: "Windows 11",
    ip: "91.198.174.23",
    location: "Berlin, DE",
    timestamp: "5 hours ago",
  },
  {
    id: "evt_06",
    user: "Alex Rivera",
    email: "alex@placeops.io",
    action: "Exported",
    summary: "Exported 4,218 review records as CSV",
    target: "data:reviews.csv",
    browser: "Chrome 130",
    device: "Tablet",
    os: "iPadOS 18.1",
    ip: "35.201.12.88",
    location: "Toronto, CA",
    timestamp: "Yesterday",
  },
  {
    id: "evt_07",
    user: "Jordan Lee",
    email: "jordan@placeops.io",
    action: "Enabled",
    summary: "Enabled Okta SSO and required it for all members",
    target: "sso:okta",
    browser: "Chrome 131",
    device: "Desktop",
    os: "Ubuntu 24.04",
    ip: "34.102.136.180",
    location: "Singapore, SG",
    timestamp: "Yesterday",
  },
  {
    id: "evt_08",
    user: "Sarah Chen",
    email: "sarah@placeops.io",
    action: "Deleted",
    summary: "Deleted outbound webhook endpoint for Slack alerts",
    target: "webhook:wh_9c2e",
    browser: "Safari 18",
    device: "Mobile",
    os: "iOS 18.2",
    ip: "104.28.14.92",
    location: "San Francisco, US",
    timestamp: "2 days ago",
  },
  {
    id: "evt_09",
    user: "Marcus Johnson",
    email: "marcus@placeops.io",
    action: "Signed in",
    summary: "Signed in with email and password from a new device",
    target: "session:new",
    browser: "Samsung Internet 27",
    device: "Mobile",
    os: "Android 15",
    ip: "49.36.221.10",
    location: "Mumbai, IN",
    timestamp: "2 days ago",
  },
  {
    id: "evt_10",
    user: "Emily Park",
    email: "emily@placeops.io",
    action: "Updated",
    summary: "Updated organization billing email and company address",
    target: "billing:profile",
    browser: "Chrome 131",
    device: "Desktop",
    os: "macOS Sequoia",
    ip: "172.58.203.11",
    location: "Seattle, US",
    timestamp: "3 days ago",
  },
]

const AuditLogPage = () => {
  const [query, setQuery] = useState("")

  const filteredAuditEvents = auditEvents.filter((event) => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return true

    return (
      event.user.toLowerCase().includes(normalized) ||
      event.email.toLowerCase().includes(normalized) ||
      event.action.toLowerCase().includes(normalized) ||
      event.summary.toLowerCase().includes(normalized) ||
      event.target.toLowerCase().includes(normalized) ||
      event.browser.toLowerCase().includes(normalized) ||
      event.device.toLowerCase().includes(normalized) ||
      event.os.toLowerCase().includes(normalized) ||
      event.location.toLowerCase().includes(normalized) ||
      event.ip.toLowerCase().includes(normalized)
    )
  })

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-6xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review workspace activity across members, settings, and data —
            including browser and device context.
          </p>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by user, action, browser, or device..."
          className="mt-4 sm:max-w-sm"
        />
        </div>


        <Frame spacing="xs">
          <FramePanel className="p-0!">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuditEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      No activity matches your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAuditEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-xs text-muted-foreground">
                            {event.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-xs flex-col gap-1">
                          <p className="truncate text-sm text-muted-foreground">
                            {event.summary}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm">{event.browser}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm">{event.device}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.location}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {event.timestamp}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </FramePanel>
        </Frame>
      </div>
    </div>
  )
}

export default AuditLogPage
