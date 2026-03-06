"use client"

import { Control } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FieldConfig {
  options?: string[]
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  checkboxText?: string
  minDate?: string
  maxDate?: string
}

interface FormFieldDef {
  id: string
  key: string
  type: string
  label: string
  helpText?: string | null
  required: boolean
  configJson: FieldConfig
}

interface FieldRendererProps {
  field: FormFieldDef
  control: Control<Record<string, unknown>>
}

export function FieldRenderer({ field, control }: FieldRendererProps) {
  const config = field.configJson

  return (
    <FormField
      control={control}
      name={field.key}
      render={({ field: formField }) => (
        <FormItem className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm md:p-5">
          <FormLabel className="text-sm font-semibold tracking-tight">
            {field.label}
            {field.required && <span className="ml-1 text-destructive">*</span>}
          </FormLabel>
          <FormControl>
            {(() => {
              if (field.type === "SHORT_TEXT" || field.type === "EMAIL" || field.type === "URL") {
                const val = (formField.value as string) ?? ""
                const maxLen = config.maxLength ?? (field.type === "SHORT_TEXT" ? 255 : undefined)
                const minLen = config.minLength ?? 0
                return (
                  <div className="space-y-1">
                    <Input
                      {...formField}
                      className="h-11 border-border/70 bg-background/75"
                      type={field.type === "EMAIL" ? "email" : field.type === "URL" ? "url" : "text"}
                      value={val}
                      maxLength={maxLen}
                    />
                    {(maxLen || minLen > 0) && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{minLen > 0 && val.length < minLen ? `Mínimo ${minLen} caracteres` : ""}</span>
                        {maxLen && (
                          <span className={val.length >= maxLen ? "text-destructive font-medium" : ""}>
                            {val.length} / {maxLen}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              }

              if (field.type === "LONG_TEXT") {
                const val = (formField.value as string) ?? ""
                const maxLen = config.maxLength ?? 1000
                const minLen = config.minLength ?? 0
                return (
                  <div className="space-y-1">
                    <Textarea
                      className="min-h-28 border-border/70 bg-background/75"
                      {...formField}
                      value={val}
                      rows={4}
                      maxLength={maxLen}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{minLen > 0 && val.length < minLen ? `Mínimo ${minLen} caracteres` : ""}</span>
                      <span className={val.length >= maxLen ? "text-destructive font-medium" : ""}>
                        {val.length} / {maxLen}
                      </span>
                    </div>
                  </div>
                )
              }

              if (field.type === "NUMBER") {
                return (
                  <Input
                    className="h-11 border-border/70 bg-background/75"
                    type="number"
                    min={config.min}
                    max={config.max}
                    value={(formField.value as string) ?? ""}
                    onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : "")}
                  />
                )
              }

              if (field.type === "DATE") {
                return (
                  <Input
                    className="h-11 border-border/70 bg-background/75"
                    type="date"
                    min={config.minDate}
                    max={config.maxDate}
                    value={(formField.value as string) ?? ""}
                    onChange={formField.onChange}
                  />
                )
              }

              if (field.type === "CHECKBOX") {
                return (
                  <div className="flex items-center space-x-2 rounded-lg border border-border/70 bg-background/60 px-3 py-2.5">
                    <Checkbox
                      checked={!!formField.value}
                      onCheckedChange={formField.onChange}
                    />
                    <span className="text-sm text-muted-foreground">
                      {config.checkboxText || field.label}
                    </span>
                  </div>
                )
              }

              if (field.type === "SELECT") {
                return (
                  <Select
                    value={(formField.value as string) ?? ""}
                    onValueChange={formField.onChange}
                  >
                    <SelectTrigger className="h-11 border-border/70 bg-background/75">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      {(config.options ?? []).map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }

              if (field.type === "MULTI_SELECT") {
                const selected = Array.isArray(formField.value)
                  ? (formField.value as string[])
                  : []

                return (
                  <div className="space-y-2">
                    {(config.options ?? []).map((opt) => (
                      <div key={opt} className="flex items-center space-x-2 rounded-lg border border-border/70 bg-background/60 px-3 py-2.5">
                        <Checkbox
                          checked={selected.includes(opt)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              formField.onChange([...selected, opt])
                            } else {
                              formField.onChange(selected.filter((v) => v !== opt))
                            }
                          }}
                        />
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                )
              }

              return <Input {...formField} className="h-11 border-border/70 bg-background/75" value={(formField.value as string) ?? ""} />
            })()}
          </FormControl>
          {field.helpText && <FormDescription className="text-xs text-muted-foreground">{field.helpText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
