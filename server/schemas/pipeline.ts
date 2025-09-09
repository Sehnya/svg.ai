/**
 * Zod schemas for pipeline validation
 */
import { z } from "zod";

export const StrokeRulesSchema = z.object({
  strokeOnly: z.boolean(),
  minStrokeWidth: z.number().min(0.1).max(10),
  maxStrokeWidth: z.number().min(0.1).max(20),
  allowFill: z.boolean(),
});

export const ComponentSizeSchema = z.object({
  type: z.string().min(1),
  minSize: z.number().min(1),
  maxSize: z.number().min(1),
  aspectRatio: z.number().positive().optional(),
});

export const ComponentCountSchema = z.object({
  type: z.string().min(1),
  min: z.number().min(0),
  max: z.number().min(1),
  preferred: z.number().min(0),
});

export const DesignIntentSchema = z.object({
  style: z.object({
    palette: z
      .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
      .min(1)
      .max(10),
    strokeRules: StrokeRulesSchema,
    density: z.enum(["sparse", "medium", "dense"]),
    symmetry: z.enum(["none", "horizontal", "vertical", "radial"]),
  }),
  motifs: z.array(z.string().min(1)).max(20),
  layout: z.object({
    sizes: z.array(ComponentSizeSchema).max(10),
    counts: z.array(ComponentCountSchema).max(10),
    arrangement: z.enum(["grid", "organic", "centered", "scattered"]),
  }),
  constraints: z.object({
    strokeOnly: z.boolean(),
    maxElements: z.number().min(1).max(100),
    requiredMotifs: z.array(z.string().min(1)).max(10),
  }),
});

export const ComponentPlanSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  rotation: z.number().min(-360).max(360),
  style: z.object({
    fill: z.string().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().positive().optional(),
    opacity: z.number().min(0).max(1).optional(),
  }),
  motif: z.string().optional(),
});

export const LayoutPlanSchema = z.object({
  bounds: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  viewBox: z
    .string()
    .regex(/^\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?$/),
  background: z.string().optional(),
  arrangement: z.enum(["grid", "organic", "centered", "scattered"]),
  spacing: z.number().min(0),
});

export const CompositionPlanSchema = z.object({
  components: z.array(ComponentPlanSchema).max(50),
  layout: LayoutPlanSchema,
  zIndex: z.array(z.number()).max(50),
});

export const SVGComponentSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  element: z.enum([
    "svg",
    "g",
    "path",
    "circle",
    "rect",
    "line",
    "polyline",
    "polygon",
    "ellipse",
  ]),
  attributes: z.record(z.union([z.string(), z.number()])),
  children: z.array(z.any()).optional(),
  metadata: z
    .object({
      motif: z.string().optional(),
      generated: z.boolean().optional(),
      reused: z.boolean().optional(),
    })
    .optional(),
});

export const DocumentMetadataSchema = z.object({
  prompt: z.string().min(1),
  seed: z.number().optional(),
  palette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)),
  description: z.string().min(1),
  generatedAt: z.date(),
  model: z.string().optional(),
  usedObjects: z.array(z.string()).optional(),
});

export const AISVGDocumentSchema = z.object({
  components: z.array(SVGComponentSchema).max(50),
  metadata: DocumentMetadataSchema,
  bounds: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  palette: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)),
});

export const GenerationResponseSchema = z.object({
  svg: z.string().min(1),
  metadata: DocumentMetadataSchema,
  layers: z.array(SVGComponentSchema),
  warnings: z.array(z.string()).optional(),
  errors: z.array(z.string()).optional(),
});
