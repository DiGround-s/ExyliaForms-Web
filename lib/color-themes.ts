export const COLOR_PRESETS = {
  purple: { hue: 277, label: "Púrpura" },
  blue: { hue: 217, label: "Azul" },
  indigo: { hue: 245, label: "Índigo" },
  teal: { hue: 180, label: "Teal" },
  green: { hue: 142, label: "Verde" },
  amber: { hue: 50, label: "Ámbar" },
  orange: { hue: 25, label: "Naranja" },
  rose: { hue: 350, label: "Rosa" },
  cyan: { hue: 195, label: "Cyan" },
  lime: { hue: 100, label: "Lima" },
  pink: { hue: 325, label: "Rosa fuerte" },
  crimson: { hue: 8, label: "Carmesí" },
} as const

export const GRADIENT_PRESETS = {
  sunset: {
    hue: 25,
    swatch: "linear-gradient(135deg, oklch(0.82 0.14 30), oklch(0.76 0.14 350))",
    lightBg: "radial-gradient(circle at 15% 0%, oklch(0.90 0.11 30/0.30), transparent 50%), radial-gradient(circle at 85% 90%, oklch(0.88 0.10 350/0.25), transparent 48%), linear-gradient(160deg, oklch(0.99 0 0), oklch(0.97 0.01 15))",
    darkBg: "radial-gradient(circle at 15% 5%, oklch(0.50 0.18 30/0.22), transparent 45%), radial-gradient(circle at 85% 88%, oklch(0.48 0.16 350/0.18), transparent 48%), linear-gradient(160deg, oklch(0.12 0 0), oklch(0.17 0.02 20) 45%, oklch(0.12 0 0))",
  },
  aurora: {
    hue: 195,
    swatch: "linear-gradient(135deg, oklch(0.70 0.16 195), oklch(0.62 0.16 277))",
    lightBg: "radial-gradient(circle at 20% 0%, oklch(0.88 0.10 195/0.28), transparent 48%), radial-gradient(circle at 80% 85%, oklch(0.88 0.10 277/0.22), transparent 50%), linear-gradient(160deg, oklch(0.99 0 0), oklch(0.96 0.01 230))",
    darkBg: "radial-gradient(circle at 18% 5%, oklch(0.52 0.18 195/0.22), transparent 45%), radial-gradient(circle at 82% 88%, oklch(0.46 0.20 277/0.18), transparent 48%), linear-gradient(160deg, oklch(0.12 0 0), oklch(0.17 0.03 240) 45%, oklch(0.12 0 0))",
  },
  ocean: {
    hue: 210,
    swatch: "linear-gradient(135deg, oklch(0.55 0.16 245), oklch(0.68 0.15 195))",
    lightBg: "radial-gradient(circle at 20% 0%, oklch(0.88 0.09 240/0.28), transparent 48%), radial-gradient(circle at 80% 85%, oklch(0.88 0.10 195/0.22), transparent 50%), linear-gradient(160deg, oklch(0.99 0 0), oklch(0.96 0.01 215))",
    darkBg: "radial-gradient(circle at 15% 5%, oklch(0.40 0.18 245/0.25), transparent 45%), radial-gradient(circle at 85% 88%, oklch(0.50 0.18 195/0.18), transparent 48%), linear-gradient(160deg, oklch(0.10 0 0), oklch(0.15 0.03 225) 45%, oklch(0.10 0 0))",
  },
  forest: {
    hue: 142,
    swatch: "linear-gradient(135deg, oklch(0.60 0.16 142), oklch(0.65 0.13 195))",
    lightBg: "radial-gradient(circle at 20% 0%, oklch(0.88 0.10 142/0.28), transparent 48%), radial-gradient(circle at 80% 85%, oklch(0.88 0.09 195/0.22), transparent 50%), linear-gradient(160deg, oklch(0.99 0 0), oklch(0.97 0.01 165))",
    darkBg: "radial-gradient(circle at 18% 5%, oklch(0.48 0.16 142/0.22), transparent 45%), radial-gradient(circle at 82% 88%, oklch(0.50 0.15 195/0.18), transparent 48%), linear-gradient(160deg, oklch(0.11 0 0), oklch(0.16 0.025 160) 45%, oklch(0.11 0 0))",
  },
  midnight: {
    hue: 245,
    swatch: "linear-gradient(135deg, oklch(0.30 0.14 245), oklch(0.22 0.12 280))",
    lightBg: "radial-gradient(circle at 20% 0%, oklch(0.86 0.10 245/0.22), transparent 48%), radial-gradient(circle at 80% 85%, oklch(0.84 0.10 280/0.18), transparent 50%), linear-gradient(160deg, oklch(0.99 0 0), oklch(0.96 0.01 260))",
    darkBg: "radial-gradient(circle at 15% 5%, oklch(0.38 0.18 245/0.30), transparent 42%), radial-gradient(circle at 85% 88%, oklch(0.32 0.16 280/0.25), transparent 48%), linear-gradient(160deg, oklch(0.08 0 0), oklch(0.14 0.04 260) 45%, oklch(0.08 0 0))",
  },
  candy: {
    hue: 325,
    swatch: "linear-gradient(135deg, oklch(0.72 0.18 325), oklch(0.62 0.18 277))",
    lightBg: "radial-gradient(circle at 20% 0%, oklch(0.88 0.11 325/0.28), transparent 48%), radial-gradient(circle at 80% 85%, oklch(0.88 0.10 277/0.22), transparent 50%), linear-gradient(160deg, oklch(0.99 0 0), oklch(0.97 0.01 300))",
    darkBg: "radial-gradient(circle at 18% 5%, oklch(0.50 0.20 325/0.22), transparent 45%), radial-gradient(circle at 82% 88%, oklch(0.45 0.20 277/0.18), transparent 48%), linear-gradient(160deg, oklch(0.12 0 0), oklch(0.17 0.03 300) 45%, oklch(0.12 0 0))",
  },
} as const

