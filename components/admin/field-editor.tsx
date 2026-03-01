"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { Plus, Trash2, GripVertical, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  type CollisionDetection,
  DndContext,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable } from "@dnd-kit/core"

const FIELD_TYPE_VALUES = ["SHORT_TEXT", "LONG_TEXT", "NUMBER", "SELECT", "MULTI_SELECT", "CHECKBOX", "DATE", "EMAIL", "URL"] as const

const FIELD_TYPE_STYLES: Record<string, { card: string; select: string; handle: string; panel: string }> = {
  SHORT_TEXT: {
    card: "border-sky-300/25 bg-sky-50/10 dark:border-sky-700/25 dark:bg-sky-950/8",
    select: "border-sky-300/35 dark:border-sky-700/35",
    handle: "border-sky-300/30 text-sky-700/75 dark:border-sky-700/30 dark:text-sky-300/80",
    panel: "border-sky-300/25 bg-sky-50/12 dark:border-sky-700/25 dark:bg-sky-950/10",
  },
  LONG_TEXT: {
    card: "border-indigo-300/25 bg-indigo-50/10 dark:border-indigo-700/25 dark:bg-indigo-950/8",
    select: "border-indigo-300/35 dark:border-indigo-700/35",
    handle: "border-indigo-300/30 text-indigo-700/75 dark:border-indigo-700/30 dark:text-indigo-300/80",
    panel: "border-indigo-300/25 bg-indigo-50/12 dark:border-indigo-700/25 dark:bg-indigo-950/10",
  },
  NUMBER: {
    card: "border-amber-300/25 bg-amber-50/10 dark:border-amber-700/25 dark:bg-amber-950/8",
    select: "border-amber-300/35 dark:border-amber-700/35",
    handle: "border-amber-300/30 text-amber-700/75 dark:border-amber-700/30 dark:text-amber-300/80",
    panel: "border-amber-300/25 bg-amber-50/12 dark:border-amber-700/25 dark:bg-amber-950/10",
  },
  SELECT: {
    card: "border-emerald-300/25 bg-emerald-50/10 dark:border-emerald-700/25 dark:bg-emerald-950/8",
    select: "border-emerald-300/35 dark:border-emerald-700/35",
    handle: "border-emerald-300/30 text-emerald-700/75 dark:border-emerald-700/30 dark:text-emerald-300/80",
    panel: "border-emerald-300/25 bg-emerald-50/12 dark:border-emerald-700/25 dark:bg-emerald-950/10",
  },
  MULTI_SELECT: {
    card: "border-teal-300/25 bg-teal-50/10 dark:border-teal-700/25 dark:bg-teal-950/8",
    select: "border-teal-300/35 dark:border-teal-700/35",
    handle: "border-teal-300/30 text-teal-700/75 dark:border-teal-700/30 dark:text-teal-300/80",
    panel: "border-teal-300/25 bg-teal-50/12 dark:border-teal-700/25 dark:bg-teal-950/10",
  },
  CHECKBOX: {
    card: "border-violet-300/25 bg-violet-50/10 dark:border-violet-700/25 dark:bg-violet-950/8",
    select: "border-violet-300/35 dark:border-violet-700/35",
    handle: "border-violet-300/30 text-violet-700/75 dark:border-violet-700/30 dark:text-violet-300/80",
    panel: "border-violet-300/25 bg-violet-50/12 dark:border-violet-700/25 dark:bg-violet-950/10",
  },
  DATE: {
    card: "border-cyan-300/25 bg-cyan-50/10 dark:border-cyan-700/25 dark:bg-cyan-950/8",
    select: "border-cyan-300/35 dark:border-cyan-700/35",
    handle: "border-cyan-300/30 text-cyan-700/75 dark:border-cyan-700/30 dark:text-cyan-300/80",
    panel: "border-cyan-300/25 bg-cyan-50/12 dark:border-cyan-700/25 dark:bg-cyan-950/10",
  },
  EMAIL: {
    card: "border-rose-300/25 bg-rose-50/10 dark:border-rose-700/25 dark:bg-rose-950/8",
    select: "border-rose-300/35 dark:border-rose-700/35",
    handle: "border-rose-300/30 text-rose-700/75 dark:border-rose-700/30 dark:text-rose-300/80",
    panel: "border-rose-300/25 bg-rose-50/12 dark:border-rose-700/25 dark:bg-rose-950/10",
  },
  URL: {
    card: "border-fuchsia-300/25 bg-fuchsia-50/10 dark:border-fuchsia-700/25 dark:bg-fuchsia-950/8",
    select: "border-fuchsia-300/35 dark:border-fuchsia-700/35",
    handle: "border-fuchsia-300/30 text-fuchsia-700/75 dark:border-fuchsia-700/30 dark:text-fuchsia-300/80",
    panel: "border-fuchsia-300/25 bg-fuchsia-50/12 dark:border-fuchsia-700/25 dark:bg-fuchsia-950/10",
  },
}

