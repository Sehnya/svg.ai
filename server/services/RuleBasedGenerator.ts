import { SVGGenerator } from "./SVGGenerator";
import { SVGSanitizer } from "./SVGSanitizer";
import { LayerAnalyzer } from "./LayerAnalyzer";
import { RegionManager } from "./RegionManager";
import { CoordinateMapper } from "./CoordinateMapper";
import { AspectRatioManager, AspectRatio } from "./AspectRatioManager";
import type {
  GenerationRequest,
  GenerationResponse,
  LayerInfo,
  SVGMetadata,
} from "../types";
import type {
  UnifiedLayeredSVGDocument,
  UnifiedLayer,
  UnifiedPath,
  PathCommand,
  PathStyle,
  LayoutSpecification,
  RegionName,
  AnchorPoint,
  UnifiedGenerationResponse,
  LayerMetadata,
  LayoutMetadata,
} from "../types/unified-layered";

interface ShapeTemplate {
  name: string;
  keywords: string[];
  generator: (
    width: number,
    height: number,
    colors: string[],
    seed: number
  ) => string;
  unifiedGenerator?: (
    canvas: { width: number; height: number; aspectRatio: AspectRatio },
    colors: string[],
    seed: number,
    regionManager: RegionManager,
    coordinateMapper: CoordinateMapper
  ) => UnifiedLayeredSVGDocument;
}

export class RuleBasedGenerator extends SVGGenerator {
  private sanitizer: SVGSanitizer;
  private layerAnalyzer: LayerAnalyzer;
  private templates: ShapeTemplate[];
  private regionManager: RegionManager;
  private coordinateMapper: CoordinateMapper;
  private unifiedMode: boolean;