export type ColorPreset = keyof typeof COLOR_PRESETS | keyof typeof GRADIENT_PRESETS | "custom" | "custom-gradient"

const BORDER_RADIUS_VALUES: Record<string, string> = {
  none: "0rem",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "1.5rem",
}

function buildGradientBg(hue1: number, hue2: number) {
  const mid = Math.round((hue1 + hue2) / 2)
  return {
    light: `radial-gradient(circle at 18% 0%, oklch(0.88 0.10 ${hue1}/0.28), transparent 48%), radial-gradient(circle at 82% 88%, oklch(0.88 0.10 ${hue2}/0.22), transparent 50%), linear-gradient(160deg, oklch(0.99 0 0), oklch(0.96 0.01 ${mid}))`,
    dark: `radial-gradient(circle at 18% 5%, oklch(0.50 0.18 ${hue1}/0.22), transparent 45%), radial-gradient(circle at 82% 88%, oklch(0.46 0.18 ${hue2}/0.18), transparent 48%), linear-gradient(160deg, oklch(0.12 0 0), oklch(0.17 0.025 ${mid}) 45%, oklch(0.12 0 0))`,
  }
}

export function generateThemeCss({
  colorPreset,
  primaryHue,
  sidebarStyle,
  borderRadius,
  fontFamily,
  customCss,
  customGradientHue1,
  customGradientHue2,
}: {
  colorPreset: string
  primaryHue: string
  sidebarStyle: string
  borderRadius: string
  fontFamily: string
  customCss: string
  customGradientHue1?: string
  customGradientHue2?: string
}): string {
  const isPresetGradient = colorPreset in GRADIENT_PRESETS
  const isCustomGradient = colorPreset === "custom-gradient"
  const gradientPreset = isPresetGradient ? GRADIENT_PRESETS[colorPreset as keyof typeof GRADIENT_PRESETS] : null

  const hue =
    colorPreset === "custom"
      ? parseInt(primaryHue) || 277
      : isCustomGradient
        ? parseInt(customGradientHue1 ?? "277") || 277
        : isPresetGradient
          ? gradientPreset!.hue
          : (COLOR_PRESETS[colorPreset as keyof typeof COLOR_PRESETS]?.hue ?? 277)

  const radius = BORDER_RADIUS_VALUES[borderRadius] ?? "0.5rem"
  const parts: string[] = []

  parts.push(`:root {
  --primary: oklch(0.585 0.233 ${hue});
  --primary-foreground: oklch(1 0 0);
  --ring: oklch(0.585 0.233 ${hue});
  --sidebar-primary: oklch(0.585 0.233 ${hue});
  --sidebar-primary-foreground: oklch(1 0 0);
  --accent: oklch(0.97 0.02 ${hue});
  --sidebar-accent: oklch(0.96 0.03 ${hue});
  --radius: ${radius};
}`)

  parts.push(`.dark {
  --primary: oklch(0.7 0.18 ${hue});
  --primary-foreground: oklch(0.12 0.02 ${hue});
  --ring: oklch(0.7 0.18 ${hue});
  --sidebar-primary: oklch(0.7 0.18 ${hue});
  --sidebar-primary-foreground: oklch(0.12 0.02 ${hue});
  --accent: oklch(0.28 0.04 ${hue});
  --sidebar-accent: oklch(0.25 0.03 ${hue});
}`)

  if (isCustomGradient) {
    const h1 = parseInt(customGradientHue1 ?? "277") || 277
    const h2 = parseInt(customGradientHue2 ?? "195") || 195
    const bg = buildGradientBg(h1, h2)
    parts.push(`[data-content] { background: ${bg.light} !important; }`)
    parts.push(`.dark [data-content] { background: ${bg.dark} !important; }`)
  } else if (gradientPreset) {
    parts.push(`[data-content] { background: ${gradientPreset.lightBg} !important; }`)
    parts.push(`.dark [data-content] { background: ${gradientPreset.darkBg} !important; }`)
  } else if (sidebarStyle === "dark") {
    parts.push(`:root {
  --sidebar: oklch(0.14 0.02 ${hue});
  --sidebar-foreground: oklch(0.9 0 0);
  --sidebar-border: oklch(0.22 0.02 ${hue});
  --sidebar-accent: oklch(0.21 0.03 ${hue});
  --sidebar-accent-foreground: oklch(0.9 0 0);
  --sidebar-primary: oklch(0.7 0.18 ${hue});
  --sidebar-primary-foreground: oklch(0.12 0.02 ${hue});
}`)
  } else if (sidebarStyle === "colored") {
    parts.push(`:root {
  --sidebar: oklch(0.5 0.22 ${hue});
  --sidebar-foreground: oklch(0.98 0 0);
  --sidebar-border: oklch(0.43 0.2 ${hue});
  --sidebar-accent: oklch(0.55 0.2 ${hue});
  --sidebar-accent-foreground: oklch(0.98 0 0);
  --sidebar-primary: oklch(0.98 0 0);
  --sidebar-primary-foreground: oklch(0.45 0.22 ${hue});
}`)
  }

  const fontMap: Record<string, string> = {
    inter: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    roboto: "var(--font-roboto), ui-sans-serif, system-ui, sans-serif",
    "open-sans": "var(--font-open-sans), ui-sans-serif, system-ui, sans-serif",
    poppins: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
    nunito: "var(--font-nunito), ui-sans-serif, system-ui, sans-serif",
    "dm-sans": "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif",
    playfair: "var(--font-playfair), ui-serif, Georgia, serif",
    lato: "var(--font-lato), ui-sans-serif, system-ui, sans-serif",
    raleway: "var(--font-raleway), ui-sans-serif, system-ui, sans-serif",
    system: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Consolas, monospace",
  }

  if (fontFamily && fontFamily !== "geist" && fontMap[fontFamily]) {
    parts.push(`body { font-family: ${fontMap[fontFamily]} !important; }`)
  }

  if (customCss?.trim()) {
    parts.push(customCss.trim())
  }

  return parts.join("\n")
}
