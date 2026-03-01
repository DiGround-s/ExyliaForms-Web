"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Globe } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LOCALES, LOCALE_META } from "@/i18n/locales"

export function LanguageSwitcher() {
  const locale = useLocale()
  const t = useTranslations("lang")
  const router = useRouter()

  function onChange(value: string) {
    document.cookie = `NEXT_LOCALE=${value}; path=/; max-age=31536000; SameSite=Lax`
    router.refresh()
  }

  return (
    <Select value={locale} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto gap-1.5 border-none px-2 text-xs shadow-none hover:bg-sidebar-accent/60" aria-label={t("label")}>
        <Globe className="h-3.5 w-3.5 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {LOCALES.map((loc) => {
          const { label, flag } = LOCALE_META[loc]
          return (
            <SelectItem key={loc} value={loc} className="text-xs">
              {flag} {label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
