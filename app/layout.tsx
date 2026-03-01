import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter, Roboto, Open_Sans, Poppins, Nunito, DM_Sans, Playfair_Display, Lato, Raleway } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ThemeInjector } from "@/components/theme-injector"
import { getSettings } from "@/lib/settings"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] })
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["400", "500", "700"] })
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"] })
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] })
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] })
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] })
const lato = Lato({ variable: "--font-lato", subsets: ["latin"], weight: ["400", "700"] })
const raleway = Raleway({ variable: "--font-raleway", subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings(["app_name", "favicon_url"])
  return {
    title: settings.app_name || "Exylia Forms",
    description: "Sistema de formularios con autenticación Discord",
    icons: settings.favicon_url ? { icon: settings.favicon_url } : undefined,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeInjector />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${roboto.variable} ${openSans.variable} ${poppins.variable} ${nunito.variable} ${dmSans.variable} ${playfair.variable} ${lato.variable} ${raleway.variable} antialiased`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
