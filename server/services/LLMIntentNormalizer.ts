/**
 * LLMIntentNormalizer - Uses LLM to convert prompts into structured DesignIntent
 */
import type { DesignIntent } from "../types/pipeline.js";
import { DesignIntentSchema } from "../schemas/pipeline.js";
import {
  IntentNormalizer,
  type NormalizationContext,
} from "./IntentNormalizer.js";

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

export class LLMIntentNormalizer extends IntentNormalizer {
  private llmConfig: LLMConfig;
  private fallbackNormalizer: IntentNormalizer;

  constructor(config: LLMConfig) {
    super();
    this.llmConfig = config;
    this.fallbackNormalizer = new IntentNormalizer();
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
}
