"use client"

import { useEffect, useRef, useCallback, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FieldRenderer } from "./field-renderer"
import { Loader2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"

interface FormSection {
  id: string
  title: string
  order: number
}

interface FormFieldDef {
  id: string
  key: string
  type: string
  label: string
  helpText?: string | null
  required: boolean
  sectionId?: string | null
  configJson: Record<string, unknown>
}

interface FormRendererProps {
  formId: string
  sections?: FormSection[]
  fields: FormFieldDef[]
}

function buildSchema(fields: FormFieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    let schema: z.ZodTypeAny = z.unknown()
    if (field.type === "SHORT_TEXT" || field.type === "LONG_TEXT") schema = z.string()
    else if (field.type === "EMAIL") schema = z.string().email("Email inválido")
    else if (field.type === "URL") schema = z.string().url("URL inválida")
    else if (field.type === "NUMBER") schema = z.number()
    else if (field.type === "DATE") schema = z.string()
    else if (field.type === "CHECKBOX") schema = z.boolean()
    else if (field.type === "SELECT") schema = z.string()
    else if (field.type === "MULTI_SELECT") schema = z.array(z.string())
    if (!field.required) schema = schema.optional()
    shape[field.key] = schema
  }
  return z.object(shape)
}

function getDefaultValues(fields: FormFieldDef[]) {
  return fields.reduce((acc, f) => {
    if (f.type === "MULTI_SELECT") acc[f.key] = []
    else if (f.type === "CHECKBOX") acc[f.key] = false
    else acc[f.key] = ""
    return acc
  }, {} as Record<string, unknown>)
}

export function FormRenderer({ formId, sections = [], fields }: FormRendererProps) {
  const router = useRouter()
  const storageKey = `form-draft-${formId}`
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasDraftRef = useRef(false)
  const [step, setStep] = useState(0)

  const steps = useMemo(() => {
    if (sections.length === 0) {
      return [{ title: "", fieldKeys: fields.map((f) => f.key) }]
    }
    const result: Array<{ title: string; fieldKeys: string[] }> = []
    const unsectioned = fields.filter((f) => !f.sectionId).map((f) => f.key)
    if (unsectioned.length > 0) result.push({ title: "General", fieldKeys: unsectioned })
    for (const section of sections) {
      const keys = fields.filter((f) => f.sectionId === section.id).map((f) => f.key)
      if (keys.length > 0) result.push({ title: section.title, fieldKeys: keys })
    }
    return result
  }, [sections, fields])

  const isMultiStep = steps.length > 1
  const currentStep = steps[step] ?? steps[0]
  const currentFields = fields.filter((f) => currentStep.fieldKeys.includes(f.key))

  const defaultValues = (() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) { hasDraftRef.current = true; return JSON.parse(saved) as Record<string, unknown> }
      } catch {}
    }
    return getDefaultValues(fields)
  })()

  const schema = buildSchema(fields)
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const watched = useWatch({ control: form.control })

  const saveDraft = useCallback((values: Record<string, unknown>) => {
    try { localStorage.setItem(storageKey, JSON.stringify(values)) } catch {}
  }, [storageKey])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveDraft(watched as Record<string, unknown>), 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [watched, saveDraft])

  function clearDraft() {
    try { localStorage.removeItem(storageKey) } catch {}
    hasDraftRef.current = false
    form.reset(getDefaultValues(fields))
    toast.info("Borrador eliminado")
  }

  async function goNext() {
    const valid = await form.trigger(currentStep.fieldKeys as (keyof Record<string, unknown>)[])
    if (!valid) return
    setStep((s) => Math.min(s + 1, steps.length - 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function goPrev() {
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function onSubmit(data: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/forms/${formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: data }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "Error al enviar el formulario")
        return
      }
      try { localStorage.removeItem(storageKey) } catch {}
      toast.success("Respuesta enviada correctamente")
      router.push("/app/submissions")
    } catch {
      toast.error("Error de conexión")
    }
  }

  return (
    <div className="space-y-4">
      {hasDraftRef.current && (
        <Alert>
          <AlertDescription className="flex items-center justify-between">
            <span>Borrador recuperado.</span>
            <Button variant="ghost" size="sm" onClick={clearDraft}>
              <RotateCcw className="mr-1 h-3 w-3" />
              Limpiar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isMultiStep && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{currentStep.title}</span>
            <span className="text-muted-foreground">Paso {step + 1} de {steps.length}</span>
          </div>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {currentFields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field as Parameters<typeof FieldRenderer>[0]["field"]}
              control={form.control}
            />
          ))}

          <div className="flex items-center gap-3">
            {isMultiStep && step > 0 && (
              <Button type="button" variant="outline" onClick={goPrev}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
            )}
            {isMultiStep && step < steps.length - 1 ? (
              <Button type="button" onClick={goNext}>
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar respuesta
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
