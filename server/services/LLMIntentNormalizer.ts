/**
 * LLMIntentNormalizer - Uses LLM to convert prompts into structured DesignIntent
 * Enhanced with unified layered SVG generation support and layout language integration
 */
import type { DesignIntent } from "../types/pipeline.js";
import { DesignIntentSchema } from "../schemas/pipeline.js";
import {
  IntentNormalizer,
  type NormalizationContext,
} from "./IntentNormalizer.js";
import {
  UnifiedLayeredSVGDocument,
  RegionName,
  AnchorPoint,
  REGION_BOUNDS,
  ANCHOR_OFFSETS,
} from "../types/unified-layered";

export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
}

export interface GroundingData {
  stylePack?: any;
  motifs?: any[];
  glossary?: any[];
  fewshot?: any[];
  components?: any[];
}

export interface UnifiedGenerationOptions {
  enforceCanvasConstraints?: boolean;
  includeLayoutLanguage?: boolean;
  includeGeometryExamples?: boolean;
  maxLayers?: number;
  maxPathsPerLayer?: number;
  preferredRegions?: RegionName[];
}

export interface UnifiedGenerationRequest {
  prompt: string;
  context?: NormalizationContext;
  grounding?: GroundingData;
  options?: UnifiedGenerationOptions;
}

export class LLMIntentNormalizer extends IntentNormalizer {
  private llmConfig: LLMConfig;
  private fallbackNormalizer: IntentNormalizer;

  constructor(config: LLMConfig) {
    super();
    this.llmConfig = config;
    this.fallbackNormalizer = new IntentNormalizer();
  }

  /**
   * Generate unified layered SVG document using enhanced prompting
   */
  async generateUnifiedLayeredSVG(
    request: UnifiedGenerationRequest
  ): Promise<UnifiedLayeredSVGDocument> {
    const options: Required<UnifiedGenerationOptions> = {
      enforceCanvasConstraints: true,
      includeLayoutLanguage: true,
      includeGeometryExamples: true,
      maxLayers: 10,
      maxPathsPerLayer: 20,
      preferredRegions: ["center", "top_center", "bottom_center"],
      ...request.options,
    };

    const systemPrompt = this.buildUnifiedSystemPrompt(
      request.grounding,
      options
    );
    const userPrompt = this.buildUnifiedUserPrompt(
      request.prompt,
      request.context,
      options
    );

    const response = await this.callLLM(systemPrompt, userPrompt);
    const document = this.parseUnifiedResponse(response);

    // Validate the generated document
    if (!this.validateUnifiedDocument(document)) {
      throw new Error(
        "Generated document does not meet unified layered SVG requirements"
      );
    }

    return document;
  }

  async normalize(
    prompt: string,
    context?: NormalizationContext,
    grounding?: GroundingData
  ): Promise<DesignIntent> {
    try {
      // Try LLM-powered normalization first
      return await this.normalizeWithLLM(prompt, context, grounding);
    } catch (error) {
      console.warn(
        "LLM normalization failed, falling back to rule-based:",
        error
      );
      // Fallback to rule-based normalization
      return this.fallbackNormalizer.normalize(prompt, context);
    }
  }

  private async normalizeWithLLM(
    prompt: string,
    context?: NormalizationContext,
    grounding?: GroundingData
  ): Promise<DesignIntent> {
    const systemPrompt = this.buildSystemPrompt(grounding);
    const userPrompt = this.buildUserPrompt(prompt, context);

    const response = await this.callLLM(systemPrompt, userPrompt);
    const intent = this.parseResponse(response);

    // Validate the generated intent
    const validationResult = DesignIntentSchema.safeParse(intent);
    if (!validationResult.success) {
      throw new Error(
        `Invalid design intent from LLM: ${validationResult.error.message}`
      );
    }

    return intent;
  }

  private buildSystemPrompt(grounding?: GroundingData): string {
    let systemPrompt = `You are an expert SVG design intent analyzer. Your task is to convert natural language prompts into structured design specifications for SVG generation.

You must respond with a valid JSON object that matches this exact schema:

{
  "style": {
    "palette": ["#color1", "#color2", ...], // Array of hex colors (1-10 colors)
    "strokeRules": {
      "strokeOnly": boolean, // true if only outlines/strokes should be used
      "minStrokeWidth": number, // minimum stroke width (0.1-10)
      "maxStrokeWidth": number, // maximum stroke width (0.1-20)
      "allowFill": boolean // whether fills are allowed
    },
    "density": "sparse" | "medium" | "dense", // visual complexity
    "symmetry": "none" | "horizontal" | "vertical" | "radial" // symmetry type
  },
  "motifs": ["motif1", "motif2", ...], // Array of design elements/shapes (max 20)
  "layout": {
    "sizes": [{"type": "string", "minSize": number, "maxSize": number, "aspectRatio"?: number}],
    "counts": [{"type": "string", "min": number, "max": number, "preferred": number}],
    "arrangement": "grid" | "organic" | "centered" | "scattered" // layout style
  },
  "constraints": {
    "strokeOnly": boolean, // must match strokeRules.strokeOnly
    "maxElements": number, // maximum number of elements (1-100)
    "requiredMotifs": ["motif1", ...] // motifs that must be present (max 10)
  }
}

Guidelines:
- Extract colors mentioned in the prompt or use appropriate defaults
- Identify visual style keywords (minimal, detailed, clean, complex, etc.)
- Recognize arrangement preferences (grid, scattered, centered, organic)
- Detect symmetry requirements
- List all mentioned shapes, objects, or design elements as motifs
- Set appropriate element counts based on complexity
- Ensure strokeOnly constraint matches strokeRules.strokeOnly`;

    // Add grounding context if available
    if (grounding?.stylePack) {
      systemPrompt += `\n\nAvailable style pack: ${JSON.stringify(grounding.stylePack)}`;
    }

    if (grounding?.motifs && grounding.motifs.length > 0) {
      systemPrompt += `\n\nAvailable motifs: ${grounding.motifs.map((m) => m.name || m.type).join(", ")}`;
    }

    if (grounding?.glossary && grounding.glossary.length > 0) {
      systemPrompt += `\n\nDesign glossary: ${grounding.glossary.map((g) => g.term + ": " + g.definition).join("; ")}`;
    }

    return systemPrompt;
  }

