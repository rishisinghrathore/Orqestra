export const APPEARANCE_LANGUAGE_KEY = "appearance-language"
export const APPEARANCE_TIMEZONE_KEY = "appearance-timezone"
export const APPEARANCE_SPACING_KEY = "appearance-spacing"

export type SpacingDensity = "regular" | "compact"

export const COMPACT_SPACING_VALUE = "3.7px"

export function getStoredLanguage(fallback = "en") {
  return localStorage.getItem(APPEARANCE_LANGUAGE_KEY) ?? fallback
}

export function setStoredLanguage(language: string) {
  localStorage.setItem(APPEARANCE_LANGUAGE_KEY, language)
}

export function getStoredTimezone(fallback = "system") {
  return localStorage.getItem(APPEARANCE_TIMEZONE_KEY) ?? fallback
}

export function setStoredTimezone(timezone: string) {
  localStorage.setItem(APPEARANCE_TIMEZONE_KEY, timezone)
}

export function getStoredSpacing(fallback: SpacingDensity = "regular"): SpacingDensity {
  const value = localStorage.getItem(APPEARANCE_SPACING_KEY)
  return value === "compact" || value === "regular" ? value : fallback
}

export function applySpacing(density: SpacingDensity) {
  const root = document.documentElement
  if (density === "compact") {
    root.style.setProperty("--spacing", COMPACT_SPACING_VALUE)
  } else {
    root.style.removeProperty("--spacing")
  }
  localStorage.setItem(APPEARANCE_SPACING_KEY, density)
}

export function initAppearancePreferences() {
  applySpacing(getStoredSpacing())
}
