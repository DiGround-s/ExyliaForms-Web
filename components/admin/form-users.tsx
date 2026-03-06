"use client"

import { useEffect, useState } from "react"
import { Loader2, LockOpen, Lock } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type SubmissionStatus = "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED"

interface UserEntry {
  user: {
    id: string
    discordId: string | null
    username: string | null
    globalName: string | null
    image: string | null
  }
  count: number
  lastStatus: SubmissionStatus
  lastDate: string
  unlocked: boolean
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

export function FormUsers({ formId }: { formId: string }) {
  const [users, setUsers] = useState<UserEntry[] | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [unlockingAll, setUnlockingAll] = useState(false)
  const [confirmUnlockAll, setConfirmUnlockAll] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/forms/${formId}/users`)
      .then((r) => r.json())
      .then(setUsers)
  }, [formId])

  async function handleToggle(userId: string, currentUnlocked: boolean) {
    setToggling(userId)
    const res = await fetch(`/api/admin/forms/${formId}/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unlocked: !currentUnlocked }),
    })
    if (res.ok) {
      setUsers((prev) =>
        prev?.map((u) => (u.user.id === userId ? { ...u, unlocked: !currentUnlocked } : u)) ?? null
      )
      toast.success(!currentUnlocked ? "Usuario desbloqueado" : "Desbloqueo cancelado")
    } else {
      toast.error("Error al actualizar")
    }
    setToggling(null)
  }

  async function handleUnlockAll() {
    setUnlockingAll(true)
    const res = await fetch(`/api/admin/forms/${formId}/users`, { method: "POST" })
    setUnlockingAll(false)

    if (!res.ok) {
      toast.error("Error al desbloquear usuarios")
      return
    }

    setUsers((prev) => prev?.map((u) => ({ ...u, unlocked: true })) ?? null)
    toast.success("Todos los usuarios fueron desbloqueados")
    setConfirmUnlockAll(false)
  }

  if (!users) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <Alert>
        <AlertDescription>No hay usuarios que hayan respondido este formulario.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => setConfirmUnlockAll(true)}>
          <LockOpen className="mr-1.5 h-3.5 w-3.5" />
          Desbloquear a todos
        </Button>
      </div>

      <div className="rounded-md border divide-y">
        {users.map((entry) => {
        const name = entry.user.globalName ?? entry.user.username ?? entry.user.discordId ?? "Usuario"
        const initial = name[0]?.toUpperCase() ?? "U"
        const loading = toggling === entry.user.id

        return (
          <div key={entry.user.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={entry.user.image ?? undefined} />
              <AvatarFallback className="text-xs">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">
                {entry.count} {entry.count === 1 ? "respuesta" : "respuestas"} · última{" "}
                {new Date(entry.lastDate).toLocaleDateString()}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[entry.lastStatus]} className="shrink-0">
              {STATUS_LABEL[entry.lastStatus]}
            </Badge>
            {entry.unlocked && (
              <Badge variant="outline" className="shrink-0 border-green-600 text-green-600">
                Desbloqueado
              </Badge>
            )}
            <Button
              size="sm"
              variant={entry.unlocked ? "outline" : "default"}
              onClick={() => handleToggle(entry.user.id, entry.unlocked)}
              disabled={loading}
              className="shrink-0"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : entry.unlocked ? (
                <>
                  <Lock className="mr-1.5 h-3.5 w-3.5" />
                  Cancelar
                </>
              ) : (
                <>
                  <LockOpen className="mr-1.5 h-3.5 w-3.5" />
                  Desbloquear
                </>
              )}
            </Button>
          </div>
        )
        })}
      </div>

      <Dialog open={confirmUnlockAll} onOpenChange={setConfirmUnlockAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desbloquear a todos</DialogTitle>
            <DialogDescription>
              Se desbloquearán todos los usuarios que hayan respondido este formulario para que puedan volver a aplicar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmUnlockAll(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleUnlockAll} disabled={unlockingAll}>
              {unlockingAll && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