  private buildUserPrompt(
    prompt: string,
    context?: NormalizationContext
  ): string {
    let userPrompt = `Convert this prompt into structured design intent: "${prompt}"`;

    if (context?.defaultPalette) {
      userPrompt += `\n\nDefault palette: ${context.defaultPalette.join(", ")}`;
    }

    if (context?.defaultSize) {
      userPrompt += `\n\nTarget size: ${context.defaultSize.width}x${context.defaultSize.height}`;
    }

    userPrompt += "\n\nRespond with valid JSON only, no additional text.";

    return userPrompt;
  }

  private async callLLM(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    if (!this.llmConfig.apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.llmConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.llmConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: this.llmConfig.temperature,
        max_tokens: this.llmConfig.maxTokens,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from OpenAI API");
    }

    return data.choices[0].message.content;
  }

  private parseResponse(response: string): DesignIntent {
    try {
      const parsed = JSON.parse(response);

      // Ensure required fields are present with defaults
      const intent: DesignIntent = {
        style: {
          palette: parsed.style?.palette || ["#2563eb", "#16a34a", "#eab308"],
          strokeRules: {
            strokeOnly: parsed.style?.strokeRules?.strokeOnly || false,
            minStrokeWidth: parsed.style?.strokeRules?.minStrokeWidth || 1,
            maxStrokeWidth: parsed.style?.strokeRules?.maxStrokeWidth || 3,
            allowFill: parsed.style?.strokeRules?.allowFill !== false,
          },
          density: parsed.style?.density || "medium",
          symmetry: parsed.style?.symmetry || "none",
        },
        motifs: parsed.motifs || [],
        layout: {
          sizes: parsed.layout?.sizes || [
            { type: "default", minSize: 50, maxSize: 150 },
          ],
          counts: parsed.layout?.counts || [
            { type: "element", min: 3, max: 7, preferred: 5 },
          ],
          arrangement: parsed.layout?.arrangement || "centered",
        },
        constraints: {
          strokeOnly:
            parsed.constraints?.strokeOnly ||
            parsed.style?.strokeRules?.strokeOnly ||
            false,
          maxElements: parsed.constraints?.maxElements || 25,
          requiredMotifs: parsed.constraints?.requiredMotifs || [],
        },
      };

      return intent;
    } catch (error) {
      throw new Error(`Failed to parse LLM response: ${error}`);
    }
  }

  // Enhanced normalization with few-shot examples
  async normalizeWithFewShot(
    prompt: string,
    context?: NormalizationContext,
    grounding?: GroundingData
  ): Promise<DesignIntent> {
    const examples = this.getFewShotExamples(grounding);
    const systemPrompt = this.buildSystemPrompt(grounding) + "\n\n" + examples;
    const userPrompt = this.buildUserPrompt(prompt, context);

    const response = await this.callLLM(systemPrompt, userPrompt);
    const intent = this.parseResponse(response);

    const validationResult = DesignIntentSchema.safeParse(intent);
    if (!validationResult.success) {
      throw new Error(
        `Invalid design intent from LLM: ${validationResult.error.message}`
      );
    }

    return intent;
  }

  private getFewShotExamples(grounding?: GroundingData): string {
    let examples = "Here are some examples:\n\n";

    // Default examples
    examples += `Example 1:
Input: "blue circle with red outline"
Output: {
  "style": {
    "palette": ["#2563eb", "#dc2626"],
    "strokeRules": {"strokeOnly": false, "minStrokeWidth": 1, "maxStrokeWidth": 3, "allowFill": true},
    "density": "sparse",
    "symmetry": "none"
  },
  "motifs": ["circle"],
  "layout": {
    "sizes": [{"type": "circle", "minSize": 50, "maxSize": 100}],
    "counts": [{"type": "element", "min": 1, "max": 1, "preferred": 1}],
    "arrangement": "centered"
  },
  "constraints": {"strokeOnly": false, "maxElements": 5, "requiredMotifs": ["circle"]}
}

Example 2:
Input: "geometric pattern with triangles and squares in a grid"
Output: {
  "style": {
    "palette": ["#374151", "#6b7280"],
    "strokeRules": {"strokeOnly": false, "minStrokeWidth": 1, "maxStrokeWidth": 2, "allowFill": true},
    "density": "medium",
    "symmetry": "none"
  },
  "motifs": ["triangle", "square", "geometric"],
  "layout": {
    "sizes": [{"type": "shape", "minSize": 30, "maxSize": 60}],
    "counts": [{"type": "element", "min": 6, "max": 12, "preferred": 9}],
    "arrangement": "grid"
  },
  "constraints": {"strokeOnly": false, "maxElements": 15, "requiredMotifs": ["triangle", "square"]}
}`;

    // Add grounding-specific examples if available
    if (grounding?.fewshot && grounding.fewshot.length > 0) {
      examples += "\n\nAdditional examples from knowledge base:\n";
      grounding.fewshot.forEach((example, i) => {
        examples += `\nExample ${i + 3}:\n${JSON.stringify(example, null, 2)}`;
      });
    }

    return examples;
  }

