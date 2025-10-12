// Helper: read built-in themes from server module
export function readBuiltInThemes(): any[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { builtInThemes } = require("./builtInThemes");
    return Array.isArray(builtInThemes) ? builtInThemes : [];
  } catch (e) {
    return [];
  }
}

// Helpers: thème simplifié (3 couleurs) -> format complet avec opposite (light/dark)
export function normalizeHex(v?: string) {
  if (!v || typeof v !== "string") return "#000000";
  const s = v.trim();
  if (/^#?[0-9a-fA-F]{3}$/.test(s)) {
    const t = s.replace("#", "");
    return (
      "#" +
      t
        .split("")
        .map((c) => c + c)
        .join("")
    );
  }
  if (/^#?[0-9a-fA-F]{6}$/.test(s)) return s.startsWith("#") ? s : "#" + s;
  return "#000000";
}

export function luminance(hex: string) {
  const h = normalizeHex(hex).slice(1);
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

export function contrastText(bg: string) {
  return luminance(bg) > 0.5 ? "#111827" : "#ffffff";
}

export function mix(hexA: string, hexB: string, ratio = 0.2) {
  const a = normalizeHex(hexA).slice(1);
  const b = normalizeHex(hexB).slice(1);
  const c = (i: number) =>
    Math.round(
      parseInt(a.slice(i, i + 2), 16) * (1 - ratio) +
        parseInt(b.slice(i, i + 2), 16) * ratio
    );
  const r = c(0),
    g = c(2),
    bl = c(4);
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

export function hoverVariant(color: string) {
  // Crée une variante hover en mélangeant avec blanc/noir selon la luminance
  return luminance(color) > 0.5
    ? mix(color, "#000000", 0.2)
    : mix(color, "#ffffff", 0.2);
}

export type SimplifiedVariant = { bg: string; button: string; hover: string };

export function toFullTheme(light: SimplifiedVariant, dark: SimplifiedVariant) {
  const L = {
    background: normalizeHex(light.bg),
    hoverColor: normalizeHex(light.hover),
    textColor: contrastText(light.bg),
    buttonBackground: normalizeHex(light.button),
    buttonHoverBackground: hoverVariant(light.button),
    buttonTextColor: contrastText(light.button),
    linkHoverColor: normalizeHex(light.hover),
    articleHoverBoxShadow: `0 4px 12px ${normalizeHex(light.hover)}55`,
    darkTheme: false,
  };
  const D = {
    background: normalizeHex(dark.bg),
    hoverColor: normalizeHex(dark.hover),
    textColor: contrastText(dark.bg),
    buttonBackground: normalizeHex(dark.button),
    buttonHoverBackground: hoverVariant(dark.button),
    buttonTextColor: contrastText(dark.button),
    linkHoverColor: normalizeHex(dark.hover),
    articleHoverBoxShadow: `0 4px 12px ${normalizeHex(dark.hover)}55`,
    darkTheme: true,
  };
  return { ...L, opposite: D } as any;
}

export function coerceThemeData(data: any) {
  // Si déjà au format complet (background/hoverColor/etc.), le retourner tel quel
  if (
    data &&
    typeof data === "object" &&
    "background" in data &&
    ("opposite" in data || "darkTheme" in data)
  )
    return data;
  // Sinon si format simplifié { light: {bg,button,hover}, dark: {bg,button,hover} }
  if (data && data.light && data.dark) {
    const l = data.light as SimplifiedVariant;
    const d = data.dark as SimplifiedVariant;
    return toFullTheme(l, d);
  }
  // Dernier recours: si ne contient que 3 couleurs uniques, dupliquer pour dark en inversant légèrement
  if (data && data.bg && data.button && data.hover) {
    const l = {
      bg: data.bg,
      button: data.button,
      hover: data.hover,
    } as SimplifiedVariant;
    const d = {
      bg: hoverVariant(data.bg),
      button: hoverVariant(data.button),
      hover: data.hover,
    } as SimplifiedVariant;
    return toFullTheme(l, d);
  }
  throw new Error("invalid_theme_payload");
}
