import { getSetting } from "@/lib/settings"
import { AppSettingsForm } from "@/components/admin/app-settings-form"

export default async function SettingsPage() {
  const appName = await getSetting("app_name")
  return <AppSettingsForm appName={appName} />
}
