import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { FileText, Users, CheckSquare, Bell, Plus } from "lucide-react"
import { getTranslations, getLocale } from "next-intl/server"
import { LOCALE_META } from "@/i18n/locales"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function AdminDashboard() {
  const [publishedCount, totalSubmissions, unreadCount, usersCount, recentSubmissions, t, locale] = await Promise.all([
    prisma.form.count({ where: { status: "PUBLISHED" } }),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { globalName: true, username: true, discordId: true, image: true } },
        form: { select: { title: true, id: true } },
      },
    }),
    getTranslations("admin"),
    getLocale(),
  ])

  const bcp47 = LOCALE_META[locale as keyof typeof LOCALE_META]?.bcp47 ?? locale
  const tCommon = await getTranslations("common")

  const stats = [
    { label: t("statsPublished"), value: publishedCount, icon: FileText },
    { label: t("statsResponses"), value: totalSubmissions, icon: CheckSquare },
    { label: t("statsPending"), value: unreadCount, icon: Bell },
    { label: t("statsUsers"), value: usersCount, icon: Users },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/admin/forms/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("newForm")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t("latestResponses")}</h2>
        {recentSubmissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noResponses")}</p>
        ) : (
          <div className="space-y-2">
            {recentSubmissions.map((sub) => {
              const name = sub.user.globalName ?? sub.user.username ?? sub.user.discordId ?? t("unknownUser")
              const initial = name[0]?.toUpperCase() ?? "U"
              return (
                <Card key={sub.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={sub.user.image ?? undefined} />
                        <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">{sub.form.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.status === "PENDING" && <Badge variant="secondary">{t("statsPending")}</Badge>}
                      <p className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat(bcp47, { dateStyle: "short", timeStyle: "short" }).format(new Date(sub.createdAt))}
                      </p>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/forms/${sub.form.id}/submissions`}>{tCommon("view")}</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
