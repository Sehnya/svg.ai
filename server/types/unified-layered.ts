/**
 * Unified Layered SVG Generation Types
 * Combines Layout Language System with Layered SVG Generation
 */

import { z } from "zod";
// import { AspectRatio } from "../services/AspectRatioManager";

// Re-export AspectRatio for external use
// export { AspectRatio };

// Temporary local definition to avoid circular dependency
export type AspectRatio = "1:1" | "4:3" | "16:9" | "3:2" | "2:3" | "9:16";

// ============================================================================
// Core Layout Language Types
// ============================================================================

export type RegionName =
  | "top_left"
  | "top_center"
  | "top_right"
  | "middle_left"
  | "center"
  | "middle_right"
  | "bottom_left"
  | "bottom_center"
  | "bottom_right"
  | "full_canvas";

export type AnchorPoint =
  | "center"
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right"
  | "top_center"
  | "bottom_center"
  | "middle_left"
  | "middle_right";

export interface CustomRegion {
  name: string;
  bounds: {
    x: number; // normalized 0-1
    y: number; // normalized 0-1
    width: number; // normalized 0-1
    height: number; // normalized 0-1
  };
}

export interface SizeSpec {
  absolute?: { width: number; height: number };
  relative?: number; // Percentage of region (0-1)
  aspect_constrained?: { width: number; aspect: number };
}

export interface RepetitionSpec {
  type: "grid" | "radial";
  count: number | [number, number];
  spacing?: number;
  radius?: number; // For radial repetition
}

// ============================================================================
// Layered SVG Types
// ============================================================================

export interface PathCommand {
  cmd: "M" | "L" | "C" | "Q" | "Z";
  coords: number[]; // Array of absolute coordinates
}

export interface PathStyle {
  fill?: string; // Color hex or "none"
  stroke?: string; // Color hex or "none"
  strokeWidth?: number; // Numeric stroke width in px
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
  opacity?: number; // 0-1
}

export interface LayoutSpecification {
  region?: RegionName | string; // Custom region name allowed
  anchor?: AnchorPoint;
  offset?: [number, number]; // Normalized offset (-1 to 1)
  size?: SizeSpec;
  repeat?: RepetitionSpec;
  zIndex?: number;
}

export interface UnifiedPath {
  id: string; // Unique path id, e.g. "roof_shape"
  style: PathStyle;
  commands: PathCommand[];
  layout?: LayoutSpecification;
}

export interface UnifiedLayer {
  id: string; // Unique layer id, e.g. "roof"
  label: string; // Human-readable, e.g. "House Roof"
  layout?: LayoutSpecification;
  paths: UnifiedPath[];
}

export interface UnifiedCanvas {
  width: number;
  height: number;
  aspectRatio: AspectRatio;
}

export interface UnifiedLayoutConfig {
  regions?: CustomRegion[];
  globalAnchor?: AnchorPoint;
  globalOffset?: [number, number];
}

export interface UnifiedLayeredSVGDocument {
  version: "unified-layered-1.0";
  canvas: UnifiedCanvas;
  layout?: UnifiedLayoutConfig;
  layers: UnifiedLayer[];
}

// ============================================================================
// Generation and Response Types
// ============================================================================

// Generation request interface for unified system
export interface GenerationRequest {
  prompt: string;
  aspectRatio: AspectRatio;
  model: "rule-based" | "llm" | "unified";
  context?: {
    style?: string;
    complexity?: string;
    colors?: string | string[];
    theme?: string;
    elements?: string | string[];
  };
  debug?: boolean;
  features?: {
    unifiedGeneration?: boolean;
  };
  environment?: "development" | "production";
  abTestGroup?: "unified" | "traditional";
}

// Generation response interface for unified system
export interface GenerationResponse {
  success: boolean;
  svg: string;
  error?: string;
  metadata?: {
    generationMethod: string;
    layers?: any[];
    layout?: {
      regionsUsed: string[];
      anchorsUsed: string[];
      aspectRatio: AspectRatio;
      canvasDimensions: { width: number; height: number };
    };
    layoutQuality?: number;
    coordinatesRepaired?: boolean;
    fallbackUsed?: boolean;
    fallbackReason?: string;
    environment?: string;
    errors?: string[];
    performance?: {
      generationTime: number;
      apiTime?: number;
      processingTime?: number;
    };
  };
  debug?: {
    overlayElements: any[];
    statistics: {
      regionsShown: number;
      anchorsShown: number;
      layersAnalyzed: number;
      errorsFound: number;
    };
    renderTime: number;
  };
}

export interface UnifiedGenerationRequest {
  prompt: string;
  aspectRatio?: AspectRatio;
  palette?: string[];
  seed?: number;
  model?: "unified" | "layered" | "rule-based" | "llm";
  userId?: string;
  layoutHints?: {
    preferredRegions?: RegionName[];
    symmetry?: "none" | "horizontal" | "vertical" | "radial";
    density?: "sparse" | "medium" | "dense";
  };
}