  /**
   * Build system prompt for unified layered SVG generation
   */
  private buildUnifiedSystemPrompt(
    grounding?: GroundingData,
    options?: Required<UnifiedGenerationOptions>
  ): string {
    let systemPrompt = `You are an advanced SVG vector planner specialized in creating structured, semantically positioned designs using the unified layered approach.

CRITICAL CANVAS CONSTRAINTS (STRICTLY ENFORCED):
- Canvas: MUST be exactly 512x512 pixels (width: 512, height: 512)
- Coordinates: ALL coordinates MUST be absolute numbers between 0 and 512 (inclusive)
- Commands: ONLY M (move), L (line), C (cubic curve), Q (quadratic curve), Z (close)
- NO relative commands (m, l, c, q), NO transforms, NO percentages, NO viewBox scaling
- Schema: MUST match "unified-layered-1.0" exactly with no deviations
- Output: ONLY valid JSON object, no text, explanations, markdown, or code blocks

STRUCTURED JSON RESPONSE FORMAT:
- Response MUST be parseable JSON starting with { and ending with }
- All string values MUST be properly quoted
- All numeric coordinates MUST be integers or decimals between 0-512
- Color values MUST be valid hex codes (#RRGGBB) or "none"
- Boolean values MUST be true/false (lowercase)
- Arrays MUST use proper JSON array syntax

UNIFIED LAYERED APPROACH:
1. LAYER DECOMPOSITION: Break designs into logical layers (background, main, details, accents)
2. SEMANTIC POSITIONING: Use layout language regions and anchors for consistent placement
3. STRUCTURED PATHS: Each shape must be a path with absolute coordinates within [0,512]
4. LAYOUT INTEGRATION: Apply layout specifications at both layer and path levels
5. COORDINATE VALIDATION: Every coordinate must pass bounds checking (0 ≤ coord ≤ 512)

LAYOUT LANGUAGE SYSTEM:`;

    if (options?.includeLayoutLanguage) {
      systemPrompt += this.buildLayoutLanguageGuide();
    }

    systemPrompt += `

UNIFIED SCHEMA REQUIREMENTS:
{
  "version": "unified-layered-1.0",
  "canvas": {
    "width": 512,
    "height": 512,
    "aspectRatio": "1:1" | "4:3" | "16:9" | "3:2" | "2:3" | "9:16"
  },
  "layers": [
    {
      "id": "unique_layer_id",
      "label": "Human Readable Label",
      "layout": {
        "region": "center" | "top_left" | etc,
        "anchor": "center" | "top_left" | etc,
        "offset": [x_offset, y_offset], // optional, -1 to 1 range
        "zIndex": number // optional
      },
      "paths": [
        {
          "id": "unique_path_id",
          "style": {
            "fill": "#hex_color" | "none",
            "stroke": "#hex_color" | "none",
            "strokeWidth": number,
            "strokeLinecap": "butt" | "round" | "square",
            "strokeLinejoin": "miter" | "round" | "bevel",
            "opacity": number // 0-1
          },
          "commands": [
            {"cmd": "M", "coords": [x, y]},
            {"cmd": "L", "coords": [x, y]},
            {"cmd": "C", "coords": [x1, y1, x2, y2, x, y]},
            {"cmd": "Q", "coords": [x1, y1, x, y]},
            {"cmd": "Z", "coords": []}
          ],
          "layout": {
            "region": "region_name",
            "anchor": "anchor_point",
            "offset": [x_offset, y_offset],
            "size": {"relative": 0.8} | {"absolute": {"width": 100, "height": 100}},
            "repeat": {"type": "grid", "count": [3, 2], "spacing": 0.1}
          }
        }
      ]
    }
  ]
}`;

    if (options?.includeGeometryExamples) {
      systemPrompt += this.buildGeometryExamples();
    }

    if (options?.enforceCanvasConstraints) {
      systemPrompt += `

STRICT VALIDATION RULES (ZERO TOLERANCE):
- Coordinate Bounds: ALL coordinates MUST be numbers between 0 and 512 (inclusive)
- Canvas Size: width and height MUST be exactly 512 (no exceptions)
- Layer Limits: Maximum ${options.maxLayers} layers total
- Path Limits: Maximum ${options.maxPathsPerLayer} paths per layer
- Color Format: MUST be valid hex codes (#RRGGBB format) or "none" (no rgb(), hsl(), or named colors)
- Region Names: MUST be from predefined list: ${Object.keys(REGION_BOUNDS).join(", ")}
- Anchor Names: MUST be from predefined list: ${Object.keys(ANCHOR_OFFSETS).join(", ")}
- ID Uniqueness: All layer and path IDs MUST be unique strings (no duplicates)
- Command Types: ONLY M, L, C, Q, Z commands allowed (no other SVG commands)
- Coordinate Count: M/L need 2 coords, C needs 6 coords, Q needs 4 coords, Z needs 0 coords
- JSON Format: Response MUST be valid JSON (no trailing commas, proper quotes, valid syntax)

AUTOMATIC REJECTION CRITERIA:
- Any coordinate < 0 or > 512 → INVALID
- Any relative command (m, l, c, q) → INVALID  
- Any transform attribute → INVALID
- Any percentage values → INVALID
- Canvas size ≠ 512x512 → INVALID
- Invalid JSON syntax → INVALID
- Missing required fields → INVALID`;
    }

    // Add grounding context
    if (grounding?.stylePack) {
      systemPrompt += `\n\nStyle Pack: ${JSON.stringify(grounding.stylePack)}`;
    }

    if (grounding?.motifs && grounding.motifs.length > 0) {
      systemPrompt += `\n\nAvailable Motifs: ${grounding.motifs.map((m) => m.name || m.type).join(", ")}`;
    }

    systemPrompt += `\n\nReturn ONLY the JSON object. No additional text, explanations, or formatting.`;

    return systemPrompt;
  }

