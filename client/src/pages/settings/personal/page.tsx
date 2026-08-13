import { FormEvent, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  LaptopIcon,
  SmartPhone01Icon,
  Tablet01Icon,
} from "@hugeicons/core-free-icons"
import { accountKeys, listAccounts, setPassword } from "@/api/account"
import {
  formatDeviceType,
  formatSessionDate,
  formatUserAgent,
  getDeviceType,
  listSessions,
  revokeSession,
  sessionKeys,
  type DeviceType,
  type UserSession,
} from "@/api/sessions"
import { TwoFactorSettings } from "@/components/settings/two-factor-settings"
import { authClient, signOut, useSession } from "@/lib/auth-client"

const deviceIcons = {
  mobile: SmartPhone01Icon,
  tablet: Tablet01Icon,
  laptop: LaptopIcon,
} as const

const DeviceTypeIcon = ({ type }: { type: DeviceType }) => (
  <Button variant="ghost" size={'sm'}>
    <HugeiconsIcon icon={deviceIcons[type]} size={18} strokeWidth={2} />
    {formatDeviceType(type)}
  </Button>
)

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name?.trim() || email?.trim() || "?"
  const parts = source.split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

const PersonalSettingsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session, isPending, refetch } = useSession()
  const user = session?.user
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionToRevoke, setSessionToRevoke] = useState<UserSession | null>(
    null
  )

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const accountsQuery = useQuery({
    queryKey: accountKeys.list(),
    queryFn: listAccounts,
    enabled: Boolean(user),
  })

  const sessionsQuery = useQuery({
    queryKey: sessionKeys.list(),
    queryFn: listSessions,
    enabled: Boolean(user),
  })

  const currentSessionToken = session?.session?.token

  const revokeSessionMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: async (_data, token) => {
      setSessionError(null)
      setSessionToRevoke(null)
      if (token === currentSessionToken) {
        navigate("/login", { replace: true })
        return
      }
      await queryClient.invalidateQueries({ queryKey: sessionKeys.list() })
    },
    onError: (mutationError: Error) => {
      setSessionError(mutationError.message)
      setSessionToRevoke(null)
    },
  })

  const revokeTargetIsCurrent =
    Boolean(sessionToRevoke) &&
    Boolean(currentSessionToken) &&
    sessionToRevoke?.token === currentSessionToken

  const hasCredential = accountsQuery.isError
    ? false
    : accountsQuery.data
      ? accountsQuery.data.some(
          (account) => account.providerId === "credential"
        )
      : null

  const updateProfileMutation = useMutation({
    mutationFn: async (nextName: string) => {
      const { error: updateError } = await authClient.updateUser({
        name: nextName,
      })
      if (updateError) {
        throw new Error(updateError.message ?? "Failed to update profile")
      }
    },
    onSuccess: async () => {
      await refetch()
      setSuccess("Profile updated")
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message)
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: async (input: {
      currentPassword: string
      newPassword: string
    }) => {
      const { error: changeError } = await authClient.changePassword({
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
        revokeOtherSessions: false,
      })
      if (changeError) {
        throw new Error(changeError.message ?? "Failed to change password")
      }
    },
    onSuccess: () => {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordSuccess("Password updated")
    },
    onError: (mutationError: Error) => {
      setPasswordError(mutationError.message)
    },
  })

  const setPasswordMutation = useMutation({
    mutationFn: setPassword,
    onSuccess: async () => {
      setNewPassword("")
      setConfirmPassword("")
      setPasswordSuccess(
        "Password set. You can sign in with email and password now."
      )
      await queryClient.invalidateQueries({ queryKey: accountKeys.list() })
    },
    onError: (mutationError: Error) => {
      setPasswordError(mutationError.message)
    },
  })

  useEffect(() => {
    setName(user?.name ?? "")
  }, [user?.name])

  const onSave = (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    const nextName = name.trim()
    if (!nextName) {
      setError("Name is required")
      return
    }

    if (nextName === (user.name ?? "").trim()) {
      setSuccess("No changes to save")
      return
    }

    setError(null)
    setSuccess(null)
    updateProfileMutation.mutate(nextName)
  }

  const onPasswordSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      setPasswordSuccess(null)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      setPasswordSuccess(null)
      return
    }

    if (hasCredential && !currentPassword) {
      setPasswordError("Current password is required")
      setPasswordSuccess(null)
      return
    }

    setPasswordError(null)
    setPasswordSuccess(null)

    if (hasCredential) {
      changePasswordMutation.mutate({ currentPassword, newPassword })
      return
    }

    setPasswordMutation.mutate(newPassword)
  }

  const onChangeAvatarClick = () => {
    setError(null)
    setSuccess(null)
    fileInputRef.current?.click()
  }

  const onAvatarSelected = () => {
    setSuccess("Avatar upload is coming soon")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const [signingOut, setSigningOut] = useState(false)

  const onSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate("/login", { replace: true })
        },
        onError: () => {
          setSigningOut(false)
          setError("Failed to sign out. Please try again.")
        },
      },
    })
  }

  const saving = updateProfileMutation.isPending
  const changingPassword =
    changePasswordMutation.isPending || setPasswordMutation.isPending

  if (isPending) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-12">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-12">
        <p className="text-sm text-muted-foreground">
          Sign in to manage your personal profile.
        </p>
      </div>
    )
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Personal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account photo and personal details.
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? <p className="text-sm text-muted-foreground">{success}</p> : null}

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">Avatar</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Shown across the app for your account.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              {user.image ? (
                <AvatarImage
                  src={user.image}
                  alt={user.name || user.email || "User"}
                />
              ) : null}
              <AvatarFallback className="text-lg">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarSelected}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onChangeAvatarClick}
              >
                Change avatar
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, or WebP. Upload support.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">Personal details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your name and email address.
            </p>
          </div>

          <form onSubmit={onSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="personal-name">Name</Label>
                <Input
                  id="personal-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personal-email">Email</Label>
                <InputGroup>
                  <InputGroupInput
                    id="personal-email"
                    value={user.email ?? ""}
                    readOnly
                  />
                  {user.emailVerified ? (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        size="xs"
                        variant="secondary"
                        className="pointer-events-none gap-1 border-transparent bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/15 dark:text-emerald-400"
                      >
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          strokeWidth={2}
                        />
                        Verified
                      </InputGroupButton>
                    </InputGroupAddon>
                  ) : null}
                </InputGroup>
              </div>
            </div>

            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">
              {hasCredential ? "Change password" : "Set password"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasCredential
                ? "Enter your current password, then choose a new one."
                : "You signed in with Google. Set a password to also use email login."}
            </p>
          </div>

          {passwordError ? (
            <p className="text-sm text-destructive">{passwordError}</p>
          ) : null}
          {passwordSuccess ? (
            <p className="text-sm text-muted-foreground">{passwordSuccess}</p>
          ) : null}

          {accountsQuery.isPending || hasCredential === null ? (
            <p className="text-sm text-muted-foreground">
              Checking account credentials...
            </p>
          ) : (
            <form onSubmit={onPasswordSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {hasCredential ? (
                  <div className="space-y-2 sm:col-span-2 sm:max-w-md">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="secondary"
                disabled={
                  changingPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  (hasCredential && !currentPassword)
                }
              >
                {changingPassword
                  ? hasCredential
                    ? "Updating..."
                    : "Setting..."
                  : hasCredential
                    ? "Update password"
                    : "Set password"}
              </Button>
            </form>
          )}
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">
              Two-factor authentication
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add an authenticator app for an extra sign-in step.
            </p>
          </div>

          <TwoFactorSettings
            enabled={Boolean(
              (user as { twoFactorEnabled?: boolean | null }).twoFactorEnabled
            )}
            hasCredential={hasCredential}
            onChanged={refetch}
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">Security activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review devices signed in to your account.
            </p>
          </div>

          <Tabs defaultValue="sessions">
            <TabsList>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="login-activity" disabled>
                Login activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="mt-4 space-y-3">
              {sessionError ? (
                <p className="text-sm text-destructive">{sessionError}</p>
              ) : null}
              {sessionsQuery.isPending ? (
                <p className="text-sm text-muted-foreground">
                  Loading sessions...
                </p>
              ) : sessionsQuery.error ? (
                <p className="text-sm text-destructive">
                  {(sessionsQuery.error as Error).message}
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-4">Device</TableHead>
                        <TableHead>Device type</TableHead>
                        <TableHead>IP address</TableHead>
                        <TableHead>Signed in</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="pr-4 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(sessionsQuery.data?.length ?? 0) === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="px-4 py-8 text-center text-sm text-muted-foreground"
                          >
                            No active sessions found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sessionsQuery.data?.map((item) => {
                          const isCurrent =
                            Boolean(currentSessionToken) &&
                            item.token === currentSessionToken
                          const deviceType = getDeviceType(item.userAgent)
                          const isRevoking =
                            revokeSessionMutation.isPending &&
                            revokeSessionMutation.variables === item.token

                          return (
                            <TableRow
                              key={item.id}
                              className={isCurrent ? "bg-muted" : undefined}
                            >
                              <TableCell className="pl-4">
                                <div className="space-y-1">
                                  <p className="font-medium">
                                    {formatUserAgent(item.userAgent)}
                                  </p>
                                  {isCurrent ? (
                                    <p className="text-xs text-muted-foreground">
                                      This device
                                    </p>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell>
                                <DeviceTypeIcon type={deviceType} />
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {item.ipAddress?.trim() || "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatSessionDate(item.createdAt)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatSessionDate(item.expiresAt)}
                              </TableCell>
                              <TableCell className="pr-4 text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={revokeSessionMutation.isPending}
                                  onClick={() => {
                                    setSessionError(null)
                                    setSessionToRevoke(item)
                                  }}
                                >
                                  {isRevoking ? "Revoking..." : "Revoke"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="login-activity" className="mt-4">
              <p className="text-sm text-muted-foreground">
                Login activity history is coming soon.
              </p>
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">Log out</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign out of your account on this device.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={signingOut}
            onClick={() => void onSignOut()}
          >
            {signingOut ? "Signing out..." : "Log out"}
          </Button>
        </section>

        <AlertDialog
          open={sessionToRevoke !== null}
          onOpenChange={(open) => {
            if (!open && !revokeSessionMutation.isPending) {
              setSessionToRevoke(null)
            }
          }}
        >
          <AlertDialogContent size="default">
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke session?</AlertDialogTitle>
              <AlertDialogDescription>
                {revokeTargetIsCurrent
                  ? "This will sign you out of this device immediately."
                  : `This will sign out ${
                      sessionToRevoke
                        ? formatUserAgent(sessionToRevoke.userAgent)
                        : "that device"
                    }. They'll need to sign in again.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={revokeSessionMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={
                  revokeSessionMutation.isPending || !sessionToRevoke
                }
                onClick={() => {
                  if (!sessionToRevoke) return
                  revokeSessionMutation.mutate(sessionToRevoke.token)
                }}
              >
                {revokeSessionMutation.isPending
                  ? "Revoking..."
                  : revokeTargetIsCurrent
                    ? "Revoke and sign out"
                    : "Revoke session"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default PersonalSettingsPage
