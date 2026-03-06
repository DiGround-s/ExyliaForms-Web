"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, FileText, LogOut, ExternalLink, Settings, BarChart2, Users, Check, Globe } from "lucide-react"
import { signOut } from "next-auth/react"
import { useTranslations, useLocale } from "next-intl"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "./theme-toggle"
import { LOCALES, LOCALE_META } from "@/i18n/locales"

interface AdminSidebarProps {
  appName: string
  logoUrl?: string
  role?: string
  user: {
    name?: string | null
    image?: string | null
    email?: string | null
  }
}

export function AdminSidebar({ appName, logoUrl, role, user }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("nav")
  const tCommon = useTranslations("common")
  const locale = useLocale()

  const isReviewer = role === "REVIEWER"

  const allNavItems = [
    { href: "/admin", label: t("dashboard"), icon: LayoutDashboard, exact: true, reviewerAllowed: false },
    { href: "/admin/forms", label: t("forms"), icon: FileText, reviewerAllowed: true },
    { href: "/admin/users", label: t("users"), icon: Users, reviewerAllowed: false },
    { href: "/admin/stats", label: t("stats"), icon: BarChart2, reviewerAllowed: false },
    { href: "/admin/settings", label: t("settings"), icon: Settings, reviewerAllowed: false },
  ]

  const navItems = allNavItems.filter((item) => !isReviewer || item.reviewerAllowed)

  const roleBadgeLabel = role === "SUPERADMIN"
    ? tCommon("superadmin")
    : role === "REVIEWER"
      ? tCommon("reviewer")
      : tCommon("admin")

  function changeLocale(value: string) {
    document.cookie = `NEXT_LOCALE=${value}; path=/; max-age=31536000; SameSite=Lax`
    router.refresh()
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        {logoUrl && (
          <img src={logoUrl} alt={appName} className="h-7 w-7 shrink-0 rounded object-contain" />
        )}
        <span className="truncate text-lg font-semibold tracking-tight">{appName}</span>
        <Badge variant="secondary" className="ml-auto shrink-0 text-xs">{roleBadgeLabel}</Badge>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3 pb-0">
        <Link
          href="/app/forms"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          {t("userView")}
        </Link>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 px-2 py-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full ring-offset-background transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={user.image ?? undefined} />
                  <AvatarFallback>{user.name?.[0]?.toUpperCase() ?? "A"}</AvatarFallback>
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
