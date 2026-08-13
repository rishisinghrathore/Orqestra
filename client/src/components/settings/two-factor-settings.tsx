import { FormEvent, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import QRCode from "react-qr-code"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import {
  disableTwoFactor,
  enableTwoFactor,
  verifyTotpSetup,
} from "@/api/two-factor"

type TwoFactorSettingsProps = {
  enabled: boolean
  hasCredential: boolean | null
  onChanged: () => Promise<unknown> | void
}

type SetupState = {
  totpURI: string
  backupCodes: string[]
}

type SetupStep = "qr" | "verify"

export const TwoFactorSettings = ({
  enabled,
  hasCredential,
  onChanged,
}: TwoFactorSettingsProps) => {
  const [password, setPassword] = useState("")
  const [setupCode, setSetupCode] = useState("")
  const [setup, setSetup] = useState<SetupState | null>(null)
  const [setupStep, setSetupStep] = useState<SetupStep>("qr")
  const [backupAcknowledged, setBackupAcknowledged] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [disableOpen, setDisableOpen] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")

  const resetSetup = () => {
    setSetup(null)
    setSetupStep("qr")
    setSetupCode("")
    setBackupAcknowledged(false)
  }

  const enableMutation = useMutation({
    mutationFn: enableTwoFactor,
    onSuccess: (data) => {
      setSetup({
        totpURI: data.totpURI,
        backupCodes: data.backupCodes ?? [],
      })
      setSetupStep("qr")
      setPassword("")
      setError(null)
      setSuccess(null)
      setBackupAcknowledged(false)
      setSetupCode("")
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: verifyTotpSetup,
    onSuccess: async () => {
      resetSetup()
      setSuccess("Two-factor authentication is now enabled")
      await onChanged()
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message)
    },
  })

  const disableMutation = useMutation({
    mutationFn: disableTwoFactor,
    onSuccess: async () => {
      setDisableOpen(false)
      setDisablePassword("")
      setSuccess("Two-factor authentication disabled")
      await onChanged()
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message)
    },
  })

  const onEnable = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    if (!password) {
      setError("Password is required to enable 2FA")
      return
    }
    enableMutation.mutate(password)
  }

  const onContinueFromQr = () => {
    setError(null)
    if (!backupAcknowledged) {
      setError("Confirm that you saved your backup codes")
      return
    }
    setSetupStep("verify")
  }

  const onVerifySetup = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (setupCode.length < 6) {
      setError("Enter the 6-digit code from your authenticator app")
      return
    }
    verifyMutation.mutate(setupCode)
  }

  const copyBackupCodes = async () => {
    if (!setup?.backupCodes.length) return
    await navigator.clipboard.writeText(setup.backupCodes.join("\n"))
    setSuccess("Backup codes copied")
  }

  if (hasCredential === null) {
    return (
      <p className="text-sm text-muted-foreground">Checking account credentials...</p>
    )
  }

  if (!hasCredential) {
    return (
      <p className="text-sm text-muted-foreground">
        Set a password for this account before enabling authenticator 2FA.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {error && !setup ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
      {success ? <p className="text-sm text-muted-foreground">{success}</p> : null}

      {enabled && !setup ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-4 shadow-xs">
          <div>
            <p className="text-sm font-medium">Authenticator app is enabled</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;ll be asked for a code when signing in with email and
              password.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null)
              setSuccess(null)
              setDisableOpen(true)
            }}
          >
            Disable 2FA
          </Button>
        </div>
      ) : null}

      {!enabled && !setup ? (
        <form onSubmit={onEnable} className="space-y-4 sm:max-w-md">
          <div className="space-y-2">
            <Label htmlFor="two-factor-password">Password</Label>
            <Input
              id="two-factor-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" disabled={enableMutation.isPending || !password}>
            {enableMutation.isPending
              ? "Starting setup..."
              : "Enable authenticator"}
          </Button>
        </form>
      ) : null}

      <Dialog
        open={Boolean(setup) && setupStep === "qr"}
        onOpenChange={(open) => {
          if (!open) {
            resetSetup()
            setError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>Set up authenticator</DialogTitle>
            <DialogDescription>
              Scan the QR code and save your backup codes before continuing.
            </DialogDescription>
          </DialogHeader>

          {setup ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium">1. Scan this QR code</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use Google Authenticator, 1Password, Authy, or a similar app.
                </p>
                <div className="mt-4 inline-flex rounded-lg bg-white p-3">
                  <QRCode value={setup.totpURI} size={160} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-medium">2. Save backup codes</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Store these somewhere safe. Each code can be used once.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void copyBackupCodes()}
                  >
                    Copy codes
                  </Button>
                </div>
                <ul className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3 font-mono text-sm sm:grid-cols-2">
                  {setup.backupCodes.map((code) => (
                    <li key={code}>{code}</li>
                  ))}
                </ul>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={backupAcknowledged}
                    onChange={(event) =>
                      setBackupAcknowledged(event.target.checked)
                    }
                  />
                  <span>I saved these backup codes in a secure place</span>
                </label>
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetSetup()
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!backupAcknowledged}
                  onClick={onContinueFromQr}
                >
                  Continue
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(setup) && setupStep === "verify"}
        onOpenChange={(open) => {
          if (!open && !verifyMutation.isPending) {
            resetSetup()
            setError(null)
          }
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          showCloseButton={!verifyMutation.isPending}
        >
          <form onSubmit={onVerifySetup} className="grid gap-6">
            <DialogHeader>
              <DialogTitle>Confirm with a code</DialogTitle>
              <DialogDescription>
                Enter the 6-digit code from your authenticator app.
              </DialogDescription>
            </DialogHeader>

            <InputOTP
              maxLength={6}
              value={setupCode}
              onChange={setSetupCode}
              disabled={verifyMutation.isPending}
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={verifyMutation.isPending}
                onClick={() => {
                  setError(null)
                  setSetupCode("")
                  setSetupStep("qr")
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={verifyMutation.isPending || setupCode.length < 6}
              >
                {verifyMutation.isPending ? "Verifying..." : "Confirm and enable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={disableOpen}
        onOpenChange={(open) => {
          if (!open && !disableMutation.isPending) {
            setDisableOpen(false)
            setDisablePassword("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable two-factor authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your password to turn off authenticator codes for this
              account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="disable-2fa-password">Password</Label>
            <Input
              id="disable-2fa-password"
              type="password"
              value={disablePassword}
              onChange={(event) => setDisablePassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={disableMutation.isPending}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disableMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={disableMutation.isPending || !disablePassword}
              onClick={() => {
                setError(null)
                disableMutation.mutate(disablePassword)
              }}
            >
              {disableMutation.isPending ? "Disabling..." : "Disable 2FA"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
