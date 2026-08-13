import { FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  verifyBackupCodeLogin,
  verifyTotpLogin,
} from "@/api/two-factor"

const BrandMark = ({ className }: { className?: string }) => {
  return (
    <svg
      fill="none"
      className={className}
      height="48"
      viewBox="0 0 36 48"
      width="36"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="m0 6c10.1433 9.4404 25.8567 9.4404 36 0-9.4404 10.1433-9.4404 25.8567 0 36-10.1433-9.4404-25.8567-9.4404-36 0 9.44041-10.1433 9.44041-25.8567 0-36z"
        fill="currentColor"
      />
    </svg>
  )
}

type Mode = "totp" | "backup"

const TwoFactorPage = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>("totp")
  const [code, setCode] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [trustDevice, setTrustDevice] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (mode === "totp") {
        return verifyTotpLogin({ code, trustDevice })
      }
      return verifyBackupCodeLogin({
        code: backupCode.trim(),
        trustDevice,
      })
    },
    onSuccess: () => {
      navigate("/", { replace: true })
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message)
    },
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (mode === "totp" && code.length < 6) {
      setError("Enter the 6-digit code from your authenticator app")
      return
    }

    if (mode === "backup" && !backupCode.trim()) {
      setError("Enter a backup code")
      return
    }

    verifyMutation.mutate()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div
        aria-hidden
        className="login-backdrop pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="login-grid pointer-events-none absolute inset-0 opacity-35 dark:opacity-20"
      />
      <div
        aria-hidden
        className="login-orb pointer-events-none absolute -top-24 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-[oklch(0.82_0.06_200/0.35)] blur-3xl dark:bg-[oklch(0.45_0.08_200/0.28)]"
      />

      <div className="login-panel relative z-10 w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="login-mark text-foreground">
            <BrandMark className="size-14" />
          </div>
          <h1 className="mt-6 font-heading text-4xl font-semibold tracking-tight text-foreground">
            Elasticware
          </h1>
          <p className="mt-2 max-w-sm text-base text-muted-foreground">
            {mode === "totp"
              ? "Enter the 6-digit code from your authenticator app."
              : "Enter one of your single-use backup codes."}
          </p>
        </div>

        <form className="space-y-6" onSubmit={onSubmit}>
          {mode === "totp" ? (
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={verifyMutation.isPending}
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="backup-code" className="sr-only">
                Backup code
              </Label>
              <Input
                id="backup-code"
                value={backupCode}
                onChange={(event) => setBackupCode(event.target.value)}
                placeholder="Backup code"
                autoComplete="one-time-code"
                disabled={verifyMutation.isPending}
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={trustDevice}
              onCheckedChange={(checked) => setTrustDevice(checked === true)}
              disabled={verifyMutation.isPending}
            />
            Trust this device for 30 days
          </label>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <Button
            type="submit"
            disabled={
              verifyMutation.isPending ||
              (mode === "totp" ? code.length < 6 : !backupCode.trim())
            }
            className="w-full"
          >
            {verifyMutation.isPending ? "Verifying..." : "Continue"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {mode === "totp" ? (
            <>
              Lost access to your app?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode("backup")
                  setError(null)
                  setCode("")
                }}
              >
                Use a backup code
              </button>
            </>
          ) : (
            <>
              Have your authenticator?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setMode("totp")
                  setError(null)
                  setBackupCode("")
                }}
              >
                Enter a 6-digit code
              </button>
            </>
          )}
        </p>

        <p className="mt-3 text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default TwoFactorPage
