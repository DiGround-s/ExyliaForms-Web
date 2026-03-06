import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowRight, Sparkles, ClipboardList, Lock } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getFormIcon } from "@/lib/form-icons"

export default async function FormsPage() {
  const [forms, t] = await Promise.all([
    prisma.form.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        isActive: true,
        _count: { select: { submissions: true } },
      },
    }),
    getTranslations("forms"),
  ])

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 via-card/80 to-card/60 p-5 shadow-sm backdrop-blur-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("title")}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{t("subtitle")}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {t("availableCount", { count: forms.length })}
          </div>
        </div>
      </div>

      {forms.length === 0 ? (
        <Alert>
          <AlertDescription>{t("noForms")}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form, index) => {
            const Icon = getFormIcon(form.icon)
            return (
              <Card
                key={form.id}
                className="group relative flex flex-col overflow-hidden border-border/70 bg-card/80 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background/70 text-muted-foreground">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div>
                        <CardTitle className="line-clamp-2 text-base leading-snug">{form.title}</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">{t("formNumber", { n: index + 1 })}</p>
                      </div>
                    </div>
                    {!form.isActive && <Badge variant="outline">{t("statusClosed")}</Badge>}
                  </div>
                  <CardDescription className="line-clamp-2 text-sm whitespace-pre-line">
                    {form.description || t("noDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5" />
                      {t("responsesCount")}
                    </span>
                    <span className="font-semibold text-foreground">{form._count.submissions}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t("status")}</span>
                    <span className={form.isActive ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-muted-foreground"}>
                      {form.isActive ? t("statusAvailable") : t("statusUnavailable")}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    className="w-full"
                    variant={form.isActive ? "default" : "secondary"}
                    disabled={!form.isActive}
                  >
                    <Link href={`/app/form/${form.id}`}>
                      {form.isActive ? t("viewForm") : t("closedBtn")}
                      {form.isActive && <ArrowRight className="ml-2 h-4 w-4" />}
                      {!form.isActive && <Lock className="ml-2 h-4 w-4" />}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
