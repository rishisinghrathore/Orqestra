import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import {
  applyThemeColors,
  PRIMARY_COLOR_OPTIONS,
  THEME_PRIMARY_STORAGE_KEY,
} from "@/lib/theme-colors"
import {
  applySpacing,
  getStoredLanguage,
  getStoredSpacing,
  getStoredTimezone,
  setStoredLanguage,
  setStoredTimezone,
  type SpacingDensity,
} from "@/lib/appearance"
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/components/theme-provider"
import { getLanguageSelectOptions } from "./language-options"

const TIMEZONE_OPTIONS = [
  {
    value: "system",
    label: "System settings · (GMT+05:30) India Standard Time — Kolkata",
  },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "Europe/London", label: "London" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
  { value: "Asia/Tokyo", label: "Tokyo" },
] as const

const AppearanceSettingsPage = () => {
  const { theme, setTheme } = useTheme()
  const languageOptions = useMemo(() => getLanguageSelectOptions(), [])
  const [language, setLanguage] = useState(() => getStoredLanguage("en"))
  const [timezone, setTimezone] = useState(() => getStoredTimezone("system"))
  const [spacing, setSpacing] = useState<SpacingDensity>(() =>
    getStoredSpacing("regular")
  )
  const [primaryColor, setPrimaryColor] = useState<string | null>(() =>
    localStorage.getItem(THEME_PRIMARY_STORAGE_KEY)
  )

  const selectPrimaryColor = (color: string) => {
    localStorage.setItem(THEME_PRIMARY_STORAGE_KEY, color)
    setPrimaryColor(color)
    applyThemeColors({ primary: color })
  }

  const onLanguageChange = (value: string | null) => {
    if (!value) return
    setLanguage(value)
    setStoredLanguage(value)
  }

  const onTimezoneChange = (value: string | null) => {
    if (!value) return
    setTimezone(value)
    setStoredTimezone(value)
  }

  const onSpacingChange = (value: string) => {
    const next = value === "compact" ? "compact" : "regular"
    setSpacing(next)
    applySpacing(next)
  }

  useEffect(() => {
    if (
      languageOptions.length > 0 &&
      !languageOptions.some((option) => option.value === language)
    ) {
      const fallback =
        languageOptions.find(
          (option) => option.value === "en" || option.value.startsWith("en-")
        ) ?? languageOptions[0]
      setLanguage(fallback.value)
      setStoredLanguage(fallback.value)
    }
  }, [language, languageOptions])

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theme, language, timezone, and density preferences for your
            workspace.
          </p>
        </div>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-medium">Theme</h2>
            <p className="text-sm text-muted-foreground">
              Choose light, dark, or match your system setting.
            </p>
          </div>
          <RadioGroup
            value={theme}
            onValueChange={(value) =>
              setTheme(value as "light" | "dark" | "system")
            }
            className="grid grid-cols-1 gap-3 sm:grid-cols-4"
          >
            <FieldLabel
              className="relative h-32 cursor-pointer rounded-xl border border-border bg-card has-data-checked:border-primary"
              htmlFor="theme-light"
            >
              <Field orientation="horizontal" className="p-3">
                <FieldContent>
                  <FieldTitle>Light</FieldTitle>
                </FieldContent>
                <RadioGroupItem value="light" id="theme-light" />
              </Field>
              <div className="absolute bottom-0 left-1/2 h-20 w-2/3 -translate-x-1/2 rounded-t-md border bg-white p-2 text-black">
                Aa
              </div>
            </FieldLabel>

            <FieldLabel
              className="relative h-32 cursor-pointer rounded-xl border border-border bg-card has-data-checked:border-primary"
              htmlFor="theme-dark"
            >
              <Field orientation="horizontal" className="p-3">
                <FieldContent>
                  <FieldTitle>Dark</FieldTitle>
                </FieldContent>
                <RadioGroupItem value="dark" id="theme-dark" />
              </Field>
              <div className="absolute bottom-0 left-1/2 h-20 w-2/3 -translate-x-1/2 rounded-t-md border bg-zinc-900 p-2 text-white">
                Aa
              </div>
            </FieldLabel>

            <FieldLabel
              className="relative h-32 cursor-pointer rounded-xl border border-border bg-card has-data-checked:border-primary"
              htmlFor="theme-system"
            >
              <Field orientation="horizontal" className="p-3">
                <FieldContent>
                  <FieldTitle>System</FieldTitle>
                </FieldContent>
                <RadioGroupItem value="system" id="theme-system" />
              </Field>
              <div className="absolute bottom-0 left-1/2 flex h-20 w-2/3 -translate-x-1/2 overflow-hidden rounded-t-md border">
                <div className="h-full w-1/2 bg-white p-2 text-black">Aa</div>
                <div className="h-full w-1/2 bg-zinc-900 p-2 text-white">Aa</div>
              </div>
            </FieldLabel>
          </RadioGroup>
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-medium">Language & timezone</h2>
            <p className="text-sm text-muted-foreground">
              Preferred language and timezone for dates and times.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="appearance-language">
                Language
              </label>
              <Select value={language} onValueChange={onLanguageChange}>
                <SelectTrigger
                  id="appearance-language"
                  className="h-10 w-full"
                >
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  className="max-h-72"
                >
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="appearance-timezone">
                Timezone
              </label>
              <Select value={timezone} onValueChange={onTimezoneChange}>
                <SelectTrigger
                  id="appearance-timezone"
                  className="h-10 w-full"
                >
                  <SelectValue placeholder="Timezone" />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-medium">Spacing</h2>
            <p className="text-sm text-muted-foreground">
              Choose between regular and compact spacing.
            </p>
          </div>

          <RadioGroup
            value={spacing}
            onValueChange={onSpacingChange}
            className="grid grid-cols-1 gap-3 sm:grid-cols-4"
          >
            <FieldLabel
              className="cursor-pointer rounded-xl border border-border bg-card   has-data-checked:border-primary"
              htmlFor="spacing-regular"
            >
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Regular</FieldTitle>
                  <p className="text-sm text-muted-foreground">
                    Default spacing scale.
                  </p>
                </FieldContent>
                <RadioGroupItem value="regular" id="spacing-regular" />
              </Field>
            </FieldLabel>

            <FieldLabel
              className="cursor-pointer rounded-xl border border-border bg-card   has-data-checked:border-primary"
              htmlFor="spacing-compact"
            >
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Compact</FieldTitle>
                  <p className="text-sm text-muted-foreground">
                    Tighter layout
                  </p>
                </FieldContent>
                <RadioGroupItem value="compact" id="spacing-compact" />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-medium">Theme colors</h2>
            <p className="text-sm text-muted-foreground">
              Pick a primary accent color for the interface.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {PRIMARY_COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Set primary color to ${color}`}
                aria-pressed={primaryColor === color}
                onClick={() => selectPrimaryColor(color)}
                className={cn(
                  "size-10 rounded-full border border-border transition-all hover:scale-105",
                  primaryColor === color &&
                    "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AppearanceSettingsPage
