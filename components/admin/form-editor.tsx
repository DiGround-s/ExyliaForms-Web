"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldEditor, type FieldDef, type SectionDef } from "./field-editor"
import { SubmissionsSplitView } from "./submissions-split-view"
import { IconPicker } from "./icon-picker"

interface Category {
  id: string
  name: string
}

interface FormData {
  id: string
  title: string
  description: string | null
  status: string
  isActive: boolean
  icon: string | null
  maxSubmissionsPerUser: number | null
  reapplyCooldownDays: number | null
  categoryId: string | null
  fields: FieldDef[]
  _count?: { submissions: number }
}

interface SubmissionsData {
  submissions: SubmissionItem[]
  stats: { total: number; unread: number; today: number; week: number }
}

interface SubmissionItem {
  id: string
  createdAt: string
  isRead: boolean
  user: {
    discordId: string | null
    username: string | null
    globalName: string | null
    image: string | null
  }
  answers: Array<{
    field: { key: string; label: string; type: string }
    valueJson: unknown
  }>
}

interface FormEditorProps {
  formId: string
  categories: Category[]
}

export function FormEditor({ formId, categories }: FormEditorProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormData | null>(null)
  const [fields, setFields] = useState<FieldDef[]>([])
  const [sections, setSections] = useState<SectionDef[]>([])
  const [submissionsData, setSubmissionsData] = useState<SubmissionsData | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/forms/${formId}`)
      .then((r) => r.json())
      .then((data) => {
        setForm(data)
        setFields(data.fields ?? [])
        setSections(data.sections ?? [])
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
          categoryId: form.categoryId,
          icon: form.icon,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Guardado")
    } catch {
      toast.error("Error al guardar")
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
        toast.error(err.issues?.[0]?.message ?? "Error al guardar campos")
        return
      }
      toast.success("Campos guardados")
    } catch {
      toast.error("Error de conexión")
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
      toast.success(updated.status === "PUBLISHED" ? "Formulario publicado" : "Formulario despublicado")
    } catch {
      toast.error("Error")
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
      toast.success(updated.isActive ? "Formulario activado" : "Formulario desactivado")
    } catch {
      toast.error("Error")
    } finally {
      setSaving(false)
    }
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
              {form.isActive ? "Activo" : "Inactivo"}
            </Badge>
          )}
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/forms")}>
          Volver
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="fields">Campos</TabsTrigger>
          <TabsTrigger value="publish">Publicación</TabsTrigger>
          <TabsTrigger value="submissions">
            Respuestas {form._count?.submissions ? `(${form._count.submissions})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <div className="flex items-center gap-2">
              <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={form.categoryId ?? "none"}
              onValueChange={(val) => setForm({ ...form, categoryId: val === "none" ? null : val })}
            >
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Máximo de respuestas por usuario</Label>
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
              <Label>Cooldown para re-aplicar (días)</Label>
              <Input
                type="number"
                min="1"
                value={form.reapplyCooldownDays ?? ""}
                onChange={(e) =>
                  setForm({ ...form, reapplyCooldownDays: e.target.value ? parseInt(e.target.value) : null })
                }
                className="w-40"
                placeholder="Sin límite"
              />
              <p className="text-xs text-muted-foreground">Días de espera tras ser aceptado o rechazado.</p>
            </div>
          </div>
          <Button onClick={saveGeneral} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
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
            Guardar campos
          </Button>
        </TabsContent>

        <TabsContent value="publish" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Visibilidad</CardTitle>
              <CardDescription>
                Publicar hace el formulario visible para los usuarios. Activar/desactivar controla si pueden acceder y responder.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Publicación</p>
                  <p className="text-sm text-muted-foreground">
                    {form.status === "PUBLISHED" ? "Visible para los usuarios" : "Oculto para los usuarios"}
                  </p>
                </div>
                <Button
                  onClick={togglePublish}
                  disabled={publishing}
                  variant={form.status === "PUBLISHED" ? "destructive" : "default"}
                >
                  {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {form.status === "PUBLISHED" ? "Despublicar" : "Publicar"}
                </Button>
              </div>

              {form.status === "PUBLISHED" && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Estado del formulario</p>
                      <p className="text-sm text-muted-foreground">
                        {form.isActive
                          ? "Activo — los usuarios pueden ver y responder"
                          : "Inactivo — los usuarios lo ven pero no pueden acceder"}
                      </p>
                    </div>
                    <Button
                      onClick={toggleActive}
                      disabled={saving}
                      variant={form.isActive ? "outline" : "default"}
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {form.isActive ? "Desactivar" : "Activar"}
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
      </Tabs>
    </div>
  )
}
