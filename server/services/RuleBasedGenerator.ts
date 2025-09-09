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
      const colors =
        request.palette || this.extractColorsFromPrompt(request.prompt);

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
      // Basic shapes
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
        keywords: ["triangle", "point", "peak"],
        generator: (width, height, colors, seed) =>
          this.generateTriangle(width, height, colors, seed),
      },

      // Polygonal shapes
      {
        name: "star",
        keywords: ["star", "asterisk", "sparkle", "pentagram"],
        generator: (width, height, colors, seed) =>
          this.generateStar(width, height, colors, seed),
      },
      {
        name: "hexagon",
        keywords: ["hexagon", "hex", "honeycomb"],
        generator: (width, height, colors, seed) =>
          this.generateHexagon(width, height, colors, seed),
      },
      {
        name: "pentagon",
        keywords: ["pentagon", "penta"],
        generator: (width, height, colors, seed) =>
          this.generatePentagon(width, height, colors, seed),
      },
      {
        name: "octagon",
        keywords: ["octagon", "octa", "stop"],
        generator: (width, height, colors, seed) =>
          this.generateOctagon(width, height, colors, seed),
      },
      {
        name: "diamond",
        keywords: ["diamond", "rhombus", "gem", "crystal"],
        generator: (width, height, colors, seed) =>
          this.generateDiamond(width, height, colors, seed),
      },

      // Freeform shapes
      {
        name: "heart",
        keywords: ["heart", "love", "valentine"],
        generator: (width, height, colors, seed) =>
          this.generateHeart(width, height, colors, seed),
      },
      {
        name: "wave",
        keywords: ["wave", "curve", "wavy", "sine"],
        generator: (width, height, colors, seed) =>
          this.generateWave(width, height, colors, seed),
      },
      {
        name: "spiral",
        keywords: ["spiral", "swirl", "coil"],
        generator: (width, height, colors, seed) =>
          this.generateSpiral(width, height, colors, seed),
      },
      {
        name: "arrow",
        keywords: ["arrow", "pointer", "direction"],
        generator: (width, height, colors, seed) =>
          this.generateArrow(width, height, colors, seed),
      },

      // Organic shapes
      {
        name: "flower",
        keywords: ["flower", "petal", "bloom", "blossom"],
        generator: (width, height, colors, seed) =>
          this.generateFlower(width, height, colors, seed),
      },
      {
        name: "leaf",
        keywords: ["leaf", "foliage", "plant"],
        generator: (width, height, colors, seed) =>
          this.generateLeaf(width, height, colors, seed),
      },
      {
        name: "tree",
        keywords: ["tree", "trunk", "branch"],
        generator: (width, height, colors, seed) =>
          this.generateTree(width, height, colors, seed),
      },

      // Complex patterns
      {
        name: "mandala",
        keywords: ["mandala", "circular", "radial", "symmetric"],
        generator: (width, height, colors, seed) =>
          this.generateMandala(width, height, colors, seed),
      },
      {
        name: "pattern",
        keywords: ["pattern", "grid", "lines", "stripes", "dots"],
        generator: (width, height, colors, seed) =>
          this.generatePattern(width, height, colors, seed),
      },
      {
        name: "icon",
        keywords: ["icon", "symbol", "logo", "badge"],
        generator: (width, height, colors, seed) =>
          this.generateIcon(width, height, colors, seed),
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

  private generateFlower(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerX = this.limitPrecision(width / 2);
    const centerY = this.limitPrecision(height / 2);
    const petalRadius = this.limitPrecision(Math.min(width, height) * 0.15);
    const centerRadius = this.limitPrecision(petalRadius * 0.3);

    const petalColor = colors[Math.floor(seededRandom() * colors.length)];
    const centerColor = colors[Math.floor(seededRandom() * colors.length)];

    const petals: string[] = [];
    const numPetals = 5 + Math.floor(seededRandom() * 3); // 5-7 petals

    // Generate petals in a circle
    for (let i = 0; i < numPetals; i++) {
      const angle = (i * 2 * Math.PI) / numPetals;
      const petalX = this.limitPrecision(
        centerX + Math.cos(angle) * petalRadius * 1.5
      );
      const petalY = this.limitPrecision(
        centerY + Math.sin(angle) * petalRadius * 1.5
      );

      petals.push(
        `<ellipse cx="${petalX}" cy="${petalY}" rx="${petalRadius}" ry="${this.limitPrecision(petalRadius * 0.6)}" fill="${petalColor}" transform="rotate(${this.limitPrecision((angle * 180) / Math.PI)} ${petalX} ${petalY})"/>`
      );
    }

    // Add center
    petals.push(
      `<circle cx="${centerX}" cy="${centerY}" r="${centerRadius}" fill="${centerColor}"/>`
    );

    return `<g id="flower">${petals.join("")}</g>`;
  }

  private generateLeaf(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerX = this.limitPrecision(width / 2);
    const centerY = this.limitPrecision(height / 2);
    const leafWidth = this.limitPrecision(Math.min(width, height) * 0.3);
    const leafHeight = this.limitPrecision(leafWidth * 1.5);

    const color = colors[Math.floor(seededRandom() * colors.length)];

    // Create leaf shape using path
    const path = `M ${centerX} ${centerY - leafHeight / 2} 
                  Q ${centerX + leafWidth / 2} ${centerY} ${centerX} ${centerY + leafHeight / 2}
                  Q ${centerX - leafWidth / 2} ${centerY} ${centerX} ${centerY - leafHeight / 2}`;

    return `<path d="${path}" fill="${color}" id="leaf"/>`;
  }

  private generateTree(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerX = this.limitPrecision(width / 2);
    const groundY = this.limitPrecision(height * 0.8);
    const trunkWidth = this.limitPrecision(Math.min(width, height) * 0.05);
    const trunkHeight = this.limitPrecision(height * 0.3);
    const crownRadius = this.limitPrecision(Math.min(width, height) * 0.2);

    const trunkColor = colors[Math.floor(seededRandom() * colors.length)];
    const crownColor = colors[Math.floor(seededRandom() * colors.length)];

    const elements: string[] = [];

    // Trunk
    elements.push(
      `<rect x="${this.limitPrecision(centerX - trunkWidth / 2)}" y="${this.limitPrecision(groundY - trunkHeight)}" width="${trunkWidth}" height="${trunkHeight}" fill="${trunkColor}"/>`
    );

    // Crown
    elements.push(
      `<circle cx="${centerX}" cy="${this.limitPrecision(groundY - trunkHeight)}" r="${crownRadius}" fill="${crownColor}"/>`
    );

    return `<g id="tree">${elements.join("")}</g>`;
  }

  private generateHexagon(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerX = this.limitPrecision(width / 2);
    const centerY = this.limitPrecision(height / 2);
    const radius = this.limitPrecision(Math.min(width, height) * 0.3);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = this.limitPrecision(centerX + radius * Math.cos(angle));
      const y = this.limitPrecision(centerY + radius * Math.sin(angle));
      points.push(`${x},${y}`);
    }

    return `<polygon points="${points.join(" ")}" fill="${color}" id="hexagon"/>`;
  }

  private generatePentagon(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerX = this.limitPrecision(width / 2);
    const centerY = this.limitPrecision(height / 2);
    const radius = this.limitPrecision(Math.min(width, height) * 0.3);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    const points: string[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const x = this.limitPrecision(centerX + radius * Math.cos(angle));
      const y = this.limitPrecision(centerY + radius * Math.sin(angle));
      points.push(`${x},${y}`);
    }

    return `<polygon points="${points.join(" ")}" fill="${color}" id="pentagon"/>`;
  }

  private generateOctagon(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerX = this.limitPrecision(width / 2);
    const centerY = this.limitPrecision(height / 2);
    const radius = this.limitPrecision(Math.min(width, height) * 0.3);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    const points: string[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = this.limitPrecision(centerX + radius * Math.cos(angle));
      const y = this.limitPrecision(centerY + radius * Math.sin(angle));
      points.push(`${x},${y}`);
    }

    return `<polygon points="${points.join(" ")}" fill="${color}" id="octagon"/>`;
  }

  private generateDiamond(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerX = this.limitPrecision(width / 2);
    const centerY = this.limitPrecision(height / 2);
    const halfWidth = this.limitPrecision(Math.min(width, height) * 0.25);
    const halfHeight = this.limitPrecision(halfWidth * 1.2);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    const points = [
      `${centerX},${centerY - halfHeight}`,
      `${centerX + halfWidth},${centerY}`,
      `${centerX},${centerY + halfHeight}`,
      `${centerX - halfWidth},${centerY}`,
    ].join(" ");

    return `<polygon points="${points}" fill="${color}" id="diamond"/>`;
  }

  private generateHeart(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerX = this.limitPrecision(width / 2);
    const centerY = this.limitPrecision(height / 2);
    const size = this.limitPrecision(Math.min(width, height) * 0.15);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    // Heart shape using path
    const path = `M ${centerX} ${centerY + size}
                  C ${centerX} ${centerY + size}, ${centerX - size * 2} ${centerY - size}, ${centerX - size} ${centerY - size}
                  C ${centerX - size / 2} ${centerY - size * 1.5}, ${centerX + size / 2} ${centerY - size * 1.5}, ${centerX + size} ${centerY - size}
                  C ${centerX + size * 2} ${centerY - size}, ${centerX} ${centerY + size}, ${centerX} ${centerY + size}`;

    return `<path d="${path}" fill="${color}" id="heart"/>`;
  }

  private generateWave(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const color = colors[Math.floor(seededRandom() * colors.length)];
    const amplitude = this.limitPrecision(height * 0.2);
    const frequency = 2 + Math.floor(seededRandom() * 3);
    const centerY = this.limitPrecision(height / 2);

    const points: string[] = [];
    for (let x = 0; x <= width; x += 5) {
      const y = this.limitPrecision(
        centerY + amplitude * Math.sin((x / width) * frequency * 2 * Math.PI)
      );
      points.push(`${x},${y}`);
    }

    return `<polyline points="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="3" id="wave"/>`;
  }

  private generateSpiral(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerX = this.limitPrecision(width / 2);
    const centerY = this.limitPrecision(height / 2);
    const maxRadius = this.limitPrecision(Math.min(width, height) * 0.4);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    const points: string[] = [];
    const turns = 3;
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * turns * 2 * Math.PI;
      const radius = (i / steps) * maxRadius;
      const x = this.limitPrecision(centerX + radius * Math.cos(angle));
      const y = this.limitPrecision(centerY + radius * Math.sin(angle));
      points.push(`${x},${y}`);
    }

    return `<polyline points="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="2" id="spiral"/>`;
  }

  private generateArrow(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerY = this.limitPrecision(height / 2);
    const arrowLength = this.limitPrecision(width * 0.6);
    const arrowWidth = this.limitPrecision(height * 0.1);
    const headWidth = this.limitPrecision(height * 0.2);
    const startX = this.limitPrecision((width - arrowLength) / 2);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    const points = [
      `${startX},${centerY - arrowWidth / 2}`,
      `${startX + arrowLength - headWidth},${centerY - arrowWidth / 2}`,
      `${startX + arrowLength - headWidth},${centerY - headWidth / 2}`,
      `${startX + arrowLength},${centerY}`,
      `${startX + arrowLength - headWidth},${centerY + headWidth / 2}`,
      `${startX + arrowLength - headWidth},${centerY + arrowWidth / 2}`,
      `${startX},${centerY + arrowWidth / 2}`,
    ].join(" ");

    return `<polygon points="${points}" fill="${color}" id="arrow"/>`;
  }

  private generateMandala(
    width: number,
    height: number,
    colors: string[],
    seed: number
  ): string {
    const seededRandom = this.createSeededRandom(seed);
    const centerX = this.limitPrecision(width / 2);
    const centerY = this.limitPrecision(height / 2);
    const radius = this.limitPrecision(Math.min(width, height) * 0.4);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    const elements: string[] = [];
    const layers = 3;

    for (let layer = 0; layer < layers; layer++) {
      const layerRadius = radius * (1 - layer * 0.3);
      const petals = 8 + layer * 4;

      for (let i = 0; i < petals; i++) {
        const angle = (i * 2 * Math.PI) / petals;
        const x = this.limitPrecision(centerX + layerRadius * Math.cos(angle));
        const y = this.limitPrecision(centerY + layerRadius * Math.sin(angle));
        const petalRadius = this.limitPrecision(layerRadius * 0.2);

        elements.push(
          `<circle cx="${x}" cy="${y}" r="${petalRadius}" fill="${color}" opacity="${0.7 - layer * 0.2}"/>`
        );
      }
    }

    // Center circle
    elements.push(
      `<circle cx="${centerX}" cy="${centerY}" r="${this.limitPrecision(radius * 0.1)}" fill="${color}"/>`
    );

    return `<g id="mandala">${elements.join("")}</g>`;
  }

  private getDefaultPalette(): string[] {
    return ["#3B82F6", "#1E40AF", "#1D4ED8"];
  }

  private extractColorsFromPrompt(prompt: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const colorMap: Record<string, string[]> = {
      red: ["#DC2626", "#B91C1C", "#991B1B"],
      pink: ["#EC4899", "#DB2777", "#BE185D"],
      purple: ["#9333EA", "#7C3AED", "#6D28D9"],
      blue: ["#2563EB", "#1D4ED8", "#1E40AF"],
      green: ["#16A34A", "#15803D", "#166534"],
      yellow: ["#EAB308", "#CA8A04", "#A16207"],
      orange: ["#EA580C", "#DC2626", "#C2410C"],
      brown: ["#A16207", "#92400E", "#78350F"],
      black: ["#1F2937", "#111827", "#030712"],
      white: ["#F9FAFB", "#F3F4F6", "#E5E7EB"],
      gray: ["#6B7280", "#4B5563", "#374151"],
      grey: ["#6B7280", "#4B5563", "#374151"],
    };

    // Check for color keywords in the prompt
    for (const [colorName, palette] of Object.entries(colorMap)) {
      if (lowerPrompt.includes(colorName)) {
        return palette;
      }
    }

    // Default palette
    return this.getDefaultPalette();
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

  private limitPrecision(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
