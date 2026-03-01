import { auth } from "@/lib/auth"
import { setSetting } from "@/lib/settings"
import { z } from "zod"

const schema = z.object({
  app_name: z.string().min(1).max(64).optional(),
})

export async function PUT(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json(parsed.error, { status: 400 })

  const updates = Object.entries(parsed.data).filter(([, v]) => v !== undefined) as [string, string][]
  await Promise.all(updates.map(([k, v]) => setSetting(k, v)))

  return Response.json({ ok: true })
}
