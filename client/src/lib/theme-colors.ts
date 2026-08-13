export const THEME_PRIMARY_STORAGE_KEY = "theme-primary"

export const PRIMARY_COLOR_OPTIONS = [
  "#18181b",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
] as const

function hexToOklchChannels(hex: string): string | null {
  const normalized = hex.replace("#", "").trim()
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null

  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255

  const toLinear = (channel: number) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

  const rl = toLinear(r)
  const gl = toLinear(g)
  const bl = toLinear(b)

  const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl
  const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl
  const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bChannel = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  const C = Math.hypot(a, bChannel)
  let H = (Math.atan2(bChannel, a) * 180) / Math.PI
  if (H < 0) H += 360

  return `${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)}`
}

export function applyThemeColors(options?: { primary?: string | null }) {
  const root = document.documentElement
  const primary = options?.primary ?? localStorage.getItem(THEME_PRIMARY_STORAGE_KEY)
  if (!primary) return

  const channels = hexToOklchChannels(primary)
  if (!channels) return

  root.style.setProperty("--primary", `oklch(${channels})`)
  root.style.setProperty("--primary-foreground", "oklch(0.985 0 0)")
  root.style.setProperty("--ring", `oklch(${channels})`)
  root.style.setProperty("--sidebar-primary", `oklch(${channels})`)
  root.style.setProperty("--sidebar-ring", `oklch(${channels})`)
}
