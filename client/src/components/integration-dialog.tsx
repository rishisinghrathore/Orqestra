import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import type { Integration } from "@/lib/integrations"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  ExternalLinkIcon,
  Link01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons"

type IntegrationDialogProps = {
  integration: Integration | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const previewBoxes = Array.from({ length: 3 })

export function IntegrationDialog({
  integration,
  open,
  onOpenChange,
}: IntegrationDialogProps) {
  const [settings, setSettings] = useState<
    Record<string, boolean>
  >({})

  if (!integration) {
    return null
  }

  const toggleSetting = (settingId: string, checked: boolean) => {
    setSettings((current) => ({ ...current, [settingId]: checked }))
  }

  const isSettingConnected = (settingId: string, defaultConnected: boolean) =>
    settings[settingId] ?? defaultConnected

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogTitle className="sr-only">{integration.title}</DialogTitle>

        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Integrations /{" "}
            <span className="font-medium text-foreground">
              {integration.title}
            </span>
          </p>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="More options"
                  />
                }
              >
                <HugeiconsIcon icon={MoreVerticalIcon} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className={cn("w-max")} align="end">
                <DropdownMenuItem>View documentation</DropdownMenuItem>
                <DropdownMenuItem>Share integration</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {integration.documentationUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Open documentation"
                render={
                  <a
                    href={integration.documentationUrl}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <HugeiconsIcon icon={ExternalLinkIcon} />
              </Button>
            ) : null}
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close"
                />
              }
            >
              <HugeiconsIcon icon={Cancel01Icon} />
            </DialogClose>
          </div>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center ">
                  <img
                    src={integration.logo}
                    alt={`${integration.title} logo`}
                    className="size-full object-contain"
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {integration.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      By {integration.vendor}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="uppercase">
                      {integration.category}
                    </Badge>
                    {integration.connected ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        Connected
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <Button type="button">
                Configure
              </Button>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              {integration.shortDescription}
            </p>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Overview</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {integration.overview}{" "}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">How it works</h3>
              <div className="space-y-4 text-sm leading-6 text-muted-foreground">
                {integration.howItWorks.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
