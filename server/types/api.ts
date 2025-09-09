import { z } from "zod";

// Size configuration interfaces
export interface SizeConfig {
  preset: "icon" | "banner" | "square" | "custom";
  width: number;
  height: number;
}

// Palette configuration interfaces
export interface PaletteConfig {
  type: "preset" | "custom";
  colors: string[];
  name?: string;
}

// Layer information interface
export interface LayerInfo {
  id: string;
  label: string;
  type: "shape" | "group" | "text" | "path";
}

// SVG metadata interface
export interface SVGMetadata {
  width: number;
  height: number;
  viewBox: string;
  backgroundColor: string;
  palette: string[];
  description: string;
  seed: number;
}

// Generation request interface
export interface GenerationRequest {
  prompt: string;
  size: {
    width: number;
    height: number;
  };
  palette?: string[];
  seed?: number;
  model?: "rule-based" | "llm";
  userId?: string; // For feedback tracking
}

// Generation response interface
export interface GenerationResponse {
  svg: string;
  meta: SVGMetadata;
  layers: LayerInfo[];
  warnings: string[];
  errors: string[];
  eventId?: number; // For feedback tracking
}

// SVG Contract interface for validation
export interface SVGContract {
  xmlns: "http://www.w3.org/2000/svg";
  viewBox: string;
  width: number;
  height: number;
  allowedTags: readonly [
    "svg",
    "g",
    "path",
    "circle",
    "rect",
    "line",
    "polyline",
    "polygon",
    "ellipse",
  ];
  forbiddenTags: readonly ["script", "foreignObject", "image"];
  forbiddenAttributes: RegExp;
}

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
  userId: z.string().optional(), // For feedback tracking
});

export const GenerationResponseSchema = z.object({
  svg: z.string(),
  meta: SVGMetadataSchema,
  layers: z.array(LayerInfoSchema),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
  eventId: z.number().optional(), // For feedback tracking
});

// Server-specific types
export interface GenerationError extends Error {
  code: string;
  statusCode: number;
}

export interface ValidationError extends Error {
  field: string;
  message: string;
}

export interface SanitizationError extends Error {
  element?: string;
  attribute?: string;
}

export interface NetworkError extends Error {
  statusCode?: number;
  timeout?: boolean;
}
