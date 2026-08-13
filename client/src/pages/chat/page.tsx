import { useMemo, useState } from "react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  Message,
  MessageContent,
} from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Archive02Icon,
  CallIcon,
  CheckUnread01Icon,
  Copy01Icon,
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  EraserIcon,
  InformationCircleIcon,
  Mail01Icon,
  NotificationOff01Icon,
  PinIcon,
  UserIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons"

type ChatFilter = "chats" | "unseen" | "archived"

type UiMessage = {
  id: string
  /** `you` = outbound (workspace), `them` = inbound (customer) */
  from: "you" | "them"
  content: string
}

type Customer = {
  name: string
  email: string
  phone: string
  company: string
  role: string
}

type RecentChat = {
  id: string
  preview: string
  updatedAt: string
  archived?: boolean
  pinned?: boolean
  unread?: boolean
  muted?: boolean
  /** Optional display title override (rename). */
  title?: string
  contact: Customer
  messages: UiMessage[]
}

const chatSeeds: Array<{
  name: string
  email: string
  phone: string
  company: string
  role: string
  preview: string
  updatedAt: string
  archived?: boolean
  reply: string
}> = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@acme.com",
    phone: "+1 (415) 555-0142",
    company: "Acme Corp",
    role: "VP of Operations",
    preview: "Sounds good — I'll send over the signed docs today.",
    updatedAt: "2m ago",
    reply: "Sounds good — I'll send over the signed docs today.",
  },
  {
    name: "James Rivera",
    email: "james@northwind.io",
    phone: "+1 (646) 555-0198",
    company: "Northwind",
    role: "Head of Product",
    preview: "Our biggest concern is migrating historical tickets.",
    updatedAt: "1h ago",
    reply: "Our biggest concern is migrating historical tickets.",
  },
  {
    name: "Priya Nair",
    email: "priya.nair@globex.com",
    phone: "+1 (312) 555-0177",
    company: "Globex",
    role: "Procurement Lead",
    preview: "Is annual billing discounted vs monthly?",
    updatedAt: "Yesterday",
    reply: "Is annual billing discounted vs monthly?",
  },
  {
    name: "Alex Kim",
    email: "alex.kim@initech.co",
    phone: "+1 (206) 555-0133",
    company: "Initech",
    role: "Customer Success",
    preview: "Kickoff is set for next Monday.",
    updatedAt: "2d ago",
    archived: true,
    reply: "Kickoff is set for next Monday.",
  },
  {
    name: "Morgan Lee",
    email: "morgan@contoso.com",
    phone: "+1 (503) 555-0119",
    company: "Contoso",
    role: "Solutions Engineer",
    preview: "We'll need SSO before we can expand seats.",
    updatedAt: "Last week",
    archived: true,
    reply: "We'll need SSO before we can expand seats.",
  },
  {
    name: "Elena Vasquez",
    email: "elena@umbrella.dev",
    phone: "+1 (212) 555-0104",
    company: "Umbrella Labs",
    role: "CTO",
    preview: "Can we pilot with the support team first?",
    updatedAt: "3m ago",
    reply: "Can we pilot with the support team first?",
  },
  {
    name: "David Park",
    email: "d.park@starkindustries.com",
    phone: "+1 (310) 555-0188",
    company: "Stark Industries",
    role: "IT Director",
    preview: "Security questionnaire is almost done.",
    updatedAt: "12m ago",
    reply: "Security questionnaire is almost done.",
  },
  {
    name: "Amira Hassan",
    email: "amira@vertexlabs.io",
    phone: "+1 (617) 555-0165",
    company: "Vertex Labs",
    role: "Founder",
    preview: "Let's sync after our board meeting.",
    updatedAt: "25m ago",
    reply: "Let's sync after our board meeting.",
  },
  {
    name: "Noah Bennett",
    email: "noah.bennett@orbitly.co",
    phone: "+1 (720) 555-0121",
    company: "Orbitly",
    role: "Revenue Ops",
    preview: "Shared the CRM field mapping doc.",
    updatedAt: "40m ago",
    reply: "Shared the CRM field mapping doc.",
  },
  {
    name: "Lina Ortega",
    email: "lina@brightpath.com",
    phone: "+1 (305) 555-0190",
    company: "Brightpath",
    role: "Account Executive",
    preview: "Customer asked about bilingual support.",
    updatedAt: "55m ago",
    reply: "Customer asked about bilingual support.",
  },
  {
    name: "Theo Nakamura",
    email: "theo@kanbanworks.jp",
    phone: "+81 3-5550-0144",
    company: "Kanban Works",
    role: "Engineering Manager",
    preview: "API rate limits look fine for our volume.",
    updatedAt: "1h ago",
    reply: "API rate limits look fine for our volume.",
  },
  {
    name: "Chloe Martin",
    email: "chloe.martin@helixhealth.org",
    phone: "+1 (215) 555-0172",
    company: "Helix Health",
    role: "Compliance Officer",
    preview: "Need BAA before production access.",
    updatedAt: "2h ago",
    reply: "Need BAA before production access.",
  },
  {
    name: "Omar Diallo",
    email: "omar@sahelretail.com",
    phone: "+1 (404) 555-0155",
    company: "Sahel Retail",
    role: "Store Ops Lead",
    preview: "Training sessions booked for Thursday.",
    updatedAt: "3h ago",
    reply: "Training sessions booked for Thursday.",
  },
  {
    name: "Hannah Brooks",
    email: "hannah@nestify.app",
    phone: "+1 (512) 555-0111",
    company: "Nestify",
    role: "Product Manager",
    preview: "Can you export the usage report by team?",
    updatedAt: "4h ago",
    reply: "Can you export the usage report by team?",
  },
  {
    name: "Ryan O'Connor",
    email: "ryan@cedarfinance.com",
    phone: "+1 (312) 555-0180",
    company: "Cedar Finance",
    role: "CFO",
    preview: "Approved the expanded seat count.",
    updatedAt: "5h ago",
    reply: "Approved the expanded seat count.",
  },
  {
    name: "Mei Lin",
    email: "mei.lin@lotuslogistics.cn",
    phone: "+86 21 5550 0199",
    company: "Lotus Logistics",
    role: "Ops Director",
    preview: "Warehouse rollout starts next sprint.",
    updatedAt: "6h ago",
    reply: "Warehouse rollout starts next sprint.",
  },
  {
    name: "Gabriel Costa",
    email: "gabriel@atlasbr.com.br",
    phone: "+55 11 5550-0133",
    company: "Atlas BR",
    role: "Sales Director",
    preview: "Introduced us to their São Paulo team.",
    updatedAt: "7h ago",
    reply: "Introduced us to their São Paulo team.",
  },
  {
    name: "Sophie Laurent",
    email: "sophie.laurent@lumiere.fr",
    phone: "+33 1 55 50 01 22",
    company: "Lumière",
    role: "Marketing Lead",
    preview: "Wanted help drafting the launch note.",
    updatedAt: "8h ago",
    reply: "Wanted help drafting the launch note.",
  },
  {
    name: "Isaac Mensah",
    email: "isaac@goldencoasthq.com",
    phone: "+233 30 555 0140",
    company: "Golden Coast HQ",
    role: "General Manager",
    preview: "Offline mode is a must for field staff.",
    updatedAt: "9h ago",
    reply: "Offline mode is a must for field staff.",
  },
  {
    name: "Natalie Frost",
    email: "natalie@pinecone.edu",
    phone: "+1 (802) 555-0166",
    company: "Pinecone University",
    role: "Registrar",
    preview: "Semester onboarding pack looks good.",
    updatedAt: "10h ago",
    reply: "Semester onboarding pack looks good.",
  },
  {
    name: "Omar Farouk",
    email: "omar.farouk@nilebank.eg",
    phone: "+20 2 5550 0177",
    company: "Nile Bank",
    role: "Digital Banking Lead",
    preview: "Waiting on legal for data residency.",
    updatedAt: "11h ago",
    reply: "Waiting on legal for data residency.",
  },
  {
    name: "Nina Petrova",
    email: "nina@balticsoft.ee",
    phone: "+372 5550 0181",
    company: "Baltic Soft",
    role: "Delivery Manager",
    preview: "Sprint demo moved to Friday morning.",
    updatedAt: "Yesterday",
    reply: "Sprint demo moved to Friday morning.",
  },
  {
    name: "Chris Walsh",
    email: "chris.walsh@harborops.com",
    phone: "+1 (503) 555-0148",
    company: "Harbor Ops",
    role: "COO",
    preview: "Can we add two more admins?",
    updatedAt: "Yesterday",
    reply: "Can we add two more admins?",
  },
  {
    name: "Aisha Rahman",
    email: "aisha@crescentmedia.ae",
    phone: "+971 4 555 0192",
    company: "Crescent Media",
    role: "Partnerships",
    preview: "Contract redlines coming tomorrow.",
    updatedAt: "Yesterday",
    reply: "Contract redlines coming tomorrow.",
  },
  {
    name: "Ben Carter",
    email: "ben@riverstone.ai",
    phone: "+1 (650) 555-0136",
    company: "Riverstone AI",
    role: "ML Lead",
    preview: "Webhook retries look solid in staging.",
    updatedAt: "Yesterday",
    reply: "Webhook retries look solid in staging.",
  },
  {
    name: "Yuki Tanaka",
    email: "yuki@tokyoloop.jp",
    phone: "+81 6 5550 0150",
    company: "Tokyo Loop",
    role: "CX Lead",
    preview: "Customers love the new inbox filters.",
    updatedAt: "2d ago",
    reply: "Customers love the new inbox filters.",
  },
  {
    name: "Marcus Hale",
    email: "marcus@westwind.energy",
    phone: "+1 (713) 555-0179",
    company: "Westwind Energy",
    role: "Field Services",
    preview: "Need mobile notifications for outages.",
    updatedAt: "2d ago",
    reply: "Need mobile notifications for outages.",
  },
  {
    name: "Ingrid Berg",
    email: "ingrid@fjorddesign.no",
    phone: "+47 555 01 183",
    company: "Fjord Design",
    role: "Creative Director",
    preview: "Shared brand assets for the portal.",
    updatedAt: "2d ago",
    reply: "Shared brand assets for the portal.",
  },
  {
    name: "Luis Mendoza",
    email: "luis@andescommerce.cl",
    phone: "+56 2 5550 0161",
    company: "Andes Commerce",
    role: "Ecom Manager",
    preview: "Holiday promo volume will spike 3x.",
    updatedAt: "3d ago",
    reply: "Holiday promo volume will spike 3x.",
  },
  {
    name: "Fatima Al-Sayed",
    email: "fatima@saharahealth.sa",
    phone: "+966 11 555 0145",
    company: "Sahara Health",
    role: "Clinic Admin",
    preview: "Patient intake form works well.",
    updatedAt: "3d ago",
    reply: "Patient intake form works well.",
  },
  {
    name: "Owen Price",
    email: "owen@slateandco.uk",
    phone: "+44 20 5550 0128",
    company: "Slate & Co",
    role: "Managing Partner",
    preview: "Board wants quarterly ROI summary.",
    updatedAt: "3d ago",
    reply: "Board wants quarterly ROI summary.",
  },
  {
    name: "Camille Dubois",
    email: "camille@rivieratech.fr",
    phone: "+33 4 55 50 01 09",
    company: "Riviera Tech",
    role: "Support Lead",
    preview: "Escalation path looks clear now.",
    updatedAt: "4d ago",
    reply: "Escalation path looks clear now.",
  },
  {
    name: "Jordan Blake",
    email: "jordan@metrofreight.com",
    phone: "+1 (219) 555-0157",
    company: "Metro Freight",
    role: "Dispatch Lead",
    preview: "Drivers need simpler status updates.",
    updatedAt: "4d ago",
    reply: "Drivers need simpler status updates.",
  },
  {
    name: "Helena Costa",
    email: "helena@lisboadigital.pt",
    phone: "+351 21 555 0134",
    company: "Lisboa Digital",
    role: "Growth",
    preview: "Referral program tracked first win.",
    updatedAt: "5d ago",
    reply: "Referral program tracked first win.",
  },
  {
    name: "Seth Okonkwo",
    email: "seth@lagosmarket.ng",
    phone: "+234 1 555 0186",
    company: "Lagos Market",
    role: "Marketplace Ops",
    preview: "Seller verification queue is clearing.",
    updatedAt: "5d ago",
    reply: "Seller verification queue is clearing.",
  },
  {
    name: "Anita Desai",
    email: "anita@monsoonsoft.in",
    phone: "+91 22 5550 0152",
    company: "Monsoon Soft",
    role: "VP Engineering",
    preview: "Interested in the enterprise SLA.",
    updatedAt: "6d ago",
    reply: "Interested in the enterprise SLA.",
  },
  {
    name: "Pete Reynolds",
    email: "pete@summitgear.com",
    phone: "+1 (801) 555-0107",
    company: "Summit Gear",
    role: "Retail Ops",
    preview: "POS sync failed twice last night.",
    updatedAt: "6d ago",
    reply: "POS sync failed twice last night.",
  },
  {
    name: "Nora Iversen",
    email: "nora@arcticapps.dk",
    phone: "+45 55 50 01 63",
    company: "Arctic Apps",
    role: "Founder",
    preview: "Loved the onboarding walkthrough.",
    updatedAt: "Last week",
    reply: "Loved the onboarding walkthrough.",
  },
  {
    name: "Tariq Hassan",
    email: "tariq@desertcloud.jo",
    phone: "+962 6 5550 0174",
    company: "Desert Cloud",
    role: "IT Manager",
    preview: "Timezone handling looks correct.",
    updatedAt: "Last week",
    reply: "Timezone handling looks correct.",
  },
  {
    name: "Emily Zhao",
    email: "emily.zhao@pacificbio.com",
    phone: "+1 (858) 555-0193",
    company: "Pacific Bio",
    role: "Lab Manager",
    preview: "Sample intake workflow approved.",
    updatedAt: "Last week",
    archived: true,
    reply: "Sample intake workflow approved.",
  },
  {
    name: "Hugo Almeida",
    email: "hugo@copaevents.br",
    phone: "+55 21 5550 0118",
    company: "Copa Events",
    role: "Event Director",
    preview: "Need bulk invites for 800 guests.",
    updatedAt: "Last week",
    archived: true,
    reply: "Need bulk invites for 800 guests.",
  },
  {
    name: "Rachel Green",
    email: "rachel@centralpark.co",
    phone: "+1 (917) 555-0125",
    company: "Central Park Co",
    role: "HR Business Partner",
    preview: "Closing this thread — moved to email.",
    updatedAt: "2 weeks ago",
    archived: true,
    reply: "Closing this thread — moved to email.",
  },
  {
    name: "Victor Lund",
    email: "victor@nordicsteel.se",
    phone: "+46 8 555 01 39",
    company: "Nordic Steel",
    role: "Plant Manager",
    preview: "Maintenance window confirmed.",
    updatedAt: "2 weeks ago",
    archived: true,
    reply: "Maintenance window confirmed.",
  },
  {
    name: "Sofia Rossi",
    email: "sofia@milanoventure.it",
    phone: "+39 02 5550 0168",
    company: "Milano Venture",
    role: "Investor Relations",
    preview: "Thanks — no further action needed.",
    updatedAt: "3 weeks ago",
    archived: true,
    reply: "Thanks — no further action needed.",
  },
  {
    name: "Derek Shaw",
    email: "derek@plainsair.com",
    phone: "+1 (316) 555-0141",
    company: "Plains Air",
    role: "Fleet Ops",
    preview: "Archived after go-live wrap-up.",
    updatedAt: "1 month ago",
    archived: true,
    reply: "Archived after go-live wrap-up.",
  },
]

