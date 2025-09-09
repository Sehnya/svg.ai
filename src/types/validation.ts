import { z } from "zod";

// Zod schemas for validation
export const SizeConfigSchema = z.object({
  preset: z.enum(["icon", "banner", "square", "custom"]),
  width: z.number().min(16).max(2048),
  height: z.number().min(16).max(2048),
});

export const PaletteConfigSchema = z.object({
  type: z.enum(["preset", "custom"]),
  colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)),
  name: z.string().optional(),
});

export const LayerInfoSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["shape", "group", "text", "path"]),
});

export const SVGMetadataSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  viewBox: z.string(),
  backgroundColor: z.string(),
  palette: z.array(z.string()),
  description: z.string(),
  seed: z.number(),
});

export const GenerationRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  size: z.object({
    width: z.number().min(16).max(2048),
    height: z.number().min(16).max(2048),
  }),
  palette: z.array(z.string()).optional(),
  seed: z.number().optional(),
  model: z.enum(["rule-based", "llm"]).optional(),
});

export const GenerationResponseSchema = z.object({
  svg: z.string(),
  meta: SVGMetadataSchema,
  layers: z.array(LayerInfoSchema),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
});

// Validation result types
export interface ValidationResult {
  success: boolean;
  data?: any;
  errors: string[];
}

export interface SanitizationResult {
  sanitizedSVG: string;
  warnings: string[];
  errors: string[];
  isValid: boolean;
}
