/**
 * IntentNormalizer - Converts natural language prompts into structured DesignIntent
 */
import type { DesignIntent } from "../types/pipeline.js";
import { DesignIntentSchema } from "../schemas/pipeline.js";

export interface NormalizationContext {
  defaultPalette?: string[];
  defaultSize?: { width: number; height: number };
  userPreferences?: Record<string, any>;
}

export class IntentNormalizer {
  private motifKeywords = new Map([
    [
      "geometric",
      ["circle", "square", "triangle", "polygon", "diamond", "hexagon"],
    ],
    ["nature", ["leaf", "tree", "flower", "branch", "organic", "natural"]],
    ["abstract", ["wave", "spiral", "curve", "flow", "gradient", "pattern"]],
    ["architectural", ["building", "structure", "column", "arch", "geometric"]],
    [
      "decorative",
      ["ornament", "border", "frame", "flourish", "embellishment"],
    ],
  ]);

  private styleKeywords = new Map([
    ["minimalist", { density: "sparse", strokeOnly: true }],
    ["detailed", { density: "dense", strokeOnly: false }],
    ["clean", { density: "sparse", strokeOnly: true }],
    ["complex", { density: "dense", strokeOnly: false }],
    ["simple", { density: "sparse", strokeOnly: true }],
  ]);

  private arrangementKeywords = new Map([
    ["centered", "centered"],
    ["grid", "grid"],
    ["scattered", "scattered"],
    ["organic", "organic"],
    ["random", "scattered"],
    ["structured", "grid"],
    ["flowing", "organic"],
  ]);

  async normalize(
    prompt: string,
    context?: NormalizationContext
  ): Promise<DesignIntent> {
    const normalizedPrompt = prompt.toLowerCase().trim();

    // Extract style information
    const style = this.extractStyle(normalizedPrompt, context);

    // Extract motifs
    const motifs = this.extractMotifs(normalizedPrompt);

    // Extract layout preferences
    const layout = this.extractLayout(normalizedPrompt, context);

    // Extract constraints
    const constraints = this.extractConstraints(normalizedPrompt, motifs);

    const intent: DesignIntent = {
      style,
      motifs,
      layout,
      constraints,
    };

    // Validate the generated intent
    const validationResult = DesignIntentSchema.safeParse(intent);
    if (!validationResult.success) {
      throw new Error(
        `Invalid design intent: ${validationResult.error.message}`
      );
    }

    return intent;
  }

  private extractStyle(prompt: string, context?: NormalizationContext) {
    // Extract palette
    const palette = this.extractPalette(prompt, context?.defaultPalette);

    // Extract stroke rules
    const strokeRules = this.extractStrokeRules(prompt);

    // Extract density
    const density = this.extractDensity(prompt);

    // Extract symmetry
    const symmetry = this.extractSymmetry(prompt);

    return {
      palette,
      strokeRules,
      density,
      symmetry,
    };
  }

  private extractPalette(prompt: string, defaultPalette?: string[]): string[] {
    // Color extraction patterns
    const colorPatterns = [
      /blue/i,
      /red/i,
      /green/i,
      /yellow/i,
      /purple/i,
      /orange/i,
      /pink/i,
      /black/i,
      /white/i,
      /gray/i,
    ];

    const colorMap = new Map([
      ["blue", "#2563eb"],
      ["red", "#dc2626"],
      ["green", "#16a34a"],
      ["yellow", "#eab308"],
      ["purple", "#9333ea"],
      ["orange", "#ea580c"],
      ["pink", "#ec4899"],
      ["black", "#000000"],
      ["white", "#ffffff"],
      ["gray", "#6b7280"],
    ]);

    const extractedColors: string[] = [];

    for (const [color, hex] of colorMap) {
      if (prompt.includes(color)) {
        extractedColors.push(hex);
      }
    }

    // Monochrome detection
    if (prompt.includes("monochrome") || prompt.includes("black and white")) {
      return ["#000000", "#ffffff"];
    }

    // Use default palette if no colors found
    if (extractedColors.length === 0) {
      return defaultPalette || ["#2563eb", "#16a34a", "#eab308"];
    }

    return extractedColors.slice(0, 6); // Limit to 6 colors
  }

