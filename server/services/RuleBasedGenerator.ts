import { SVGGenerator } from "./SVGGenerator";
import { SVGSanitizer } from "./SVGSanitizer";
import { LayerAnalyzer } from "./LayerAnalyzer";
import type {
  GenerationRequest,
  GenerationResponse,
  LayerInfo,
  SVGMetadata,
} from "../types";

interface ShapeTemplate {
  name: string;
  keywords: string[];
  generator: (
    width: number,
    height: number,
    colors: string[],
    seed: number
  ) => string;
}

export class RuleBasedGenerator extends SVGGenerator {
  private sanitizer: SVGSanitizer;
  private layerAnalyzer: LayerAnalyzer;
  private templates: ShapeTemplate[];

  constructor() {
    super();
    this.sanitizer = new SVGSanitizer();
    this.layerAnalyzer = new LayerAnalyzer();
    this.templates = this.initializeTemplates();
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

      // Parse prompt to determine shape type
      const template = this.selectTemplate(request.prompt);

      // Generate SVG content
      const svgContent = this.generateSVGContent(
        template,
        width,
        height,
        colors,
        seed,
        request.prompt
      );

      // Sanitize the generated SVG
      const sanitizationResult = this.sanitizer.sanitize(svgContent);

      if (!sanitizationResult.isValid) {
        return {
          svg: "",
          meta: this.createEmptyMetadata(),
          layers: [],
          warnings: sanitizationResult.warnings,
          errors: sanitizationResult.errors,
        };
      }

      // Generate metadata and layers
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
        warnings: sanitizationResult.warnings,
        errors: [],
      };
    } catch (error) {
      return {
        svg: "",
        meta: this.createEmptyMetadata(),
        layers: [],
        warnings: [],
        errors: [
          `Generation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      };
    }
  }

  private initializeTemplates(): ShapeTemplate[] {
    return [
      {
        name: "circle",
        keywords: ["circle", "round", "ball", "dot", "ring"],
        generator: (width, height, colors, seed) =>
          this.generateCircle(width, height, colors, seed),
      },
      {
        name: "rectangle",
        keywords: ["rectangle", "rect", "square", "box", "card"],
        generator: (width, height, colors, seed) =>
          this.generateRectangle(width, height, colors, seed),
      },
      {
        name: "triangle",
        keywords: ["triangle", "arrow", "point", "peak"],
        generator: (width, height, colors, seed) =>
          this.generateTriangle(width, height, colors, seed),
      },
      {
        name: "star",
        keywords: ["star", "asterisk", "sparkle"],
        generator: (width, height, colors, seed) =>
          this.generateStar(width, height, colors, seed),
      },
      {
        name: "icon",
        keywords: ["icon", "symbol", "logo", "badge"],
        generator: (width, height, colors, seed) =>
          this.generateIcon(width, height, colors, seed),
      },
      {
        name: "pattern",
        keywords: ["pattern", "grid", "lines", "stripes", "dots"],
        generator: (width, height, colors, seed) =>
          this.generatePattern(width, height, colors, seed),
      },
    ];
  }

  private selectTemplate(prompt: string): ShapeTemplate {
    const lowerPrompt = prompt.toLowerCase();

    // Find the best matching template based on keywords
    for (const template of this.templates) {
      if (template.keywords.some((keyword) => lowerPrompt.includes(keyword))) {
        return template;
      }
    }

    // Default to circle if no match found
    return this.templates[0];
  }

  private generateSVGContent(
    template: ShapeTemplate,
    width: number,
    height: number,
    colors: string[],
    seed: number,
    prompt: string
  ): string {
    const content = template.generator(width, height, colors, seed);
    const backgroundColor = this.extractBackgroundColor(prompt, colors);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      ${backgroundColor ? `<rect width="100%" height="100%" fill="${backgroundColor}"/>` : ""}
      ${content}
    </svg>`;
  }

  private generateCircle(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerX = this.limitPrecision(width / 2);
    const centerY = this.limitPrecision(height / 2);
    const radius = this.limitPrecision(
      Math.min(width, height) * (0.3 + seededRandom() * 0.2)
    );
    const color = colors[Math.floor(seededRandom() * colors.length)];
    const strokeWidth = Math.max(1, Math.floor(seededRandom() * 3) + 1);

    const hasStroke = seededRandom() > 0.5;
    const hasFill = seededRandom() > 0.3;

    let attributes = `cx="${centerX}" cy="${centerY}" r="${radius}"`;

    if (hasFill) {
      attributes += ` fill="${color}"`;
    } else {
      attributes += ` fill="none"`;
    }

    if (hasStroke) {
      const strokeColor = colors[Math.floor(seededRandom() * colors.length)];
      attributes += ` stroke="${strokeColor}" stroke-width="${strokeWidth}"`;
    }

    return `<circle ${attributes} id="main-circle"/>`;
  }

  private generateRectangle(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const padding = Math.min(width, height) * 0.1;
    const rectWidth = this.limitPrecision(width - padding * 2);
    const rectHeight = this.limitPrecision(height - padding * 2);
    const x = this.limitPrecision(padding);
    const y = this.limitPrecision(padding);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    // Add rounded corners sometimes
    const hasRoundedCorners = seededRandom() > 0.6;
    const cornerRadius = hasRoundedCorners
      ? this.limitPrecision(Math.min(rectWidth, rectHeight) * 0.1)
      : 0;

    let attributes = `x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}"`;

    if (cornerRadius > 0) {
      attributes += ` rx="${cornerRadius}" ry="${cornerRadius}"`;
    }

    attributes += ` fill="${color}"`;

    return `<rect ${attributes} id="main-rect"/>`;
  }

  private generateTriangle(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const padding = Math.min(width, height) * 0.1;
    const centerX = this.limitPrecision(width / 2);
    const topY = this.limitPrecision(padding);
    const bottomY = this.limitPrecision(height - padding);
    const leftX = this.limitPrecision(padding);
    const rightX = this.limitPrecision(width - padding);

    const color = colors[Math.floor(seededRandom() * colors.length)];
    const points = `${centerX},${topY} ${leftX},${bottomY} ${rightX},${bottomY}`;

    return `<polygon points="${points}" fill="${color}" id="main-triangle"/>`;
  }

  private generateStar(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerX = this.limitPrecision(width / 2);
    const centerY = this.limitPrecision(height / 2);
    const outerRadius = this.limitPrecision(Math.min(width, height) * 0.4);
    const innerRadius = this.limitPrecision(outerRadius * 0.4);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    // Generate 5-pointed star
    const points: string[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = this.limitPrecision(
        centerX + radius * Math.cos(angle - Math.PI / 2)
      );
      const y = this.limitPrecision(
        centerY + radius * Math.sin(angle - Math.PI / 2)
      );
      points.push(`${x},${y}`);
    }

    return `<polygon points="${points.join(" ")}" fill="${color}" id="main-star"/>`;
  }

  private generateIcon(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const color = colors[Math.floor(seededRandom() * colors.length)];
    const strokeColor = colors[Math.floor(seededRandom() * colors.length)];

    // Generate a simple house icon
    const baseY = this.limitPrecision(height * 0.8);
    const roofY = this.limitPrecision(height * 0.3);
    const centerX = this.limitPrecision(width / 2);
    const leftX = this.limitPrecision(width * 0.2);
    const rightX = this.limitPrecision(width * 0.8);

    return `<g id="house-icon">
      <polygon points="${centerX},${roofY} ${leftX},${this.limitPrecision(height * 0.5)} ${rightX},${this.limitPrecision(height * 0.5)}" fill="${color}"/>
      <rect x="${leftX}" y="${this.limitPrecision(height * 0.5)}" width="${this.limitPrecision(rightX - leftX)}" height="${this.limitPrecision(baseY - height * 0.5)}" fill="${strokeColor}"/>
      <rect x="${this.limitPrecision(width * 0.4)}" y="${this.limitPrecision(height * 0.6)}" width="${this.limitPrecision(width * 0.2)}" height="${this.limitPrecision(height * 0.2)}" fill="none" stroke="${color}" stroke-width="2"/>
    </g>`;
  }

  private generatePattern(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const color = colors[Math.floor(seededRandom() * colors.length)];
    const spacing = Math.max(10, Math.min(width, height) / 8);

    const elements: string[] = [];

    // Generate a grid of circles
    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        const radius = this.limitPrecision(spacing * 0.2);
        elements.push(
          `<circle cx="${this.limitPrecision(x)}" cy="${this.limitPrecision(y)}" r="${radius}" fill="${color}"/>`
        );
      }
    }

    return `<g id="dot-pattern">${elements.join("")}</g>`;
  }

  private extractBackgroundColor(
    prompt: string,
    colors: string[]
  ): string | null {
    const lowerPrompt = prompt.toLowerCase();

    // Check for background color keywords
    if (lowerPrompt.includes("background") || lowerPrompt.includes("bg")) {
      return colors[colors.length - 1]; // Use last color as background
    }

    return null;
  }

  private createSeededRandom(seed: number): () => number {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
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
      backgroundColor:
        this.extractBackgroundColor(prompt, colors) || "transparent",
      palette: colors,
      description: `Generated SVG based on prompt: "${prompt}"`,
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