  /**
   * Build user prompt for unified layered SVG generation
   */
  private buildUnifiedUserPrompt(
    prompt: string,
    context?: NormalizationContext,
    options?: Required<UnifiedGenerationOptions>
  ): string {
    let userPrompt = `Create a unified layered SVG design: "${prompt}"

REQUIREMENTS:
1. Break design into logical layers with semantic meaning
2. Use semantic regions for positioning (${options?.preferredRegions?.join(", ") || "center, top_center, bottom_center"})
3. Generate absolute path commands within [0,512] canvas
4. Apply layout specifications for consistent positioning
5. Return unified-layered-1.0 JSON format only`;

    if (context?.defaultPalette) {
      userPrompt += `\n\nColor Palette: ${context.defaultPalette.join(", ")}`;
    }

    if (context?.defaultSize) {
      userPrompt += `\n\nCanvas: 512x512 (maintaining aspect ratio context)`;
    }

    userPrompt += `\n\nReturn ONLY the JSON object, no additional text.`;

    return userPrompt;
  }

  /**
   * Build layout language guide for system prompt
   */
  private buildLayoutLanguageGuide(): string {
    const regionNames = Object.keys(REGION_BOUNDS) as RegionName[];
    const anchorNames = Object.keys(ANCHOR_OFFSETS) as AnchorPoint[];

    return `

SEMANTIC REGIONS (use instead of calculating coordinates):
${regionNames
  .map((region) => {
    const bounds = REGION_BOUNDS[region];
    return `- ${region}: ${(bounds.width * 100).toFixed(0)}% × ${(bounds.height * 100).toFixed(0)}% area`;
  })
  .join("\n")}

ANCHOR POINTS (for precise positioning within regions):
${anchorNames
  .map((anchor) => {
    const offset = ANCHOR_OFFSETS[anchor];
    return `- ${anchor}: (${offset.x}, ${offset.y}) relative to region`;
  })
  .join("\n")}

POSITIONING EXAMPLES:
- Center main content: "region": "center", "anchor": "center"
- Top-left corner: "region": "top_left", "anchor": "top_left"
- Slight adjustment: "region": "center", "offset": [0.1, -0.1]
- Size control: "size": {"relative": 0.8} (80% of region)
- Pattern: "repeat": {"type": "grid", "count": [3, 2]}`;
  }

