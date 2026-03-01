"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface EmbedData {
  title: string
  description: string
  footer: string
  color: string
  cooldown?: string
}

export function EmbedSection({
  label,
  vars,
  data,
  onChange,
  hasCooldown,
  tEmbed,
}: {
  label: string
  vars: string[]
  data: EmbedData
  onChange: (patch: Partial<EmbedData>) => void
  hasCooldown?: boolean
  tEmbed: {
    embedTitle: string
    embedDescription: string
    embedFooter: string
    embedCooldown: string
    embedColor: string
    vars: string
    previewTitle: string
  }
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-medium">{label}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{tEmbed.embedTitle}</Label>
              <Input value={data.title} onChange={(e) => onChange({ title: e.target.value })} maxLength={256} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{tEmbed.embedDescription}</Label>
              <Textarea
                value={data.description}
                onChange={(e) => onChange({ description: e.target.value })}
                className="min-h-24 text-sm"
                maxLength={4096}
              />
            </div>
            {hasCooldown && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{tEmbed.embedCooldown}</Label>
                <Input
                  value={data.cooldown ?? ""}
                  onChange={(e) => onChange({ cooldown: e.target.value })}
                  maxLength={512}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{tEmbed.embedFooter}</Label>
              <Input value={data.footer} onChange={(e) => onChange({ footer: e.target.value })} maxLength={2048} />
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground">{tEmbed.embedColor}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border bg-transparent p-0.5"
                />
                <Input
                  value={data.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                  className="w-28 font-mono text-sm uppercase"
                  maxLength={7}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{tEmbed.vars}:</span>{" "}
              {vars.map((v) => (
                <code key={v} className="mx-0.5 rounded bg-muted px-1 py-0.5 text-[11px]">{v}</code>
              ))}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{tEmbed.previewTitle}</p>
            <DiscordPreview data={data} hasCooldown={hasCooldown} />
          </div>
        </div>
      )}
    </div>
  )
}

export function DiscordPreview({ data, hasCooldown }: { data: EmbedData; hasCooldown?: boolean }) {
  const borderColor = data.color || "#5865F2"
  const exampleVars: Record<string, string> = {
    formTitle: "Mi Formulario",
    date: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }),
    cooldownDays: "7",
  }

  function preview(str: string) {
    return str.replace(/\{\{(\w+)\}\}/g, (_, k) => exampleVars[k] ?? `{{${k}}}`)
  }

  function renderMd(str: string) {
    return str
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
  }

  return (
    <div className="rounded-lg bg-[#313338] p-4 text-sm">
      <div
        className="rounded-r-md pl-3"
        style={{ borderLeft: `4px solid ${borderColor}`, background: "#2b2d31" }}
      >
        <div className="space-y-1 py-2 pr-3">
          {data.title && (
            <p className="font-semibold text-white text-sm">{preview(data.title)}</p>
          )}
          {data.description && (
            <p
              className="text-[#dbdee1] text-xs leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: renderMd(preview(data.description)) }}
            />
          )}
          {hasCooldown && data.cooldown && (
            <div className="mt-2 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase text-[#b5bac1]">⏳ Tiempo de espera</p>
              <p
                className="text-xs text-[#dbdee1]"
                dangerouslySetInnerHTML={{ __html: renderMd(preview(data.cooldown)) }}
              />
            </div>
          )}
          {data.footer && (
            <p className="pt-1 text-[10px] text-[#87898c]">{preview(data.footer)}</p>
          )}
        </div>
      </div>
    </div>
  )
}
