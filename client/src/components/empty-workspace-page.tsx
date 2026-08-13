import { Link } from "react-router-dom"
import { IconStack } from "@/components/reui/icon-stack"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { DatabaseIcon, UserAdd01Icon } from "@hugeicons/core-free-icons"

type EmptyAction = {
  label: string
  icon: IconSvgElement
  variant?: "default" | "outline"
  to?: string
}

type EmptyWorkspacePageProps = {
  icon: IconSvgElement
  title: string
  description: string
  primaryAction?: EmptyAction
  secondaryAction?: EmptyAction
}

function ActionButton({
  action,
  fallbackVariant,
}: {
  action: EmptyAction
  fallbackVariant?: "default" | "outline"
}) {
  const variant = action.variant ?? fallbackVariant ?? "default"

  return (
    <Button
      size="sm"
      variant={variant}
      render={action.to ? <Link to={action.to} /> : undefined}
    >
      <HugeiconsIcon
        icon={action.icon}
        strokeWidth={2}
        data-icon="inline-start"
      />
      {action.label}
    </Button>
  )
}

export function EmptyWorkspacePage({
  icon,
  title,
  description,
  primaryAction = {
    label: "Invite team",
    icon: UserAdd01Icon,
  },
  secondaryAction = {
    label: "Connect source",
    icon: DatabaseIcon,
    variant: "outline",
  },
}: EmptyWorkspacePageProps) {
  return (
    <div className="no-scrollbar flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-12">
      <Empty className="max-w-md py-10">
        <EmptyHeader>
          <EmptyMedia>
            <IconStack aria-hidden="true" className="h-24 w-22 text-primary">
              <HugeiconsIcon
                icon={icon}
                strokeWidth={2}
                className="size-5 text-primary"
              />
            </IconStack>
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>

        <EmptyContent className="flex-row justify-center gap-2">
          <ActionButton action={primaryAction} />
          <ActionButton action={secondaryAction} fallbackVariant="outline" />
        </EmptyContent>
      </Empty>
    </div>
  )
}
