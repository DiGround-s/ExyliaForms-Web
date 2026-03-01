import { getSettings } from "@/lib/settings"
import { generateThemeCss } from "@/lib/color-themes"

export async function ThemeInjector() {
  const settings = await getSettings([
    "color_preset",
    "primary_hue",
    "sidebar_style",
    "border_radius",
    "font_family",
    "custom_css",
    "custom_gradient_hue1",
    "custom_gradient_hue2",
  ])

  const css = generateThemeCss({
    colorPreset: settings.color_preset,
    primaryHue: settings.primary_hue,
    sidebarStyle: settings.sidebar_style,
    borderRadius: settings.border_radius,
    fontFamily: settings.font_family,
    customCss: settings.custom_css,
    customGradientHue1: settings.custom_gradient_hue1,
    customGradientHue2: settings.custom_gradient_hue2,
  })

  if (!css.trim()) return null

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
