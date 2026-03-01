"use client"

import React from "react"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getFormIcon } from "@/lib/form-icons"

interface StatsData {
  forms: { total: number; published: number; draft: number }
  submissions: { total: number; pending: number; accepted: number; rejected: number }
  users: number
  topForms: Array<{ title: string; icon: string | null; count: number }>
  daily: Array<{ day: string; count: number }>
}

const STATUS_COLORS = {
  pending: "#f59e0b",
  accepted: "#22c55e",
  rejected: "#ef4444",
}

const PIE_COLORS = ["#f59e0b", "#22c55e", "#ef4444"]

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontSize: 12,
}

const TOOLTIP_ITEM_STYLE: React.CSSProperties = {
  color: "var(--card-foreground)",
}

const TOOLTIP_LABEL_STYLE: React.CSSProperties = {
  color: "var(--muted-foreground)",
  marginBottom: 4,
}

function formatDay(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export function StatsCharts({ data }: { data: StatsData }) {
  const statusPie = [
    { name: "Pendientes", value: data.submissions.pending },
    { name: "Aceptados", value: data.submissions.accepted },
    { name: "Rechazados", value: data.submissions.rejected },
  ].filter((d) => d.value > 0)

  const dailyFilled = (() => {
    const map = new Map(data.daily.map((d) => [d.day, d.count]))
    const days: Array<{ day: string; count: number }> = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = d.toISOString().slice(0, 10)
      days.push({ day: key, count: map.get(key) ?? 0 })
    }
    return days
  })()

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Respuestas últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyFilled}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  tickFormatter={formatDay}
                  tick={{ fontSize: 11 }}
                  interval={4}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  labelFormatter={(v) => new Date(v as string).toLocaleDateString()}
                  formatter={(v) => [v, "Respuestas"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estado de respuestas</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {statusPie.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    itemStyle={TOOLTIP_ITEM_STYLE}
                    labelStyle={TOOLTIP_LABEL_STYLE}
                    formatter={(v, n) => [v, n]}
                  />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Formularios con más respuestas</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topForms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {data.topForms.map((form) => {
                const Icon = getFormIcon(form.icon)
                const pct = data.submissions.total > 0
                  ? Math.round((form.count / data.submissions.total) * 100)
                  : 0
                return (
                  <div key={form.title} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate max-w-60">{form.title}</span>
                      </div>
                      <span className="text-muted-foreground shrink-0 ml-2">{form.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
