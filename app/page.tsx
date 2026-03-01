import { auth, signIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSetting } from "@/lib/settings"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export default async function LandingPage() {
  const session = await auth()
  if (session) {
    if (session.user.role === "ADMIN") redirect("/admin")
    redirect("/app/forms")
  }

  const [appName, t] = await Promise.all([
    getSetting("app_name"),
    getTranslations("auth"),
  ])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">{appName}</h1>
          <p className="mt-2 text-muted-foreground">{t("platform")}</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("loginTitle")}</CardTitle>
            <CardDescription>{t("loginDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async () => {
                "use server"
                await signIn("discord")
              }}
            >
              <Button type="submit" className="w-full" size="lg">
                <svg
                  className="mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 127.14 96.36"
                  fill="currentColor"
                >
                  <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.12 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.12 12.69-11.43 12.69Z" />
                </svg>
                {t("loginWithDiscord")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
