"use client"

import { useState } from "react"
import { Plus, Trash2, GripVertical, FolderPlus, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const FIELD_TYPES = [
  { value: "SHORT_TEXT", label: "Texto corto" },
  { value: "LONG_TEXT", label: "Texto largo" },
  { value: "NUMBER", label: "Número" },
  { value: "SELECT", label: "Selección única" },
  { value: "MULTI_SELECT", label: "Selección múltiple" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "DATE", label: "Fecha" },
  { value: "EMAIL", label: "Email" },
  { value: "URL", label: "URL" },
]

export interface SectionDef {
  id: string
  title: string
  order: number
}

export interface FieldDef {
  key: string
  type: string
  label: string
  helpText: string
  required: boolean
  order: number
  sectionId: string | null
  configJson: {
    options?: string[]
    min?: number
    max?: number
  }
}

interface FieldEditorProps {
  sections: SectionDef[]
  fields: FieldDef[]
  onChangeSections: (sections: SectionDef[]) => void
  onChangeFields: (fields: FieldDef[]) => void
}

function slugifyKey(label: string, existingKeys: string[], selfKey?: string): string {
  const base = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
  if (!base) return selfKey ?? `campo_${Date.now()}`
  const others = existingKeys.filter((k) => k !== selfKey)
  if (!others.includes(base)) return base
  let i = 2
  while (others.includes(`${base}_${i}`)) i++
  return `${base}_${i}`
}

function makeField(sectionId: string | null, order: number): FieldDef {
  return {
    key: `campo_${Date.now()}`,
    type: "SHORT_TEXT",
    label: "",
    helpText: "",
    required: false,
    order,
    sectionId,
    configJson: {},
  }
}

function FieldCard({
  field,
  index,
  sections,
  allKeys,
  onUpdate,
  onRemove,
}: {
  field: FieldDef
  index: number
  sections: SectionDef[]
  allKeys: string[]
  onUpdate: (updates: Partial<FieldDef>) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(true)
  const hasOptions = field.type === "SELECT" || field.type === "MULTI_SELECT"

  function updateConfig(updates: Partial<FieldDef["configJson"]>) {
    onUpdate({ configJson: { ...field.configJson, ...updates } })
  }

  function addOption() {
    updateConfig({ options: [...(field.configJson.options ?? []), ""] })
  }

  function updateOption(optIdx: number, value: string) {
    const opts = [...(field.configJson.options ?? [])]
    opts[optIdx] = value
    updateConfig({ options: opts })
  }

  function removeOption(optIdx: number) {
    updateConfig({ options: (field.configJson.options ?? []).filter((_, i) => i !== optIdx) })
  }

  return (
    <Card>
      <CardHeader className="py-2 px-4">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium flex-1 truncate">
            {field.label || `Campo ${index + 1}`}
          </span>
          <Badge variant="outline" className="text-xs shrink-0">{field.type}</Badge>
          <button onClick={() => setOpen((o) => !o)} className="text-muted-foreground hover:text-foreground">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button onClick={onRemove} className="text-destructive hover:opacity-70">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-3 pt-0">
          <Separator />
          <div className="space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={field.type} onValueChange={(v) => onUpdate({ type: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Etiqueta</Label>
            <Input
              className="h-8 text-sm"
              value={field.label}
              onChange={(e) => {
                const label = e.target.value
                const key = slugifyKey(label, allKeys, field.key)
                onUpdate({ label, key })
              }}
              placeholder="¿Cuál es tu nombre?"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Texto de ayuda</Label>
            <Input
              className="h-8 text-sm"
              value={field.helpText}
              onChange={(e) => onUpdate({ helpText: e.target.value })}
              placeholder="Opcional"
            />
          </div>

          {sections.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Sección</Label>
              <Select
                value={field.sectionId ?? "none"}
                onValueChange={(v) => onUpdate({ sectionId: v === "none" ? null : v })}
              >
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sección</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              checked={field.required}
              onCheckedChange={(v) => onUpdate({ required: !!v })}
            />
            <Label className="text-xs">Obligatorio</Label>
          </div>

          {field.type === "NUMBER" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Mínimo</Label>
                <Input
                  className="h-8 text-sm"
                  type="number"
                  value={field.configJson.min ?? ""}
                  onChange={(e) => updateConfig({ min: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Máximo</Label>
                <Input
                  className="h-8 text-sm"
                  type="number"
                  value={field.configJson.max ?? ""}
                  onChange={(e) => updateConfig({ max: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
          )}

          {hasOptions && (
            <div className="space-y-2">
              <Label className="text-xs">Opciones</Label>
              {(field.configJson.options ?? []).map((opt, optIdx) => (
                <div key={optIdx} className="flex gap-2">
                  <Input
                    className="h-7 text-sm"
                    value={opt}
                    onChange={(e) => updateOption(optIdx, e.target.value)}
                    placeholder={`Opción ${optIdx + 1}`}
                  />
                  <button onClick={() => removeOption(optIdx)} className="text-destructive hover:opacity-70">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addOption}>
                <Plus className="mr-1 h-3 w-3" />
                Añadir opción
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export function FieldEditor({ sections, fields, onChangeSections, onChangeFields }: FieldEditorProps) {
  function addSection() {
    const newSection: SectionDef = {
      id: crypto.randomUUID(),
      title: `Sección ${sections.length + 1}`,
      order: sections.length,
    }
    onChangeSections([...sections, newSection])
  }

  function updateSection(id: string, title: string) {
    onChangeSections(sections.map((s) => (s.id === id ? { ...s, title } : s)))
  }

  function removeSection(id: string) {
    onChangeSections(sections.filter((s) => s.id !== id))
    onChangeFields(fields.map((f) => (f.sectionId === id ? { ...f, sectionId: null } : f)))
  }

  function addFieldToSection(sectionId: string | null) {
    const sectionFields = fields.filter((f) => f.sectionId === sectionId)
    onChangeFields([...fields, makeField(sectionId, sectionFields.length)])
  }

  function updateField(key: string, updates: Partial<FieldDef>) {
    onChangeFields(fields.map((f) => (f.key === key ? { ...f, ...updates } : f)))
  }

  function removeField(key: string) {
    onChangeFields(fields.filter((f) => f.key !== key))
  }

  const unsectioned = fields.filter((f) => !f.sectionId)

  const allKeys = fields.map((f) => f.key)

  if (sections.length === 0) {
    return (
      <div className="space-y-4">
        {fields.map((field, index) => (
          <FieldCard
            key={field.key}
            field={field}
            index={index}
            sections={sections}
            allKeys={allKeys}
            onUpdate={(u) => updateField(field.key, u)}
            onRemove={() => removeField(field.key)}
          />
        ))}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => addFieldToSection(null)} className="flex-1">
            <Plus className="mr-2 h-4 w-4" />
            Añadir campo
          </Button>
          <Button variant="outline" onClick={addSection}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Añadir sección
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {unsectioned.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">Sin sección</p>
            <Badge variant="outline" className="text-xs">{unsectioned.length}</Badge>
          </div>
          <div className="space-y-3 pl-3 border-l-2 border-muted">
            {unsectioned.map((field, index) => (
              <FieldCard
                key={field.key}
                field={field}
                index={index}
                sections={sections}
                allKeys={allKeys}
                onUpdate={(u) => updateField(field.key, u)}
                onRemove={() => removeField(field.key)}
              />
            ))}
            <Button variant="outline" size="sm" onClick={() => addFieldToSection(null)}>
              <Plus className="mr-1 h-3 w-3" />
              Añadir campo
            </Button>
          </div>
        </div>
      )}

      {sections.map((section, sIdx) => {
        const sectionFields = fields.filter((f) => f.sectionId === section.id)
        return (
          <div key={section.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs shrink-0">Paso {sIdx + 1}</Badge>
              <Input
                className="h-7 text-sm font-medium flex-1"
                value={section.title}
                onChange={(e) => updateSection(section.id, e.target.value)}
                placeholder="Nombre de la sección"
              />
              <Badge variant="outline" className="text-xs shrink-0">{sectionFields.length} campos</Badge>
              <button
                onClick={() => removeSection(section.id)}
                className="text-destructive hover:opacity-70 shrink-0"
                title="Eliminar sección"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 pl-3 border-l-2 border-primary/30">
              {sectionFields.map((field, index) => (
                <FieldCard
                  key={field.key}
                  field={field}
                  index={index}
                  sections={sections}
                  allKeys={allKeys}
                  onUpdate={(u) => updateField(field.key, u)}
                  onRemove={() => removeField(field.key)}
                />
              ))}
              <Button variant="outline" size="sm" onClick={() => addFieldToSection(section.id)}>
                <Plus className="mr-1 h-3 w-3" />
                Añadir campo
              </Button>
            </div>
          </div>
        )
      })}

      <Button variant="outline" onClick={addSection} className="w-full">
        <FolderPlus className="mr-2 h-4 w-4" />
        Añadir sección
      </Button>
    </div>
  )
}
