"use client"

import { useState } from "react"
import { FORM_ICONS, getFormIcon } from "@/lib/form-icons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface IconPickerProps {
  value?: string | null
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const SelectedIcon = getFormIcon(value)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9" title="Cambiar icono">
          <SelectedIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Seleccionar icono</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-6 gap-1 pt-2">
          {Object.entries(FORM_ICONS).map(([name, Icon]) => (
            <button
              key={name}
              onClick={() => { onChange(name); setOpen(false) }}
              className={cn(
                "flex items-center justify-center rounded p-2 hover:bg-muted transition-colors",
                value === name && "bg-primary text-primary-foreground hover:bg-primary"
              )}
              title={name}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
