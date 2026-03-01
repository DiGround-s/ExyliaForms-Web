"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, Trash2, Loader2 } from "lucide-react"

type SubmissionStatus = "PENDING" | "ACCEPTED" | "REJECTED"

interface SubmissionAnswer {
  field: { key: string; label: string; type: string }
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

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pendiente", variant: "secondary" },
  ACCEPTED: { label: "Aceptado", variant: "default" },
  REJECTED: { label: "Rechazado", variant: "destructive" },
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "boolean") return value ? "Sí" : "No"
  return String(value ?? "—")
}

export function SubmissionDetail({ submission, onStatusChange, onDelete, deleting }: SubmissionDetailProps) {
  const userName = submission.user.globalName ?? submission.user.username ?? submission.user.discordId ?? "Usuario"
  const initial = userName[0]?.toUpperCase() ?? "U"
  const cfg = STATUS_CONFIG[submission.status]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={submission.user.image ?? undefined} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{userName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(submission.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {onStatusChange && (
          <>
            <Button
              size="sm"
              variant={submission.status === "ACCEPTED" ? "default" : "outline"}
              onClick={() => onStatusChange(submission.id, "ACCEPTED")}
              disabled={submission.status === "ACCEPTED"}
            >
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              Aceptar
            </Button>
            <Button
              size="sm"
              variant={submission.status === "REJECTED" ? "destructive" : "outline"}
              onClick={() => onStatusChange(submission.id, "REJECTED")}
              disabled={submission.status === "REJECTED"}
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Rechazar
            </Button>
            {submission.status !== "PENDING" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onStatusChange(submission.id, "PENDING")}
              >
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Pendiente
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
            Eliminar
          </Button>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        {submission.answers.map((answer) => (
          <div key={answer.field.key}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {answer.field.label}
            </p>
            <p className="mt-0.5 text-sm whitespace-pre-wrap">{formatValue(answer.valueJson)}</p>
          </div>
        ))}
        {submission.answers.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin respuestas registradas.</p>
        )}
      </div>
    </div>
  )
}
