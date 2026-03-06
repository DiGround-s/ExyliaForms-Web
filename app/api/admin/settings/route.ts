import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/auth-utils"
import { setSettings, SETTINGS_CACHE_TAG } from "@/lib/settings"
import { z } from "zod"

const schema = z.object({
  app_name: z.string().min(1).max(64).optional(),
  logo_url: z.string().max(2097152).optional(),
  favicon_url: z.string().max(524288).optional(),
  color_preset: z.enum(["purple", "blue", "indigo", "teal", "green", "amber", "orange", "rose", "cyan", "lime", "pink", "crimson", "sunset", "aurora", "ocean", "forest", "midnight", "candy", "custom", "custom-gradient"]).optional(),
  custom_gradient_hue1: z.string().optional(),
  custom_gradient_hue2: z.string().optional(),
  primary_hue: z.string().optional(),
  sidebar_style: z.enum(["default", "dark", "colored"]).optional(),
  border_radius: z.enum(["none", "sm", "md", "lg", "xl", "full"]).optional(),
  font_family: z.enum(["geist", "inter", "roboto", "open-sans", "poppins", "nunito", "dm-sans", "playfair", "lato", "raleway", "system", "mono"]).optional(),
  custom_css: z.string().max(32768).optional(),
  default_locale: z.enum(["es", "en", "pt", "zh", "fr"]).optional(),
  dm_received_title: z.string().max(256).optional(),
  dm_received_description: z.string().max(4096).optional(),
  dm_received_footer: z.string().max(2048).optional(),
  dm_received_color: z.string().max(7).optional(),
  dm_accepted_title: z.string().max(256).optional(),
  dm_accepted_description: z.string().max(4096).optional(),
  dm_accepted_footer: z.string().max(2048).optional(),
  dm_accepted_color: z.string().max(7).optional(),
  dm_rejected_title: z.string().max(256).optional(),
  dm_rejected_description: z.string().max(4096).optional(),
  dm_rejected_cooldown: z.string().max(512).optional(),
  dm_rejected_footer: z.string().max(2048).optional(),
  dm_rejected_color: z.string().max(7).optional(),
})

export async function PUT(req: Request) {
  const session = await auth()
  if (!session || !hasAdminAccess(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json(parsed.error, { status: 400 })

  const updates = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined) as [string, string][]
  )
  await setSettings(updates)
  revalidateTag(SETTINGS_CACHE_TAG)

  return Response.json({ ok: true })
}
