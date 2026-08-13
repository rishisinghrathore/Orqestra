import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlayIcon, ArrowDown01Icon } from "@hugeicons/core-free-icons"

export function Pattern() {
  return (
    <ButtonGroup className="**:data-[slot=button]:border-r-0">
      <Button>
        <HugeiconsIcon icon={PlayIcon} strokeWidth={2} aria-hidden="true" className="fill-current" />
        <span>Execute</span>
      </Button>
      <ButtonGroupSeparator className="bg-primary/72" />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="icon"
              className="border-primary-foreground/20 rounded-l-none border-l"
            />
          }
        >
          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem>Commit & Push</DropdownMenuItem>
          <DropdownMenuItem>Commit & Sync</DropdownMenuItem>
          <DropdownMenuItem>Amend Last Commit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  )
}