const DEFAULT_TYPE_STYLE = {
  card: "border-border/70 bg-card/90",
  select: "",
  handle: "border-border/70 text-muted-foreground",
  panel: "border-border/60 bg-background/50",
}

export interface SectionDef {
  id: string
  title: string
  order: number
}

export interface FieldDef {
  id: string
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
    checkboxText?: string
    minDate?: string
    maxDate?: string
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

function makeField(sectionId: string | null): FieldDef {
  return {
    id: crypto.randomUUID(),
    key: `campo_${Date.now()}`,
    type: "SHORT_TEXT",
    label: "",
    helpText: "",
    required: false,
    order: 0,
    sectionId,
    configJson: {},
  }
}

function fieldDragId(fieldId: string): string {
  return `field:${fieldId}`
}

function sectionDragId(sectionId: string): string {
  return `section:${sectionId}`
}

function containerDragId(sectionId: string | null): string {
  return `container:${sectionId ?? "none"}`
}

function parseDragId(value: string): { kind: "field" | "section" | "container"; id: string | null } | null {
  if (value.startsWith("field:")) return { kind: "field", id: value.slice(6) }
  if (value.startsWith("section:")) return { kind: "section", id: value.slice(8) }
  if (value.startsWith("container:")) {
    const id = value.slice(10)
    return { kind: "container", id: id === "none" ? null : id }
  }
  return null
}

function normalizeFieldOrders(fields: FieldDef[]): FieldDef[] {
  return fields.map((field, index) => ({ ...field, order: index }))
}

function DroppableGroup({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={isOver ? "min-h-14 rounded-xl border border-primary/40 bg-primary/5 p-2 transition-colors" : "min-h-14 p-2"}
    >
      {children}
    </div>
  )
}

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return closestCorners(args)
}

