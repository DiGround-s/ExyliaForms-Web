"use client"

import { useState, useCallback, useMemo } from "react"
import { useTranslations, useLocale } from "next-intl"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SubmissionDetail } from "./submission-detail"
import { LOCALE_META } from "@/i18n/locales"

type SubmissionStatus = "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED"
type Filter = "ALL" | SubmissionStatus

const STATUS_DOT: Record<SubmissionStatus, string> = {
  PENDING: "bg-yellow-400",
  UNDER_REVIEW: "bg-blue-400",
  ACCEPTED: "bg-green-500",
  REJECTED: "bg-red-500",
}

const STATUS_BADGE: Record<SubmissionStatus, string> = {
  PENDING: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  UNDER_REVIEW: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  ACCEPTED: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
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
  underReview: number
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
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  const FILTERS: Array<{ key: Filter; label: string; count?: number }> = [
    { key: "ALL", label: t("filterAll") },
    { key: "PENDING", label: t("filterPending"), count: stats.pending },
    { key: "UNDER_REVIEW", label: t("filterUnderReview"), count: stats.underReview },
    { key: "ACCEPTED", label: t("filterAccepted"), count: stats.accepted },
    { key: "REJECTED", label: t("filterRejected"), count: stats.rejected },
  ]

  const filtered = useMemo(
    () => (filter === "ALL" ? submissions : submissions.filter((s) => s.status === filter)),
    [submissions, filter]
  )

  const selected = submissions.find((s) => s.id === selectedId) ?? null

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    setMobileShowDetail(true)
  }, [])

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
      else if (prev.status === "UNDER_REVIEW") next.underReview = Math.max(0, next.underReview - 1)
      else if (prev.status === "ACCEPTED") next.accepted = Math.max(0, next.accepted - 1)
      else if (prev.status === "REJECTED") next.rejected = Math.max(0, next.rejected - 1)
      if (status === "PENDING") next.pending++
      else if (status === "UNDER_REVIEW") next.underReview++
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
      else if (sub.status === "UNDER_REVIEW") next.underReview = Math.max(0, next.underReview - 1)
      else if (sub.status === "ACCEPTED") next.accepted = Math.max(0, next.accepted - 1)
      else if (sub.status === "REJECTED") next.rejected = Math.max(0, next.rejected - 1)
      return next
    })
    if (selectedId === id) {
      setSelectedId(nextList[0]?.id ?? null)
      setMobileShowDetail(false)
    }
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
    setStats((st) => ({ ...st, total: 0, pending: 0, underReview: 0, accepted: 0, rejected: 0, today: 0, week: 0 }))
    setSelectedId(null)
    setMobileShowDetail(false)
    setConfirmDeleteAll(false)
  }, [formId])

  const statsRows = [
    { label: t("statsTotal"), value: stats.total },
    { label: t("statsPending"), value: stats.pending },
    { label: t("statsUnderReview"), value: stats.underReview },
    { label: t("statsAccepted"), value: stats.accepted },
    { label: t("statsRejected"), value: stats.rejected },
    { label: t("statsToday"), value: stats.today },
    { label: t("statsWeek"), value: stats.week },
  ]

  const submissionList = (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border/60 bg-background/50 p-2">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {label}
              {count !== undefined && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  filter === key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background/80"
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {filter !== "ALL" ? t("noSubmissionsFilter") : t("noSubmissions")}
          </div>
        ) : (
          filtered.map((sub) => {
            const name = sub.user.globalName ?? sub.user.username ?? sub.user.discordId ?? tAdmin("unknownUser")
            const initial = name[0]?.toUpperCase() ?? "U"
            const isSelected = selectedId === sub.id
            return (
              <button
                key={sub.id}
                onClick={() => handleSelect(sub.id)}
                className={cn(
                  "w-full border-b border-border/50 px-3 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted/60",
                  isSelected && "bg-muted/70 border-l-2 border-l-primary"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-9 w-9 shrink-0 border border-border/60">
                    <AvatarImage src={sub.user.image ?? undefined} />
                    <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-sm font-medium leading-tight">{name}</p>
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[sub.status])} />
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {new Intl.DateTimeFormat(bcp47, { dateStyle: "medium", timeStyle: "short" }).format(new Date(sub.createdAt))}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none", STATUS_BADGE[sub.status])}>
                        {sub.status === "PENDING" ? t("statusPending") : sub.status === "UNDER_REVIEW" ? t("statusUnderReview") : sub.status === "ACCEPTED" ? t("statusAccepted") : t("statusRejected")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {tSub("answersCount", { count: sub.answers.length })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
        {statsRows.map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-border/70 bg-card/70 p-2.5 text-center shadow-sm sm:p-3">
            <p className="text-xl font-bold sm:text-2xl">{value}</p>
            <p className="text-[10px] text-muted-foreground sm:text-xs">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/70 px-2.5 py-2">
        <p className="text-xs text-muted-foreground">
          {t("statsTotal")}: <span className="font-semibold text-foreground">{stats.total}</span>
        </p>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("mr-1 h-3 w-3", refreshing && "animate-spin")} />
            {t("refresh")}
          </Button>
          {!readOnly && (
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setConfirmDeleteAll(true)}>
              {t("deleteAll")}
            </Button>
          )}
        </div>
      </div>

      {submissions.length === 0 ? (
        <Alert>
          <AlertDescription>{t("noSubmissions")}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="hidden lg:flex gap-0 overflow-hidden rounded-xl border border-border/70 bg-card/65 shadow-sm" style={{ height: "64vh" }}>
            <div className="w-72 shrink-0 border-r border-border/70 xl:w-80">
              {submissionList}
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
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {t("selectOne")}
                </div>
              )}
            </div>
          </div>

          <div className="lg:hidden">
            {!mobileShowDetail ? (
              <div className="overflow-hidden rounded-xl border border-border/70 bg-card/65 shadow-sm" style={{ maxHeight: "75vh" }}>
                {submissionList}
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setMobileShowDetail(false)}
                  className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("filterAll")}
                  <span className="ml-1 text-xs opacity-60">({filtered.length})</span>
                </button>
                {selected ? (
                  <SubmissionDetail
                    submission={selected}
                    onStatusChange={readOnly ? undefined : handleStatusChange}
                    onDelete={readOnly ? undefined : handleDelete}
                    deleting={deleting === selected.id}
                  />
                ) : (
                  <div className="rounded-xl border border-border/70 bg-card/70 p-8 text-center text-sm text-muted-foreground">
                    {t("selectOne")}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
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
