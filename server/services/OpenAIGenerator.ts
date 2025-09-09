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

        if (!parsed.svg) {
          return {
            success: false,
            errors: ["No SVG content in OpenAI response"],
          };
        }

        return {
          success: true,
          svg: parsed.svg,
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

  private createSystemPrompt(
    size: { width: number; height: number },
    palette?: string[]
  ): string {
    const paletteText = palette
      ? `Use these colors: ${palette.join(", ")}`
      : "Use appropriate colors for the design";

    return `You are an expert SVG generator. Create clean, valid SVG code based on user prompts.

REQUIREMENTS:
- Generate valid SVG markup with proper xmlns and viewBox attributes
- Use viewBox="0 0 ${size.width} ${size.height}" and width="${size.width}" height="${size.height}"
- ${paletteText}
- Only use these SVG elements: svg, g, path, circle, rect, line, polyline, polygon, ellipse
- NO script tags, foreignObject, image tags, or event handlers (onclick, onload, etc.)
- Limit decimal precision to 2 places maximum
- If using stroke, ensure stroke-width is >= 1
- Add meaningful id attributes to main elements
- Create clean, semantic SVG structure

RESPONSE FORMAT:
Return a JSON object with this structure:
{
  "svg": "complete SVG markup string",
  "warnings": ["any warnings about the generation"]
}

Focus on creating visually appealing, clean SVG graphics that match the user's description.`;
  }

  private createUserPrompt(prompt: string, seed: number): string {
    return `Create an SVG based on this description: "${prompt}"

Use seed ${seed} for any randomization to ensure consistent results.

Generate clean, professional SVG code that accurately represents the requested design.`;
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
