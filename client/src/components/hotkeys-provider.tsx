import { HotkeysProvider } from "@tanstack/react-hotkeys"
import type { ReactNode } from "react"

type AppHotkeysProviderProps = {
  children: ReactNode
}

export function AppHotkeysProvider({ children }: AppHotkeysProviderProps) {
  return (
    <HotkeysProvider
      defaultOptions={{
        hotkey: { preventDefault: true },
      }}
    >
      {children}
    </HotkeysProvider>
  )
}
