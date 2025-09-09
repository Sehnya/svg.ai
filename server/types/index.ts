// Main types export file for server
export * from "./api";

// Constants for SVG validation
export const SVG_CONSTANTS = {
  ALLOWED_TAGS: [
    "svg",
    "g",
    "path",
    "circle",
    "rect",
    "line",
    "polyline",
    "polygon",
    "ellipse",
  ] as const,

  FORBIDDEN_TAGS: ["script", "foreignObject", "image"] as const,

  FORBIDDEN_ATTRIBUTES: /^on[a-z]+$/i,

  MAX_DECIMAL_PRECISION: 2,

  REQUIRED_ATTRIBUTES: {
    svg: ["xmlns", "viewBox"],
  } as const,

  SIZE_PRESETS: {
    icon: { width: 24, height: 24 },
    banner: { width: 800, height: 200 },
    square: { width: 400, height: 400 },
  } as const,

  DEFAULT_PALETTES: {
    primary: ["#3B82F6", "#1E40AF", "#1D4ED8"],
    secondary: ["#10B981", "#059669", "#047857"],
    accent: ["#F59E0B", "#D97706", "#B45309"],
    monochrome: ["#374151", "#6B7280", "#9CA3AF"],
  } as const,
} as const;