  private extractStrokeRules(prompt: string) {
    const strokeOnly =
      prompt.includes("outline") ||
      prompt.includes("stroke") ||
      prompt.includes("line art") ||
      prompt.includes("wireframe");

    const minStrokeWidth = strokeOnly ? 1 : 0.5;
    const maxStrokeWidth = prompt.includes("thick")
      ? 4
      : prompt.includes("thin")
        ? 1
        : 2;

    return {
      strokeOnly,
      minStrokeWidth,
      maxStrokeWidth,
      allowFill: !strokeOnly,
    };
  }

  private extractDensity(prompt: string): "sparse" | "medium" | "dense" {
    if (
      prompt.includes("simple") ||
      prompt.includes("minimal") ||
      prompt.includes("clean")
    ) {
      return "sparse";
    }
    if (
      prompt.includes("detailed") ||
      prompt.includes("complex") ||
      prompt.includes("intricate")
    ) {
      return "dense";
    }
    return "medium";
  }

  private extractSymmetry(
    prompt: string
  ): "none" | "horizontal" | "vertical" | "radial" {
    if (prompt.includes("radial") || prompt.includes("circular")) {
      return "radial";
    }
    if (prompt.includes("horizontal") || prompt.includes("mirror")) {
      return "horizontal";
    }
    if (prompt.includes("vertical")) {
      return "vertical";
    }
    if (prompt.includes("symmetric") || prompt.includes("symmetry")) {
      return "horizontal"; // Default symmetry
    }
    return "none";
  }

  private extractMotifs(prompt: string): string[] {
    const motifs: string[] = [];

    // Check for explicit motif keywords
    for (const [category, keywords] of this.motifKeywords) {
      for (const keyword of keywords) {
        if (prompt.includes(keyword)) {
          motifs.push(keyword);
        }
      }
    }

    // Extract noun phrases that could be motifs
    const words = prompt.split(/\s+/);
    const potentialMotifs = words.filter(
      (word) =>
        word.length > 3 &&
        !["with", "and", "the", "for", "that", "this"].includes(word)
    );

    motifs.push(...potentialMotifs.slice(0, 5));

    return [...new Set(motifs)].slice(0, 10); // Remove duplicates and limit
  }

  private extractLayout(prompt: string, context?: NormalizationContext) {
    // Extract arrangement
    let arrangement: "grid" | "organic" | "centered" | "scattered" = "centered";
    for (const [keyword, value] of this.arrangementKeywords) {
      if (prompt.includes(keyword)) {
        arrangement = value as any;
        break;
      }
    }

    // Extract size preferences
    const sizes = this.extractSizes(prompt);

    // Extract count preferences
    const counts = this.extractCounts(prompt);

    return {
      sizes,
      counts,
      arrangement,
    };
  }

  private extractSizes(prompt: string) {
    const sizes = [];

    // Default size based on common elements
    if (prompt.includes("icon") || prompt.includes("small")) {
      sizes.push({ type: "icon", minSize: 16, maxSize: 64 });
    }
    if (prompt.includes("large") || prompt.includes("big")) {
      sizes.push({ type: "main", minSize: 100, maxSize: 300 });
    }

    // Default medium size if nothing specified
    if (sizes.length === 0) {
      sizes.push({ type: "default", minSize: 50, maxSize: 150 });
    }

    return sizes;
  }

  private extractCounts(prompt: string) {
    const counts = [];

    // Extract numbers from prompt
    const numbers = prompt.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const count = parseInt(numbers[0]);
      counts.push({
        type: "element",
        min: Math.max(1, count - 2),
        max: count + 2,
        preferred: count,
      });
    } else {
      // Default count based on density
      const density = this.extractDensity(prompt);
      const baseCount = density === "sparse" ? 3 : density === "dense" ? 8 : 5;
      counts.push({
        type: "element",
        min: baseCount - 2,
        max: baseCount + 3,
        preferred: baseCount,
      });
    }

    return counts;
  }

  private extractConstraints(prompt: string, motifs: string[]) {
    const strokeOnly =
      prompt.includes("outline") ||
      prompt.includes("stroke") ||
      prompt.includes("line art");

    // Extract max elements based on complexity
    const maxElements = prompt.includes("simple")
      ? 10
      : prompt.includes("complex")
        ? 50
        : 25;

    // Required motifs are the most important ones mentioned
    const requiredMotifs = motifs.slice(0, 3);

    return {
      strokeOnly,
      maxElements,
      requiredMotifs,
    };
  }
}
