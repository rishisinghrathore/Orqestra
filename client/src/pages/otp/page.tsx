import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

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

type OtpLocationState = {
  email?: string
}

const OtpPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as OtpLocationState | null)?.email
  const [otp, setOtp] = useState("")

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div aria-hidden className="login-backdrop pointer-events-none absolute inset-0" />
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
          <p className="mt-2 max-w-xs text-base text-muted-foreground">
            Enter the 4-digit code
            {email ? (
              <>
                {" "}
                sent to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </>
            ) : (
              " we sent to your email"
            )}
            .
          </p>
        </div>

        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault()
            if (otp.length < 4) return
            navigate("/login")
          }}
        >
          <div className="flex justify-center">
            <InputOTP maxLength={4} value={otp} onChange={setOtp}>
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3].map((index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            type="submit"
            disabled={otp.length < 4}
            className="w-full"
          >
            Verify code
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Resend
          </button>
        </p>

        <p className="mt-3 text-center text-sm text-muted-foreground">
          <Link
            to="/forgot-password"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Use a different email
          </Link>
        </p>
      </div>
    </div>
  )
}

export default OtpPage
