import { auth } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { getSettings } from "@/lib/settings"
import { UserSidebar } from "@/components/layout/user-sidebar"
import { MobileDrawer } from "@/components/layout/mobile-drawer"

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/")

  const settings = await getSettings(["app_name", "logo_url"])
  const appName = settings.app_name
  const logoUrl = settings.logo_url

  const sidebar = (
    <UserSidebar
      appName={appName}
      logoUrl={logoUrl || undefined}
      user={{
        name: session.user.name,
        image: session.user.image,
        email: session.user.email,
      }}
      isAdmin={hasAdminAccess(session.user.role)}
    />
  )

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">{sidebar}</div>
      <div data-content="" className="relative flex flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_20%_0%,oklch(0.88_0.12_320/.35),transparent_45%),radial-gradient(circle_at_80%_85%,oklch(0.9_0.14_155/.32),transparent_50%),linear-gradient(160deg,oklch(0.99_0_0),oklch(0.96_0.01_285))] dark:bg-[radial-gradient(circle_at_18%_5%,oklch(0.46_0.21_305/.28),transparent_42%),radial-gradient(circle_at_82%_88%,oklch(0.63_0.19_152/.22),transparent_48%),linear-gradient(160deg,oklch(0.12_0_0),oklch(0.17_0.03_290)_45%,oklch(0.12_0_0))]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[-8%] h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-fuchsia-400/30 via-violet-400/20 to-transparent blur-3xl dark:from-fuchsia-500/25 dark:via-violet-500/20" />
          <div className="absolute bottom-[-18%] left-[-8%] h-[28rem] w-[28rem] animate-pulse rounded-full bg-gradient-to-tr from-emerald-300/28 via-lime-200/22 to-transparent blur-3xl dark:from-emerald-400/20 dark:via-lime-300/14" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(1_0_0_/_0.26),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,oklch(0.18_0.01_285_/_0.58),transparent_62%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,oklch(0.98_0_0_/_0.7)_78%,oklch(0.96_0_0_/_0.95))] dark:bg-[linear-gradient(to_bottom,transparent,oklch(0.1_0_0_/_0.55)_76%,oklch(0.1_0_0_/_0.9))]" />
        </div>
        <header className="relative z-10 flex h-14 items-center border-b bg-background/70 px-4 backdrop-blur md:hidden">
          <MobileDrawer sidebar={sidebar} />
          <span className="ml-2 font-semibold">{appName}</span>
        </header>
        <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
