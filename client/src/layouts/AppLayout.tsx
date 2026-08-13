import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ChevronDownIcon,
  LoaderPinwheelIcon,
  Loading01Icon,
  Loading04Icon,
  PanelLeftIcon,
  SparklesFreeIcons,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { settingsMenus } from "@/lib/settings-menus"
import { sidebarFooterMenus, sidebarMenus } from "@/lib/sidebar-menus"
import { listDataObjects, type DataObject } from "@/api/data-model"
import { AssistantSheet } from "@/components/assistant-sheet"
import { authClient, organization, signOut, useSession } from "@/lib/auth-client"
import { assistantSheetOpenAtom } from "@/store/assistant-sheet"
import { useSetAtom } from "jotai"
import { useEffect, useMemo, useState } from "react"
import { DatabaseIcon } from "@hugeicons/core-free-icons"

const itemClassName = (isActive: boolean) =>
  cn(
    "flex w-full cursor-pointer items-center gap-2 rounded-sm text-left transition-opacity duration-100",
    isActive ? "opacity-100" : "opacity-50 hover:opacity-80"
  )

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name?.trim() || email?.trim() || "?"
  const parts = source.split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

const AppLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session } = useSession()
  const user = session?.user
  const [switching, setSwitching] = useState(false)
  const setAssistantSheetOpen = useSetAtom(assistantSheetOpenAtom)

  const settingsMode = location.pathname.startsWith("/settings")

  const { data: workspaces, isPending: workspacesPending } =
    authClient.useListOrganizations()
  const { data: activeOrganization } = authClient.useActiveOrganization()

  const activeWorkspace =
    activeOrganization ?? workspaces?.[0] ?? null
  const userInitials = getInitials(user?.name, user?.email)
  const [objects, setObjects] = useState<DataObject[]>([])
  const [objectsLoading, setObjectsLoading] = useState(false)

  useEffect(() => {
    if (settingsMode || !activeWorkspace?.id) {
      setObjects([])
      return
    }

    let cancelled = false
    setObjectsLoading(true)

    listDataObjects(activeWorkspace.id)
      .then((next) => {
        if (!cancelled) setObjects(next)
      })
      .catch(() => {
        if (!cancelled) setObjects([])
      })
      .finally(() => {
        if (!cancelled) setObjectsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeWorkspace?.id, settingsMode])

  const sidebarObjectItems = useMemo(
    () =>
      [...objects].sort((a, b) => a.pluralName.localeCompare(b.pluralName)),
    [objects]
  )

  const handleWorkspaceChange = async (organizationId: string) => {
    if (!organizationId || organizationId === activeWorkspace?.id || switching) {
      return
    }

    setSwitching(true)
    await organization.setActive({ organizationId })
    setSwitching(false)
  }

  return (
    <div className="flex h-screen flex-col">
      {/* <div className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-foreground">
        <HugeiconsIcon size={16} icon={LoaderPinwheelIcon} className="animate-spin" />
        <span>
          We are syncing your workspace. We&apos;ll email you once it&apos;s done.
        </span>
      </div> */}

      <div className="flex min-h-0 flex-1">
      <aside className="flex h-full w-1/6 flex-col justify-between p-4">
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="flex w-full items-center justify-between gap-2">
            <svg
              fill="none"
              className="size-10"
              height="48"
              viewBox="0 0 30 48"
              width="30"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m0 6c10.1433 9.4404 25.8567 9.4404 36 0-9.4404 10.1433-9.4404 25.8567 0 36-10.1433-9.4404-25.8567-9.4404-36 0 9.44041-10.1433 9.44041-25.8567 0-36z"
                fill="#4f46e5"
              />
            </svg>
            <div>

            <Button
                size={"icon-sm"}
                variant={"secondary"}
                onClick={() => setAssistantSheetOpen(true)}
              >
                <HugeiconsIcon size={20} icon={SparklesFreeIcons} />
              </Button>
              <Button size={"icon-sm"} variant={"secondary"}>
                <HugeiconsIcon size={20} icon={PanelLeftIcon} />
              </Button>
            </div>
          </div>

          {settingsMode ? (
            <Button
              className={"mt-4"}
              variant={"secondary"}
              size={"sm"}
              onClick={() => navigate("/")}
            >
              <HugeiconsIcon size={18} icon={ArrowLeft01Icon} />
              Back
            </Button>
          ) : null}

          {!settingsMode ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="mt-4 flex w-fit max-w-40 cursor-pointer items-center gap-2 rounded-sm bg-card p-2 text-left opacity-80 transition-opacity duration-100 hover:opacity-100"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {workspacesPending
                          ? "Loading..."
                          : activeWorkspace?.name || "Select workspace"}
                      </span>
                    </span>
                    <HugeiconsIcon
                      size={16}
                      icon={ChevronDownIcon}
                      className="shrink-0 opacity-50"
                    />
                  </button>
                }
              />
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuRadioGroup
                  value={activeWorkspace?.id ?? ""}
                  onValueChange={(value) => {
                    void handleWorkspaceChange(value)
                  }}
                >
                  <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                  {!workspacesPending && (workspaces?.length ?? 0) === 0 ? (
                    <DropdownMenuItem disabled>
                      No workspaces yet
                    </DropdownMenuItem>
                  ) : null}
                  {workspaces?.map((workspace) => (
                    <DropdownMenuRadioItem
                      key={workspace.id}
                      value={workspace.id}
                      className="items-start py-2"
                      disabled={switching}
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate">{workspace.name}</span>
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <nav className="mt-4 space-y-4">
            {settingsMode
              ? settingsMenus.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <p className="px-2 text-xs font-medium opacity-40">
                      {section.title}
                    </p>
                    <div className="space-y-3 p-2">
                      {section.items.map((menu) => (
                        <NavLink
                          key={menu.id}
                          to={`/settings/${menu.id}`}
                          className={({ isActive }) => itemClassName(isActive)}
                        >
                          <HugeiconsIcon size={20} icon={menu.icon} />
                          <p className="text-sm font-medium">{menu.title}</p>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))
              : sidebarMenus.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <p className="px-2 text-xs font-medium opacity-40">
                      {section.title}
                    </p>
                    <div className="space-y-3 p-2">
                      {section.items.map((menu) => (
                        <NavLink
                          key={menu.to}
                          to={menu.to}
                          end={menu.to === "/"}
                          className={({ isActive }) => itemClassName(isActive)}
                        >
                          <HugeiconsIcon size={20} icon={menu.icon} />
                          <p className="text-sm font-medium">{menu.title}</p>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))}

            {!settingsMode && sidebarObjectItems.length > 0 ? (
              <div className="space-y-1">
                <p className="px-2 text-xs font-medium opacity-40">Objects</p>
                <div className="space-y-3 p-2">
                  {objectsLoading ? (
                    <p className="px-2 text-sm opacity-50">Loading objects...</p>
                  ) : sidebarObjectItems.length === 0 ? (
                    <p className="px-2 text-sm opacity-50">No objects yet</p>
                  ) : (
                    sidebarObjectItems.map((object) => (
                      <NavLink
                        key={object.id}
                        to={`/objects/${object.id}`}
                        className={({ isActive }) => itemClassName(isActive)}
                      >
                        <HugeiconsIcon size={20} icon={DatabaseIcon} />
                        <p className="truncate text-sm font-medium">
                          {object.pluralName}
                        </p>
                      </NavLink>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </nav>
        </div>
      </aside>

      <div className="relative flex h-full w-5/6 flex-col bg-card">
        <Outlet />
      </div>
      </div>

      <AssistantSheet />
    </div>
  )
}

export default AppLayout
