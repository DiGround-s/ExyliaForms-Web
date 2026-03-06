"use client"

import { useState, useCallback, useMemo } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SubmissionDetail } from "./submission-detail"
import { LOCALE_META } from "@/i18n/locales"

type SubmissionStatus = "PENDING" | "ACCEPTED" | "REJECTED"
type Filter = "ALL" | SubmissionStatus

const STATUS_DOT: Record<SubmissionStatus, string> = {
  PENDING: "bg-yellow-400",
  ACCEPTED: "bg-green-500",
  REJECTED: "bg-red-500",
}

interface Submission {
  id: string
  createdAt: string
  status: SubmissionStatus
  user: {
    discordId: string | null
    username: string | null
    globalName: string | null
    image: string | null
  }
  answers: Array<{
    field: { key: string; label: string; section: { title: string } | null }
    valueJson: unknown
  }>
}

interface Stats {
  total: number
  pending: number
  accepted: number
  rejected: number
  today: number
  week: number
}

interface SubmissionsSplitViewProps {
  formId: string
  initialSubmissions: Submission[]
  stats: Stats
  readOnly?: boolean
}

export function SubmissionsSplitView({ formId, initialSubmissions, stats: initialStats, readOnly = false }: SubmissionsSplitViewProps) {
  const t = useTranslations("admin.submissions")
  const tAdmin = useTranslations("admin")
  const tCommon = useTranslations("common")
  const tSub = useTranslations("submissions")
  const locale = useLocale()
  const bcp47 = LOCALE_META[locale as keyof typeof LOCALE_META]?.bcp47 ?? locale

  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [stats, setStats] = useState<Stats>(initialStats)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSubmissions.find((s) => s.status === "PENDING")?.id ?? initialSubmissions[0]?.id ?? null
  )
  const [filter, setFilter] = useState<Filter>("PENDING")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deletingAll, setDeletingAll] = useState(false)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const FILTERS: Array<{ key: Filter; label: string }> = [
    { key: "ALL", label: t("filterAll") },
    { key: "PENDING", label: t("filterPending") },
    { key: "ACCEPTED", label: t("filterAccepted") },
    { key: "REJECTED", label: t("filterRejected") },
  ]

  const filtered = useMemo(
    () => (filter === "ALL" ? submissions : submissions.filter((s) => s.status === filter)),
    [submissions, filter]
  )

  const selected = submissions.find((s) => s.id === selectedId) ?? null

  const handleStatusChange = useCallback(async (id: string, status: SubmissionStatus) => {
    const prev = submissions.find((s) => s.id === id)
    if (!prev || prev.status === status) return

    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) return

    setSubmissions((list) => list.map((s) => (s.id === id ? { ...s, status } : s)))
    setStats((st) => {
      const next = { ...st }
      if (prev.status === "PENDING") next.pending = Math.max(0, next.pending - 1)
      else if (prev.status === "ACCEPTED") next.accepted = Math.max(0, next.accepted - 1)
      else if (prev.status === "REJECTED") next.rejected = Math.max(0, next.rejected - 1)
      if (status === "PENDING") next.pending++
      else if (status === "ACCEPTED") next.accepted++
      else if (status === "REJECTED") next.rejected++
      return next
    })
  }, [submissions])

  const handleDelete = useCallback(async (id: string) => {
    const sub = submissions.find((s) => s.id === id)
    if (!sub) return
    setDeleting(id)
    const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" })
    setDeleting(null)
    if (!res.ok) return

    const nextList = submissions.filter((s) => s.id !== id)
    setSubmissions(nextList)
    setStats((st) => {
      const next = { ...st, total: Math.max(0, st.total - 1) }
      if (sub.status === "PENDING") next.pending = Math.max(0, next.pending - 1)
      else if (sub.status === "ACCEPTED") next.accepted = Math.max(0, next.accepted - 1)
      else if (sub.status === "REJECTED") next.rejected = Math.max(0, next.rejected - 1)
      return next
    })
    if (selectedId === id) setSelectedId(nextList[0]?.id ?? null)
  }, [submissions, selectedId])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    const res = await fetch(`/api/admin/forms/${formId}/submissions`)
    setRefreshing(false)
    if (!res.ok) return
    const data = await res.json()
    setSubmissions(data.submissions)
    setStats(data.stats)
    setSelectedId((prev) => data.submissions.find((s: Submission) => s.id === prev)?.id ?? data.submissions[0]?.id ?? null)
  }, [formId])

  const handleDeleteAll = useCallback(async () => {
    setDeletingAll(true)
    const res = await fetch(`/api/admin/forms/${formId}/submissions`, { method: "DELETE" })
    setDeletingAll(false)
    if (!res.ok) return

    setSubmissions([])
    setStats((st) => ({ ...st, total: 0, pending: 0, accepted: 0, rejected: 0, today: 0, week: 0 }))
    setSelectedId(null)
    setConfirmDeleteAll(false)
  }, [formId])

  const statsRows = [
    { label: t("statsTotal"), value: stats.total },
    { label: t("statsPending"), value: stats.pending },
    { label: t("statsAccepted"), value: stats.accepted },
    { label: t("statsRejected"), value: stats.rejected },
    { label: t("statsToday"), value: stats.today },
    { label: t("statsWeek"), value: stats.week },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {statsRows.map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-border/70 bg-card/70 p-3 text-center shadow-sm">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/70 p-1.5">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key)}
              className="h-7 text-xs"
            >
              {label}
              {key !== "ALL" && (
                <span className="ml-1 opacity-70">
                  ({key === "PENDING" ? stats.pending : key === "ACCEPTED" ? stats.accepted : stats.rejected})
                </span>
              )}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-1.5 h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
          {!readOnly && (
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs"
              onClick={() => setConfirmDeleteAll(true)}
            >
              {t("deleteAll")}
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Alert>
          <AlertDescription>
            {filter !== "ALL" ? t("noSubmissionsFilter") : t("noSubmissions")}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex gap-0 overflow-hidden rounded-xl border border-border/70 bg-card/65 shadow-sm" style={{ height: "64vh" }}>
          <div className="w-80 shrink-0 border-r border-border/70 overflow-y-auto bg-background/50">
            {filtered.map((sub) => {
              const name = sub.user.globalName ?? sub.user.username ?? sub.user.discordId ?? tAdmin("unknownUser")
              const initial = name[0]?.toUpperCase() ?? "U"
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedId(sub.id)}
                  className={cn(
                    "w-full border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                    selectedId === sub.id && "bg-muted/70"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0 border border-border/60">
                      <AvatarImage src={sub.user.image ?? undefined} />
                      <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[sub.status])} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat(bcp47, { dateStyle: "medium", timeStyle: "short" }).format(new Date(sub.createdAt))}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {tSub("answersCount", { count: sub.answers.length })}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {selected ? (
              <SubmissionDetail
                submission={selected}
                onStatusChange={readOnly ? undefined : handleStatusChange}
                onDelete={readOnly ? undefined : handleDelete}
                deleting={deleting === selected.id}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                {t("selectOne")}
              </div>
            )}
          </div>
        </div>
      )}

      {!readOnly && (
        <Dialog open={confirmDeleteAll} onOpenChange={setConfirmDeleteAll}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("deleteAllTitle")}</DialogTitle>
              <DialogDescription>{t("deleteAllDesc")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfirmDeleteAll(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteAll} disabled={deletingAll}>
                {deletingAll ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                {t("deleteAllConfirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
