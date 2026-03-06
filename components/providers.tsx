"use client"

import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"

export function Providers({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster richColors />
      </ThemeProvider>
    </SessionProvider>
  )
}
