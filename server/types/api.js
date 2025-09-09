"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerationResponseSchema = exports.GenerationRequestSchema = exports.SVGMetadataSchema = exports.LayerInfoSchema = exports.PaletteConfigSchema = exports.SizeConfigSchema = void 0;
var zod_1 = require("zod");
// Zod schemas for validation
exports.SizeConfigSchema = zod_1.z.object({
    preset: zod_1.z.enum(["icon", "banner", "square", "custom"]),
    width: zod_1.z.number().min(16).max(2048),
    height: zod_1.z.number().min(16).max(2048),
});
exports.PaletteConfigSchema = zod_1.z.object({
    type: zod_1.z.enum(["preset", "custom"]),
    colors: zod_1.z.array(zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/)),
    name: zod_1.z.string().optional(),
});
exports.LayerInfoSchema = zod_1.z.object({
    id: zod_1.z.string(),
    label: zod_1.z.string(),
    type: zod_1.z.enum(["shape", "group", "text", "path"]),
});
exports.SVGMetadataSchema = zod_1.z.object({
    width: zod_1.z.number().positive(),
    height: zod_1.z.number().positive(),
    viewBox: zod_1.z.string(),
    backgroundColor: zod_1.z.string(),
    palette: zod_1.z.array(zod_1.z.string()),
    description: zod_1.z.string(),
    seed: zod_1.z.number(),
});
exports.GenerationRequestSchema = zod_1.z.object({
    prompt: zod_1.z.string().min(1).max(500),
    size: zod_1.z.object({
        width: zod_1.z.number().min(16).max(2048),
        height: zod_1.z.number().min(16).max(2048),
    }),
    palette: zod_1.z.array(zod_1.z.string()).optional(),
    seed: zod_1.z.number().optional(),
    model: zod_1.z.enum(["rule-based", "llm"]).optional(),
    userId: zod_1.z.string().optional(), // For feedback tracking
});
exports.GenerationResponseSchema = zod_1.z.object({
    svg: zod_1.z.string(),
    meta: exports.SVGMetadataSchema,
    layers: zod_1.z.array(exports.LayerInfoSchema),
    warnings: zod_1.z.array(zod_1.z.string()),
    errors: zod_1.z.array(zod_1.z.string()),
    eventId: zod_1.z.number().optional(), // For feedback tracking
});
