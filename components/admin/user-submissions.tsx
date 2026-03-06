"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getFormIcon } from "@/lib/form-icons"

type SubmissionStatus = "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED"

interface Answer {
  field: { key: string; label: string; section: { title: string } | null }
  valueJson: unknown
}

interface Submission {
  id: string
  createdAt: string
  status: SubmissionStatus
  form: { id: string; title: string; icon: string | null }
  answers: Answer[]
}

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  PENDING: "Pendiente",
  UNDER_REVIEW: "En revisión",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
}

const STATUS_VARIANT: Record<SubmissionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  UNDER_REVIEW: "outline",
  ACCEPTED: "default",
  REJECTED: "destructive",
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "boolean") return value ? "Sí" : "No"
  return String(value ?? "—")
}

function renderAnswer(value: unknown) {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter((item) => item.length > 0)
    if (items.length === 0) return <p className="text-sm italic text-muted-foreground">Sin respuesta</p>
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
        {value ? "Sí" : "No"}
      </span>
    )
  }

  if (value === null || value === undefined || value === "") {
    return <p className="text-sm italic text-muted-foreground">Sin respuesta</p>
  }

  return <p className="text-sm whitespace-pre-wrap leading-relaxed">{formatValue(value)}</p>
}

export function UserSubmissions({ submissions }: { submissions: Submission[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Respuestas enviadas</h2>
      <div className="divide-y rounded-md border border-border/70 bg-card/70 shadow-sm">
        {submissions.map((sub) => {
          const open = expanded.has(sub.id)
          const Icon = getFormIcon(sub.form.icon)
          return (
            <div key={sub.id}>
              <button
                onClick={() => toggle(sub.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  open && "bg-muted/40"
                )}
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{sub.form.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sub.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[sub.status]} className="shrink-0">
                  {STATUS_LABEL[sub.status]}
                </Badge>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" asChild onClick={(e) => e.stopPropagation()}>
                  <Link href={`/admin/forms/${sub.form.id}/submissions`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {open && (
                <div className="space-y-3 bg-muted/20 px-4 pb-4 pt-2">
                  <Separator />
                  {sub.answers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin respuestas registradas.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {sub.answers.map((answer, index) => {
                        const previousSection = index > 0 ? sub.answers[index - 1]?.field.section?.title ?? null : null
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

                            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pregunta {index + 1}</p>
                              <p className="mt-1 text-sm font-medium leading-snug">
                                {answer.field.label}
                              </p>
                              <div className="mt-2 rounded-md border border-border/60 bg-background/70 p-2.5">
                                {renderAnswer(answer.valueJson)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
