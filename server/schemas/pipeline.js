"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerationResponseSchema = exports.AISVGDocumentSchema = exports.DocumentMetadataSchema = exports.SVGComponentSchema = exports.CompositionPlanSchema = exports.LayoutPlanSchema = exports.ComponentPlanSchema = exports.DesignIntentSchema = exports.ComponentCountSchema = exports.ComponentSizeSchema = exports.StrokeRulesSchema = void 0;
/**
 * Zod schemas for pipeline validation
 */
var zod_1 = require("zod");
exports.StrokeRulesSchema = zod_1.z.object({
    strokeOnly: zod_1.z.boolean(),
    minStrokeWidth: zod_1.z.number().min(0.1).max(10),
    maxStrokeWidth: zod_1.z.number().min(0.1).max(20),
    allowFill: zod_1.z.boolean(),
});
exports.ComponentSizeSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    minSize: zod_1.z.number().min(1),
    maxSize: zod_1.z.number().min(1),
    aspectRatio: zod_1.z.number().positive().optional(),
});
exports.ComponentCountSchema = zod_1.z.object({
    type: zod_1.z.string().min(1),
    min: zod_1.z.number().min(0),
    max: zod_1.z.number().min(1),
    preferred: zod_1.z.number().min(0),
});
exports.DesignIntentSchema = zod_1.z.object({
    style: zod_1.z.object({
        palette: zod_1.z
            .array(zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/))
            .min(1)
            .max(10),
        strokeRules: exports.StrokeRulesSchema,
        density: zod_1.z.enum(["sparse", "medium", "dense"]),
        symmetry: zod_1.z.enum(["none", "horizontal", "vertical", "radial"]),
    }),
    motifs: zod_1.z.array(zod_1.z.string().min(1)).max(20),
    layout: zod_1.z.object({
        sizes: zod_1.z.array(exports.ComponentSizeSchema).max(10),
        counts: zod_1.z.array(exports.ComponentCountSchema).max(10),
        arrangement: zod_1.z.enum(["grid", "organic", "centered", "scattered"]),
    }),
    constraints: zod_1.z.object({
        strokeOnly: zod_1.z.boolean(),
        maxElements: zod_1.z.number().min(1).max(100),
        requiredMotifs: zod_1.z.array(zod_1.z.string().min(1)).max(10),
    }),
});
exports.ComponentPlanSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
    position: zod_1.z.object({
        x: zod_1.z.number(),
        y: zod_1.z.number(),
    }),
    size: zod_1.z.object({
        width: zod_1.z.number().positive(),
        height: zod_1.z.number().positive(),
    }),
    rotation: zod_1.z.number().min(-360).max(360),
    style: zod_1.z.object({
        fill: zod_1.z.string().optional(),
        stroke: zod_1.z.string().optional(),
        strokeWidth: zod_1.z.number().positive().optional(),
        opacity: zod_1.z.number().min(0).max(1).optional(),
    }),
    motif: zod_1.z.string().optional(),
});
exports.LayoutPlanSchema = zod_1.z.object({
    bounds: zod_1.z.object({
        width: zod_1.z.number().positive(),
        height: zod_1.z.number().positive(),
    }),
    viewBox: zod_1.z
        .string()
        .regex(/^\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?\s+\d+(\.\d+)?$/),
    background: zod_1.z.string().optional(),
    arrangement: zod_1.z.enum(["grid", "organic", "centered", "scattered"]),
    spacing: zod_1.z.number().min(0),
});
exports.CompositionPlanSchema = zod_1.z.object({
    components: zod_1.z.array(exports.ComponentPlanSchema).max(50),
    layout: exports.LayoutPlanSchema,
    zIndex: zod_1.z.array(zod_1.z.number()).max(50),
});
exports.SVGComponentSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
    element: zod_1.z.enum([
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
    attributes: zod_1.z.record(zod_1.z.union([zod_1.z.string(), zod_1.z.number()])),
    children: zod_1.z.array(zod_1.z.any()).optional(),
    metadata: zod_1.z
        .object({
        motif: zod_1.z.string().optional(),
        generated: zod_1.z.boolean().optional(),
        reused: zod_1.z.boolean().optional(),
    })
        .optional(),
});
exports.DocumentMetadataSchema = zod_1.z.object({
    prompt: zod_1.z.string().min(1),
    seed: zod_1.z.number().optional(),
    palette: zod_1.z.array(zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/)),
    description: zod_1.z.string().min(1),
    generatedAt: zod_1.z.date(),
    model: zod_1.z.string().optional(),
    usedObjects: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.AISVGDocumentSchema = zod_1.z.object({
    components: zod_1.z.array(exports.SVGComponentSchema).max(50),
    metadata: exports.DocumentMetadataSchema,
    bounds: zod_1.z.object({
        width: zod_1.z.number().positive(),
        height: zod_1.z.number().positive(),
    }),
    palette: zod_1.z.array(zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/)),
});
exports.GenerationResponseSchema = zod_1.z.object({
    svg: zod_1.z.string().min(1),
    metadata: exports.DocumentMetadataSchema,
    layers: zod_1.z.array(exports.SVGComponentSchema),
    warnings: zod_1.z.array(zod_1.z.string()).optional(),
    errors: zod_1.z.array(zod_1.z.string()).optional(),
});
