/**
 * UnifiedPromptBuilder - Builds optimized prompts for OpenAI that include both
 * layout language and layered generation instructions
 */

import {
  GenerationRequest,
  UnifiedLayeredSVGDocument,
  AspectRatio,
  REGION_BOUNDS,
  ANCHOR_OFFSETS,
} from "../types/unified-layered";

export interface OpenAIPrompt {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
}

export class UnifiedPromptBuilder {
  /**
   * Build unified prompt with layout and layer context
   */
  buildUnifiedPrompt(request: GenerationRequest): OpenAIPrompt {
    const systemPrompt = this.buildSystemPrompt(request.aspectRatio);
    const userPrompt = this.buildUserPrompt(request.prompt, request.context);

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
   * Build system prompt with unified instructions
   */
  private buildSystemPrompt(aspectRatio: AspectRatio): string {
    const canvasDimensions = this.getCanvasDimensions(aspectRatio);
    const regionList = Object.keys(REGION_BOUNDS).join(", ");
    const anchorList = Object.keys(ANCHOR_OFFSETS).join(", ");

    return `You are an advanced SVG vector planner that creates structured, semantically positioned designs using the unified layered approach.

UNIFIED APPROACH OVERVIEW:
- Break objects into logical layers (structure, details, accents, etc.)
- Use semantic regions for positioning instead of calculating pixel coordinates
- Each shape must be a path with M, L, C, Q, Z commands only
- All coordinates must be absolute within [0,${canvasDimensions.width}] x [0,${canvasDimensions.height}] canvas
- Return ONLY JSON matching the "unified-layered-1.0" schema

CANVAS SPECIFICATIONS:
- Canvas size: ${canvasDimensions.width}x${canvasDimensions.height} pixels
- Aspect ratio: ${aspectRatio}
- Coordinate system: (0,0) at top-left, (${canvasDimensions.width},${canvasDimensions.height}) at bottom-right
- All coordinates must be within canvas bounds

LAYOUT LANGUAGE SYSTEM:
Use semantic regions instead of manual coordinate calculations:

Available Regions: ${regionList}

Region Layout:
┌─────────────┬─────────────┬─────────────┐
│  top_left   │ top_center  │  top_right  │
├─────────────┼─────────────┼─────────────┤
│ middle_left │   center    │middle_right │
├─────────────┼─────────────┼─────────────┤
│bottom_left  │bottom_center│bottom_right │
└─────────────┴─────────────┴─────────────┘
│              full_canvas               │

Anchor Points: ${anchorList}

POSITIONING EXAMPLES:
- "region": "top_left", "anchor": "center" → centers shape in top-left region
- "region": "center", "anchor": "bottom_center" → positions shape with its bottom-center at region center
- "region": "center", "offset": [0.2, -0.1] → slightly right and up from center
- "repeat": {"type": "grid", "count": [3, 2]} → creates 3x2 grid pattern

LAYER ORGANIZATION PRINCIPLES:
1. Separate logical parts into distinct layers (background, main structure, details, accents)
2. Each layer should have a clear semantic purpose
3. Use descriptive IDs and labels for layers and paths
4. Maintain proper z-ordering through layer sequence
5. Apply layout specifications at appropriate levels (document, layer, or path)

PATH COMMAND REQUIREMENTS:
- Use only M (move), L (line), C (cubic bezier), Q (quadratic), Z (close) commands
- All coordinates must be absolute (no relative commands)
- Coordinates must be within [0,${canvasDimensions.width}] x [0,${canvasDimensions.height}] range
- Use smooth curves (C commands) for organic shapes
- Use straight lines (L commands) for geometric shapes

STYLE SPECIFICATIONS:
- Use hex colors for fill and stroke (#RRGGBB format)
- Stroke width in pixels (typically 1-4 for most shapes)
- Support strokeLinecap: "butt" | "round" | "square"
- Support strokeLinejoin: "miter" | "round" | "bevel"
- Opacity values between 0 and 1

SCHEMA EXAMPLE:
${JSON.stringify(this.getSchemaExample(aspectRatio), null, 2)}

QUALITY GUIDELINES:
1. Create visually balanced compositions using semantic regions
2. Ensure proper contrast between elements
3. Use consistent stroke widths within related elements
4. Organize layers logically (background to foreground)
5. Position elements with appropriate margins from canvas edges
6. Use semantic region names that match the design intent

COORDINATE VALIDATION:
- All path coordinates MUST be within canvas bounds
- Use layout language to avoid manual coordinate calculations
- Let the system handle pixel-perfect positioning based on regions and anchors

Return ONLY the JSON object, no additional text or explanations.`;
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(prompt: string, context?: any): string {
    let userPrompt = `Create a unified layered SVG design: "${prompt}"

REQUIREMENTS:
1. Break the design into logical layers with semantic meaning
2. Use semantic regions for positioning instead of manual coordinates
3. Organize paths within appropriate layers
4. Use layout specifications for consistent positioning
5. Ensure all coordinates are within canvas bounds
6. Return only the unified-layered-1.0 JSON format

DESIGN APPROACH:
- Start with background/structure layers
- Add detail layers on top
- Use semantic regions that match the design intent
- Apply appropriate anchoring for each element type
- Consider the overall composition and balance`;

    if (context) {
      userPrompt += `\n\nCONTEXT:\n`;

      if (context.style) {
        userPrompt += `- Style: ${context.style}\n`;
      }

      if (context.complexity) {
        userPrompt += `- Complexity: ${context.complexity}\n`;
      }

      if (context.colors) {
        userPrompt += `- Color palette: ${Array.isArray(context.colors) ? context.colors.join(", ") : context.colors}\n`;
      }

      if (context.theme) {
        userPrompt += `- Theme: ${context.theme}\n`;
      }

      if (context.elements) {
        userPrompt += `- Required elements: ${Array.isArray(context.elements) ? context.elements.join(", ") : context.elements}\n`;
      }
    }

    userPrompt += `\n\nReturn ONLY the JSON object, no additional text.`;

    return userPrompt;
  }

  /**
   * Get schema example for the given aspect ratio
   */
  private getSchemaExample(
    aspectRatio: AspectRatio
  ): UnifiedLayeredSVGDocument {
    const canvasDimensions = this.getCanvasDimensions(aspectRatio);

    return {
      version: "unified-layered-1.0",
      canvas: {
        width: canvasDimensions.width,
        height: canvasDimensions.height,
        aspectRatio: aspectRatio,
      },
      layout: {
        globalAnchor: "center",
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
                fill: "#F8FAFC",
                stroke: "none",
              },
              commands: [
                { cmd: "M", coords: [0, 0] },
                { cmd: "L", coords: [canvasDimensions.width, 0] },
                {
                  cmd: "L",
                  coords: [canvasDimensions.width, canvasDimensions.height],
                },
                { cmd: "L", coords: [0, canvasDimensions.height] },
                { cmd: "Z", coords: [] },
              ],
            },
          ],
        },
        {
          id: "main_structure",
          label: "Main Structure",
          layout: {
            region: "center",
            anchor: "center",
          },
          paths: [
            {
              id: "main_shape",
              style: {
                fill: "#E5E7EB",
                stroke: "#111827",
                strokeWidth: 2,
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
        {
          id: "details",
          label: "Detail Elements",
          layout: {
            region: "center",
            anchor: "center",
          },
          paths: [
            {
              id: "detail_circle",
              style: {
                fill: "#3B82F6",
                stroke: "#1E40AF",
                strokeWidth: 1,
              },
              commands: [
                { cmd: "M", coords: [256, 236] },
                { cmd: "C", coords: [267, 236, 276, 245, 276, 256] },
                { cmd: "C", coords: [276, 267, 267, 276, 256, 276] },
                { cmd: "C", coords: [245, 276, 236, 267, 236, 256] },
                { cmd: "C", coords: [236, 245, 245, 236, 256, 236] },
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
   * Get canvas dimensions for aspect ratio
   */
  private getCanvasDimensions(aspectRatio: AspectRatio): {
    width: number;
    height: number;
  } {
    // This should use AspectRatioManager, but for now provide basic mapping
    const aspectRatioMap: Record<
      AspectRatio,
      { width: number; height: number }
    > = {
      "1:1": { width: 512, height: 512 },
      "4:3": { width: 512, height: 384 },
      "16:9": { width: 512, height: 288 },
      "3:2": { width: 512, height: 341 },
      "2:3": { width: 341, height: 512 },
      "9:16": { width: 288, height: 512 },
    };

    return aspectRatioMap[aspectRatio] || { width: 512, height: 512 };
  }

  /**
   * Build prompt for specific design types
   */
  buildSpecializedPrompt(
    request: GenerationRequest,
    designType:
      | "geometric"
      | "organic"
      | "architectural"
      | "nature"
      | "abstract"
  ): OpenAIPrompt {
    const basePrompt = this.buildUnifiedPrompt(request);

    const specializedInstructions = this.getSpecializedInstructions(designType);

    // Append specialized instructions to system prompt
    basePrompt.messages[0].content += `\n\nSPECIALIZED INSTRUCTIONS FOR ${designType.toUpperCase()} DESIGN:\n${specializedInstructions}`;

    return basePrompt;
  }

  /**
   * Get specialized instructions for different design types
   */
  private getSpecializedInstructions(designType: string): string {
    const instructions = {
      geometric: `
- Use precise straight lines and perfect curves
- Prefer L commands for sharp edges and C commands for smooth curves
- Create symmetrical compositions when appropriate
- Use consistent stroke widths and geometric proportions
- Position elements using grid-based regions for alignment`,

      organic: `
- Use flowing C (cubic bezier) commands for natural curves
- Avoid perfectly straight lines except for stems/trunks
- Create asymmetrical but balanced compositions
- Use varying stroke widths to suggest depth and growth
- Position elements to suggest natural growth patterns`,

      architectural: `
- Use primarily L commands for structural elements
- Create strong vertical and horizontal alignments
- Use consistent proportions and modular sizing
- Apply proper perspective through layering
- Position elements using structural regions (foundation, walls, roof)`,

      nature: `
- Combine organic curves with some geometric structure
- Use layering to suggest depth (background, midground, foreground)
- Create natural color harmonies
- Position elements to suggest environmental relationships
- Use repetition patterns for textures (leaves, grass, etc.)`,

      abstract: `
- Experiment with unconventional shapes and compositions
- Use dynamic positioning across multiple regions
- Create visual rhythm through repetition and variation
- Balance geometric and organic elements
- Use layering to create visual depth and complexity`,
    };

    return instructions[designType as keyof typeof instructions] || "";
  }
}
