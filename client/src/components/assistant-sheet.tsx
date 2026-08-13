import { useHotkey } from "@tanstack/react-hotkeys"
import { useAtom } from "jotai"
import { useRef, useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  assistantSheetHotkey,
  assistantSheetOpenAtom,
} from "@/store/assistant-sheet"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Attachment01Icon,
  FileAttachmentIcon,
  Image01Icon,
  Link01Icon,
  ArrowUpRight01Icon,
  PauseIcon,
} from "@hugeicons/core-free-icons"

export function AssistantSheet() {
  const [open, setOpen] = useAtom(assistantSheetOpenAtom)
  const [input, setInput] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useHotkey(
    assistantSheetHotkey,
    () => {
      setOpen((current) => !current)
    },
    { preventDefault: true }
  )

  const handleSubmit = () => {
    const message = input.trim()
    if (!message || isRunning) {
      return
    }

    setIsRunning(true)
    setInput("")
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="top-4 right-4 bottom-4 h-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-hidden rounded-lg border border-border shadow-xl sm:max-w-xl data-[side=right]:inset-y-4 data-[side=right]:h-auto data-[side=right]:border-l-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Assistant</SheetTitle>
          <SheetDescription>Ask the assistant for help.</SheetDescription>
        </SheetHeader>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={() => {
            if (fileInputRef.current) {
              fileInputRef.current.value = ""
            }
          }}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          multiple
          onChange={() => {
            if (imageInputRef.current) {
              imageInputRef.current.value = ""
            }
          }}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2">
            <p className="text-sm text-muted-foreground">
              How can I help you today?
            </p>
          </div>

          <div className="mt-auto p-4 pt-0">
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
                placeholder="Ask anything..."
                disabled={isRunning}
                className="min-h-16 resize-none"
              />
              <InputGroupAddon
                align="block-end"
                className="justify-between gap-2"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <InputGroupButton
                        variant="outline"
                        size="icon-xs"
                        className="rounded-full"
                        disabled={isRunning}
                      />
                    }
                  >
                    <HugeiconsIcon icon={Attachment01Icon} />
                    <span className="sr-only">Add attachment</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start">
                    <DropdownMenuItem
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <HugeiconsIcon icon={FileAttachmentIcon} />
                      Upload file
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <HugeiconsIcon icon={Image01Icon} />
                      Upload image
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <HugeiconsIcon icon={Link01Icon} />
                      Add link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <InputGroupButton
                  variant="default"
                  size="icon-xs"
                  className="ml-auto rounded-full"
                  aria-label={isRunning ? "Pause" : "Send"}
                  disabled={!isRunning && !input.trim()}
                  onClick={isRunning ? handlePause : handleSubmit}
                >
                  <HugeiconsIcon icon={isRunning ? PauseIcon : ArrowUpRight01Icon} />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
