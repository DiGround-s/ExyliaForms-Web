import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSetting } from "@/lib/settings"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { MobileDrawer } from "@/components/layout/mobile-drawer"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/app/forms")

  const appName = await getSetting("app_name")

  const sidebar = (
    <AdminSidebar
      appName={appName}
      user={{
        name: session.user.name,
        image: session.user.image,
        email: session.user.email,
      }}
    />
  )

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:flex">{sidebar}</div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b px-4 md:hidden">
          <MobileDrawer sidebar={sidebar} />
          <span className="ml-2 font-semibold">{appName} — Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