  /**
   * Build geometry examples for system prompt with layout language integration
   */
  private buildGeometryExamples(): string {
    return `

GEOMETRY EXAMPLES WITH LAYOUT LANGUAGE:

SMOOTH CURVES (use C commands for organic shapes with semantic positioning):
Rounded rectangle in center region:
{
  "id": "rounded_rect",
  "style": {"fill": "#3B82F6", "stroke": "#1E40AF", "strokeWidth": 2},
  "commands": [
    {"cmd": "M", "coords": [206, 216]},
    {"cmd": "C", "coords": [206, 211, 211, 206, 216, 206]},
    {"cmd": "L", "coords": [296, 206]},
    {"cmd": "C", "coords": [301, 206, 306, 211, 306, 216]},
    {"cmd": "L", "coords": [306, 296]},
    {"cmd": "C", "coords": [306, 301, 301, 306, 296, 306]},
    {"cmd": "L", "coords": [216, 306]},
    {"cmd": "C", "coords": [211, 306, 206, 301, 206, 296]},
    {"cmd": "Z", "coords": []}
  ],
  "layout": {"region": "center", "anchor": "center"}
}

SHARP GEOMETRY (use L commands for crisp edges with semantic positioning):
Triangle in top center:
{
  "id": "sharp_triangle",
  "style": {"fill": "#EF4444", "stroke": "#DC2626", "strokeWidth": 3},
  "commands": [
    {"cmd": "M", "coords": [256, 50]},
    {"cmd": "L", "coords": [350, 200]},
    {"cmd": "L", "coords": [162, 200]},
    {"cmd": "Z", "coords": []}
  ],
  "layout": {"region": "top_center", "anchor": "center"}
}

PERFECT CIRCLE (use C commands with layout language):
Circle in center with relative sizing:
{
  "id": "perfect_circle",
  "style": {"fill": "#10B981", "stroke": "#059669", "strokeWidth": 2},
  "commands": [
    {"cmd": "M", "coords": [256, 156]},
    {"cmd": "C", "coords": [311.23, 156, 356, 200.77, 356, 256]},
    {"cmd": "C", "coords": [356, 311.23, 311.23, 356, 256, 356]},
    {"cmd": "C", "coords": [200.77, 356, 156, 311.23, 156, 256]},
    {"cmd": "C", "coords": [156, 200.77, 200.77, 156, 256, 156]},
    {"cmd": "Z", "coords": []}
  ],
  "layout": {"region": "center", "anchor": "center", "size": {"relative": 0.8}}
}

COMPLEX ORGANIC SHAPE (smooth curves with layout positioning):
Leaf shape with semantic positioning:
{
  "id": "organic_leaf",
  "style": {"fill": "#22C55E", "stroke": "#16A34A", "strokeWidth": 2},
  "commands": [
    {"cmd": "M", "coords": [256, 150]},
    {"cmd": "C", "coords": [320, 160, 360, 200, 350, 260]},
    {"cmd": "C", "coords": [340, 320, 300, 350, 256, 340]},
    {"cmd": "C", "coords": [212, 350, 172, 320, 162, 260]},
    {"cmd": "C", "coords": [152, 200, 192, 160, 256, 150]},
    {"cmd": "Z", "coords": []}
  ],
  "layout": {"region": "center", "anchor": "center", "offset": [0, -0.1]}
}

GEOMETRIC PATTERN (sharp edges with repetition):
Grid of squares using layout language:
{
  "id": "pattern_square",
  "style": {"fill": "#8B5CF6", "stroke": "#7C3AED", "strokeWidth": 1},
  "commands": [
    {"cmd": "M", "coords": [240, 240]},
    {"cmd": "L", "coords": [272, 240]},
    {"cmd": "L", "coords": [272, 272]},
    {"cmd": "L", "coords": [240, 272]},
    {"cmd": "Z", "coords": []}
  ],
  "layout": {
    "region": "center", 
    "anchor": "center",
    "repeat": {"type": "grid", "count": [3, 3], "spacing": 0.15}
  }
}

COORDINATE VALIDATION EXAMPLES:
✓ VALID: {"cmd": "M", "coords": [0, 0]} (minimum bounds)
✓ VALID: {"cmd": "L", "coords": [512, 512]} (maximum bounds)
✓ VALID: {"cmd": "C", "coords": [100.5, 200.25, 300.75, 400.5, 256, 256]} (decimals OK)
✗ INVALID: {"cmd": "M", "coords": [-10, 50]} (negative coordinate)
✗ INVALID: {"cmd": "L", "coords": [600, 300]} (exceeds 512 limit)
✗ INVALID: {"cmd": "m", "coords": [10, 10]} (relative command)`;
  }

  /**
   * Parse unified layered SVG response
   */
  private parseUnifiedResponse(response: string): UnifiedLayeredSVGDocument {
    try {
      const parsed = JSON.parse(response);

      // Ensure required structure
      if (!parsed.version || parsed.version !== "unified-layered-1.0") {
        throw new Error("Invalid or missing version");
      }

      if (!parsed.canvas || !parsed.layers) {
        throw new Error("Missing required canvas or layers");
      }

      return parsed as UnifiedLayeredSVGDocument;
    } catch (error) {
      throw new Error(`Failed to parse unified layered SVG response: ${error}`);
    }
  }