function FieldCard({
  field,
  allKeys,
  onUpdate,
  onRemove,
}: {
  field: FieldDef
  allKeys: string[]
  onUpdate: (updates: Partial<FieldDef>) => void
  onRemove: () => void
}) {
  const t = useTranslations("admin.fieldEditor")
  const tTypes = useTranslations("fieldTypes")
  const hasOptions = field.type === "SELECT" || field.type === "MULTI_SELECT"
  const hasConfig = field.type === "CHECKBOX" || field.type === "NUMBER" || field.type === "DATE" || hasOptions
  const color = FIELD_TYPE_STYLES[field.type] ?? DEFAULT_TYPE_STYLE

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldDragId(field.id) })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  }

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
    <div ref={setNodeRef} style={style}>
      <div className={`rounded-xl border p-3 shadow-sm ${color.card}`}>
        <div className="grid gap-2 lg:grid-cols-[auto_170px_1fr_1fr_auto_auto]">
          <button
            {...attributes}
            {...listeners}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:text-foreground cursor-grab active:cursor-grabbing touch-none ${color.handle}`}
            title={t("dragField")}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <Select value={field.type} onValueChange={(value) => onUpdate({ type: value })}>
            <SelectTrigger className={`h-9 w-full text-xs sm:text-sm ${color.select}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPE_VALUES.map((value) => (
                <SelectItem key={value} value={value}>{tTypes(value)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            className="h-9"
            value={field.label}
            onChange={(e) => {
              const label = e.target.value
              const key = slugifyKey(label, allKeys, field.key)
              onUpdate({ label, key })
            }}
            placeholder={t("labelPlaceholder")}
          />

          <Input
            className="h-9"
            value={field.helpText}
            onChange={(e) => onUpdate({ helpText: e.target.value })}
            placeholder={t("helpPlaceholder")}
          />

          <button
            onClick={() => onUpdate({ required: !field.required })}
            className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors ${
              field.required
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground"
            }`}
            title={t("required")}
          >
            <Checkbox checked={field.required} className="pointer-events-none" />
            {t("required")}
          </button>

          <button
            onClick={onRemove}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-destructive/30 text-destructive transition-opacity hover:opacity-80"
            title={t("deleteField")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {hasConfig && (
          <div className={`mt-3 space-y-3 rounded-lg border p-3 ${color.panel}`}>
            {field.type === "CHECKBOX" && (
              <div className="space-y-1">
                <Label className="text-xs">{t("checkboxText")}</Label>
                <Input
                  className="h-8"
                  value={field.configJson.checkboxText ?? ""}
                  onChange={(e) => updateConfig({ checkboxText: e.target.value || undefined })}
                  placeholder={t("checkboxPlaceholder")}
                />
              </div>
            )}

            {field.type === "NUMBER" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("minLabel")}</Label>
                  <Input
                    className="h-8"
                    type="number"
                    value={field.configJson.min ?? ""}
                    onChange={(e) => updateConfig({ min: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("maxLabel")}</Label>
                  <Input
                    className="h-8"
                    type="number"
                    value={field.configJson.max ?? ""}
                    onChange={(e) => updateConfig({ max: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
            )}

            {field.type === "DATE" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("minDate")}</Label>
                  <Input
                    className="h-8"
                    type="date"
                    value={field.configJson.minDate ?? ""}
                    onChange={(e) => updateConfig({ minDate: e.target.value || undefined })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("maxDate")}</Label>
                  <Input
                    className="h-8"
                    type="date"
                    value={field.configJson.maxDate ?? ""}
                    onChange={(e) => updateConfig({ maxDate: e.target.value || undefined })}
                  />
                </div>
              </div>
            )}

            {hasOptions && (
              <div className="space-y-2">
                <Label className="text-xs">{t("options")}</Label>
                {(field.configJson.options ?? []).map((opt, optIdx) => (
                  <div key={optIdx} className="flex gap-2">
                    <Input
                      className="h-8"
                      value={opt}
                      onChange={(e) => updateOption(optIdx, e.target.value)}
                      placeholder={t("optionPlaceholder", { n: optIdx + 1 })}
                    />
                    <button
                      onClick={() => removeOption(optIdx)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/30 text-destructive"
                      title={t("deleteOption")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addOption}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {t("addOption")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionBlock({
  section,
  index,
  fieldIds,
  onUpdateTitle,
  onRemove,
  children,
}: {
  section: SectionDef
  index: number
  fieldIds: string[]
  onUpdateTitle: (title: string) => void
  onRemove: () => void
  children: React.ReactNode
}) {
  const t = useTranslations("admin.fieldEditor")
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sectionDragId(section.id),
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-2.5">
        <button
          {...attributes}
          {...listeners}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition-colors hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          title={t("dragSection")}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Badge variant="secondary" className="text-xs">{t("section", { n: index + 1 })}</Badge>
        <Input
          className="h-8 flex-1"
          value={section.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder={t("sectionPlaceholder")}
        />
        <Badge variant="outline" className="text-xs">{t("fieldsCount", { count: fieldIds.length })}</Badge>
        <button
          onClick={onRemove}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/30 text-destructive"
          title={t("deleteSection")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  )
}

export function FieldEditor({ sections, fields, onChangeSections, onChangeFields }: FieldEditorProps) {
  const t = useTranslations("admin.fieldEditor")
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order),
    [fields]
  )

  const allKeys = orderedFields.map((field) => field.key)
  const unsectioned = orderedFields.filter((field) => !field.sectionId)

  function addSection() {
    const next: SectionDef = {
      id: crypto.randomUUID(),
      title: t("section", { n: sections.length + 1 }),
      order: sections.length,
    }
    onChangeSections([...sections, next])
  }

  function updateSection(id: string, title: string) {
    onChangeSections(sections.map((section) => (section.id === id ? { ...section, title } : section)))
  }

  function removeSection(id: string) {
    onChangeSections(sections.filter((section) => section.id !== id))
    const nextFields = normalizeFieldOrders(
      orderedFields.map((field) => (field.sectionId === id ? { ...field, sectionId: null } : field))
    )
    onChangeFields(nextFields)
  }

  function addFieldToSection(sectionId: string | null) {
    const next = normalizeFieldOrders([...orderedFields, makeField(sectionId)])
    onChangeFields(next)
  }

  function updateField(id: string, updates: Partial<FieldDef>) {
    const next = orderedFields.map((field) => (field.id === id ? { ...field, ...updates } : field))
    onChangeFields(next)
  }

  function removeField(id: string) {
    const next = normalizeFieldOrders(orderedFields.filter((field) => field.id !== id))
    onChangeFields(next)
  }

  function getTargetInsertIndex(sectionId: string | null, sourceFieldId: string): number {
    const sourceList = orderedFields.filter((field) => field.id !== sourceFieldId)
    const sameSectionIndices = sourceList
      .map((field, index) => ({ field, index }))
      .filter((entry) => entry.field.sectionId === sectionId)
      .map((entry) => entry.index)

    if (sameSectionIndices.length > 0) {
      return sameSectionIndices[sameSectionIndices.length - 1] + 1
    }

    if (sectionId === null) {
      const firstSectionFieldIndex = sourceList.findIndex((field) => field.sectionId !== null)
      return firstSectionFieldIndex === -1 ? sourceList.length : firstSectionFieldIndex
    }

    const sectionIndex = sections.findIndex((section) => section.id === sectionId)
    if (sectionIndex === -1) return sourceList.length

    for (let i = sectionIndex + 1; i < sections.length; i++) {
      const nextSectionId = sections[i].id
      const nextFieldIndex = sourceList.findIndex((field) => field.sectionId === nextSectionId)
      if (nextFieldIndex !== -1) return nextFieldIndex
    }

    return sourceList.length
  }

  function reorderSections(activeSectionId: string, overSectionId: string) {
    const ids = sections.map((section) => section.id)
    const oldIndex = ids.indexOf(activeSectionId)
    const newIndex = ids.indexOf(overSectionId)
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

    const reordered = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
      ...section,
      order: index,
    }))

    onChangeSections(reordered)
  }

  function reorderFields(activeFieldId: string, overFieldId: string, targetSectionId: string | null) {
    const oldIndex = orderedFields.findIndex((field) => field.id === activeFieldId)
    const newIndex = orderedFields.findIndex((field) => field.id === overFieldId)
    if (oldIndex === -1 || newIndex === -1) return

    const moved = arrayMove(orderedFields, oldIndex, newIndex).map((field) =>
      field.id === activeFieldId ? { ...field, sectionId: targetSectionId } : field
    )
    onChangeFields(normalizeFieldOrders(moved))
  }

  function moveFieldToContainer(activeFieldId: string, targetSectionId: string | null) {
    const active = orderedFields.find((field) => field.id === activeFieldId)
    if (!active) return

    const sourceList = orderedFields.filter((field) => field.id !== activeFieldId)
    const insertIndex = getTargetInsertIndex(targetSectionId, activeFieldId)

    const next = [...sourceList]
    next.splice(insertIndex, 0, { ...active, sectionId: targetSectionId })
    onChangeFields(normalizeFieldOrders(next))
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null
    if (!overId || activeId === overId) return

    const activeMeta = parseDragId(activeId)
    const overMeta = parseDragId(overId)
    if (!activeMeta || !overMeta) return

    if (activeMeta.kind === "section" && activeMeta.id) {
      if (overMeta.kind === "section" && overMeta.id) {
        reorderSections(activeMeta.id, overMeta.id)
      }
      return
    }

    if (activeMeta.kind !== "field" || !activeMeta.id) return

    if (overMeta.kind === "field" && overMeta.id) {
      const overField = orderedFields.find((field) => field.id === overMeta.id)
      if (!overField) return
      reorderFields(activeMeta.id, overMeta.id, overField.sectionId)
      return
    }

    if (overMeta.kind === "section") {
      moveFieldToContainer(activeMeta.id, overMeta.id)
      return
    }

    if (overMeta.kind === "container") {
      moveFieldToContainer(activeMeta.id, overMeta.id)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-card/70 p-3">
          <p className="text-sm font-medium">{t("editorTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("editorDesc")}</p>
        </div>

        <div className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">{t("noSection")}</p>
            <Badge variant="outline" className="text-xs">{unsectioned.length}</Badge>
          </div>
          <SortableContext items={unsectioned.map((field) => fieldDragId(field.id))} strategy={verticalListSortingStrategy}>
            <DroppableGroup id={containerDragId(null)}>
              <div className="space-y-2">
                {unsectioned.map((field) => (
                  <FieldCard
                    key={field.id}
                    field={field}
                    allKeys={allKeys}
                    onUpdate={(updates) => updateField(field.id, updates)}
                    onRemove={() => removeField(field.id)}
                  />
                ))}
              </div>
            </DroppableGroup>
          </SortableContext>
          <Button variant="outline" size="sm" onClick={() => addFieldToSection(null)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t("addFieldNoSection")}
          </Button>
        </div>

        <SortableContext items={sections.map((section) => sectionDragId(section.id))} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section, sectionIndex) => {
              const sectionFields = orderedFields.filter((field) => field.sectionId === section.id)

              return (
                <SectionBlock
                  key={section.id}
                  section={section}
                  index={sectionIndex}
                  fieldIds={sectionFields.map((field) => field.id)}
                  onUpdateTitle={(title) => updateSection(section.id, title)}
                  onRemove={() => removeSection(section.id)}
                >
                  <SortableContext items={sectionFields.map((field) => fieldDragId(field.id))} strategy={verticalListSortingStrategy}>
                    <DroppableGroup id={containerDragId(section.id)}>
                      <div className="space-y-2">
                        {sectionFields.map((field) => (
                          <FieldCard
                            key={field.id}
                            field={field}
                            allKeys={allKeys}
                            onUpdate={(updates) => updateField(field.id, updates)}
                            onRemove={() => removeField(field.id)}
                          />
                        ))}
                        {sectionFields.length === 0 && (
                          <div className="rounded-lg border border-dashed border-border/60 bg-background/35 px-3 py-2 text-xs text-muted-foreground">
                            {t("dropHere")}
                          </div>
                        )}
                      </div>
                    </DroppableGroup>
                  </SortableContext>

                  <Button variant="outline" size="sm" onClick={() => addFieldToSection(section.id)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {t("addField")}
                  </Button>
                </SectionBlock>
              )
            })}
          </div>
        </SortableContext>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={addSection}>
            <FolderPlus className="mr-2 h-4 w-4" />
            {t("addSection")}
          </Button>
          <Button variant="outline" onClick={() => addFieldToSection(null)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addField")}
          </Button>
        </div>
      </div>
    </DndContext>
  )
}
