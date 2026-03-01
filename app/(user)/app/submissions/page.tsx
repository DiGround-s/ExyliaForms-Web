import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowRight, CalendarClock, Sparkles } from "lucide-react"
import { getTranslations, getLocale } from "next-intl/server"
import { LOCALE_META } from "@/i18n/locales"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getFormIcon } from "@/lib/form-icons"

export default async function SubmissionsPage() {
  const session = await auth()

  const [submissions, t, locale] = await Promise.all([
    prisma.submission.findMany({
      where: { userId: session!.user.id },
      include: {
        form: { select: { id: true, title: true, status: true, icon: true } },
        _count: { select: { answers: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getTranslations("submissions"),
    getLocale(),
  ])

  const bcp47 = LOCALE_META[locale as keyof typeof LOCALE_META]?.bcp47 ?? locale

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 via-card/80 to-card/65 p-5 shadow-sm backdrop-blur-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("title")}</h1>
            <p className="text-sm text-muted-foreground md:text-base">{t("subtitle")}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {t("count", { count: submissions.length })}
          </div>
        </div>
      </div>

      {submissions.length === 0 && (
        <Alert>
          <AlertDescription>{t("noSubmissions")}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {submissions.map((sub, index) => {
          const Icon = getFormIcon(sub.form.icon)
          return (
            <Card
              key={sub.id}
              className="group border-border/70 bg-card/80 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md animate-in fade-in-0 slide-in-from-bottom-3 duration-700"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <CardHeader className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{sub.form.title}</CardTitle>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {new Intl.DateTimeFormat(bcp47, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(sub.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sub.form.status === "PUBLISHED" ? "default" : "secondary"}>
                      {sub.form.status === "PUBLISHED" ? t("statusPublished") : t("statusHidden")}
                    </Badge>
                    <Badge variant="outline">{t("answersCount", { count: sub._count.answers })}</Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/app/submissions/${sub.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
