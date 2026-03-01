import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { getSetting } from "@/lib/settings"
import { LOCALES, DEFAULT_LOCALE, type Locale } from "./locales"

function toLocale(raw: string | undefined): Locale | null {
  if (raw && (LOCALES as readonly string[]).includes(raw)) return raw as Locale
  return null
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const fromCookie = toLocale(cookieStore.get("NEXT_LOCALE")?.value)
  const fromDb = fromCookie ? null : toLocale(await getSetting("default_locale"))
  const locale = fromCookie ?? fromDb ?? DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
