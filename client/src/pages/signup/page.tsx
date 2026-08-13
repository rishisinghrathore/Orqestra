import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/lib/auth-client"

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

const SignupPage = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

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
            Create your sales workspace account.
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="name" className="sr-only">
              Full name
            </Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="sr-only">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="sr-only">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="sr-only">
              Confirm password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>

        <div className="my-7 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            void signIn.social({
              provider: "google",
              callbackURL: window.location.origin + "/create-workspace",
            })
          }}
        >
          Continue with Google
        </Button>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignupPage
