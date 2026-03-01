"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FieldEditor, type FieldDef, type SectionDef } from "./field-editor"
import { SubmissionsSplitView } from "./submissions-split-view"
import { IconPicker } from "./icon-picker"
import { FormUsers } from "./form-users"
import { EmbedSection, type EmbedData } from "./embed-editor"
import { type FormEmbedConfig } from "@/lib/discord"

interface FormData {
  id: string
  title: string
  description: string | null
  status: string
  isActive: boolean
  icon: string | null
  maxSubmissionsPerUser: number | null
  reapplyCooldownDays: number | null
  dmEmbedConfig: FormEmbedConfig | null
  fields: FieldDef[]
  _count?: { submissions: number }
}

interface SubmissionsData {
  submissions: SubmissionItem[]
  stats: { total: number; pending: number; accepted: number; rejected: number; today: number; week: number }
}

interface SubmissionItem {
  id: string
  createdAt: string
  status: "PENDING" | "ACCEPTED" | "REJECTED"
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

interface FormEditorProps {
  formId: string
}

export function FormEditor({ formId }: FormEditorProps) {
  const router = useRouter()
  const t = useTranslations("admin.editor")
  const tCommon = useTranslations("common")
  const tSettings = useTranslations("settings")
  const [form, setForm] = useState<FormData | null>(null)
  const [fields, setFields] = useState<FieldDef[]>([])
  const [sections, setSections] = useState<SectionDef[]>([])
  const [submissionsData, setSubmissionsData] = useState<SubmissionsData | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [dmReceived, setDmReceived] = useState<EmbedData>({ title: "", description: "", footer: "", color: "#5865F2" })
  const [dmAccepted, setDmAccepted] = useState<EmbedData>({ title: "", description: "", footer: "", color: "#57F287" })
  const [dmRejected, setDmRejected] = useState<EmbedData>({ title: "", description: "", footer: "", color: "#ED4245", cooldown: "" })

  useEffect(() => {
    fetch(`/api/admin/forms/${formId}`)
      .then((r) => r.json())
      .then((data) => {
        setForm(data)
        setFields(data.fields ?? [])
        setSections(data.sections ?? [])
        const cfg: FormEmbedConfig = data.dmEmbedConfig ?? {}
        setDmReceived({ title: cfg.received?.title ?? "", description: cfg.received?.description ?? "", footer: cfg.received?.footer ?? "", color: cfg.received?.color ?? "#5865F2" })
        setDmAccepted({ title: cfg.accepted?.title ?? "", description: cfg.accepted?.description ?? "", footer: cfg.accepted?.footer ?? "", color: cfg.accepted?.color ?? "#57F287" })
        setDmRejected({ title: cfg.rejected?.title ?? "", description: cfg.rejected?.description ?? "", footer: cfg.rejected?.footer ?? "", color: cfg.rejected?.color ?? "#ED4245", cooldown: cfg.rejected?.cooldown ?? "" })
      })
    fetch(`/api/admin/forms/${formId}/submissions`)
      .then((r) => r.json())
      .then(setSubmissionsData)
  }, [formId])

  async function saveGeneral() {
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          maxSubmissionsPerUser: form.maxSubmissionsPerUser,
          reapplyCooldownDays: form.reapplyCooldownDays,
          icon: form.icon,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("saved"))
    } catch {
      toast.error(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  async function saveFields() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/forms/${formId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: sections.map((s, i) => ({ ...s, order: i })),
          fields: fields.map((f, i) => ({ ...f, order: i })),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.issues?.[0]?.message ?? t("fieldsError"))
        return
      }
      toast.success(t("fieldsSaved"))
    } catch {
      toast.error(t("connectionError"))
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish() {
    if (!form) return
    setPublishing(true)
    const endpoint = form.status === "PUBLISHED" ? "unpublish" : "publish"
    try {
      const res = await fetch(`/api/admin/forms/${formId}/${endpoint}`, { method: "POST" })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setForm((prev) => prev ? { ...prev, status: updated.status } : prev)
      toast.success(updated.status === "PUBLISHED" ? t("published") : t("unpublished"))
    } catch {
      toast.error(t("saveError"))
    } finally {
      setPublishing(false)
    }
  }

  async function toggleActive() {
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !form.isActive }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setForm((prev) => prev ? { ...prev, isActive: updated.isActive } : prev)
      toast.success(updated.isActive ? t("activated") : t("deactivated"))
    } catch {
      toast.error(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  async function saveNotifications() {
    setSaving(true)
    try {
      const config: FormEmbedConfig = {
        received: { title: dmReceived.title, description: dmReceived.description, footer: dmReceived.footer, color: dmReceived.color },
        accepted: { title: dmAccepted.title, description: dmAccepted.description, footer: dmAccepted.footer, color: dmAccepted.color },
        rejected: { title: dmRejected.title, description: dmRejected.description, footer: dmRejected.footer, color: dmRejected.color, cooldown: dmRejected.cooldown },
      }
      const res = await fetch(`/api/admin/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dmEmbedConfig: config }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("notificationsSaved"))
    } catch {
      toast.error(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  const tEmbed = {
    embedTitle: tSettings("discord.embedTitle"),
    embedDescription: tSettings("discord.embedDescription"),
    embedFooter: tSettings("discord.embedFooter"),
    embedCooldown: tSettings("discord.embedCooldown"),
    embedColor: tSettings("discord.embedColor"),
    vars: tSettings("discord.vars"),
    previewTitle: tSettings("discord.previewTitle"),
  }

  if (!form) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{form.title}</h1>
          <Badge variant={form.status === "PUBLISHED" ? "default" : "secondary"}>{form.status}</Badge>
          {form.status === "PUBLISHED" && (
            <Badge variant={form.isActive ? "default" : "outline"}>
              {form.isActive ? t("active") : t("inactive")}
            </Badge>
          )}
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/forms")}>
          {tCommon("back")}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t("tabGeneral")}</TabsTrigger>
          <TabsTrigger value="fields">{t("tabFields")}</TabsTrigger>
          <TabsTrigger value="publish">{t("tabPublish")}</TabsTrigger>
          <TabsTrigger value="submissions">
            {t("tabSubmissions")} {form._count?.submissions ? `(${form._count.submissions})` : ""}
          </TabsTrigger>
          <TabsTrigger value="users">{t("tabUsers")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("tabNotifications")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>{t("labelTitle")}</Label>
            <div className="flex items-center gap-2">
              <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("labelDescription")}</Label>
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("labelMaxSubmissions")}</Label>
              <Input
                type="number"
                min="1"
                value={form.maxSubmissionsPerUser ?? ""}
                onChange={(e) =>
                  setForm({ ...form, maxSubmissionsPerUser: e.target.value ? parseInt(e.target.value) : null })
                }
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("labelCooldown")}</Label>
              <Input
                type="number"
                min="1"
                value={form.reapplyCooldownDays ?? ""}
                onChange={(e) =>
                  setForm({ ...form, reapplyCooldownDays: e.target.value ? parseInt(e.target.value) : null })
                }
                className="w-40"
                placeholder={t("cooldownPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">{t("cooldownDesc")}</p>
            </div>
          </div>
          <Button onClick={saveGeneral} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </TabsContent>

        <TabsContent value="fields" className="pt-4">
          <FieldEditor
            sections={sections}
            fields={fields}
            onChangeSections={setSections}
            onChangeFields={setFields}
          />
          <Button className="mt-4" onClick={saveFields} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("saveFields")}
          </Button>
        </TabsContent>

        <TabsContent value="publish" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("visibilityTitle")}</CardTitle>
              <CardDescription>{t("visibilityDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{t("publishTitle")}</p>
                  <p className="text-sm text-muted-foreground">
                    {form.status === "PUBLISHED" ? t("visibleToUsers") : t("hiddenFromUsers")}
                  </p>
                </div>
                <Button
                  onClick={togglePublish}
                  disabled={publishing}
                  variant={form.status === "PUBLISHED" ? "destructive" : "default"}
                >
                  {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {form.status === "PUBLISHED" ? t("unpublish") : t("publish")}
                </Button>
              </div>

              {form.status === "PUBLISHED" && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{t("formStatusTitle")}</p>
                      <p className="text-sm text-muted-foreground">
                        {form.isActive ? t("formActiveDesc") : t("formInactiveDesc")}
                      </p>
                    </div>
                    <Button
                      onClick={toggleActive}
                      disabled={saving}
                      variant={form.isActive ? "outline" : "default"}
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {form.isActive ? t("deactivate") : t("activate")}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="pt-4">
          {submissionsData ? (
            <SubmissionsSplitView
              initialSubmissions={submissionsData.submissions}
              stats={submissionsData.stats}
            />
          ) : (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="pt-4">
          <FormUsers formId={formId} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("tabNotifications")}</CardTitle>
              <CardDescription>{t("notificationsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <EmbedSection
                label={tSettings("discord.received")}
                vars={["{{formTitle}}", "{{date}}"]}
                data={dmReceived}
                onChange={(patch) => setDmReceived((p) => ({ ...p, ...patch }))}
                tEmbed={tEmbed}
              />
              <Separator />
              <EmbedSection
                label={tSettings("discord.accepted")}
                vars={["{{formTitle}}"]}
                data={dmAccepted}
                onChange={(patch) => setDmAccepted((p) => ({ ...p, ...patch }))}
                tEmbed={tEmbed}
              />
              <Separator />
              <EmbedSection
                label={tSettings("discord.rejected")}
                vars={["{{formTitle}}", "{{cooldownDays}}"]}
                data={dmRejected}
                onChange={(patch) => setDmRejected((p) => ({ ...p, ...patch }))}
                hasCooldown
                tEmbed={tEmbed}
              />
            </CardContent>
          </Card>
          <Button onClick={saveNotifications} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