  constructor(unifiedMode: boolean = false) {
    super();
    this.sanitizer = new SVGSanitizer();
    this.layerAnalyzer = new LayerAnalyzer();
    this.templates = this.initializeTemplates();
    this.unifiedMode = unifiedMode;

    // Initialize with default aspect ratio - will be updated per request
    this.regionManager = new RegionManager("1:1");
    this.coordinateMapper = new CoordinateMapper(512, 512, this.regionManager);
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
      // Check if unified mode is requested or enabled
      const useUnified =
        this.unifiedMode ||
        request.model === "unified" ||
        request.model === "rule-based-unified";

      if (useUnified) {
        return await this.generateUnified(request);
      }

      // Legacy generation path
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
        unifiedGenerator: (
          canvas,
          colors,
          seed,
          regionManager,
          coordinateMapper
        ) =>
          this.generateUnifiedCircle(
            canvas,
            colors,
            seed,
            regionManager,
            coordinateMapper
          ),
      },
      {
        name: "rectangle",
        keywords: ["rectangle", "rect", "square", "box", "card"],
        generator: (width, height, colors, seed) =>
          this.generateRectangle(width, height, colors, seed),
        unifiedGenerator: (
          canvas,
          colors,
          seed,
          regionManager,
          coordinateMapper
        ) =>
          this.generateUnifiedRectangle(
            canvas,
            colors,
            seed,
            regionManager,
            coordinateMapper
          ),
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
        unifiedGenerator: (
          canvas,
          colors,
          seed,
          regionManager,
          coordinateMapper
        ) =>
          this.generateUnifiedStar(
            canvas,
            colors,
            seed,
            regionManager,
            coordinateMapper
          ),
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

  /**
   * Generate SVG using unified layout language approach
   */
  async generateUnified(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    try {
      const seed = request.seed || this.generateSeed();
      const aspectRatio = this.determineAspectRatio(request);
      const colors =
        request.palette || this.extractColorsFromPrompt(request.prompt);

      // Update managers for current request
      this.regionManager.updateAspectRatio(aspectRatio);
      const dimensions = AspectRatioManager.getCanvasDimensions(aspectRatio);
      this.coordinateMapper.updateCanvasDimensions(
        dimensions.width,
        dimensions.height
      );

      // Parse prompt to determine shape type
      const template = this.selectTemplate(request.prompt);

      // Generate unified layered document
      const unifiedDoc = this.generateUnifiedDocument(
        template,
        {
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio,
        },
        colors,
        seed,
        request.prompt
      );

      // Convert to SVG
      const svg = this.convertUnifiedToSVG(unifiedDoc);

      // Generate metadata
      const layerMetadata = this.generateLayerMetadata(unifiedDoc);
      const layoutMetadata = this.generateLayoutMetadata(unifiedDoc);

      return {
        svg,
        meta: {
          width: dimensions.width,
          height: dimensions.height,
          viewBox: AspectRatioManager.getViewBox(
            aspectRatio,
            dimensions.width,
            dimensions.height
          ),
          backgroundColor: "transparent",
          palette: colors,
          description: `Generated unified SVG based on prompt: "${request.prompt}"`,
          seed,
        },
        layers: this.convertToLegacyLayers(layerMetadata),
        warnings: [],
        errors: [],
      };
    } catch (error) {
      return {
        svg: "",
        meta: this.createEmptyMetadata(),
        layers: [],
        warnings: [],
        errors: [
          `Unified generation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      };
    }
  }

  /**
   * Generate unified layered SVG document
   */
  private generateUnifiedDocument(
    template: ShapeTemplate,
    canvas: { width: number; height: number; aspectRatio: AspectRatio },
    colors: string[],
    seed: number,
    prompt: string
  ): UnifiedLayeredSVGDocument {
    // Use unified generator if available, otherwise convert legacy
    if (template.unifiedGenerator) {
      return template.unifiedGenerator(
        canvas,
        colors,
        seed,
        this.regionManager,
        this.coordinateMapper
      );
    }

    // Convert legacy template to unified format
    return this.convertLegacyToUnified(template, canvas, colors, seed, prompt);
  }

  /**
   * Convert legacy template to unified format
   */
  private convertLegacyToUnified(
    template: ShapeTemplate,
    canvas: { width: number; height: number; aspectRatio: AspectRatio },
    colors: string[],
    seed: number,
    prompt: string
  ): UnifiedLayeredSVGDocument {
    // Generate legacy SVG content
    const legacySvgContent = template.generator(
      canvas.width,
      canvas.height,
      colors,
      seed
    );

    // Parse and convert to unified format
    const paths = this.parseLegacySVGToUnifiedPaths(
      legacySvgContent,
      colors[0]
    );

    // Determine appropriate region based on template type
    const region = this.selectRegionForTemplate(template, prompt);

    // Create unified layer
    const layer: UnifiedLayer = {
      id: `${template.name}_layer`,
      label: `${template.name.charAt(0).toUpperCase() + template.name.slice(1)} Layer`,
      layout: {
        region,
        anchor: "center",
        offset: [0, 0],
      },
      paths,
    };

    return {
      version: "unified-layered-1.0",
      canvas,
      layers: [layer],
    };
  }

  /**
   * Parse legacy SVG content to unified paths
   */
  private parseLegacySVGToUnifiedPaths(
    svgContent: string,
    defaultColor: string
  ): UnifiedPath[] {
    const paths: UnifiedPath[] = [];

    // Simple regex-based parsing for basic shapes
    // This is a simplified approach - in production, you'd want proper SVG parsing

    // Parse circles
    const circleMatches = svgContent.matchAll(
      /<circle[^>]*cx="([^"]*)"[^>]*cy="([^"]*)"[^>]*r="([^"]*)"[^>]*(?:fill="([^"]*)")?[^>]*(?:stroke="([^"]*)")?[^>]*(?:stroke-width="([^"]*)")?[^>]*\/?>|<circle[^>]*r="([^"]*)"[^>]*cx="([^"]*)"[^>]*cy="([^"]*)"[^>]*(?:fill="([^"]*)")?[^>]*(?:stroke="([^"]*)")?[^>]*(?:stroke-width="([^"]*)")?[^>]*\/?>/g
    );

    for (const match of circleMatches) {
      const cx = parseFloat(match[1] || match[8] || "0");
      const cy = parseFloat(match[2] || match[9] || "0");
      const r = parseFloat(match[3] || match[7] || "10");
      const fill = match[4] || match[10] || defaultColor;
      const stroke = match[5] || match[11] || "none";
      const strokeWidth = parseFloat(match[6] || match[12] || "0");

      // Convert circle to path commands (approximation with 8 points)
      const commands: PathCommand[] = [];
      const points = 8;

      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        const x = this.limitPrecision(cx + r * Math.cos(angle));
        const y = this.limitPrecision(cy + r * Math.sin(angle));

        if (i === 0) {
          commands.push({ cmd: "M", coords: [x, y] });
        } else {
          commands.push({ cmd: "L", coords: [x, y] });
        }
      }
      commands.push({ cmd: "Z", coords: [] });

      paths.push({
        id: `circle_${paths.length}`,
        style: {
          fill: fill === "none" ? undefined : fill,
          stroke: stroke === "none" ? undefined : stroke,
          strokeWidth: strokeWidth > 0 ? strokeWidth : undefined,
        },
        commands,
      });
    }

    // Parse rectangles
    const rectMatches = svgContent.matchAll(
      /<rect[^>]*x="([^"]*)"[^>]*y="([^"]*)"[^>]*width="([^"]*)"[^>]*height="([^"]*)"[^>]*(?:fill="([^"]*)")?[^>]*(?:stroke="([^"]*)")?[^>]*(?:stroke-width="([^"]*)")?[^>]*\/?>/g
    );

    for (const match of rectMatches) {
      const x = parseFloat(match[1] || "0");
      const y = parseFloat(match[2] || "0");
      const width = parseFloat(match[3] || "10");
      const height = parseFloat(match[4] || "10");
      const fill = match[5] || defaultColor;
      const stroke = match[6] || "none";
      const strokeWidth = parseFloat(match[7] || "0");

      const commands: PathCommand[] = [
        { cmd: "M", coords: [x, y] },
        { cmd: "L", coords: [x + width, y] },
        { cmd: "L", coords: [x + width, y + height] },
        { cmd: "L", coords: [x, y + height] },
        { cmd: "Z", coords: [] },
      ];

      paths.push({
        id: `rect_${paths.length}`,
        style: {
          fill: fill === "none" ? undefined : fill,
          stroke: stroke === "none" ? undefined : stroke,
          strokeWidth: strokeWidth > 0 ? strokeWidth : undefined,
        },
        commands,
      });
    }

    // Parse polygons
    const polygonMatches = svgContent.matchAll(
      /<polygon[^>]*points="([^"]*)"[^>]*(?:fill="([^"]*)")?[^>]*(?:stroke="([^"]*)")?[^>]*(?:stroke-width="([^"]*)")?[^>]*\/?>/g
    );

    for (const match of polygonMatches) {
      const pointsStr = match[1] || "";
      const fill = match[2] || defaultColor;
      const stroke = match[3] || "none";
      const strokeWidth = parseFloat(match[4] || "0");

      const points = pointsStr
        .split(/[\s,]+/)
        .map((p) => parseFloat(p))
        .filter((n) => !isNaN(n));
      const commands: PathCommand[] = [];

      for (let i = 0; i < points.length; i += 2) {
        if (i + 1 < points.length) {
          const x = this.limitPrecision(points[i]);
          const y = this.limitPrecision(points[i + 1]);

          if (i === 0) {
            commands.push({ cmd: "M", coords: [x, y] });
          } else {
            commands.push({ cmd: "L", coords: [x, y] });
          }
        }
      }
      if (commands.length > 0) {
        commands.push({ cmd: "Z", coords: [] });
      }

      paths.push({
        id: `polygon_${paths.length}`,
        style: {
          fill: fill === "none" ? undefined : fill,
          stroke: stroke === "none" ? undefined : stroke,
          strokeWidth: strokeWidth > 0 ? strokeWidth : undefined,
        },
        commands,
      });
    }

    // If no paths were parsed, create a simple default shape
    if (paths.length === 0) {
      paths.push({
        id: "default_shape",
        style: {
          fill: defaultColor,
          stroke: "none",
        },
        commands: [
          { cmd: "M", coords: [200, 200] },
          { cmd: "L", coords: [312, 200] },
          { cmd: "L", coords: [312, 312] },
          { cmd: "L", coords: [200, 312] },
          { cmd: "Z", coords: [] },
        ],
      });
    }

    return paths;
  }

  /**
   * Select appropriate region for template type
   */
  private selectRegionForTemplate(
    template: ShapeTemplate,
    prompt: string
  ): RegionName {
    const lowerPrompt = prompt.toLowerCase();

    // Check for position hints in prompt
    if (lowerPrompt.includes("top")) return "top_center";
    if (lowerPrompt.includes("bottom")) return "bottom_center";
    if (lowerPrompt.includes("left")) return "middle_left";
    if (lowerPrompt.includes("right")) return "middle_right";
    if (lowerPrompt.includes("corner")) return "top_left";

    // Template-specific region selection
    switch (template.name) {
      case "tree":
        return "bottom_center"; // Trees typically grow from bottom
      case "flower":
        return "center"; // Flowers in center
      case "star":
        return "top_center"; // Stars in sky
      case "heart":
        return "center"; // Hearts in center
      case "arrow":
        return "center"; // Arrows pointing direction
      case "icon":
        return "center"; // Icons centered
      default:
        return "center"; // Default to center
    }
  }

  /**
   * Convert unified document to SVG string
   */
  private convertUnifiedToSVG(doc: UnifiedLayeredSVGDocument): string {
    const { canvas, layers } = doc;
    const parts: string[] = [];

    // Process each layer
    for (const layer of layers) {
      parts.push(`<!-- Layer: ${layer.label} -->`);
      parts.push(`<g id="${layer.id}" data-label="${layer.label}">`);

      // Process each path in the layer
      for (const path of layer.paths) {
        const pathElement = this.createPathElement(path);
        parts.push(`  ${pathElement}`);
      }

      parts.push(`</g>`);
    }

    const viewBox = AspectRatioManager.getViewBox(
      canvas.aspectRatio,
      canvas.width,
      canvas.height
    );

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${canvas.width}" height="${canvas.height}">
${parts.join("\n")}
</svg>`;
  }

  /**
   * Create SVG path element from unified path
   */
  private createPathElement(path: UnifiedPath): string {
    const d = this.buildPathData(path.commands);
    const style = this.buildStyleAttributes(path.style);

    return `<path id="${path.id}" d="${d}"${style}/>`;
  }

  /**
   * Build path data string from commands
   */
  private buildPathData(commands: PathCommand[]): string {
    return commands
      .map((cmd) => {
        if (cmd.cmd === "Z") return "Z";
        return `${cmd.cmd} ${cmd.coords.join(" ")}`;
      })
      .join(" ");
  }

  /**
   * Build style attributes from path style
   */
  private buildStyleAttributes(style: PathStyle): string {
    const attrs: string[] = [];

    attrs.push(`fill="${style.fill || "none"}"`);
    attrs.push(`stroke="${style.stroke || "none"}"`);

    if (style.strokeWidth) attrs.push(`stroke-width="${style.strokeWidth}"`);
    if (style.strokeLinecap)
      attrs.push(`stroke-linecap="${style.strokeLinecap}"`);
    if (style.strokeLinejoin)
      attrs.push(`stroke-linejoin="${style.strokeLinejoin}"`);
    if (style.opacity !== undefined) attrs.push(`opacity="${style.opacity}"`);

    return attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
  }

  /**
   * Generate layer metadata from unified document
   */
  private generateLayerMetadata(
    doc: UnifiedLayeredSVGDocument
  ): LayerMetadata[] {
    return doc.layers.map((layer) => {
      // Calculate bounds for the layer
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      layer.paths.forEach((path) => {
        path.commands.forEach((cmd) => {
          if (cmd.cmd !== "Z") {
            for (let i = 0; i < cmd.coords.length; i += 2) {
              const x = cmd.coords[i];
              const y = cmd.coords[i + 1];
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        });
      });

      return {
        id: layer.id,
        label: layer.label,
        pathCount: layer.paths.length,
        region: layer.layout?.region,
        anchor: layer.layout?.anchor,
        bounds: {
          x: minX === Infinity ? 0 : minX,
          y: minY === Infinity ? 0 : minY,
          width: maxX === -Infinity ? 0 : maxX - minX,
          height: maxY === -Infinity ? 0 : maxY - minY,
        },
      };
    });
  }

  /**
   * Generate layout metadata from unified document
   */
  private generateLayoutMetadata(
    doc: UnifiedLayeredSVGDocument
  ): LayoutMetadata {
    const usedRegions = new Set<string>();
    const usedAnchors = new Set<AnchorPoint>();

    // Collect used regions and anchors
    doc.layers.forEach((layer) => {
      if (layer.layout?.region) {
        usedRegions.add(layer.layout.region);
      }
      if (layer.layout?.anchor) {
        usedAnchors.add(layer.layout.anchor);
      }

      layer.paths.forEach((path) => {
        if (path.layout?.region) {
          usedRegions.add(path.layout.region);
        }
        if (path.layout?.anchor) {
          usedAnchors.add(path.layout.anchor);
        }
      });
    });

    // Get all regions with usage info
    const regions = this.regionManager.getAllRegions().map((region) => ({
      name: region.name,
      bounds: {
        x: region.pixelBounds.x,
        y: region.pixelBounds.y,
        width: region.pixelBounds.width,
        height: region.pixelBounds.height,
      },
      used: usedRegions.has(region.name),
    }));

    // Calculate coordinate range
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    doc.layers.forEach((layer) => {
      layer.paths.forEach((path) => {
        path.commands.forEach((cmd) => {
          if (cmd.cmd !== "Z") {
            for (let i = 0; i < cmd.coords.length; i += 2) {
              const x = cmd.coords[i];
              const y = cmd.coords[i + 1];
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        });
      });
    });

    return {
      regions,
      anchorsUsed: Array.from(usedAnchors),
      coordinateRange: {
        minX: minX === Infinity ? 0 : minX,
        maxX: maxX === -Infinity ? 512 : maxX,
        minY: minY === Infinity ? 0 : minY,
        maxY: maxY === -Infinity ? 512 : maxY,
      },
    };
  }

  /**
   * Convert unified layer metadata to legacy format
   */
  private convertToLegacyLayers(layerMetadata: LayerMetadata[]): LayerInfo[] {
    return layerMetadata.map((layer) => ({
      id: layer.id,
      name: layer.label,
      elementCount: layer.pathCount,
      bounds: layer.bounds,
      visible: true,
      opacity: 1,
    }));
  }

  /**
   * Determine aspect ratio from request
   */
  private determineAspectRatio(request: GenerationRequest): AspectRatio {
    // Check if aspect ratio is specified in request
    if (request.aspectRatio) {
      return request.aspectRatio;
    }

    // Infer from size if available
    if (request.size) {
      const { width, height } = request.size;
      const ratio = width / height;

      if (Math.abs(ratio - 1) < 0.1) return "1:1";
      if (Math.abs(ratio - 4 / 3) < 0.1) return "4:3";
      if (Math.abs(ratio - 16 / 9) < 0.1) return "16:9";
      if (Math.abs(ratio - 3 / 2) < 0.1) return "3:2";
      if (Math.abs(ratio - 2 / 3) < 0.1) return "2:3";
      if (Math.abs(ratio - 9 / 16) < 0.1) return "9:16";
    }

    // Default to square
    return "1:1";
  }

  /**
   * Enable or disable unified mode
   */
  setUnifiedMode(enabled: boolean): void {
    this.unifiedMode = enabled;
  }

  /**
   * Check if unified mode is enabled
   */
  isUnifiedMode(): boolean {
    return this.unifiedMode;
  }

  // Unified generators for specific shapes

  /**
   * Generate unified circle using semantic regions
   */
  private generateUnifiedCircle(
    canvas: { width: number; height: number; aspectRatio: AspectRatio },
    colors: string[],
    seed: number,
    regionManager: RegionManager,
    coordinateMapper: CoordinateMapper
  ): UnifiedLayeredSVGDocument {
    const seededRandom = this.createSeededRandom(seed);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    // Use center region for main circle
    const layout: LayoutSpecification = {
      region: "center",
      anchor: "center",
      offset: [0, 0],
      size: {
        relative: 0.6, // 60% of region size
      },
    };

    const position = coordinateMapper.calculatePosition(layout);
    const radius = Math.min(position.width || 100, position.height || 100) / 2;

    // Generate circle as path commands
    const commands: PathCommand[] = [];
    const points = 16; // Smooth circle with 16 points

    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const x = this.limitPrecision(position.x + radius * Math.cos(angle));
      const y = this.limitPrecision(position.y + radius * Math.sin(angle));

      if (i === 0) {
        commands.push({ cmd: "M", coords: [x, y] });
      } else {
        commands.push({ cmd: "L", coords: [x, y] });
      }
    }
    commands.push({ cmd: "Z", coords: [] });

    const path: UnifiedPath = {
      id: "main_circle",
      style: {
        fill: color,
        stroke:
          seededRandom() > 0.5
            ? colors[Math.floor(seededRandom() * colors.length)]
            : undefined,
        strokeWidth:
          seededRandom() > 0.5 ? 2 + Math.floor(seededRandom() * 3) : undefined,
      },
      commands,
      layout,
    };

    const layer: UnifiedLayer = {
      id: "circle_layer",
      label: "Circle",
      layout: {
        region: "center",
        anchor: "center",
      },
      paths: [path],
    };

    return {
      version: "unified-layered-1.0",
      canvas,
      layers: [layer],
    };
  }

  /**
   * Generate unified rectangle using semantic regions
   */
  private generateUnifiedRectangle(
    canvas: { width: number; height: number; aspectRatio: AspectRatio },
    colors: string[],
    seed: number,
    regionManager: RegionManager,
    coordinateMapper: CoordinateMapper
  ): UnifiedLayeredSVGDocument {
    const seededRandom = this.createSeededRandom(seed);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    const layout: LayoutSpecification = {
      region: "center",
      anchor: "center",
      offset: [0, 0],
      size: {
        relative: 0.7, // 70% of region size
      },
    };

    const position = coordinateMapper.calculatePosition(layout);
    const width = position.width || 100;
    const height = position.height || 100;

    // Calculate rectangle corners
    const left = position.x - width / 2;
    const top = position.y - height / 2;
    const right = left + width;
    const bottom = top + height;

    const commands: PathCommand[] = [
      {
        cmd: "M",
        coords: [this.limitPrecision(left), this.limitPrecision(top)],
      },
      {
        cmd: "L",
        coords: [this.limitPrecision(right), this.limitPrecision(top)],
      },
      {
        cmd: "L",
        coords: [this.limitPrecision(right), this.limitPrecision(bottom)],
      },
      {
        cmd: "L",
        coords: [this.limitPrecision(left), this.limitPrecision(bottom)],
      },
      { cmd: "Z", coords: [] },
    ];

    const path: UnifiedPath = {
      id: "main_rectangle",
      style: {
        fill: color,
        stroke:
          seededRandom() > 0.3
            ? colors[Math.floor(seededRandom() * colors.length)]
            : undefined,
        strokeWidth:
          seededRandom() > 0.3 ? 1 + Math.floor(seededRandom() * 3) : undefined,
      },
      commands,
      layout,
    };

    const layer: UnifiedLayer = {
      id: "rectangle_layer",
      label: "Rectangle",
      layout: {
        region: "center",
        anchor: "center",
      },
      paths: [path],
    };

    return {
      version: "unified-layered-1.0",
      canvas,
      layers: [layer],
    };
  }

  /**
   * Generate unified star using semantic regions
   */
  private generateUnifiedStar(
    canvas: { width: number; height: number; aspectRatio: AspectRatio },
    colors: string[],
    seed: number,
    regionManager: RegionManager,
    coordinateMapper: CoordinateMapper
  ): UnifiedLayeredSVGDocument {
    const seededRandom = this.createSeededRandom(seed);
    const color = colors[Math.floor(seededRandom() * colors.length)];

    const layout: LayoutSpecification = {
      region: "center",
      anchor: "center",
      offset: [0, 0],
      size: {
        relative: 0.6,
      },
    };

    const position = coordinateMapper.calculatePosition(layout);
    const outerRadius =
      Math.min(position.width || 100, position.height || 100) / 2;
    const innerRadius = outerRadius * 0.4;

    // Generate 5-pointed star
    const commands: PathCommand[] = [];
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = this.limitPrecision(position.x + radius * Math.cos(angle));
      const y = this.limitPrecision(position.y + radius * Math.sin(angle));

      if (i === 0) {
        commands.push({ cmd: "M", coords: [x, y] });
      } else {
        commands.push({ cmd: "L", coords: [x, y] });
      }
    }
    commands.push({ cmd: "Z", coords: [] });

    const path: UnifiedPath = {
      id: "main_star",
      style: {
        fill: color,
        stroke:
          seededRandom() > 0.4
            ? colors[Math.floor(seededRandom() * colors.length)]
            : undefined,
        strokeWidth:
          seededRandom() > 0.4 ? 1 + Math.floor(seededRandom() * 2) : undefined,
      },
      commands,
      layout,
    };

    const layer: UnifiedLayer = {
      id: "star_layer",
      label: "Star",
      layout: {
        region: "center",
        anchor: "center",
      },
      paths: [path],
    };

    return {
      version: "unified-layered-1.0",
      canvas,
      layers: [layer],
    };
  }
}
