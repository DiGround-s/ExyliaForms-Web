import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { createElement } from "react"
import { getTranslations } from "next-intl/server"
import { FormRenderer } from "@/components/forms/form-renderer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getFormIcon } from "@/lib/form-icons"
import { Lock } from "lucide-react"

interface Params {
  params: Promise<{ id: string }>
}

export default async function FormPage({ params }: Params) {
  const session = await auth()
  const { id } = await params
  const t = await getTranslations("forms")

  const form = await prisma.form.findUnique({
    where: { id, status: "PUBLISHED" },
    include: {
      fields: { orderBy: { order: "asc" } },
      sections: { orderBy: { order: "asc" } },
    },
  })

  if (!form) notFound()

  if (!form.isActive) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 flex items-center gap-3 rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 to-card/70 p-5 shadow-sm backdrop-blur-sm">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground">
            {createElement(getFormIcon(form.icon), { className: "h-5 w-5" })}
          </span>
          <h1 className="text-2xl font-bold tracking-tight">{form.title}</h1>
          <Badge variant="secondary">{t("statusClosed")}</Badge>
        </div>
        <Separator />
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>{t("formClosedTitle")}</AlertTitle>
          <AlertDescription>{t("formClosed")}</AlertDescription>
        </Alert>
      </div>
    )
  }

  let limitReached = false
  if (session && form.maxSubmissionsPerUser) {
    const [submissionCount, unlock] = await Promise.all([
      prisma.submission.count({ where: { formId: id, userId: session.user.id } }),
      prisma.formUserUnlock.findUnique({ where: { formId_userId: { formId: id, userId: session.user.id } } }),
    ])
    if (!unlock) {
      limitReached = submissionCount >= form.maxSubmissionsPerUser
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 to-card/70 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-muted-foreground">
            {createElement(getFormIcon(form.icon), { className: "h-5 w-5" })}
          </span>
          <h1 className="text-2xl font-bold tracking-tight">{form.title}</h1>
          <Badge variant={limitReached ? "secondary" : "default"}>
            {limitReached ? t("limitReached") : t("open")}
          </Badge>
        </div>
        {form.description && (
          <p className="mt-2 whitespace-pre-line text-muted-foreground">{form.description}</p>
        )}
      </div>

      <Separator />

      {limitReached && (
        <Alert variant="destructive">
          <AlertTitle>{t("limitReachedTitle")}</AlertTitle>
          <AlertDescription>{t("limitReachedDesc")}</AlertDescription>
        </Alert>
      )}

      {!limitReached && form.fields.length === 0 && (
        <Alert>
          <AlertDescription>{t("noFields")}</AlertDescription>
        </Alert>
      )}

      {!limitReached && form.fields.length > 0 && (
        <FormRenderer
          formId={form.id}
          sections={form.sections}
          fields={form.fields.map((f: typeof form.fields[number]) => ({
            ...f,
            configJson: f.configJson as Record<string, unknown>,
          }))}
        />
      )}
    </div>
  )
}
