"use client"

import { useTranslations, useLocale } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, Trash2, Loader2 } from "lucide-react"
import { LOCALE_META } from "@/i18n/locales"

type SubmissionStatus = "PENDING" | "ACCEPTED" | "REJECTED"

interface SubmissionAnswer {
  field: { key: string; label: string; section: { title: string } | null }
  valueJson: unknown
}

interface SubmissionDetailProps {
  submission: {
    id: string
    createdAt: string
    status: SubmissionStatus
    user: {
      discordId: string | null
      username: string | null
      globalName: string | null
      image: string | null
    }
    answers: SubmissionAnswer[]
  }
  onStatusChange?: (id: string, status: SubmissionStatus) => void
  onDelete?: (id: string) => void
  deleting?: boolean
}

const STATUS_VARIANT: Record<SubmissionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  ACCEPTED: "default",
  REJECTED: "destructive",
}

function renderAnswerValue(value: unknown, yes: string, no: string, noAnswer: string) {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter((item) => item.length > 0)
    if (items.length === 0) return <p className="text-sm italic text-muted-foreground">{noAnswer}</p>
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, index) => (
          <Badge key={`${item}-${index}`} variant="secondary" className="rounded-md px-2 py-0.5 text-xs">
            {item}
          </Badge>
        ))}
      </div>
    )
  }

  if (typeof value === "boolean") {
    return (
      <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${value ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300" : "border-border bg-muted/60 text-muted-foreground"}`}>
        {value ? yes : no}
      </span>
    )
  }

  if (value === null || value === undefined || value === "") {
    return <p className="text-sm italic text-muted-foreground">{noAnswer}</p>
  }

  if (typeof value === "object") {
    return (
      <pre className="overflow-x-auto rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs text-muted-foreground">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  return <p className="text-sm whitespace-pre-wrap leading-relaxed">{String(value ?? "—")}</p>
}

export function SubmissionDetail({ submission, onStatusChange, onDelete, deleting }: SubmissionDetailProps) {
  const t = useTranslations("admin.submissions")
  const tCommon = useTranslations("common")
  const tSub = useTranslations("submissions")
  const locale = useLocale()
  const bcp47 = LOCALE_META[locale as keyof typeof LOCALE_META]?.bcp47 ?? locale

  const statusLabel: Record<SubmissionStatus, string> = {
    PENDING: t("statusPending"),
    ACCEPTED: t("statusAccepted"),
    REJECTED: t("statusRejected"),
  }

  const userName = submission.user.globalName ?? submission.user.username ?? submission.user.discordId ?? tCommon("admin")
  const initial = userName[0]?.toUpperCase() ?? "U"

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card/75 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border/70">
              <AvatarImage src={submission.user.image ?? undefined} />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{userName}</p>
              <p className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat(bcp47, { dateStyle: "full", timeStyle: "short" }).format(new Date(submission.createdAt))}
              </p>
            </div>
          </div>
          <Badge variant={STATUS_VARIANT[submission.status]}>{statusLabel[submission.status]}</Badge>
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {onStatusChange && (
            <>
              <Button
                size="sm"
                variant={submission.status === "ACCEPTED" ? "default" : "outline"}
                onClick={() => onStatusChange(submission.id, "ACCEPTED")}
                disabled={submission.status === "ACCEPTED"}
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                {t("accept")}
              </Button>
              <Button
                size="sm"
                variant={submission.status === "REJECTED" ? "destructive" : "outline"}
                onClick={() => onStatusChange(submission.id, "REJECTED")}
                disabled={submission.status === "REJECTED"}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                {t("reject")}
              </Button>
              {submission.status !== "PENDING" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onStatusChange(submission.id, "PENDING")}
                >
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  {t("pendingAction")}
                </Button>
              )}
            </>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-destructive hover:text-destructive"
              onClick={() => onDelete(submission.id)}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
              {tCommon("delete")}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        {submission.answers.map((answer, index) => {
          const previousSection = index > 0 ? submission.answers[index - 1]?.field.section?.title ?? null : null
          const currentSection = answer.field.section?.title ?? null
          const showSection = !!currentSection && (index === 0 || currentSection !== previousSection)

          return (
            <div key={`${answer.field.key}-${index}`} className="space-y-2">
              {showSection && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/90">{currentSection}</span>
                  <div className="h-px flex-1 bg-border/70" />
                </div>
              )}

              <div className="rounded-xl border border-border/70 bg-card/80 p-3.5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{tSub("question", { n: index + 1 })}</p>
                <p className="mt-1 text-sm font-medium leading-snug">{answer.field.label}</p>
                <div className="mt-2 rounded-lg border border-border/60 bg-background/60 p-2.5">
                  {renderAnswerValue(answer.valueJson, tCommon("yes"), tCommon("no"), tCommon("noAnswer"))}
                </div>
              </div>
            </div>
          )
        })}
        {submission.answers.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noAnswers")}</p>
        )}
      </div>
    </div>
  )
}