export interface LayerMetadata {
  id: string;
  label: string;
  pathCount: number;
  region?: RegionName | string;
  anchor?: AnchorPoint;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface LayoutMetadata {
  regions: {
    name: RegionName | string;
    bounds: { x: number; y: number; width: number; height: number };
    used: boolean;
  }[];
  anchorsUsed: AnchorPoint[];
  coordinateRange: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface UnifiedGenerationResponse {
  svg: string;
  metadata: {
    layers: LayerMetadata[];
    layout: LayoutMetadata;
    generationMethod:
      | "unified-layered"
      | "layered-fallback"
      | "rule-based-fallback";
    canvas: UnifiedCanvas;
    prompt: string;
    seed?: number;
    palette: string[];
    generatedAt: Date;
  };
  warnings?: string[];
  errors?: string[];
  eventId?: number;
}

// ============================================================================
// Validation and Error Types
// ============================================================================

export interface UnifiedValidationResult {
  success: boolean;
  data?: UnifiedLayeredSVGDocument;
  errors: string[];
  warnings: string[];
}

export interface CoordinateValidationResult {
  valid: boolean;
  clampedCoordinates?: number[];
  outOfBounds: boolean;
  suggestions?: string[];
}

export interface LayoutValidationResult {
  valid: boolean;
  regionExists: boolean;
  anchorValid: boolean;
  offsetInRange: boolean;
  suggestions?: string[];
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

// Basic type schemas
export const RegionNameSchema = z.enum([
  "top_left",
  "top_center",
  "top_right",
  "middle_left",
  "center",
  "middle_right",
  "bottom_left",
  "bottom_center",
  "bottom_right",
  "full_canvas",
]);

export const AnchorPointSchema = z.enum([
  "center",
  "top_left",
  "top_right",
  "bottom_left",
  "bottom_right",
  "top_center",
  "bottom_center",
  "middle_left",
  "middle_right",
]);

export const AspectRatioSchema = z.enum([
  "1:1",
  "4:3",
  "16:9",
  "3:2",
  "2:3",
  "9:16",
]);

// Complex type schemas
export const CustomRegionSchema = z.object({
  name: z.string().min(1),
  bounds: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
  }),
});

export const SizeSpecSchema = z
  .object({
    absolute: z
      .object({
        width: z.number().positive(),
        height: z.number().positive(),
      })
      .optional(),
    relative: z.number().min(0).max(1).optional(),
    aspect_constrained: z
      .object({
        width: z.number().positive(),
        aspect: z.number().positive(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      const definedFields = [
        data.absolute,
        data.relative,
        data.aspect_constrained,
      ].filter(Boolean);
      return definedFields.length === 1;
    },
    { message: "Exactly one size specification method must be provided" }
  );

export const RepetitionSpecSchema = z.object({
  type: z.enum(["grid", "radial"]),
  count: z.union([
    z.number().int().positive(),
    z.tuple([z.number().int().positive(), z.number().int().positive()]),
  ]),
  spacing: z.number().positive().optional(),
  radius: z.number().positive().optional(),
});

export const PathCommandSchema = z
  .object({
    cmd: z.enum(["M", "L", "C", "Q", "Z"]),
    coords: z.array(z.number()),
  })
  .refine(
    (data) => {
      const { cmd, coords } = data;
      if (cmd === "Z") return coords.length === 0;
      if (cmd === "M" || cmd === "L") return coords.length === 2;
      if (cmd === "Q") return coords.length === 4;
      if (cmd === "C") return coords.length === 6;
      return false;
    },
    { message: "Invalid coordinate count for path command" }
  );

export const PathStyleSchema = z.object({
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().positive().optional(),
  strokeLinecap: z.enum(["butt", "round", "square"]).optional(),
  strokeLinejoin: z.enum(["miter", "round", "bevel"]).optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const LayoutSpecificationSchema = z.object({
  region: z.union([RegionNameSchema, z.string()]).optional(),
  anchor: AnchorPointSchema.optional(),
  offset: z
    .tuple([z.number().min(-1).max(1), z.number().min(-1).max(1)])
    .optional(),
  size: SizeSpecSchema.optional(),
  repeat: RepetitionSpecSchema.optional(),
  zIndex: z.number().int().optional(),
});

export const UnifiedPathSchema = z.object({
  id: z.string().min(1),
  style: PathStyleSchema,
  commands: z.array(PathCommandSchema).min(1),
  layout: LayoutSpecificationSchema.optional(),
});

export const UnifiedLayerSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  layout: LayoutSpecificationSchema.optional(),
  paths: z.array(UnifiedPathSchema).min(1),
});

export const UnifiedCanvasSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  aspectRatio: AspectRatioSchema,
});

export const UnifiedLayoutConfigSchema = z.object({
  regions: z.array(CustomRegionSchema).optional(),
  globalAnchor: AnchorPointSchema.optional(),
  globalOffset: z
    .tuple([z.number().min(-1).max(1), z.number().min(-1).max(1)])
    .optional(),
});

export const UnifiedLayeredSVGDocumentSchema = z.object({
  version: z.literal("unified-layered-1.0"),
  canvas: UnifiedCanvasSchema,
  layout: UnifiedLayoutConfigSchema.optional(),
  layers: z.array(UnifiedLayerSchema).min(1),
});

// Request and response schemas
export const UnifiedGenerationRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  aspectRatio: AspectRatioSchema.optional(),
  palette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).optional(),
  seed: z.number().int().optional(),
  model: z.enum(["unified", "layered", "rule-based", "llm"]).optional(),
  userId: z.string().optional(),
  layoutHints: z
    .object({
      preferredRegions: z.array(RegionNameSchema).optional(),
      symmetry: z.enum(["none", "horizontal", "vertical", "radial"]).optional(),
      density: z.enum(["sparse", "medium", "dense"]).optional(),
    })
    .optional(),
});

