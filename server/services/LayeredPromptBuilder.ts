/**
 * LayeredPromptBuilder - Builds prompts for unified layered SVG generation with layout language integration
 * Creates system and user prompts that instruct AI models to generate structured, semantically positioned designs
 */

import {
  UnifiedLayeredSVGDocument,
  RegionName,
  AnchorPoint,
  AspectRatio,
  REGION_BOUNDS,
  ANCHOR_OFFSETS,
} from "../types/unified-layered";
import { GenerationRequest } from "../types";

export interface PromptTemplate {
  name: string;
  description: string;
  systemPromptAdditions: string;
  exampleDocument: UnifiedLayeredSVGDocument;
  preferredRegions?: RegionName[];
  suggestedAnchors?: AnchorPoint[];
}

export interface LayeredPromptOptions {
  includeSchemaExample?: boolean;
  includeLayoutExamples?: boolean;
  includeRegionGuide?: boolean;
  includeAnchorGuide?: boolean;
  enforceConstraints?: boolean;
  maxLayers?: number;
  maxPathsPerLayer?: number;
}

export interface OpenAIPrompt {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
}

export class LayeredPromptBuilder {
  private options: Required<LayeredPromptOptions>;
  private templates: Map<string, PromptTemplate>;

  constructor(options: LayeredPromptOptions = {}) {
    this.options = {
      includeSchemaExample: true,
      includeLayoutExamples: true,
      includeRegionGuide: true,
      includeAnchorGuide: true,
      enforceConstraints: true,
      maxLayers: 10,
      maxPathsPerLayer: 20,
      ...options,
    };

    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Build a complete OpenAI prompt for unified layered SVG generation
   */
  buildUnifiedPrompt(
    request: GenerationRequest,
    templateName?: string
  ): OpenAIPrompt {
    const systemPrompt = this.buildSystemPrompt(templateName);
    const userPrompt = this.buildUserPrompt(request.prompt, request);

    return {
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    };
  }

  /**
   * Build system prompt with unified layered SVG instructions
   */
  buildSystemPrompt(templateName?: string): string {
    let systemPrompt = `You are an advanced SVG vector planner that creates structured, semantically positioned designs using the unified layered approach.

CORE PRINCIPLES:
- Break designs into logical layers with clear semantic meaning
- Use semantic regions for positioning instead of calculating pixel coordinates
- Generate only absolute path commands (M, L, C, Q, Z) within [0,512] canvas
- Return ONLY JSON matching the "unified-layered-1.0" schema
- Focus on clean, organized structure that enables future editing

UNIFIED LAYERED APPROACH:
1. LAYER DECOMPOSITION: Separate logical parts (background, main content, details, accents)
2. SEMANTIC POSITIONING: Use layout language regions and anchors for consistent placement
3. STRUCTURED PATHS: Each shape must be a path with absolute coordinates
4. LAYOUT INTEGRATION: Apply layout specifications at both layer and path levels

LAYOUT LANGUAGE SYSTEM:`;

    if (this.options.includeRegionGuide) {
      systemPrompt += this.buildRegionGuide();
    }

    if (this.options.includeAnchorGuide) {
      systemPrompt += this.buildAnchorGuide();
    }

    systemPrompt += `

UNIFIED SCHEMA REQUIREMENTS:
- Version: "unified-layered-1.0"
- Canvas: Fixed 512x512 with appropriate aspect ratio
- Layers: Array of logical layer objects with semantic organization
- Paths: Array of path objects with absolute coordinates and optional layout specs
- Layout: Optional layout specifications for positioning and sizing`;

    if (this.options.includeSchemaExample) {
      systemPrompt += this.buildSchemaExample();
    }

    if (this.options.includeLayoutExamples) {
      systemPrompt += this.buildLayoutExamples();
    }

    if (this.options.enforceConstraints) {
      systemPrompt += this.buildConstraints();
    }

    // Add template-specific instructions
    if (templateName && this.templates.has(templateName)) {
      const template = this.templates.get(templateName)!;
      systemPrompt += `\n\nTEMPLATE GUIDANCE (${template.name}):\n${template.description}\n${template.systemPromptAdditions}`;
    }

    systemPrompt += `\n\nIMPORTANT: Return ONLY the JSON object, no additional text, explanations, or markdown formatting.`;

    return systemPrompt;
  }

  /**
   * Build user prompt with request context
   */
  buildUserPrompt(prompt: string, request: GenerationRequest): string {
    let userPrompt = `Create a unified layered SVG design: "${prompt}"

REQUIREMENTS:
1. Break the design into logical layers with semantic meaning
2. Use semantic regions for positioning instead of manual coordinates  
3. Organize paths within appropriate layers
4. Use layout specifications for consistent positioning
5. Ensure all coordinates are within [0,512] range
6. Return only the unified-layered-1.0 JSON format`;

    // Add context from request
    if (request.size) {
      const aspectRatio = this.determineAspectRatio(
        request.size.width,
        request.size.height
      );
      userPrompt += `\n\nCanvas: 512x512 (aspect ratio: ${aspectRatio})`;
    }

    if (request.palette && request.palette.length > 0) {
      userPrompt += `\nColor palette: ${request.palette.join(", ")}`;
    }

    if (request.seed) {
      userPrompt += `\nSeed: ${request.seed} (use for consistent randomization)`;
    }

    userPrompt += `\n\nReturn ONLY the JSON object, no additional text.`;

    return userPrompt;
  }

  /**
   * Add a custom prompt template
   */
  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.name, template);
  }

  /**
   * Get available template names
   */
  getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Get template by name
   */
  getTemplate(name: string): PromptTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * Build region guide for system prompt
   */
  private buildRegionGuide(): string {
    const regionNames = Object.keys(REGION_BOUNDS) as RegionName[];

    return `

SEMANTIC REGIONS:
Available regions for positioning:
${regionNames
  .map((region) => {
    const bounds = REGION_BOUNDS[region];
    return `- ${region}: ${(bounds.width * 100).toFixed(0)}% × ${(bounds.height * 100).toFixed(0)}% area`;
  })
  .join("\n")}

REGION USAGE:
- Use "center" for main focal elements
- Use "top_*" regions for headers, titles, or sky elements  
- Use "bottom_*" regions for footers, ground, or base elements
- Use "full_canvas" for backgrounds or full-size elements
- Combine regions logically (e.g., house body in center, roof in top_center)`;
  }

  /**
   * Build anchor guide for system prompt
   */
  private buildAnchorGuide(): string {
    const anchorNames = Object.keys(ANCHOR_OFFSETS) as AnchorPoint[];

    return `

ANCHOR POINTS:
Available anchors for precise positioning:
${anchorNames
  .map((anchor) => {
    const offset = ANCHOR_OFFSETS[anchor];
    return `- ${anchor}: (${offset.x}, ${offset.y}) relative to region`;
  })
  .join("\n")}

ANCHOR USAGE:
- "center": Default, centers element in region
- "top_left", "top_right", etc.: Align element edges to region corners
- "top_center", "bottom_center": Align to region edges
- Use anchors to create consistent alignment across layers`;
  }

  /**
   * Build schema example for system prompt
   */
  private buildSchemaExample(): string {
    const example = this.getSchemaExample();

    return `

SCHEMA EXAMPLE:
${JSON.stringify(example, null, 2)}`;
  }

  /**
   * Build layout examples for system prompt
   */
  private buildLayoutExamples(): string {
    return `

LAYOUT EXAMPLES:
1. Center a shape: "region": "center", "anchor": "center"
2. Top-left corner: "region": "top_left", "anchor": "top_left"  
3. Slight offset: "region": "center", "anchor": "center", "offset": [0.1, -0.1]
4. Size control: "size": {"relative": 0.8} (80% of region)
5. Repetition: "repeat": {"type": "grid", "count": [3, 2], "spacing": 0.1}

POSITIONING STRATEGY:
- Start with semantic regions (where should this logically go?)
- Add anchors for precise alignment (how should it align within the region?)
- Use offsets for fine-tuning (small adjustments from anchor point)
- Apply sizing for scale control (how big relative to region?)
- Use repetition for patterns (multiple instances with spacing)`;
  }

  /**
   * Build constraints for system prompt
   */
  private buildConstraints(): string {
    return `

STRICT CONSTRAINTS:
- Canvas: MUST be 512x512 pixels
- Coordinates: MUST be absolute values within [0,512] range
- Commands: ONLY M, L, C, Q, Z (no relative commands)
- Layers: Maximum ${this.options.maxLayers} layers
- Paths per layer: Maximum ${this.options.maxPathsPerLayer} paths
- Schema: MUST match "unified-layered-1.0" exactly
- Output: ONLY JSON, no text, explanations, or formatting

VALIDATION REQUIREMENTS:
- All coordinates must be numbers within [0,512]
- All colors must be valid hex codes (e.g., "#FF0000")
- All region names must be from the predefined list
- All anchor names must be from the predefined list
- Layer IDs must be unique strings
- Path IDs must be unique within their layer`;
  }

  /**
   * Get schema example document
   */
  private getSchemaExample(): UnifiedLayeredSVGDocument {
    return {
      version: "unified-layered-1.0",
      canvas: {
        width: 512,
        height: 512,
        aspectRatio: "1:1",
      },
      layers: [
        {
          id: "background",
          label: "Background Layer",
          layout: {
            region: "full_canvas",
            anchor: "center",
          },
          paths: [
            {
              id: "bg_rect",
              style: {
                fill: "#F0F9FF",
                stroke: "none",
              },
              commands: [
                { cmd: "M", coords: [0, 0] },
                { cmd: "L", coords: [512, 0] },
                { cmd: "L", coords: [512, 512] },
                { cmd: "L", coords: [0, 512] },
                { cmd: "Z", coords: [] },
              ],
            },
          ],
        },
        {
          id: "main_content",
          label: "Main Content",
          layout: {
            region: "center",
            anchor: "center",
          },
          paths: [
            {
              id: "main_shape",
              style: {
                fill: "#3B82F6",
                stroke: "#1E40AF",
                strokeWidth: 3,
              },
              commands: [
                { cmd: "M", coords: [200, 200] },
                { cmd: "L", coords: [312, 200] },
                { cmd: "L", coords: [312, 312] },
                { cmd: "L", coords: [200, 312] },
                { cmd: "Z", coords: [] },
              ],
              layout: {
                region: "center",
                anchor: "center",
              },
            },
          ],
        },
      ],
    };
  }

  /**
   * Initialize built-in prompt templates
   */
  private initializeTemplates(): void {
    // Simple geometric template
    this.templates.set("geometric", {
      name: "Geometric Shapes",
      description: "Focus on clean geometric forms with minimal layers",
      systemPromptAdditions: `
- Prefer simple geometric shapes (rectangles, circles, triangles)
- Use 2-4 layers maximum for clean organization
- Apply consistent spacing and alignment
- Use solid colors with minimal gradients`,
      exampleDocument: this.createGeometricExample(),
      preferredRegions: ["center", "top_center", "bottom_center"],
      suggestedAnchors: ["center", "top_center", "bottom_center"],
    });

    // Organic/natural template
    this.templates.set("organic", {
      name: "Organic Forms",
      description: "Focus on natural, flowing shapes with smooth curves",
      systemPromptAdditions: `
- Use curved paths (C, Q commands) for organic shapes
- Create flowing, natural compositions
- Layer elements to build depth and complexity
- Use earth tones and natural color palettes`,
      exampleDocument: this.createOrganicExample(),
      preferredRegions: ["center", "full_canvas", "top_left", "bottom_right"],
      suggestedAnchors: ["center", "top_left", "bottom_right"],
    });

    // Icon template
    this.templates.set("icon", {
      name: "Icon Design",
      description:
        "Create clean, recognizable icons with clear visual hierarchy",
      systemPromptAdditions: `
- Focus on clarity and recognizability at small sizes
- Use 1-3 layers for simple, clean structure
- Prefer center region for main icon elements
- Use consistent stroke weights and minimal detail`,
      exampleDocument: this.createIconExample(),
      preferredRegions: ["center"],
      suggestedAnchors: ["center"],
    });
  }

  /**
   * Create geometric template example
   */
  private createGeometricExample(): UnifiedLayeredSVGDocument {
    return {
      version: "unified-layered-1.0",
      canvas: { width: 512, height: 512, aspectRatio: "1:1" },
      layers: [
        {
          id: "base",
          label: "Base Shape",
          paths: [
            {
              id: "square",
              style: { fill: "#E5E7EB", stroke: "#374151", strokeWidth: 2 },
              commands: [
                { cmd: "M", coords: [156, 156] },
                { cmd: "L", coords: [356, 156] },
                { cmd: "L", coords: [356, 356] },
                { cmd: "L", coords: [156, 356] },
                { cmd: "Z", coords: [] },
              ],
              layout: { region: "center", anchor: "center" },
            },
          ],
        },
      ],
    };
  }

  /**
   * Create organic template example
   */
  private createOrganicExample(): UnifiedLayeredSVGDocument {
    return {
      version: "unified-layered-1.0",
      canvas: { width: 512, height: 512, aspectRatio: "1:1" },
      layers: [
        {
          id: "organic_shape",
          label: "Organic Form",
          paths: [
            {
              id: "curve",
              style: { fill: "#10B981", stroke: "#047857", strokeWidth: 2 },
              commands: [
                { cmd: "M", coords: [256, 100] },
                { cmd: "C", coords: [350, 150, 400, 250, 350, 350] },
                { cmd: "C", coords: [300, 400, 200, 400, 150, 350] },
                { cmd: "C", coords: [100, 300, 100, 200, 150, 150] },
                { cmd: "C", coords: [200, 100, 220, 100, 256, 100] },
                { cmd: "Z", coords: [] },
              ],
              layout: { region: "center", anchor: "center" },
            },
          ],
        },
      ],
    };
  }

  /**
   * Create icon template example
   */
  private createIconExample(): UnifiedLayeredSVGDocument {
    return {
      version: "unified-layered-1.0",
      canvas: { width: 512, height: 512, aspectRatio: "1:1" },
      layers: [
        {
          id: "icon",
          label: "Icon Shape",
          paths: [
            {
              id: "icon_circle",
              style: { fill: "#3B82F6", stroke: "#1E40AF", strokeWidth: 4 },
              commands: [
                { cmd: "M", coords: [256, 156] },
                { cmd: "C", coords: [311, 156, 356, 201, 356, 256] },
                { cmd: "C", coords: [356, 311, 311, 356, 256, 356] },
                { cmd: "C", coords: [201, 356, 156, 311, 156, 256] },
                { cmd: "C", coords: [156, 201, 201, 156, 256, 156] },
                { cmd: "Z", coords: [] },
              ],
              layout: { region: "center", anchor: "center" },
            },
          ],
        },
      ],
    };
  }

  /**
   * Determine aspect ratio from dimensions
   */
  private determineAspectRatio(width: number, height: number): AspectRatio {
    const ratio = width / height;

    if (Math.abs(ratio - 1) < 0.1) return "1:1";
    if (Math.abs(ratio - 4 / 3) < 0.1) return "4:3";
    if (Math.abs(ratio - 16 / 9) < 0.1) return "16:9";
    if (Math.abs(ratio - 3 / 2) < 0.1) return "3:2";
    if (Math.abs(ratio - 2 / 3) < 0.1) return "2:3";
    if (Math.abs(ratio - 9 / 16) < 0.1) return "9:16";

    return "1:1"; // Default fallback
  }
}
