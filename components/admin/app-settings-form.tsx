"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2, Upload, X, AlertTriangle, Shuffle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { EmbedSection, type EmbedData } from "@/components/admin/embed-editor"
import { COLOR_PRESETS, GRADIENT_PRESETS } from "@/lib/color-themes"
import { useTranslations } from "next-intl"
import { LOCALES, LOCALE_META } from "@/i18n/locales"

const BORDER_RADIUS_OPTIONS = [
  { value: "none", key: "radiusNone", style: "0" },
  { value: "sm", key: "radiusSm", style: "4px" },
  { value: "md", key: "radiusMd", style: "8px" },
  { value: "lg", key: "radiusLg", style: "12px" },
  { value: "xl", key: "radiusXl", style: "16px" },
  { value: "full", key: "radiusFull", style: "24px" },
]

const SIDEBAR_STYLE_KEYS = [
  { value: "default", labelKey: "sidebarDefault", descKey: "sidebarDefaultDesc" },
  { value: "dark", labelKey: "sidebarDark", descKey: "sidebarDarkDesc" },
  { value: "colored", labelKey: "sidebarColored", descKey: "sidebarColoredDesc" },
]

const FONT_OPTIONS = [
  { value: "geist", label: "Geist", stack: "sans-serif" },
  { value: "inter", label: "Inter", stack: "sans-serif" },
  { value: "roboto", label: "Roboto", stack: "sans-serif" },
  { value: "open-sans", label: "Open Sans", stack: "sans-serif" },
  { value: "poppins", label: "Poppins", stack: "sans-serif" },
  { value: "nunito", label: "Nunito", stack: "sans-serif" },
  { value: "dm-sans", label: "DM Sans", stack: "sans-serif" },
  { value: "lato", label: "Lato", stack: "sans-serif" },
  { value: "raleway", label: "Raleway", stack: "sans-serif" },
  { value: "playfair", label: "Playfair Display", stack: "serif" },
  { value: "system", label: "System UI", stack: "sans-serif" },
  { value: "mono", label: "Monospace", stack: "mono" },
]

const FONT_VAR_MAP: Record<string, string> = {
  geist: "var(--font-geist-sans)",
  inter: "var(--font-inter)",
  roboto: "var(--font-roboto)",
  "open-sans": "var(--font-open-sans)",
  poppins: "var(--font-poppins)",
  nunito: "var(--font-nunito)",
  "dm-sans": "var(--font-dm-sans)",
  lato: "var(--font-lato)",
  raleway: "var(--font-raleway)",
  playfair: "var(--font-playfair)",
  system: "system-ui",
  mono: "ui-monospace",
}

interface Props {
  initialSettings: Record<string, string>
}

