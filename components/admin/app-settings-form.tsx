"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AppSettingsFormProps {
  appName: string
}

export function AppSettingsForm({ appName: initial }: AppSettingsFormProps) {
  const [appName, setAppName] = useState(initial)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!appName.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_name: appName.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success("Configuración guardada")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Nombre de la aplicación</CardTitle>
          <CardDescription>Se muestra en la barra lateral y en el header móvil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              maxLength={64}
              placeholder="Ej: Mi Portal de Formularios"
            />
          </div>
          <Button onClick={save} disabled={saving || !appName.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
