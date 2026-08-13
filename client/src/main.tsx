import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { AppHotkeysProvider } from "@/components/hotkeys-provider.tsx"
import { JotaiProvider } from "@/components/jotai-provider.tsx"
import { QueryProvider } from "@/components/query-provider.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/toast"
import { SonnerToaster } from "@/components/ui/sonner"
import { initAppearancePreferences } from "@/lib/appearance"
import { applyThemeColors } from "@/lib/theme-colors"

initAppearancePreferences()
applyThemeColors()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JotaiProvider>
      <AppHotkeysProvider>
        <QueryProvider>
          <ThemeProvider>
            <Toaster>
              <App />
              <SonnerToaster />
            </Toaster>
          </ThemeProvider>
        </QueryProvider>
      </AppHotkeysProvider>
    </JotaiProvider>
  </StrictMode>
)