  /**
   * Validate unified layered SVG document with strict constraint enforcement
   */
  private validateUnifiedDocument(
    document: UnifiedLayeredSVGDocument
  ): boolean {
    try {
      // Check version
      if (document.version !== "unified-layered-1.0") {
        console.warn("Invalid version:", document.version);
        return false;
      }

      // Check canvas constraints (strict 512x512)
      if (document.canvas.width !== 512 || document.canvas.height !== 512) {
        console.warn(
          "Invalid canvas size:",
          document.canvas.width,
          "x",
          document.canvas.height
        );
        return false;
      }

      // Check layers exist
      if (!document.layers || document.layers.length === 0) {
        console.warn("No layers found");
        return false;
      }

      // Validate each layer
      const layerIds = new Set<string>();
      for (const layer of document.layers) {
        if (!layer.id || !layer.label || !layer.paths) {
          console.warn("Invalid layer structure:", layer.id);
          return false;
        }

        // Check for duplicate layer IDs
        if (layerIds.has(layer.id)) {
          console.warn("Duplicate layer ID:", layer.id);
          return false;
        }
        layerIds.add(layer.id);

        // Validate layout specifications
        if (layer.layout) {
          if (
            layer.layout.region &&
            !Object.keys(REGION_BOUNDS).includes(layer.layout.region)
          ) {
            console.warn("Invalid region name:", layer.layout.region);
            return false;
          }
          if (
            layer.layout.anchor &&
            !Object.keys(ANCHOR_OFFSETS).includes(layer.layout.anchor)
          ) {
            console.warn("Invalid anchor name:", layer.layout.anchor);
            return false;
          }
        }

        // Validate paths
        const pathIds = new Set<string>();
        for (const path of layer.paths) {
          if (!path.id || !path.style || !path.commands) {
            console.warn("Invalid path structure:", path.id);
            return false;
          }

          // Check for duplicate path IDs
          if (pathIds.has(path.id)) {
            console.warn("Duplicate path ID:", path.id);
            return false;
          }
          pathIds.add(path.id);

          // Validate style colors
          if (
            path.style.fill &&
            path.style.fill !== "none" &&
            !this.isValidHexColor(path.style.fill)
          ) {
            console.warn("Invalid fill color:", path.style.fill);
            return false;
          }
          if (
            path.style.stroke &&
            path.style.stroke !== "none" &&
            !this.isValidHexColor(path.style.stroke)
          ) {
            console.warn("Invalid stroke color:", path.style.stroke);
            return false;
          }

          // Validate path layout specifications
          if (path.layout) {
            if (
              path.layout.region &&
              !Object.keys(REGION_BOUNDS).includes(path.layout.region)
            ) {
              console.warn("Invalid path region name:", path.layout.region);
              return false;
            }
            if (
              path.layout.anchor &&
              !Object.keys(ANCHOR_OFFSETS).includes(path.layout.anchor)
            ) {
              console.warn("Invalid path anchor name:", path.layout.anchor);
              return false;
            }
          }

          // Validate commands and coordinates (strict bounds checking)
          for (const command of path.commands) {
            if (!["M", "L", "C", "Q", "Z"].includes(command.cmd)) {
              console.warn("Invalid command type:", command.cmd);
              return false;
            }

            // Validate coordinate count for each command type
            const expectedCoordCount = this.getExpectedCoordinateCount(
              command.cmd
            );
            if (command.coords.length !== expectedCoordCount) {
              console.warn(
                `Invalid coordinate count for ${command.cmd}: expected ${expectedCoordCount}, got ${command.coords.length}`
              );
              return false;
            }

            // Validate coordinate bounds (0-512 inclusive)
            if (command.cmd !== "Z") {
              for (let i = 0; i < command.coords.length; i++) {
                const coord = command.coords[i];
                if (typeof coord !== "number" || coord < 0 || coord > 512) {
                  console.warn(
                    `Coordinate out of bounds: ${coord} (must be 0-512)`
                  );
                  return false;
                }
              }
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.warn("Validation error:", error);
      return false;
    }
  }

  /**
   * Validate hex color format
   */
  private isValidHexColor(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  }

  /**
   * Get expected coordinate count for SVG path command
   */
  private getExpectedCoordinateCount(cmd: string): number {
    switch (cmd) {
      case "M":
      case "L":
        return 2;
      case "C":
        return 6;
      case "Q":
        return 4;
      case "Z":
        return 0;
      default:
        throw new Error(`Unknown command: ${cmd}`);
    }
  }

  /**
   * Enhanced validation with detailed error reporting
   */
  validateUnifiedDocumentWithErrors(document: UnifiedLayeredSVGDocument): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      // Version check
      if (document.version !== "unified-layered-1.0") {
        errors.push(
          `Invalid version: ${document.version} (expected: unified-layered-1.0)`
        );
      }

      // Canvas constraints
      if (document.canvas.width !== 512) {
        errors.push(
          `Invalid canvas width: ${document.canvas.width} (must be 512)`
        );
      }
      if (document.canvas.height !== 512) {
        errors.push(
          `Invalid canvas height: ${document.canvas.height} (must be 512)`
        );
      }

      // Layers validation
      if (!document.layers || document.layers.length === 0) {
        errors.push("No layers found (at least one layer required)");
        return { valid: false, errors };
      }

      const layerIds = new Set<string>();
      const allPathIds = new Set<string>();

      for (
        let layerIndex = 0;
        layerIndex < document.layers.length;
        layerIndex++
      ) {
        const layer = document.layers[layerIndex];
        const layerPrefix = `Layer ${layerIndex + 1} (${layer.id || "unnamed"})`;

        // Layer structure validation
        if (!layer.id) {
          errors.push(`${layerPrefix}: Missing layer ID`);
        } else if (layerIds.has(layer.id)) {
          errors.push(`${layerPrefix}: Duplicate layer ID "${layer.id}"`);
        } else {
          layerIds.add(layer.id);
        }

        if (!layer.label) {
          errors.push(`${layerPrefix}: Missing layer label`);
        }

        if (!layer.paths || layer.paths.length === 0) {
          errors.push(
            `${layerPrefix}: No paths found (at least one path required)`
          );
          continue;
        }

        // Layer layout validation
        if (layer.layout) {
          if (
            layer.layout.region &&
            !Object.keys(REGION_BOUNDS).includes(layer.layout.region)
          ) {
            errors.push(
              `${layerPrefix}: Invalid region "${layer.layout.region}"`
            );
          }
          if (
            layer.layout.anchor &&
            !Object.keys(ANCHOR_OFFSETS).includes(layer.layout.anchor)
          ) {
            errors.push(
              `${layerPrefix}: Invalid anchor "${layer.layout.anchor}"`
            );
          }
        }

        // Path validation
        for (let pathIndex = 0; pathIndex < layer.paths.length; pathIndex++) {
          const path = layer.paths[pathIndex];
          const pathPrefix = `${layerPrefix} Path ${pathIndex + 1} (${path.id || "unnamed"})`;

          if (!path.id) {
            errors.push(`${pathPrefix}: Missing path ID`);
          } else if (allPathIds.has(path.id)) {
            errors.push(`${pathPrefix}: Duplicate path ID "${path.id}"`);
          } else {
            allPathIds.add(path.id);
          }

          if (!path.style) {
            errors.push(`${pathPrefix}: Missing style object`);
          } else {
            if (
              path.style.fill &&
              path.style.fill !== "none" &&
              !this.isValidHexColor(path.style.fill)
            ) {
              errors.push(
                `${pathPrefix}: Invalid fill color "${path.style.fill}" (use #RRGGBB format)`
              );
            }
            if (
              path.style.stroke &&
              path.style.stroke !== "none" &&
              !this.isValidHexColor(path.style.stroke)
            ) {
              errors.push(
                `${pathPrefix}: Invalid stroke color "${path.style.stroke}" (use #RRGGBB format)`
              );
            }
          }

          if (!path.commands || path.commands.length === 0) {
            errors.push(`${pathPrefix}: No commands found`);
            continue;
          }

          // Path layout validation
          if (path.layout) {
            if (
              path.layout.region &&
              !Object.keys(REGION_BOUNDS).includes(path.layout.region)
            ) {
              errors.push(
                `${pathPrefix}: Invalid region "${path.layout.region}"`
              );
            }
            if (
              path.layout.anchor &&
              !Object.keys(ANCHOR_OFFSETS).includes(path.layout.anchor)
            ) {
              errors.push(
                `${pathPrefix}: Invalid anchor "${path.layout.anchor}"`
              );
            }
          }

          // Command validation
          for (let cmdIndex = 0; cmdIndex < path.commands.length; cmdIndex++) {
            const command = path.commands[cmdIndex];
            const cmdPrefix = `${pathPrefix} Command ${cmdIndex + 1}`;

            if (!["M", "L", "C", "Q", "Z"].includes(command.cmd)) {
              errors.push(
                `${cmdPrefix}: Invalid command "${command.cmd}" (use M, L, C, Q, or Z)`
              );
              continue;
            }

            const expectedCount = this.getExpectedCoordinateCount(command.cmd);
            if (command.coords.length !== expectedCount) {
              errors.push(
                `${cmdPrefix}: ${command.cmd} command needs ${expectedCount} coordinates, got ${command.coords.length}`
              );
            }

            // Coordinate bounds validation
            if (command.cmd !== "Z") {
              for (
                let coordIndex = 0;
                coordIndex < command.coords.length;
                coordIndex++
              ) {
                const coord = command.coords[coordIndex];
                if (typeof coord !== "number") {
                  errors.push(
                    `${cmdPrefix}: Coordinate ${coordIndex + 1} is not a number: ${coord}`
                  );
                } else if (coord < 0 || coord > 512) {
                  errors.push(
                    `${cmdPrefix}: Coordinate ${coordIndex + 1} out of bounds: ${coord} (must be 0-512)`
                  );
                }
              }
            }
          }
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Validation exception: ${error}`);
      return { valid: false, errors };
    }
  }

  /**
   * Enhanced normalization with unified layered SVG few-shot examples
   */
  async normalizeWithUnifiedExamples(
    prompt: string,
    context?: NormalizationContext,
    grounding?: GroundingData
  ): Promise<DesignIntent> {
    const examples = this.getUnifiedFewShotExamples(grounding);
    const systemPrompt = this.buildSystemPrompt(grounding) + "\n\n" + examples;
    const userPrompt = this.buildUserPrompt(prompt, context);

    const response = await this.callLLM(systemPrompt, userPrompt);
    const intent = this.parseResponse(response);

    const validationResult = DesignIntentSchema.safeParse(intent);
    if (!validationResult.success) {
      throw new Error(
        `Invalid design intent from LLM: ${validationResult.error.message}`
      );
    }

    return intent;
  }

  /**
   * Get few-shot examples for unified layered SVG generation with layout language
   */
  private getUnifiedFewShotExamples(grounding?: GroundingData): string {
    let examples = "UNIFIED LAYERED SVG EXAMPLES WITH LAYOUT LANGUAGE:\n\n";

    examples += `Example 1 - Sharp Geometric Shape with Semantic Positioning:
Input: "blue square in the center"
Output: {
  "version": "unified-layered-1.0",
  "canvas": {"width": 512, "height": 512, "aspectRatio": "1:1"},
  "layers": [{
    "id": "main_shape",
    "label": "Main Square",
    "layout": {"region": "center", "anchor": "center", "zIndex": 1},
    "paths": [{
      "id": "blue_square",
      "style": {"fill": "#3B82F6", "stroke": "#1E40AF", "strokeWidth": 2},
      "commands": [
        {"cmd": "M", "coords": [206, 206]},
        {"cmd": "L", "coords": [306, 206]},
        {"cmd": "L", "coords": [306, 306]},
        {"cmd": "L", "coords": [206, 306]},
        {"cmd": "Z", "coords": []}
      ],
      "layout": {"region": "center", "anchor": "center", "size": {"relative": 0.4}}
    }]
  }]
}

Example 2 - Smooth Organic Shape with Layout Language:
Input: "green leaf with smooth curves"
Output: {
  "version": "unified-layered-1.0",
  "canvas": {"width": 512, "height": 512, "aspectRatio": "1:1"},
  "layers": [{
    "id": "organic_layer",
    "label": "Leaf Shape",
    "layout": {"region": "center", "anchor": "center", "zIndex": 1},
    "paths": [{
      "id": "smooth_leaf",
      "style": {"fill": "#10B981", "stroke": "#047857", "strokeWidth": 2},
      "commands": [
        {"cmd": "M", "coords": [256, 150]},
        {"cmd": "C", "coords": [320, 160, 360, 200, 350, 260]},
        {"cmd": "C", "coords": [340, 320, 300, 350, 256, 340]},
        {"cmd": "C", "coords": [212, 350, 172, 320, 162, 260]},
        {"cmd": "C", "coords": [152, 200, 192, 160, 256, 150]},
        {"cmd": "Z", "coords": []}
      ],
      "layout": {"region": "center", "anchor": "center", "size": {"relative": 0.6}}
    }]
  }]
}

Example 3 - Multi-Layer Design with Layout Specifications:
Input: "house with red roof and blue walls"
Output: {
  "version": "unified-layered-1.0",
  "canvas": {"width": 512, "height": 512, "aspectRatio": "1:1"},
  "layers": [
    {
      "id": "structure",
      "label": "House Walls",
      "layout": {"region": "center", "anchor": "bottom_center", "zIndex": 1},
      "paths": [{
        "id": "walls",
        "style": {"fill": "#3B82F6", "stroke": "#1E40AF", "strokeWidth": 3},
        "commands": [
          {"cmd": "M", "coords": [156, 300]},
          {"cmd": "L", "coords": [356, 300]},
          {"cmd": "L", "coords": [356, 450]},
          {"cmd": "L", "coords": [156, 450]},
          {"cmd": "Z", "coords": []}
        ],
        "layout": {"region": "center", "anchor": "bottom_center"}
      }]
    },
    {
      "id": "roof",
      "label": "House Roof",
      "layout": {"region": "center", "anchor": "center", "offset": [0, -0.3], "zIndex": 2},
      "paths": [{
        "id": "roof_triangle",
        "style": {"fill": "#EF4444", "stroke": "#DC2626", "strokeWidth": 3},
        "commands": [
          {"cmd": "M", "coords": [156, 300]},
          {"cmd": "L", "coords": [256, 180]},
          {"cmd": "L", "coords": [356, 300]},
          {"cmd": "Z", "coords": []}
        ],
        "layout": {"region": "top_center", "anchor": "bottom_center"}
      }]
    }
  ]
}

Example 4 - Pattern with Repetition and Layout Language:
Input: "grid of small circles"
Output: {
  "version": "unified-layered-1.0",
  "canvas": {"width": 512, "height": 512, "aspectRatio": "1:1"},
  "layers": [{
    "id": "pattern_layer",
    "label": "Circle Pattern",
    "layout": {"region": "center", "anchor": "center", "zIndex": 1},
    "paths": [{
      "id": "circle_unit",
      "style": {"fill": "#8B5CF6", "stroke": "#7C3AED", "strokeWidth": 1},
      "commands": [
        {"cmd": "M", "coords": [256, 236]},
        {"cmd": "C", "coords": [267.05, 236, 276, 244.95, 276, 256]},
        {"cmd": "C", "coords": [276, 267.05, 267.05, 276, 256, 276]},
        {"cmd": "C", "coords": [244.95, 276, 236, 267.05, 236, 256]},
        {"cmd": "C", "coords": [236, 244.95, 244.95, 236, 256, 236]},
        {"cmd": "Z", "coords": []}
      ],
      "layout": {
        "region": "center", 
        "anchor": "center",
        "repeat": {"type": "grid", "count": [4, 4], "spacing": 0.2}
      }
    }]
  }]
}

LAYOUT LANGUAGE DEMONSTRATION:
- Sharp geometry: Use L commands for crisp edges (squares, triangles, polygons)
- Smooth geometry: Use C commands for organic curves (circles, leaves, rounded shapes)
- Semantic positioning: Use regions (center, top_left, etc.) instead of calculating pixels
- Anchor points: Use anchors (center, top_left, etc.) for precise alignment within regions
- Relative sizing: Use size.relative (0.0-1.0) for proportional scaling within regions
- Pattern repetition: Use repeat specifications for grids and radial patterns
- Layer organization: Separate logical parts (background, main, details) with proper z-indexing`;

    // Add grounding-specific examples if available
    if (grounding?.fewshot && grounding.fewshot.length > 0) {
      examples += "\n\nAdditional examples from knowledge base:\n";
      grounding.fewshot.forEach((example, i) => {
        examples += `\nExample ${i + 5}:\n${JSON.stringify(example, null, 2)}`;
      });
    }

    return examples;
  }
}
