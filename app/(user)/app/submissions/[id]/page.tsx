import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { createElement } from "react"
import { ChevronLeft, CalendarClock, CircleCheck, CircleX, ListChecks } from "lucide-react"
import { getTranslations, getLocale } from "next-intl/server"
import { LOCALE_META } from "@/i18n/locales"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getFormIcon } from "@/lib/form-icons"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Params {
  params: Promise<{ id: string }>
}

function renderValue(value: unknown, tCommon: (key: string) => string) {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0)

    if (items.length === 0) {
      return <p className="text-sm italic text-muted-foreground">{tCommon("noAnswer")}</p>
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge key={`${item}-${index}`} variant="secondary" className="rounded-md px-2.5 py-1">
            {item}
          </Badge>
        ))}
      </div>
    )
  }

  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300/60 bg-emerald-100/70 px-2.5 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300">
        <CircleCheck className="h-4 w-4" />
        {tCommon("yes")}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-muted bg-muted/55 px-2.5 py-1 text-sm font-medium text-muted-foreground">
        <CircleX className="h-4 w-4" />
        {tCommon("no")}
      </span>
    )
  }

  if (value === null || value === undefined || value === "") {
    return <p className="text-sm italic text-muted-foreground">{tCommon("noAnswer")}</p>
  }

  if (typeof value === "object") {
    return (
      <pre className="overflow-x-auto rounded-lg border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{String(value)}</p>
}

export default async function SubmissionDetailPage({ params }: Params) {
  const session = await auth()
  const { id } = await params

  const [submission, tSub, tCommon, tField, tNav, locale] = await Promise.all([
    prisma.submission.findUnique({
      where: { id, userId: session!.user.id },
      include: {
        form: { select: { title: true, description: true, icon: true } },
        answers: {
          include: { field: true },
          orderBy: { field: { order: "asc" } },
        },
      },
    }),
    getTranslations("submissions"),
    getTranslations("common"),
    getTranslations("fieldTypes"),
    getTranslations("nav"),
    getLocale(),
  ])

  if (!submission) notFound()

  const bcp47 = LOCALE_META[locale as keyof typeof LOCALE_META]?.bcp47 ?? locale

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 flex items-center gap-3 rounded-2xl border border-border/70 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/submissions">
            <ChevronLeft className="mr-1 h-4 w-4" />
            {tCommon("back")}
          </Link>
        </Button>
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 via-card/80 to-card/65 p-5 shadow-sm backdrop-blur-sm md:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground">
            {createElement(getFormIcon(submission.form.icon), { className: "h-5 w-5" })}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{submission.form.title}</h1>
            {submission.form.description && (
              <p className="mt-1 text-sm text-muted-foreground md:text-base">{submission.form.description}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/65 px-3 py-1 text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {new Intl.DateTimeFormat(bcp47, { dateStyle: "full", timeStyle: "short" }).format(submission.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/65 px-3 py-1 text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" />
            {tSub("answersCount", { count: submission.answers.length })}
          </span>
        </div>
      </div>

      <Separator />

      {submission.answers.length === 0 && (
        <Alert>
          <AlertDescription>{tSub("noAnswers")}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {submission.answers.map((answer, index) => (
          <Card
            key={answer.id}
            className="border-border/70 bg-card/80 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md animate-in fade-in-0 slide-in-from-bottom-3 duration-700"
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <CardHeader className="space-y-3 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex rounded-md border border-border/70 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {tSub("question", { n: index + 1 })}
                </span>
                <Badge variant="outline" className="text-xs">
                  {tField(answer.field.type as Parameters<typeof tField>[0]) ?? answer.field.type}
                </Badge>
              </div>
              <div>
                <CardTitle className="text-base leading-snug">{answer.field.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="py-0 pb-4">
              <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                {renderValue(answer.valueJson, tCommon)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