export const LayerMetadataSchema = z.object({
  id: z.string(),
  label: z.string(),
  pathCount: z.number().int().nonnegative(),
  region: z.union([RegionNameSchema, z.string()]).optional(),
  anchor: AnchorPointSchema.optional(),
  bounds: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().nonnegative(),
    height: z.number().nonnegative(),
  }),
});

export const LayoutMetadataSchema = z.object({
  regions: z.array(
    z.object({
      name: z.union([RegionNameSchema, z.string()]),
      bounds: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number().nonnegative(),
        height: z.number().nonnegative(),
      }),
      used: z.boolean(),
    })
  ),
  anchorsUsed: z.array(AnchorPointSchema),
  coordinateRange: z.object({
    minX: z.number(),
    maxX: z.number(),
    minY: z.number(),
    maxY: z.number(),
  }),
});

export const UnifiedGenerationResponseSchema = z.object({
  svg: z.string().min(1),
  metadata: z.object({
    layers: z.array(LayerMetadataSchema),
    layout: LayoutMetadataSchema,
    generationMethod: z.enum([
      "unified-layered",
      "layered-fallback",
      "rule-based-fallback",
    ]),
    canvas: UnifiedCanvasSchema,
    prompt: z.string(),
    seed: z.number().int().optional(),
    palette: z.array(z.string()),
    generatedAt: z.date(),
  }),
  warnings: z.array(z.string()).optional(),
  errors: z.array(z.string()).optional(),
  eventId: z.number().int().optional(),
});

// ============================================================================
// Utility Types and Constants
// ============================================================================

export const UNIFIED_SCHEMA_VERSION = "unified-layered-1.0" as const;

export const DEFAULT_LAYOUT_SPECIFICATION: LayoutSpecification = {
  region: "center",
  anchor: "center",
  offset: [0, 0],
};

export const COORDINATE_BOUNDS = {
  MIN: 0,
  MAX: 512,
  PRECISION: 2,
} as const;

export const REGION_BOUNDS: Record<
  RegionName,
  { x: number; y: number; width: number; height: number }
> = {
  top_left: { x: 0, y: 0, width: 0.33, height: 0.33 },
  top_center: { x: 0.33, y: 0, width: 0.34, height: 0.33 },
  top_right: { x: 0.67, y: 0, width: 0.33, height: 0.33 },
  middle_left: { x: 0, y: 0.33, width: 0.33, height: 0.34 },
  center: { x: 0.33, y: 0.33, width: 0.34, height: 0.34 },
  middle_right: { x: 0.67, y: 0.33, width: 0.33, height: 0.34 },
  bottom_left: { x: 0, y: 0.67, width: 0.33, height: 0.33 },
  bottom_center: { x: 0.33, y: 0.67, width: 0.34, height: 0.33 },
  bottom_right: { x: 0.67, y: 0.67, width: 0.33, height: 0.33 },
  full_canvas: { x: 0, y: 0, width: 1, height: 1 },
};

export const ANCHOR_OFFSETS: Record<AnchorPoint, { x: number; y: number }> = {
  center: { x: 0.5, y: 0.5 },
  top_left: { x: 0, y: 0 },
  top_right: { x: 1, y: 0 },
  bottom_left: { x: 0, y: 1 },
  bottom_right: { x: 1, y: 1 },
  top_center: { x: 0.5, y: 0 },
  bottom_center: { x: 0.5, y: 1 },
  middle_left: { x: 0, y: 0.5 },
  middle_right: { x: 1, y: 0.5 },
};

// Type guards
export function isRegionName(value: string): value is RegionName {
  return RegionNameSchema.safeParse(value).success;
}

export function isAnchorPoint(value: string): value is AnchorPoint {
  return AnchorPointSchema.safeParse(value).success;
}

export function isUnifiedLayeredDocument(
  value: unknown
): value is UnifiedLayeredSVGDocument {
  return UnifiedLayeredSVGDocumentSchema.safeParse(value).success;
}

export function isValidPathCommand(cmd: string, coords: number[]): boolean {
  return PathCommandSchema.safeParse({ cmd, coords }).success;
}