export function AppSettingsForm({ initialSettings }: Props) {
  const t = useTranslations("settings")
  const [appName, setAppName] = useState(initialSettings.app_name ?? "")
  const [logoUrl, setLogoUrl] = useState(initialSettings.logo_url ?? "")
  const [faviconUrl, setFaviconUrl] = useState(initialSettings.favicon_url ?? "")
  const [colorPreset, setColorPreset] = useState(initialSettings.color_preset ?? "purple")
  const [primaryHue, setPrimaryHue] = useState(parseInt(initialSettings.primary_hue ?? "277"))
  const [sidebarStyle, setSidebarStyle] = useState(initialSettings.sidebar_style ?? "default")
  const [borderRadius, setBorderRadius] = useState(initialSettings.border_radius ?? "md")
  const [fontFamily, setFontFamily] = useState(initialSettings.font_family ?? "geist")
  const [customCss, setCustomCss] = useState(initialSettings.custom_css ?? "")
  const [defaultLocale, setDefaultLocale] = useState(initialSettings.default_locale ?? "en")
  const [customGradientHue1, setCustomGradientHue1] = useState(parseInt(initialSettings.custom_gradient_hue1 ?? "277"))
  const [customGradientHue2, setCustomGradientHue2] = useState(parseInt(initialSettings.custom_gradient_hue2 ?? "195"))
  const [dmReceived, setDmReceived] = useState({
    title: initialSettings.dm_received_title ?? "",
    description: initialSettings.dm_received_description ?? "",
    footer: initialSettings.dm_received_footer ?? "",
    color: initialSettings.dm_received_color ?? "#5865F2",
  })
  const [dmAccepted, setDmAccepted] = useState({
    title: initialSettings.dm_accepted_title ?? "",
    description: initialSettings.dm_accepted_description ?? "",
    footer: initialSettings.dm_accepted_footer ?? "",
    color: initialSettings.dm_accepted_color ?? "#57F287",
  })
  const [dmRejected, setDmRejected] = useState({
    title: initialSettings.dm_rejected_title ?? "",
    description: initialSettings.dm_rejected_description ?? "",
    cooldown: initialSettings.dm_rejected_cooldown ?? "",
    footer: initialSettings.dm_rejected_footer ?? "",
    color: initialSettings.dm_rejected_color ?? "#ED4245",
  })
  const [saving, setSaving] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) {
      toast.error(t("identity.logoTooLarge"))
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setLogoUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!appName.trim()) {
      toast.error(t("nameRequired"))
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_name: appName.trim(),
          logo_url: logoUrl,
          favicon_url: faviconUrl,
          color_preset: colorPreset,
          primary_hue: String(primaryHue),
          sidebar_style: sidebarStyle,
          border_radius: borderRadius,
          font_family: fontFamily,
          custom_css: customCss,
          default_locale: defaultLocale,
          custom_gradient_hue1: String(customGradientHue1),
          custom_gradient_hue2: String(customGradientHue2),
          dm_received_title: dmReceived.title,
          dm_received_description: dmReceived.description,
          dm_received_footer: dmReceived.footer,
          dm_received_color: dmReceived.color,
          dm_accepted_title: dmAccepted.title,
          dm_accepted_description: dmAccepted.description,
          dm_accepted_footer: dmAccepted.footer,
          dm_accepted_color: dmAccepted.color,
          dm_rejected_title: dmRejected.title,
          dm_rejected_description: dmRejected.description,
          dm_rejected_cooldown: dmRejected.cooldown,
          dm_rejected_footer: dmRejected.footer,
          dm_rejected_color: dmRejected.color,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("saved"))
      setTimeout(() => window.location.reload(), 800)
    } catch {
      toast.error(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  const tEmbed = {
    embedTitle: t("discord.embedTitle"),
    embedDescription: t("discord.embedDescription"),
    embedFooter: t("discord.embedFooter"),
    embedCooldown: t("discord.embedCooldown"),
    embedColor: t("discord.embedColor"),
    vars: t("discord.vars"),
    previewTitle: t("discord.previewTitle"),
  }

  const activeHue =
    colorPreset === "custom"
      ? primaryHue
      : colorPreset === "custom-gradient"
        ? customGradientHue1
        : (GRADIENT_PRESETS[colorPreset as keyof typeof GRADIENT_PRESETS]?.hue
            ?? COLOR_PRESETS[colorPreset as keyof typeof COLOR_PRESETS]?.hue
            ?? 277)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("saveChanges")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("identity.title")}</CardTitle>
          <CardDescription>{t("identity.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>{t("identity.appName")}</Label>
            <Input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              maxLength={64}
              placeholder={t("identity.appNamePlaceholder")}
              className="max-w-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("identity.logo")}</Label>
            <div className="flex items-start gap-4">
              {logoUrl && (
                <div className="relative shrink-0">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-16 w-16 rounded-lg border object-contain p-1"
                  />
                  <button
                    onClick={() => setLogoUrl("")}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={logoUrl.startsWith("data:") ? t("identity.logoUploaded") : logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder={t("identity.logoPlaceholder")}
                    className="flex-1"
                    readOnly={logoUrl.startsWith("data:")}
                  />
                  <Button variant="outline" size="icon" onClick={() => logoInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoFile}
                />
                <p className="text-xs text-muted-foreground">{t("identity.logoDesc")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("identity.faviconUrl")}</Label>
            <Input
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder={t("identity.faviconPlaceholder")}
              className="max-w-sm"
            />
            <p className="text-xs text-muted-foreground">{t("identity.faviconDesc")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("colors.title")}</CardTitle>
          <CardDescription>{t("colors.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setColorPreset(key)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary",
                    colorPreset === key
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                      : "border-border"
                  )}
                >
                  <div
                    className="h-8 w-8 rounded-full shadow-sm"
                    style={{ background: `oklch(0.585 0.233 ${preset.hue})` }}
                  />
                  <span className="text-xs font-medium">{t(`colors.${key}` as Parameters<typeof t>[0])}</span>
                </button>
              ))}
              <button
                onClick={() => setColorPreset("custom")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary",
                  colorPreset === "custom"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                    : "border-border"
                )}
              >
                <div
                  className="h-8 w-8 rounded-full shadow-sm"
                  style={{
                    background:
                      "conic-gradient(oklch(0.6 0.22 0), oklch(0.6 0.22 60), oklch(0.6 0.22 120), oklch(0.6 0.22 180), oklch(0.6 0.22 240), oklch(0.6 0.22 300), oklch(0.6 0.22 360))",
                  }}
                />
                <span className="text-xs font-medium">{t("colors.custom")}</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{t("colors.gradients")}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(GRADIENT_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setColorPreset(key)}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border p-3 text-left transition-all hover:border-primary",
                    colorPreset === key
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                      : "border-border"
                  )}
                >
                  <div
                    className="h-10 w-full rounded-md shadow-sm"
                    style={{ background: preset.swatch }}
                  />
                  <span className="text-xs font-medium">{t(`colors.${key}` as Parameters<typeof t>[0])}</span>
                </button>
              ))}
              <button
                onClick={() => setColorPreset("custom-gradient")}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-3 text-left transition-all hover:border-primary",
                  colorPreset === "custom-gradient"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                    : "border-border"
                )}
              >
                <div
                  className="h-10 w-full rounded-md shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.72 0.18 ${customGradientHue1}), oklch(0.65 0.18 ${customGradientHue2}))`,
                  }}
                />
                <span className="text-xs font-medium">{t("colors.customGradient")}</span>
              </button>
            </div>
          </div>

          {colorPreset === "custom-gradient" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="relative">
                <div
                  className="h-14 w-full rounded-lg shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.72 0.18 ${customGradientHue1}), oklch(0.65 0.18 ${customGradientHue2}))`,
                  }}
                />
                <button
                  onClick={() => {
                    const h1 = Math.floor(Math.random() * 360)
                    const h2 = (h1 + 90 + Math.floor(Math.random() * 180)) % 360
                    setCustomGradientHue1(h1)
                    setCustomGradientHue2(h2)
                  }}
                  className="absolute right-2 top-2 rounded-md bg-black/20 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/35"
                  title="Random"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("colors.color1")}</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border" style={{ background: `oklch(0.585 0.233 ${customGradientHue1})` }} />
                      <span className="text-sm tabular-nums text-muted-foreground">{customGradientHue1}°</span>
                    </div>
                  </div>
                  <div className="relative h-5">
                    <div
                      className="pointer-events-none absolute inset-0 rounded-full"
                      style={{ background: "linear-gradient(to right, oklch(0.6 0.22 0), oklch(0.6 0.22 45), oklch(0.6 0.22 90), oklch(0.6 0.22 135), oklch(0.6 0.22 180), oklch(0.6 0.22 225), oklch(0.6 0.22 270), oklch(0.6 0.22 315), oklch(0.6 0.22 360))" }}
                    />
                    <input
                      type="range" min="0" max="360"
                      value={customGradientHue1}
                      onChange={(e) => setCustomGradientHue1(parseInt(e.target.value))}
                      className="relative h-full w-full cursor-pointer opacity-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("colors.color2")}</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border" style={{ background: `oklch(0.585 0.233 ${customGradientHue2})` }} />
                      <span className="text-sm tabular-nums text-muted-foreground">{customGradientHue2}°</span>
                    </div>
                  </div>
                  <div className="relative h-5">
                    <div
                      className="pointer-events-none absolute inset-0 rounded-full"
                      style={{ background: "linear-gradient(to right, oklch(0.6 0.22 0), oklch(0.6 0.22 45), oklch(0.6 0.22 90), oklch(0.6 0.22 135), oklch(0.6 0.22 180), oklch(0.6 0.22 225), oklch(0.6 0.22 270), oklch(0.6 0.22 315), oklch(0.6 0.22 360))" }}
                    />
                    <input
                      type="range" min="0" max="360"
                      value={customGradientHue2}
                      onChange={(e) => setCustomGradientHue2(parseInt(e.target.value))}
                      className="relative h-full w-full cursor-pointer opacity-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {colorPreset === "custom" && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label>{t("colors.hue")}</Label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrimaryHue(Math.floor(Math.random() * 360))}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Random"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-sm tabular-nums text-muted-foreground">{primaryHue}°</span>
                </div>
              </div>
              <div className="relative h-5">
                <div
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background:
                      "linear-gradient(to right, oklch(0.6 0.22 0), oklch(0.6 0.22 45), oklch(0.6 0.22 90), oklch(0.6 0.22 135), oklch(0.6 0.22 180), oklch(0.6 0.22 225), oklch(0.6 0.22 270), oklch(0.6 0.22 315), oklch(0.6 0.22 360))",
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={primaryHue}
                  onChange={(e) => setPrimaryHue(parseInt(e.target.value))}
                  className="relative h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 shrink-0 rounded-full border-2 border-background shadow-md"
                  style={{ background: `oklch(0.585 0.233 ${primaryHue})` }}
                />
                <div
                  className="h-8 flex-1 rounded-md border-2 border-background shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.585 0.233 ${primaryHue}), oklch(0.7 0.18 ${primaryHue}))`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("design.title")}</CardTitle>
          <CardDescription>{t("design.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>{t("design.borderRadius")}</Label>
            <div className="flex flex-wrap gap-3">
              {BORDER_RADIUS_OPTIONS.map(({ value, key, style }) => (
                <button
                  key={value}
                  onClick={() => setBorderRadius(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover:border-primary",
                    borderRadius === value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                      : "border-border"
                  )}
                >
                  <div
                    className="h-9 w-9 border-2 border-foreground/25 bg-muted"
                    style={{ borderRadius: style }}
                  />
                  <span className="text-xs font-medium">{t(`design.${key}` as Parameters<typeof t>[0])}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("design.sidebarStyle")}</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SIDEBAR_STYLE_KEYS.map(({ value, labelKey, descKey }) => (
                <button
                  key={value}
                  onClick={() => setSidebarStyle(value)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-all hover:border-primary",
                    sidebarStyle === value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                      : "border-border"
                  )}
                >
                  <div className="mb-3 flex h-14 overflow-hidden rounded-md border">
                    <div
                      className="flex w-1/3 flex-col gap-1 p-1.5"
                      style={{
                        background:
                          value === "dark"
                            ? `oklch(0.14 0.02 ${activeHue})`
                            : value === "colored"
                              ? `oklch(0.5 0.22 ${activeHue})`
                              : "#f1f5f9",
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-1 rounded-sm"
                          style={{
                            width: `${75 - i * 15}%`,
                            background:
                              i === 0
                                ? `oklch(0.585 0.233 ${activeHue})`
                                : value === "dark" || value === "colored"
                                  ? "rgba(255,255,255,0.3)"
                                  : "rgba(0,0,0,0.15)",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex-1 bg-white/60" />
                  </div>
                  <p className="text-sm font-medium">{t(`design.${labelKey}` as Parameters<typeof t>[0])}</p>
                  <p className="text-xs text-muted-foreground">{t(`design.${descKey}` as Parameters<typeof t>[0])}</p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("typography.title")}</CardTitle>
          <CardDescription>{t("typography.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>{t("typography.fontFamily")}</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {FONT_OPTIONS.map(({ value, label, stack }) => (
                <button
                  key={value}
                  onClick={() => setFontFamily(value)}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-all hover:border-primary",
                    fontFamily === value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/25"
                      : "border-border"
                  )}
                >
                  <span
                    className="text-xl font-medium leading-none"
                    style={{ fontFamily: FONT_VAR_MAP[value] }}
                  >
                    Ag
                  </span>
                  <span className="text-xs text-muted-foreground truncate">{label}</span>
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">{stack}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("locale.title")}</CardTitle>
          <CardDescription>{t("locale.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>{t("locale.label")}</Label>
            <Select value={defaultLocale} onValueChange={setDefaultLocale}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((loc) => {
                  const { label, flag } = LOCALE_META[loc]
                  return (
                    <SelectItem key={loc} value={loc}>
                      {flag} {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("advancedCss.title")}</CardTitle>
          <CardDescription>{t("advancedCss.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t("advancedCss.warning")}
          </div>
          <Textarea
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            placeholder={`.sidebar { border-right: 2px solid oklch(0.585 0.233 277); }`}
            className="min-h-40 font-mono text-sm"
            maxLength={32768}
          />
          <p className="text-right text-xs text-muted-foreground">{customCss.length} / 32768</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("discord.title")}</CardTitle>
          <CardDescription>{t("discord.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <EmbedSection
            label={t("discord.received")}
            vars={["{{formTitle}}", "{{date}}"]}
            data={dmReceived}
            onChange={(patch) => setDmReceived((p) => ({ ...p, ...patch }))}
            tEmbed={tEmbed}
          />
          <Separator />
          <EmbedSection
            label={t("discord.accepted")}
            vars={["{{formTitle}}"]}
            data={dmAccepted}
            onChange={(patch) => setDmAccepted((p) => ({ ...p, ...patch }))}
            tEmbed={tEmbed}
          />
          <Separator />
          <EmbedSection
            label={t("discord.rejected")}
            vars={["{{formTitle}}", "{{cooldownDays}}"]}
            data={dmRejected}
            onChange={(patch) => setDmRejected((p) => ({ ...p, ...patch }))}
            hasCooldown
            tEmbed={tEmbed}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={save} disabled={saving} size="lg">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("saveChanges")}
        </Button>
      </div>
    </div>
  )
}