const recentChats: RecentChat[] = chatSeeds.map((seed, index) => {
  const id = String(index + 1)
  return {
    id,
    preview: seed.preview,
    updatedAt: seed.updatedAt,
    archived: seed.archived,
    pinned: index === 0 || index === 5,
    unread: !seed.archived && (index === 1 || index === 6 || index === 12),
    muted: index === 8,
    contact: {
      name: seed.name,
      email: seed.email,
      phone: seed.phone,
      company: seed.company,
      role: seed.role,
    },
    messages: [
      {
        id: `${id}-1`,
        from: "you",
        content: `Hi ${seed.name.split(" ")[0]} — checking in on next steps.`,
      },
      {
        id: `${id}-2`,
        from: "them",
        content: seed.reply,
      },
    ],
  }
})

const chatDisplayName = (chat: RecentChat) =>
  chat.title?.trim() || chat.contact.name

const showChatAlertToast = (
  title: string,
  description: string,
  icon: typeof PinIcon
) => {
  toast.custom(() => (
    <Alert className="w-[min(22rem,calc(100vw-2rem))] border-border bg-card shadow-lg">
      <HugeiconsIcon icon={icon} />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  ))
}

const ChatPage = () => {
  const [chats, setChats] = useState(recentChats)
  const [input, setInput] = useState("")
  const [filter, setFilter] = useState<ChatFilter>("chats")
  const [search, setSearch] = useState("")
  const [activeChatId, setActiveChatId] = useState(recentChats[0]?.id ?? "")
  const [showPersonalInfo, setShowPersonalInfo] = useState(true)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameChatId, setRenameChatId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [threads, setThreads] = useState(() =>
    Object.fromEntries(recentChats.map((chat) => [chat.id, chat.messages]))
  )

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase()
    return chats
      .filter((chat) => {
        const matchesTab =
          filter === "archived"
            ? Boolean(chat.archived)
            : filter === "unseen"
              ? Boolean(chat.unread)
              : !chat.archived
        if (!matchesTab) return false
        if (!query) return true
        const name = chatDisplayName(chat).toLowerCase()
        return (
          name.includes(query) ||
          chat.contact.company.toLowerCase().includes(query) ||
          chat.preview.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
  }, [chats, filter, search])

  const activeChat =
    chats.find((chat) => chat.id === activeChatId) ?? filteredChats[0] ?? null

  const messages = activeChat ? (threads[activeChat.id] ?? []) : []
  const renameTarget = chats.find((chat) => chat.id === renameChatId) ?? null

  const updateChat = (
    chatId: string,
    updater: (chat: RecentChat) => RecentChat
  ) => {
    setChats((current) =>
      current.map((chat) => (chat.id === chatId ? updater(chat) : chat))
    )
  }

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId)
    setInput("")
    updateChat(chatId, (chat) =>
      chat.unread ? { ...chat, unread: false } : chat
    )
  }

  const handlePinChat = (chatId: string) => {
    const chat = chats.find((item) => item.id === chatId)
    if (!chat) return

    const nextPinned = !chat.pinned
    updateChat(chatId, (item) => ({ ...item, pinned: nextPinned }))

    const name = chatDisplayName(chat)
    showChatAlertToast(
      nextPinned ? "Chat pinned" : "Chat unpinned",
      nextPinned
        ? `${name} will stay at the top of your recent chats.`
        : `${name} is no longer pinned.`,
      PinIcon
    )
  }

  const handleToggleUnread = (chatId: string) => {
    updateChat(chatId, (chat) => ({ ...chat, unread: !chat.unread }))
  }

  const handleMuteChat = (chatId: string) => {
    updateChat(chatId, (chat) => ({ ...chat, muted: !chat.muted }))
  }

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard may be unavailable in insecure contexts.
    }
  }

  const handleViewContactInfo = (chatId: string) => {
    handleSelectChat(chatId)
    setShowPersonalInfo(true)
  }

  const openRenameDialog = (chat: RecentChat) => {
    setRenameChatId(chat.id)
    setRenameValue(chatDisplayName(chat))
    setRenameOpen(true)
  }

  const handleRenameSave = () => {
    if (!renameChatId) return
    const nextTitle = renameValue.trim()
    updateChat(renameChatId, (chat) => ({
      ...chat,
      title:
        nextTitle && nextTitle !== chat.contact.name ? nextTitle : undefined,
    }))
    setRenameOpen(false)
    setRenameChatId(null)
  }

  const handleExportChat = (chatId: string) => {
    const chat = chats.find((item) => item.id === chatId)
    if (!chat) return

    const lines = (threads[chatId] ?? []).map((message) => {
      const speaker =
        message.from === "you" ? "You" : chatDisplayName(chat)
      return `${speaker}: ${message.content}`
    })

    const blob = new Blob(
      [
        `Chat with ${chatDisplayName(chat)}\n`,
        `${chat.contact.company} · ${chat.contact.email}\n`,
        `${"=".repeat(40)}\n\n`,
        lines.length > 0 ? lines.join("\n\n") : "(No messages)",
        "\n",
      ],
      { type: "text/plain;charset=utf-8" }
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${chatDisplayName(chat).replace(/\s+/g, "-").toLowerCase()}-chat.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleArchiveChat = (chatId: string) => {
    const chat = chats.find((item) => item.id === chatId)
    if (!chat) return

    const nextArchived = !chat.archived
    updateChat(chatId, (item) => ({ ...item, archived: nextArchived }))

    const name = chatDisplayName(chat)
    showChatAlertToast(
      nextArchived ? "Chat archived" : "Chat unarchived",
      nextArchived
        ? `${name} moved to Archived.`
        : `${name} restored to Chats.`,
      Archive02Icon
    )
  }

  const handleClearChat = (chatId: string) => {
    setThreads((current) => ({ ...current, [chatId]: [] }))
    updateChat(chatId, (chat) => ({
      ...chat,
      preview: "No messages yet",
      updatedAt: "Just now",
    }))
  }

  const handleDeleteChat = (chatId: string) => {
    setChats((current) => {
      const next = current.filter((chat) => chat.id !== chatId)
      if (activeChatId === chatId) {
        const fallback =
          next.find((chat) => {
            if (filter === "archived") return Boolean(chat.archived)
            if (filter === "unseen") return Boolean(chat.unread)
            return !chat.archived
          }) ?? next[0]
        setActiveChatId(fallback?.id ?? "")
      }
      return next
    })
    setThreads((current) => {
      const { [chatId]: _removed, ...rest } = current
      return rest
    })
    setInput("")
  }

  const handleSubmit = () => {
    const content = input.trim()
    if (!content || !activeChat) return

    const next: UiMessage = {
      id: crypto.randomUUID(),
      from: "you",
      content,
    }

    setThreads((current) => ({
      ...current,
      [activeChat.id]: [...(current[activeChat.id] ?? []), next],
    }))
    updateChat(activeChat.id, (chat) => ({
      ...chat,
      preview: content,
      updatedAt: "Just now",
      unread: false,
    }))
    setInput("")
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Left — chats list */}
      <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border/60">
        <div className="space-y-3 p-4">
          <p className="text-sm font-medium">Chats</p>
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as ChatFilter)}
          >
            <TabsList className="w-full">
              <TabsTrigger value="chats" className="flex-1">
                Chats
              </TabsTrigger>
              <TabsTrigger value="unseen" className="flex-1">
                Unseen
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex-1">
                Archived
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers..."
              className="h-9"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <p className="px-2 pb-2 text-xs font-medium opacity-40">Recent</p>
          {filteredChats.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No chats found
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filteredChats.map((chat) => {
                const isActive = chat.id === activeChat?.id
                return (
                  <li key={chat.id}>
                    <ContextMenu>
                      <ContextMenuTrigger
                        className={cn(
                          "flex w-full flex-col gap-0.5 rounded-md px-3 py-2.5 text-left transition-colors outline-none",
                          isActive ? "bg-muted" : "hover:bg-muted/60"
                        )}
                        onClick={() => handleSelectChat(chat.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5">
                            {chat.pinned ? (
                              <HugeiconsIcon
                                icon={PinIcon}
                                className="size-3.5 shrink-0 opacity-50"
                              />
                            ) : null}
                            {chat.muted ? (
                              <HugeiconsIcon
                                icon={NotificationOff01Icon}
                                className="size-3.5 shrink-0 opacity-50"
                              />
                            ) : null}
                            <span
                              className={cn(
                                "truncate text-sm",
                                chat.unread
                                  ? "font-semibold"
                                  : "font-medium"
                              )}
                            >
                              {chatDisplayName(chat)}
                            </span>
                            {chat.unread ? (
                              <span className="size-1.5 shrink-0 rounded-full bg-foreground" />
                            ) : null}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {chat.updatedAt}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "truncate text-xs",
                            chat.unread
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {chat.preview}
                        </span>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-52 gap-0 **:data-[slot=context-menu-item]:gap-2.5 **:data-[slot=context-menu-sub-trigger]:gap-2.5 **:data-[variant=destructive]:text-destructive! **:data-[variant=destructive]:*:[svg]:text-destructive! **:data-[variant=destructive]:focus:bg-destructive/10! **:data-[variant=destructive]:focus:text-destructive! **:data-[variant=destructive]:data-highlighted:bg-destructive/10! **:data-[variant=destructive]:data-highlighted:text-destructive!">
                        <ContextMenuItem
                          onClick={() => handlePinChat(chat.id)}
                        >
                          <HugeiconsIcon icon={PinIcon} />
                          {chat.pinned ? "Unpin chat" : "Pin chat"}
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => handleToggleUnread(chat.id)}
                        >
                          <HugeiconsIcon icon={CheckUnread01Icon} />
                          {chat.unread ? "Mark as read" : "Mark as unread"}
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => handleMuteChat(chat.id)}
                        >
                          <HugeiconsIcon icon={NotificationOff01Icon} />
                          {chat.muted ? "Unmute" : "Mute"}
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => handleViewContactInfo(chat.id)}
                        >
                          <HugeiconsIcon icon={UserIcon} />
                          View contact info
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => openRenameDialog(chat)}
                        >
                          <HugeiconsIcon icon={Edit02Icon} />
                          Rename chat
                        </ContextMenuItem>
                        <ContextMenuSub>
                          <ContextMenuSubTrigger className="gap-2.5">
                            <HugeiconsIcon icon={Copy01Icon} />
                            Copy
                          </ContextMenuSubTrigger>
                          <ContextMenuSubContent className="w-48 **:data-[slot=context-menu-item]:gap-2.5">
                            <ContextMenuItem
                              onClick={() =>
                                void handleCopy(chat.contact.email)
                              }
                            >
                              <HugeiconsIcon icon={Mail01Icon} />
                              Copy email
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() =>
                                void handleCopy(chat.contact.phone)
                              }
                            >
                              <HugeiconsIcon icon={CallIcon} />
                              Copy phone
                            </ContextMenuItem>
                          </ContextMenuSubContent>
                        </ContextMenuSub>
                        <ContextMenuItem
                          onClick={() => handleExportChat(chat.id)}
                        >
                          <HugeiconsIcon icon={Download01Icon} />
                          Export chat
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => handleArchiveChat(chat.id)}
                        >
                          <HugeiconsIcon icon={Archive02Icon} />
                          {chat.archived ? "Unarchive" : "Archive"}
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => handleClearChat(chat.id)}
                        >
                          <HugeiconsIcon icon={EraserIcon} />
                          Clear chat
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          variant="destructive"
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive *:[svg]:text-destructive"
                          onClick={() => handleDeleteChat(chat.id)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Center — conversation */}
      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-card">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-6">
          {activeChat ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {chatDisplayName(activeChat)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {activeChat.contact.company} · {activeChat.contact.role}
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium">Conversation</p>
          )}

          {activeChat ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Call"
              >
                <HugeiconsIcon icon={CallIcon} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Video call"
              >
                <HugeiconsIcon icon={Video01Icon} />
              </Button>
              <Button
                type="button"
                variant={showPersonalInfo ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Personal info"
                aria-pressed={showPersonalInfo}
                onClick={() => setShowPersonalInfo((open) => !open)}
              >
                <HugeiconsIcon icon={InformationCircleIcon} />
              </Button>
            </div>
          ) : null}
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <MessageScrollerProvider>
            <MessageScroller className="min-h-0 flex-1">
              <MessageScrollerViewport className="px-6 pt-2 pb-36">
                <MessageScrollerContent className="mx-auto w-full max-w-3xl gap-4">
                  {messages.length === 0 ? (
                    <MessageScrollerItem className="flex min-h-40 flex-1 flex-col items-center justify-center text-center">
                      <p className="font-heading text-lg font-medium text-foreground">
                        No messages yet
                      </p>
                      <p className="mt-1 max-w-md text-sm text-muted-foreground">
                        Send a message to start chatting with{" "}
                        {activeChat?.contact.name ?? "this customer"}.
                      </p>
                    </MessageScrollerItem>
                  ) : (
                    messages.map((message, index) => {
                      const isYou = message.from === "you"
                      return (
                        <MessageScrollerItem
                          key={message.id}
                          messageId={message.id}
                          scrollAnchor={index === messages.length - 1}
                        >
                          <Message align={isYou ? "end" : "start"}>
                            <MessageContent>
                              {!isYou && activeChat ? (
                                <p className="mb-1 text-xs text-muted-foreground">
                                  {chatDisplayName(activeChat)}
                                </p>
                              ) : null}
                              <Bubble
                                variant={isYou ? "default" : "secondary"}
                                align={isYou ? "end" : "start"}
                              >
                                <BubbleContent className="whitespace-pre-wrap">
                                  {message.content}
                                </BubbleContent>
                              </Bubble>
                            </MessageContent>
                          </Message>
                        </MessageScrollerItem>
                      )
                    })
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton className="bottom-32" />
            </MessageScroller>
          </MessageScrollerProvider>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-card via-card/95 to-transparent px-6 pt-12 pb-6">
            <div className="pointer-events-auto mx-auto w-full max-w-3xl">
              <InputGroup className="has-[>textarea]:min-h-20 border-border bg-background shadow-lg">
                <InputGroupTextarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      handleSubmit()
                    }
                  }}
                  placeholder={
                    activeChat
                      ? `Message ${chatDisplayName(activeChat)}...`
                      : "Select a chat to message..."
                  }
                  disabled={!activeChat}
                  className="min-h-16 resize-none"
                />
                <InputGroupAddon align="block-end" className="justify-end">
                  <InputGroupButton
                    variant="default"
                    size="sm"
                    aria-label="Send message"
                    disabled={!activeChat || !input.trim()}
                    onClick={handleSubmit}
                  >
                    Send
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        </div>
      </section>

      {/* Right — personal info */}
      {showPersonalInfo ? (
        <aside className="flex h-full w-72 shrink-0 flex-col border-l border-border/60">
          <div className="px-4 py-4">
            <p className="text-sm font-medium">Personal info</p>
          </div>

          {activeChat ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
              <div className="space-y-1 pb-6">
                <p className="text-sm font-medium">{activeChat.contact.name}</p>
                <p className="text-xs text-muted-foreground">
                  {activeChat.contact.role}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium opacity-40">Company</p>
                  <p className="truncate text-sm">{activeChat.contact.company}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium opacity-40">Email</p>
                  <p className="truncate text-sm">{activeChat.contact.email}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium opacity-40">Phone</p>
                  <p className="truncate text-sm">{activeChat.contact.phone}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-muted-foreground">
              Select a chat to view contact details
            </div>
          )}
        </aside>
      ) : null}

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open)
          if (!open) setRenameChatId(null)
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>
              {renameTarget
                ? `Set a custom title for your chat with ${renameTarget.contact.name}.`
                : "Set a custom title for this chat."}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                handleRenameSave()
              }
            }}
            placeholder="Chat title"
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!renameValue.trim()}
              onClick={handleRenameSave}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChatPage
