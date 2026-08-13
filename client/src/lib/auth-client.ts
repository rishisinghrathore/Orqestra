import { createAuthClient } from "better-auth/react"
import {
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins"
import { apiKeyClient } from "@better-auth/api-key/client"
import { stripeClient } from "@better-auth/stripe/client"
import { ac, roles } from "@/lib/permissions"

// Same-origin via Vite `/api` proxy so auth cookies stay first-party in dev.
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || undefined,
  plugins: [
    organizationClient({
      ac,
      roles,
      dynamicAccessControl: {
        enabled: true,
      },
    }),
    apiKeyClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/2fa"
      },
    }),
    stripeClient({
      subscription: true,
    }),
  ],
})

export const {
  signIn,
  signOut,
  useSession,
  organization,
  apiKey,
  twoFactor,
  subscription,
} = authClient
