export const LOCALES = ["es", "en", "pt", "zh", "fr"] as const
export type Locale = (typeof LOCALES)[number]

export const LOCALE_META: Record<Locale, { label: string; flag: string; bcp47: string }> = {
  es: { label: "Español", flag: "🇪🇸", bcp47: "es-ES" },
  en: { label: "English", flag: "🇺🇸", bcp47: "en-US" },
  pt: { label: "Português", flag: "🇧🇷", bcp47: "pt-BR" },
  zh: { label: "中文", flag: "🇨🇳", bcp47: "zh-CN" },
  fr: { label: "Français", flag: "🇫🇷", bcp47: "fr-FR" },
}

export const DEFAULT_LOCALE: Locale = "es"
