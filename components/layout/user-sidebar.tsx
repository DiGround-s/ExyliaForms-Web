"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FileText, ClipboardList, LogOut, Shield, Check, Globe } from "lucide-react"
import { signOut } from "next-auth/react"
import { useTranslations, useLocale } from "next-intl"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "./theme-toggle"
import { LOCALES, LOCALE_META } from "@/i18n/locales"

interface UserSidebarProps {
  appName: string
  logoUrl?: string
  user: {
    name?: string | null
    image?: string | null
    email?: string | null
  }
  isAdmin?: boolean
}

export function UserSidebar({ appName, logoUrl, user, isAdmin }: UserSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("nav")
  const locale = useLocale()

  const navItems = [
    { href: "/app/forms", label: t("forms"), icon: FileText },
    { href: "/app/submissions", label: t("submissions"), icon: ClipboardList },
  ]

  function changeLocale(value: string) {
    document.cookie = `NEXT_LOCALE=${value}; path=/; max-age=31536000; SameSite=Lax`
    router.refresh()
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border/70 bg-sidebar/90 backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/80">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border/70 px-5">
        {logoUrl && (
          <img src={logoUrl} alt={appName} className="h-7 w-7 shrink-0 rounded object-contain" />
        )}
        <span className="truncate text-lg font-semibold tracking-tight">{appName}</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }, index) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:translate-x-0.5 animate-in fade-in-0 slide-in-from-left-3 duration-500",
              pathname.startsWith(href)
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
            )}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {isAdmin && (
        <div className="border-t border-sidebar-border/70 p-3 pb-0">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
          >
            <Shield className="h-4 w-4" />
            {t("adminPanel")}
          </Link>
        </div>
      )}

      <div className={`p-3 ${isAdmin ? "" : "border-t border-sidebar-border/70"}`}>
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full ring-offset-background transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={user.image ?? undefined} />
                  <AvatarFallback>{user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Globe className="mr-2 h-4 w-4" />
                  {LOCALE_META[locale as keyof typeof LOCALE_META]?.flag} {LOCALE_META[locale as keyof typeof LOCALE_META]?.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {LOCALES.map((loc) => (
                    <DropdownMenuItem key={loc} onClick={() => changeLocale(loc)} className="cursor-pointer">
                      {locale === loc && <Check className="mr-2 h-3.5 w-3.5" />}
                      {locale !== loc && <span className="mr-2 w-3.5" />}
                      {LOCALE_META[loc].flag} {LOCALE_META[loc].label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
