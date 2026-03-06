"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { Loader2, Plus, Trash2 } from "lucide-react"
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
import { EmbedSection, CollapsibleSection, type EmbedData } from "./embed-editor"
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
  globalDmDefaults?: {
    received?: { title?: string; description?: string; footer?: string; color?: string }
    accepted?: { title?: string; description?: string; footer?: string; color?: string }
    rejected?: { title?: string; description?: string; cooldown?: string; footer?: string; color?: string }
  }
  fields: FieldDef[]
  _count?: { submissions: number }
}

interface SubmissionsData {
  submissions: SubmissionItem[]
  stats: { total: number; pending: number; underReview: number; accepted: number; rejected: number; today: number; week: number }
}

interface SubmissionItem {
  id: string
  createdAt: string
  status: "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED"
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

interface AcceptServerItem {
  id: string
  guildId: string
  roleIdsText: string
}

function createAcceptServerItem(data?: Partial<Omit<AcceptServerItem, "id">>): AcceptServerItem {
  return {
    id: crypto.randomUUID(),
    guildId: data?.guildId ?? "",
    roleIdsText: data?.roleIdsText ?? "",
  }
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
  const [joinOnAcceptEnabled, setJoinOnAcceptEnabled] = useState(false)
  const [acceptServers, setAcceptServers] = useState<AcceptServerItem[]>([])
  const [logChannelId, setLogChannelId] = useState("")
  const [logReceivedChannelId, setLogReceivedChannelId] = useState("")
  const [logReceivedMessage, setLogReceivedMessage] = useState("")
  const [logAcceptedMessage, setLogAcceptedMessage] = useState("")
  const [logRejectedMessage, setLogRejectedMessage] = useState("")

  useEffect(() => {
    fetch(`/api/admin/forms/${formId}`)
      .then((r) => r.json())
      .then((data) => {
        setForm(data)
        setFields(data.fields ?? [])
        setSections(data.sections ?? [])
        const cfg: FormEmbedConfig = data.dmEmbedConfig ?? {}
        const defaults = data.globalDmDefaults ?? {}
        setDmReceived({
          title: cfg.received?.title ?? defaults.received?.title ?? "",
          description: cfg.received?.description ?? defaults.received?.description ?? "",
          footer: cfg.received?.footer ?? defaults.received?.footer ?? "",
          color: cfg.received?.color ?? defaults.received?.color ?? "#5865F2",
        })
        setDmAccepted({
          title: cfg.accepted?.title ?? defaults.accepted?.title ?? "",
          description: cfg.accepted?.description ?? defaults.accepted?.description ?? "",
          footer: cfg.accepted?.footer ?? defaults.accepted?.footer ?? "",
          color: cfg.accepted?.color ?? defaults.accepted?.color ?? "#57F287",
        })
        setDmRejected({
          title: cfg.rejected?.title ?? defaults.rejected?.title ?? "",
          description: cfg.rejected?.description ?? defaults.rejected?.description ?? "",
          footer: cfg.rejected?.footer ?? defaults.rejected?.footer ?? "",
          color: cfg.rejected?.color ?? defaults.rejected?.color ?? "#ED4245",
          cooldown: cfg.rejected?.cooldown ?? defaults.rejected?.cooldown ?? "",
        })
        setJoinOnAcceptEnabled(Boolean(cfg.joinOnAcceptEnabled))
        setAcceptServers(
          (cfg.acceptServers ?? []).map((server) => ({
            ...createAcceptServerItem(),
            guildId: server.guildId ?? "",
            roleIdsText: (server.roleIds ?? []).join(", "),
          })),
        )
        setLogChannelId(cfg.logChannelId ?? "")
        setLogReceivedChannelId(cfg.logReceivedChannelId ?? "")
        setLogReceivedMessage(cfg.logReceivedMessage ?? "")
        setLogAcceptedMessage(cfg.logAcceptedMessage ?? "")
        setLogRejectedMessage(cfg.logRejectedMessage ?? "")
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

  function addServer() {
    setAcceptServers((prev) => [...prev, createAcceptServerItem()])
  }

  function removeServer(id: string) {
    setAcceptServers((prev) => prev.filter((server) => server.id !== id))
  }

  function updateServer(id: string, patch: Partial<Omit<AcceptServerItem, "id">>) {
    setAcceptServers((prev) => prev.map((server) => (server.id === id ? { ...server, ...patch } : server)))
  }

  async function saveDiscord() {
    setSaving(true)
    try {
      const normalizedServers = acceptServers
        .map((server) => ({
          guildId: server.guildId.trim(),
          roleIds: Array.from(new Set(server.roleIdsText.split(",").map((id) => id.trim()).filter(Boolean))),
        }))
        .filter((server) => Boolean(server.guildId))

      const config: FormEmbedConfig = {
        received: { title: dmReceived.title, description: dmReceived.description, footer: dmReceived.footer, color: dmReceived.color },
        accepted: { title: dmAccepted.title, description: dmAccepted.description, footer: dmAccepted.footer, color: dmAccepted.color },
        rejected: { title: dmRejected.title, description: dmRejected.description, footer: dmRejected.footer, color: dmRejected.color, cooldown: dmRejected.cooldown },
        joinOnAcceptEnabled,
        acceptServers: normalizedServers,
        logChannelId: logChannelId.trim() || undefined,
        logReceivedChannelId: logReceivedChannelId.trim() || undefined,
        logReceivedMessage: logReceivedMessage.trim() || undefined,
        logAcceptedMessage: logAcceptedMessage.trim() || undefined,
        logRejectedMessage: logRejectedMessage.trim() || undefined,
      }
      const res = await fetch(`/api/admin/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dmEmbedConfig: config }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { error?: string; issues?: Array<{ message?: string }> } | null
        const details = payload?.issues?.map((issue) => issue.message).filter(Boolean).join(" | ")
        throw new Error(details || payload?.error || "Save failed")
      }
      toast.success(t("discordSaved"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveError"))
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
          <TabsTrigger value="discord">{t("tabDiscord")}</TabsTrigger>
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
              formId={formId}
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

        <TabsContent value="discord" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("tabDiscord")}</CardTitle>
              <CardDescription>{t("discordDesc")}</CardDescription>
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
              <Separator />
              <CollapsibleSection label={t("logReceivedChannelTitle")}>
                <p className="text-xs text-muted-foreground">{t("logReceivedChannelDesc")}</p>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("logChannelId")}</Label>
                  <Input
                    value={logReceivedChannelId}
                    onChange={(e) => setLogReceivedChannelId(e.target.value)}
                    placeholder="123456789012345678"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("logReceivedMessage")}
                    <span className="ml-2 font-normal opacity-60">{"{{username}}, {{globalName}}, {{formTitle}}, {{date}}"}</span>
                  </Label>
                  <Textarea
                    value={logReceivedMessage}
                    onChange={(e) => setLogReceivedMessage(e.target.value)}
                    placeholder="📋 **{{globalName}}** (`{{username}}`) ha enviado una solicitud en **{{formTitle}}**"
                    rows={2}
                  />
                </div>
              </CollapsibleSection>
              <Separator />
              <CollapsibleSection label={t("logChannelTitle")}>
                <p className="text-xs text-muted-foreground">{t("logChannelDesc")}</p>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("logChannelId")}</Label>
                  <Input
                    value={logChannelId}
                    onChange={(e) => setLogChannelId(e.target.value)}
                    placeholder="123456789012345678"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("logAcceptedMessage")}
                    <span className="ml-2 font-normal opacity-60">{"{{username}}, {{globalName}}, {{formTitle}}, {{date}}"}</span>
                  </Label>
                  <Textarea
                    value={logAcceptedMessage}
                    onChange={(e) => setLogAcceptedMessage(e.target.value)}
                    placeholder="✅ **{{globalName}}** (`{{username}}`) ha sido **aceptado** en **{{formTitle}}**"
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t("logRejectedMessage")}
                    <span className="ml-2 font-normal opacity-60">{"{{username}}, {{globalName}}, {{formTitle}}, {{date}}"}</span>
                  </Label>
                  <Textarea
                    value={logRejectedMessage}
                    onChange={(e) => setLogRejectedMessage(e.target.value)}
                    placeholder="❌ **{{globalName}}** (`{{username}}`) ha sido **rechazado** en **{{formTitle}}**"
                    rows={2}
                  />
                </div>
              </CollapsibleSection>
              <Separator />
              <CollapsibleSection label={t("joinOnAcceptTitle")}>
                <p className="text-xs text-muted-foreground">{t("joinOnAcceptDesc")}</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={joinOnAcceptEnabled}
                    onChange={(e) => setJoinOnAcceptEnabled(e.target.checked)}
                  />
                  {t("joinOnAcceptEnabled")}
                </label>
                {acceptServers.length === 0 && (
                  <p className="text-xs text-muted-foreground">{t("noServers")}</p>
                )}
                <div className="space-y-3">
                  {acceptServers.map((server) => (
                    <div key={server.id} className="space-y-3 rounded-lg border p-3">
                      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{t("serverId")}</Label>
                          <Input
                            value={server.guildId}
                            onChange={(e) => updateServer(server.id, { guildId: e.target.value })}
                            placeholder="123456789012345678"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{t("roleIds")}</Label>
                          <Input
                            value={server.roleIdsText}
                            onChange={(e) => updateServer(server.id, { roleIdsText: e.target.value })}
                            placeholder="111111111111111111, 222222222222222222"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button type="button" variant="outline" onClick={() => removeServer(server.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("removeServer")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={addServer}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addServer")}
                </Button>
              </CollapsibleSection>
            </CardContent>
          </Card>
          <Button onClick={saveDiscord} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
