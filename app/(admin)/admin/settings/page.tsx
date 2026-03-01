import { getSettings } from "@/lib/settings"
import { AppSettingsForm } from "@/components/admin/app-settings-form"

export default async function SettingsPage() {
  const settings = await getSettings([
    "app_name",
    "logo_url",
    "favicon_url",
    "color_preset",
    "primary_hue",
    "sidebar_style",
    "border_radius",
    "font_family",
    "custom_css",
    "default_locale",
    "custom_gradient_hue1",
    "custom_gradient_hue2",
    "dm_received_title", "dm_received_description", "dm_received_footer", "dm_received_color",
    "dm_accepted_title", "dm_accepted_description", "dm_accepted_footer", "dm_accepted_color",
    "dm_rejected_title", "dm_rejected_description", "dm_rejected_cooldown", "dm_rejected_footer", "dm_rejected_color",
  ])
  return <AppSettingsForm initialSettings={settings} />
}
