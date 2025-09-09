import OpenAI from "openai";
import { SVGGenerator } from "./SVGGenerator";
import { SVGSanitizer } from "./SVGSanitizer";
import { LayerAnalyzer } from "./LayerAnalyzer";
import { RuleBasedGenerator } from "./RuleBasedGenerator";
import type {
  GenerationRequest,
  GenerationResponse,
  LayerInfo,
  SVGMetadata,
} from "../types";

export class OpenAIGenerator extends SVGGenerator {
  private openai: OpenAI;
  private sanitizer: SVGSanitizer;
  private layerAnalyzer: LayerAnalyzer;
  private fallbackGenerator: RuleBasedGenerator;

  constructor(apiKey?: string) {
    super();

    if (!apiKey && !process.env.OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass it to constructor."
      );
    }

    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });

    this.sanitizer = new SVGSanitizer();
    this.layerAnalyzer = new LayerAnalyzer();
    this.fallbackGenerator = new RuleBasedGenerator();
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const validation = this.validateRequest(request);
    if (!validation.success) {
      return {
        svg: "",
        meta: this.createEmptyMetadata(),
        layers: [],
        warnings: [],
        errors: validation.errors,
      };
    }

    try {
      const seed = request.seed || this.generateSeed();
      const { width, height } = request.size;
      const colors = request.palette || this.getDefaultPalette();

      // Try OpenAI generation first
      const openaiResult = await this.generateWithOpenAI(request, seed);

      if (openaiResult.success && openaiResult.svg) {
        // Sanitize the OpenAI-generated SVG
        const sanitizationResult = this.sanitizer.sanitize(openaiResult.svg);

        if (sanitizationResult.isValid) {
          const metadata = this.generateMetadata(
            width,
            height,
            colors,
            seed,
            request.prompt
          );
          const layers = this.layerAnalyzer.analyze(
            sanitizationResult.sanitizedSVG
          );

          return {
            svg: sanitizationResult.sanitizedSVG,
            meta: metadata,
            layers,
            warnings: [
              ...sanitizationResult.warnings,
              ...(openaiResult.warnings || []),
            ],
            errors: [],
          };
        } else {
          // If sanitization fails, fall back to rule-based
          console.warn(
            "OpenAI SVG failed sanitization, falling back to rule-based generation"
          );
          return this.fallbackToRuleBased(request, [
            "OpenAI SVG failed sanitization",
            ...sanitizationResult.errors,
          ]);
        }
      } else {
        // If OpenAI generation fails, fall back to rule-based
        console.warn(
          "OpenAI generation failed, falling back to rule-based generation"
        );
        return this.fallbackToRuleBased(
          request,
          openaiResult.errors || ["OpenAI generation failed"]
        );
      }
    } catch (error) {
      console.error("OpenAI generation error:", error);
      // Fall back to rule-based generation on any error
      return this.fallbackToRuleBased(request, [
        `OpenAI error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ]);
    }
  }

  private async generateWithOpenAI(
    request: GenerationRequest,
    seed: number
  ): Promise<{
    success: boolean;
    svg?: string;
    warnings?: string[];
    errors?: string[];
  }> {
    try {
      const systemPrompt = this.createSystemPrompt(
        request.size,
        request.palette
      );
      const userPrompt = this.createUserPrompt(request.prompt, seed);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return { success: false, errors: ["No response from OpenAI"] };
      }

      try {
        const parsed = JSON.parse(response);

        if (!parsed.elements || !Array.isArray(parsed.elements)) {
          return {
            success: false,
            errors: [
              "Invalid JSON structure from OpenAI - missing elements array",
            ],
          };
        }

        // Generate SVG from the JSON description
        const svg = this.generateSVGFromJSON(parsed, request.size);

        return {
          success: true,
          svg,
          warnings: parsed.warnings || [],
        };
      } catch (parseError) {
        return {
          success: false,
          errors: [
            `Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
          ],
        };
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("rate limit")) {
        return { success: false, errors: ["OpenAI rate limit exceeded"] };
      }

      return {
        success: false,
        errors: [
          `OpenAI API error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      };
    }
  }

  private generateSVGFromJSON(
    jsonData: any,
    size: { width: number; height: number }
  ): string {
    const { elements, background } = jsonData;
    let svgContent = "";

    // Add background if specified
    if (background && background.type !== "none") {
      if (background.type === "solid" && background.color) {
        svgContent += `<rect width="100%" height="100%" fill="${background.color}" id="background"/>`;
      } else if (background.type === "gradient" && background.gradient) {
        const {
          startColor,
          endColor,
          direction = "vertical",
        } = background.gradient;
        const gradientId = "bg-gradient";

        let x1 = "0%",
          y1 = "0%",
          x2 = "0%",
          y2 = "100%";
        if (direction === "horizontal") {
          x1 = "0%";
          y1 = "0%";
          x2 = "100%";
          y2 = "0%";
        } else if (direction === "diagonal") {
          x1 = "0%";
          y1 = "0%";
          x2 = "100%";
          y2 = "100%";
        }

        svgContent += `
          <defs>
            <linearGradient id="${gradientId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
              <stop offset="0%" style="stop-color:${startColor};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${endColor};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#${gradientId})" id="background"/>`;
      }
    }

    // Generate elements
    elements.forEach((element: any, index: number) => {
      const elementSVG = this.generateElementSVG(element, index);
      if (elementSVG) {
        svgContent += elementSVG;
      }
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size.width} ${size.height}" width="${size.width}" height="${size.height}">
      ${svgContent}
    </svg>`;
  }

  private generateElementSVG(element: any, index: number): string {
    const id = element.id || `element-${index}`;

    switch (element.type) {
      case "circle":
        return this.generateCircleElement(element, id);
      case "rectangle":
        return this.generateRectangleElement(element, id);
      case "polygon":
        return this.generatePolygonElement(element, id);
      case "path":
        return this.generatePathElement(element, id);
      case "ellipse":
        return this.generateEllipseElement(element, id);
      case "line":
        return this.generateLineElement(element, id);
      case "text":
        return this.generateTextElement(element, id);
      default:
        console.warn(`Unknown element type: ${element.type}`);
        return "";
    }
  }

  private generateCircleElement(element: any, id: string): string {
    const { x, y, radius, fill, stroke, strokeWidth } = element;
    let attributes = `cx="${this.limitPrecision(x)}" cy="${this.limitPrecision(y)}" r="${this.limitPrecision(radius)}"`;

    if (fill) attributes += ` fill="${fill}"`;
    if (stroke) attributes += ` stroke="${stroke}"`;
    if (strokeWidth && strokeWidth >= 1)
      attributes += ` stroke-width="${strokeWidth}"`;

    return `<circle ${attributes} id="${id}"/>`;
  }

  private generateRectangleElement(element: any, id: string): string {
    const { x, y, width, height, rx, fill, stroke, strokeWidth } = element;
    let attributes = `x="${this.limitPrecision(x)}" y="${this.limitPrecision(y)}" width="${this.limitPrecision(width)}" height="${this.limitPrecision(height)}"`;

    if (rx) attributes += ` rx="${this.limitPrecision(rx)}"`;
    if (fill) attributes += ` fill="${fill}"`;
    if (stroke) attributes += ` stroke="${stroke}"`;
    if (strokeWidth && strokeWidth >= 1)
      attributes += ` stroke-width="${strokeWidth}"`;

    return `<rect ${attributes} id="${id}"/>`;
  }

  private generatePolygonElement(element: any, id: string): string {
    const { points, fill, stroke, strokeWidth } = element;

    if (!Array.isArray(points) || points.length < 3) {
      console.warn("Invalid polygon points");
      return "";
    }

    const pointsStr = points
      .map(
        (point: any) =>
          `${this.limitPrecision(point[0])},${this.limitPrecision(point[1])}`
      )
      .join(" ");

    let attributes = `points="${pointsStr}"`;
    if (fill) attributes += ` fill="${fill}"`;
    if (stroke) attributes += ` stroke="${stroke}"`;
    if (strokeWidth && strokeWidth >= 1)
      attributes += ` stroke-width="${strokeWidth}"`;

    return `<polygon ${attributes} id="${id}"/>`;
  }

  private generatePathElement(element: any, id: string): string {
    const { d, fill, stroke, strokeWidth } = element;

    if (!d) {
      console.warn("Path element missing d attribute");
      return "";
    }

    let attributes = `d="${d}"`;
    if (fill !== undefined) attributes += ` fill="${fill}"`;
    if (stroke) attributes += ` stroke="${stroke}"`;
    if (strokeWidth && strokeWidth >= 1)
      attributes += ` stroke-width="${strokeWidth}"`;

    return `<path ${attributes} id="${id}"/>`;
  }

  private generateEllipseElement(element: any, id: string): string {
    const { cx, cy, rx, ry, fill, stroke, strokeWidth } = element;
    let attributes = `cx="${this.limitPrecision(cx)}" cy="${this.limitPrecision(cy)}" rx="${this.limitPrecision(rx)}" ry="${this.limitPrecision(ry)}"`;

    if (fill) attributes += ` fill="${fill}"`;
    if (stroke) attributes += ` stroke="${stroke}"`;
    if (strokeWidth && strokeWidth >= 1)
      attributes += ` stroke-width="${strokeWidth}"`;

    return `<ellipse ${attributes} id="${id}"/>`;
  }

  private generateLineElement(element: any, id: string): string {
    const { x1, y1, x2, y2, stroke, strokeWidth } = element;
    let attributes = `x1="${this.limitPrecision(x1)}" y1="${this.limitPrecision(y1)}" x2="${this.limitPrecision(x2)}" y2="${this.limitPrecision(y2)}"`;

    attributes += ` stroke="${stroke || "#000000"}"`;
    attributes += ` stroke-width="${strokeWidth && strokeWidth >= 1 ? strokeWidth : 1}"`;

    return `<line ${attributes} id="${id}"/>`;
  }

  private generateTextElement(element: any, id: string): string {
    const { x, y, content, fontSize, fill, fontFamily } = element;
    let attributes = `x="${this.limitPrecision(x)}" y="${this.limitPrecision(y)}"`;

    if (fontSize) attributes += ` font-size="${fontSize}"`;
    if (fill) attributes += ` fill="${fill}"`;
    if (fontFamily) attributes += ` font-family="${fontFamily}"`;

    return `<text ${attributes} id="${id}">${content || ""}</text>`;
  }

  private createSystemPrompt(
    size: { width: number; height: number },
    palette?: string[]
  ): string {
    const paletteText = palette
      ? `Available colors: ${palette.join(", ")}`
      : "Use appropriate colors for the design";

    return `You are an SVG Shape Planner. Output STRICT JSON that matches the provided JSON Schema.

CANVAS: ${size.width}x${size.height}
${paletteText}

RULES:
- Think in terms of basic primitives (rect, circle, ellipse, line, polyline, polygon, path, text)
- All colors must be valid CSS color strings or "url(#gradientId)" for gradients
- Prefer simple coordinates and whole numbers unless smoothness is required
- Avoid excessive elements; keep it minimal and clean
- Never include explanations or markdown—ONLY the JSON that validates
- Ensure the composition fits within the width/height bounds

JSON SCHEMA:
{
  "type": "object",
  "properties": {
    "elements": {
      "type": "array",
      "items": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "type": {"const": "rect"},
              "id": {"type": "string"},
              "x": {"type": "number"},
              "y": {"type": "number"},
              "width": {"type": "number"},
              "height": {"type": "number"},
              "rx": {"type": "number"},
              "fill": {"type": "string"},
              "stroke": {"type": "string"},
              "strokeWidth": {"type": "number", "minimum": 1}
            },
            "required": ["type", "id", "x", "y", "width", "height"]
          },
          {
            "type": "object",
            "properties": {
              "type": {"const": "circle"},
              "id": {"type": "string"},
              "cx": {"type": "number"},
              "cy": {"type": "number"},
              "r": {"type": "number"},
              "fill": {"type": "string"},
              "stroke": {"type": "string"},
              "strokeWidth": {"type": "number", "minimum": 1}
            },
            "required": ["type", "id", "cx", "cy", "r"]
          },
          {
            "type": "object",
            "properties": {
              "type": {"const": "polygon"},
              "id": {"type": "string"},
              "points": {"type": "string"},
              "fill": {"type": "string"},
              "stroke": {"type": "string"},
              "strokeWidth": {"type": "number", "minimum": 1}
            },
            "required": ["type", "id", "points"]
          },
          {
            "type": "object",
            "properties": {
              "type": {"const": "path"},
              "id": {"type": "string"},
              "d": {"type": "string"},
              "fill": {"type": "string"},
              "stroke": {"type": "string"},
              "strokeWidth": {"type": "number", "minimum": 1}
            },
            "required": ["type", "id", "d"]
          },
          {
            "type": "object",
            "properties": {
              "type": {"const": "ellipse"},
              "id": {"type": "string"},
              "cx": {"type": "number"},
              "cy": {"type": "number"},
              "rx": {"type": "number"},
              "ry": {"type": "number"},
              "fill": {"type": "string"},
              "stroke": {"type": "string"},
              "strokeWidth": {"type": "number", "minimum": 1}
            },
            "required": ["type", "id", "cx", "cy", "rx", "ry"]
          },
          {
            "type": "object",
            "properties": {
              "type": {"const": "line"},
              "id": {"type": "string"},
              "x1": {"type": "number"},
              "y1": {"type": "number"},
              "x2": {"type": "number"},
              "y2": {"type": "number"},
              "stroke": {"type": "string"},
              "strokeWidth": {"type": "number", "minimum": 1}
            },
            "required": ["type", "id", "x1", "y1", "x2", "y2", "stroke"]
          }
        ]
      }
    },
    "gradients": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "type": {"enum": ["linear", "radial"]},
          "stops": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "offset": {"type": "string"},
                "color": {"type": "string"}
              },
              "required": ["offset", "color"]
            }
          },
          "x1": {"type": "string"},
          "y1": {"type": "string"},
          "x2": {"type": "string"},
          "y2": {"type": "string"}
        },
        "required": ["id", "type", "stops"]
      }
    }
  },
  "required": ["elements"]
}`;
  }

  private createUserPrompt(prompt: string, seed: number): string {
    return `Analyze this design request and return a JSON structure describing the SVG elements: "${prompt}"

ANALYSIS REQUIREMENTS:
- Break down the prompt into specific visual elements
- Determine appropriate shapes, positions, sizes, and colors
- Consider composition and visual hierarchy
- Use seed ${seed} for any randomization decisions
- Think about how to best represent the concept visually

EXAMPLES:
- "red star" → single star polygon element
- "blue house with yellow door" → rectangle for house, triangle for roof, smaller rectangle for door
- "abstract geometric pattern" → multiple shapes with interesting arrangements
- "flower with petals" → central circle + multiple ellipses arranged radially

Focus on creating a clear, structured representation that captures the essence of the request.`;
  }

  private async fallbackToRuleBased(
    request: GenerationRequest,
    warnings: string[]
  ): Promise<GenerationResponse> {
    const result = await this.fallbackGenerator.generate(request);
    return {
      ...result,
      warnings: [
        ...warnings,
        ...result.warnings,
        "Fell back to rule-based generation",
      ],
    };
  }

  private generateMetadata(
    width: number,
    height: number,
    colors: string[],
    seed: number,
    prompt: string
  ): SVGMetadata {
    return {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      backgroundColor: "transparent",
      palette: colors,
      description: `AI-generated SVG based on prompt: "${prompt}"`,
      seed,
    };
  }

  private getDefaultPalette(): string[] {
    return ["#3B82F6", "#1E40AF", "#1D4ED8"];
  }

  private createEmptyMetadata(): SVGMetadata {
    return {
      width: 0,
      height: 0,
      viewBox: "0 0 0 0",
      backgroundColor: "transparent",
      palette: [],
      description: "",
      seed: 0,
    };
  }
}
