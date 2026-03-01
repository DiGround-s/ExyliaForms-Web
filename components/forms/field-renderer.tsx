"use client"

import { Control, Controller } from "react-hook-form"
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
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required && <span className="ml-1 text-destructive">*</span>}
          </FormLabel>
          <FormControl>
            <>
              {(field.type === "SHORT_TEXT" || field.type === "EMAIL" || field.type === "URL") && (
                <Input
                  {...formField}
                  type={
                    field.type === "EMAIL" ? "email" : field.type === "URL" ? "url" : "text"
                  }
                  value={(formField.value as string) ?? ""}
                />
              )}
              {field.type === "LONG_TEXT" && (
                <Textarea {...formField} value={(formField.value as string) ?? ""} rows={4} />
              )}
              {field.type === "NUMBER" && (
                <Input
                  type="number"
                  min={config.min}
                  max={config.max}
                  value={(formField.value as string) ?? ""}
                  onChange={(e) => formField.onChange(e.target.value ? Number(e.target.value) : "")}
                />
              )}
              {field.type === "DATE" && (
                <Input
                  type="date"
                  value={(formField.value as string) ?? ""}
                  onChange={formField.onChange}
                />
              )}
              {field.type === "CHECKBOX" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={!!formField.value}
                    onCheckedChange={formField.onChange}
                  />
                  <span className="text-sm text-muted-foreground">{field.label}</span>
                </div>
              )}
              {field.type === "SELECT" && (
                <Select
                  value={(formField.value as string) ?? ""}
                  onValueChange={formField.onChange}
                >
                  <SelectTrigger>
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
              )}
              {field.type === "MULTI_SELECT" && (
                <div className="space-y-2">
                  {(config.options ?? []).map((opt) => {
                    const selected = Array.isArray(formField.value)
                      ? (formField.value as string[])
                      : []
                    return (
                      <div key={opt} className="flex items-center space-x-2">
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
                    )
                  })}
                </div>
              )}
            </>
          </FormControl>
          {field.helpText && <FormDescription>{field.helpText}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
