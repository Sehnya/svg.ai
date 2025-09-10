/**
 * SVGSynthesizer - Generates SVG documents using strict schemas with component reuse
 * Enhanced to process unified language with layout specifications and coordinate conversion
 */
import type {
  CompositionPlan,
  AISVGDocument,
  SVGComponent,
  DocumentMetadata,
} from "../types/pipeline.js";
import { AISVGDocumentSchema } from "../schemas/pipeline.js";
import { ComponentLibrary } from "./ComponentLibrary.js";
import type {
  GroundingData,
  UnifiedCompositionPlan,
} from "./CompositionPlanner.js";
import type {
  LayoutSpecification,
  UnifiedLayeredSVGDocument,
  AspectRatio,
  RegionName,
  AnchorPoint,
} from "../types/unified-layered.js";
import { RegionManager } from "./RegionManager.js";
import { CoordinateMapper } from "./CoordinateMapper.js";
import { ConstrainedSVGGenerator } from "./ConstrainedSVGGenerator.js";
import { LayeredSVGGenerator } from "./LayeredSVGGenerator.js";

export interface SynthesisContext {
  prompt: string;
  seed?: number;
  model?: string;
  userId?: string;
  aspectRatio?: AspectRatio;
  useUnifiedLayout?: boolean; // Enable unified layout processing
}

export interface UnifiedSynthesisOptions {
  enableLayoutLanguage?: boolean;
  enforceCanvasConstraints?: boolean;
  useConstrainedGenerator?: boolean;
  useLayeredGenerator?: boolean;
  fallbackToTraditional?: boolean;
}

export interface UnifiedSynthesisResult {
  document: AISVGDocument;
  unifiedDocument?: UnifiedLayeredSVGDocument;
  layoutSpecifications?: LayoutSpecification[];
  coordinateMapping?: {
    originalPositions: Array<{ x: number; y: number }>;
    mappedPositions: Array<{ x: number; y: number }>;
  };
  metadata: {
    synthesisMethod: "traditional" | "unified" | "constrained" | "layered";
    layoutProcessed: boolean;
    coordinatesConverted: boolean;
  };
}

export class SVGSynthesizer {
  private componentLibrary: ComponentLibrary;
  private regionManager: RegionManager;
  private coordinateMapper: CoordinateMapper;
  private constrainedGenerator?: ConstrainedSVGGenerator;
  private layeredGenerator?: LayeredSVGGenerator;

  constructor(aspectRatio: AspectRatio = "1:1") {
    this.componentLibrary = new ComponentLibrary();
    this.regionManager = new RegionManager(aspectRatio);
    this.coordinateMapper = new CoordinateMapper(512, 512, this.regionManager);
  }

  /**
   * Initialize generators for unified synthesis
   */
  initializeUnifiedGenerators(apiKey?: string): void {
    this.constrainedGenerator = new ConstrainedSVGGenerator();
    if (apiKey) {
      this.layeredGenerator = new LayeredSVGGenerator(apiKey);
    }
  }

  /**
   * Synthesize with unified layout specifications
   */
  async synthesizeUnified(
    plan: UnifiedCompositionPlan,
    grounding: GroundingData,
    context: SynthesisContext,
    options: UnifiedSynthesisOptions = {}
  ): Promise<UnifiedSynthesisResult> {
    const opts: Required<UnifiedSynthesisOptions> = {
      enableLayoutLanguage: true,
      enforceCanvasConstraints: true,
      useConstrainedGenerator: false,
      useLayeredGenerator: false,
      fallbackToTraditional: true,
      ...options,
    };

    // Update coordinate system for current aspect ratio
    if (context.aspectRatio) {
      this.updateAspectRatio(context.aspectRatio);
    }

    try {
      // Try layered generation first if enabled
      if (opts.useLayeredGenerator && this.layeredGenerator) {
        return await this.synthesizeWithLayeredGenerator(
          plan,
          grounding,
          context
        );
      }

      // Try constrained generation if enabled
      if (opts.useConstrainedGenerator && this.constrainedGenerator) {
        return await this.synthesizeWithConstrainedGenerator(
          plan,
          grounding,
          context
        );
      }

      // Use unified layout processing
      if (opts.enableLayoutLanguage) {
        return await this.synthesizeWithUnifiedLayout(plan, grounding, context);
      }

      // Fallback to traditional synthesis
      if (opts.fallbackToTraditional) {
        const traditionalPlan = this.convertToTraditionalPlan(plan);
        const document = await this.synthesize(
          traditionalPlan,
          grounding,
          context
        );

        return {
          document,
          metadata: {
            synthesisMethod: "traditional",
            layoutProcessed: false,
            coordinatesConverted: false,
          },
        };
      }

      throw new Error("No synthesis method available");
    } catch (error) {
      if (opts.fallbackToTraditional) {
        console.warn(
          "Unified synthesis failed, falling back to traditional:",
          error
        );
        const traditionalPlan = this.convertToTraditionalPlan(plan);
        const document = await this.synthesize(
          traditionalPlan,
          grounding,
          context
        );

        return {
          document,
          metadata: {
            synthesisMethod: "traditional",
            layoutProcessed: false,
            coordinatesConverted: false,
          },
        };
      }
      throw error;
    }
  }

  async synthesize(
    plan: CompositionPlan,
    grounding: GroundingData,
    context: SynthesisContext
  ): Promise<AISVGDocument> {
    // Generate components from composition plan
    const components = await this.generateComponents(plan, grounding);

    // Create document metadata
    const metadata = this.createMetadata(plan, context, grounding);

    // Assemble document
    const document: AISVGDocument = {
      components,
      metadata,
      bounds: plan.layout.bounds,
      palette: this.extractPalette(plan, grounding),
    };

    // Validate document structure with schema
    const validationResult = AISVGDocumentSchema.safeParse(document);
    if (!validationResult.success) {
      console.warn(
        `SVG document validation warning: ${validationResult.error.message}`
      );
      // Continue with generation but log the validation issue
    }

    return document;
  }

  private async generateComponents(
    plan: CompositionPlan,
    grounding: GroundingData
  ): Promise<SVGComponent[]> {
    const components: SVGComponent[] = [];

    for (let i = 0; i < plan.components.length; i++) {
      const componentPlan = plan.components[i];
      const zIndex = plan.zIndex[i];

      const component = await this.createComponent(
        componentPlan,
        grounding,
        zIndex
      );
      if (component) {
        components.push(component);
      }
    }

    return components;
  }

  private async createComponent(
    componentPlan: any,
    grounding: GroundingData,
    zIndex: number
  ): Promise<SVGComponent | null> {
    const { id, type, position, size, rotation, style, motif } = componentPlan;

    // Try to reuse existing components from grounding
    const reusedComponent = this.tryReuseComponent(componentPlan, grounding);
    if (reusedComponent) {
      return this.adaptComponent(reusedComponent, componentPlan, zIndex);
    }

    // Try component library templates
    const libraryComponent = this.tryLibraryComponent(componentPlan);
    if (libraryComponent) {
      return this.enhanceComponent(libraryComponent, zIndex);
    }

    // Generate basic component
    return this.generateBasicComponent(componentPlan, zIndex);
  }

  private tryReuseComponent(
    componentPlan: any,
    grounding: GroundingData
  ): SVGComponent | null {
    if (!grounding.components || grounding.components.length === 0) {
      return null;
    }

    // Find matching component by motif or type
    const matchingComponent = grounding.components.find(
      (comp) =>
        comp.motif === componentPlan.motif || comp.type === componentPlan.type
    );

    return matchingComponent || null;
  }

  private adaptComponent(
    baseComponent: SVGComponent,
    componentPlan: any,
    zIndex: number
  ): SVGComponent {
    const { position, size, style, rotation } = componentPlan;

    // Validate input coordinates and dimensions
    this.validateCoordinates(position, size);

    // Clone and adapt the component
    const adapted: SVGComponent = {
      ...baseComponent,
      id: componentPlan.id,
      attributes: { ...baseComponent.attributes },
      metadata: {
        ...baseComponent.metadata,
        reused: true,
      },
    };

    // Apply transformations based on element type
    switch (adapted.element) {
      case "circle":
        adapted.attributes.cx = this.sanitizeNumber(position.x);
        adapted.attributes.cy = this.sanitizeNumber(position.y);
        adapted.attributes.r = this.sanitizeNumber(
          Math.min(size.width, size.height) / 2
        );
        break;

      case "rect":
        adapted.attributes.x = this.sanitizeNumber(position.x - size.width / 2);
        adapted.attributes.y = this.sanitizeNumber(
          position.y - size.height / 2
        );
        adapted.attributes.width = this.sanitizeNumber(size.width);
        adapted.attributes.height = this.sanitizeNumber(size.height);
        break;

      case "polygon":
        // Scale and position polygon points
        if (typeof adapted.attributes.points === "string") {
          adapted.attributes.points = this.transformPolygonPoints(
            adapted.attributes.points as string,
            position,
            size
          );
        }
        break;

      case "path":
        // Transform path data (simplified)
        if (typeof adapted.attributes.d === "string") {
          adapted.attributes.d = this.transformPathData(
            adapted.attributes.d as string,
            position,
            size
          );
        }
        break;
    }

    // Apply styling
    this.applyStyle(adapted, style);

    // Apply rotation if needed
    if (rotation !== 0) {
      adapted.attributes.transform = `rotate(${rotation} ${position.x} ${position.y})`;
    }

    return adapted;
  }

  private tryLibraryComponent(componentPlan: any): SVGComponent | null {
    const { motif, type, position, size, style } = componentPlan;

    // Find suitable template
    const templates = this.componentLibrary.findTemplates({
      tags: motif ? [motif] : undefined,
      type: type,
    });

    if (templates.length === 0) {
      return null;
    }

    // Use the first matching template
    const template = templates[0];
    return this.componentLibrary.instantiateComponent(
      template.id,
      style,
      position,
      size
    );
  }

  private enhanceComponent(
    component: SVGComponent,
    zIndex: number
  ): SVGComponent {
    return {
      ...component,
      metadata: {
        ...component.metadata,
        generated: true,
      },
    };
  }

  private generateBasicComponent(
    componentPlan: any,
    zIndex: number
  ): SVGComponent {
    const { id, type, position, size, style, motif } = componentPlan;

    // Validate input coordinates and dimensions
    this.validateCoordinates(position, size);

    const attributes: Record<string, string | number> = {};

    // Generate attributes based on element type
    switch (type) {
      case "circle":
        attributes.cx = this.sanitizeNumber(position.x);
        attributes.cy = this.sanitizeNumber(position.y);
        attributes.r = this.sanitizeNumber(
          Math.min(size.width, size.height) / 2
        );
        break;

      case "rect":
        attributes.x = this.sanitizeNumber(position.x - size.width / 2);
        attributes.y = this.sanitizeNumber(position.y - size.height / 2);
        attributes.width = this.sanitizeNumber(size.width);
        attributes.height = this.sanitizeNumber(size.height);
        break;

      case "polygon":
        // Generate triangle by default
        const points = [
          `${position.x},${position.y - size.height / 2}`,
          `${position.x - size.width / 2},${position.y + size.height / 2}`,
          `${position.x + size.width / 2},${position.y + size.height / 2}`,
        ].join(" ");
        attributes.points = points;
        break;

      case "path":
        // Generate simple path
        attributes.d = this.generateSimplePath(position, size, motif);
        break;

      case "line":
        attributes.x1 = this.sanitizeNumber(position.x - size.width / 2);
        attributes.y1 = this.sanitizeNumber(position.y);
        attributes.x2 = this.sanitizeNumber(position.x + size.width / 2);
        attributes.y2 = this.sanitizeNumber(position.y);
        break;

      case "ellipse":
        attributes.cx = this.sanitizeNumber(position.x);
        attributes.cy = this.sanitizeNumber(position.y);
        attributes.rx = this.sanitizeNumber(size.width / 2);
        attributes.ry = this.sanitizeNumber(size.height / 2);
        break;

      default:
        // Default to circle
        attributes.cx = this.sanitizeNumber(position.x);
        attributes.cy = this.sanitizeNumber(position.y);
        attributes.r = this.sanitizeNumber(
          Math.min(size.width, size.height) / 2
        );
    }

    const component: SVGComponent = {
      id,
      type: motif || type,
      element: type as any,
      attributes,
      metadata: {
        motif,
        generated: true,
        reused: false,
      },
    };

    // Apply styling
    this.applyStyle(component, style);

    return component;
  }

  private applyStyle(component: SVGComponent, style: any) {
    if (style.fill) {
      component.attributes.fill = style.fill;
    }
    if (style.stroke) {
      component.attributes.stroke = style.stroke;
    }
    if (style.strokeWidth) {
      component.attributes["stroke-width"] = style.strokeWidth;
    }
    if (style.opacity) {
      component.attributes.opacity = style.opacity;
    }
  }

  private transformPolygonPoints(
    points: string,
    position: { x: number; y: number },
    size: { width: number; height: number }
  ): string {
    // Parse points and transform them
    const pointPairs = points.split(" ").map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return {
        x: position.x + (x - 50) * (size.width / 100), // Assuming original is 100x100
        y: position.y + (y - 50) * (size.height / 100),
      };
    });

    return pointPairs
      .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");
  }

  private transformPathData(
    pathData: string,
    position: { x: number; y: number },
    size: { width: number; height: number }
  ): string {
    // Simplified path transformation - in practice this would be more sophisticated
    // For now, just translate the path
    return `M${position.x - size.width / 2},${position.y} ${pathData.substring(1)}`;
  }

  private generateSimplePath(
    position: { x: number; y: number },
    size: { width: number; height: number },
    motif?: string
  ): string {
    const { x, y } = position;
    const { width, height } = size;

    // Generate different paths based on motif
    switch (motif) {
      case "wave":
        return `M${x - width / 2},${y} Q${x - width / 4},${y - height / 2} ${x},${y} Q${x + width / 4},${y + height / 2} ${x + width / 2},${y}`;

      case "leaf":
        return `M${x},${y - height / 2} Q${x + width / 4},${y - height / 4} ${x + width / 8},${y} Q${x + width / 4},${y + height / 4} ${x},${y + height / 2} Q${x - width / 4},${y + height / 4} ${x - width / 8},${y} Q${x - width / 4},${y - height / 4} ${x},${y - height / 2} Z`;

      case "star":
        // Simple 5-pointed star
        const points = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5;
          const radius = i % 2 === 0 ? width / 2 : width / 4;
          const px = x + Math.cos(angle - Math.PI / 2) * radius;
          const py = y + Math.sin(angle - Math.PI / 2) * radius;
          points.push(i === 0 ? `M${px},${py}` : `L${px},${py}`);
        }
        return points.join(" ") + " Z";

      default:
        // Simple curved path
        return `M${x - width / 2},${y} Q${x},${y - height / 2} ${x + width / 2},${y}`;
    }
  }

  private createMetadata(
    plan: CompositionPlan,
    context: SynthesisContext,
    grounding: GroundingData
  ): DocumentMetadata {
    return {
      prompt: context.prompt,
      seed: context.seed,
      palette: this.extractPalette(plan, grounding),
      description: this.generateDescription(plan, context),
      generatedAt: new Date(),
      model: context.model || "synthesizer-v1",
      usedObjects: this.extractUsedObjects(grounding),
    };
  }

  private extractPalette(
    plan: CompositionPlan,
    grounding: GroundingData
  ): string[] {
    const colors = new Set<string>();

    // Extract colors from components
    for (const component of plan.components) {
      if (component.style.fill && component.style.fill !== "none") {
        colors.add(component.style.fill);
      }
      if (component.style.stroke) {
        colors.add(component.style.stroke);
      }
    }

    // Add background color if present
    if (plan.layout.background) {
      colors.add(plan.layout.background);
    }

    // Add colors from grounding style pack
    if (grounding.stylePack?.colors) {
      grounding.stylePack.colors.forEach((color: string) => colors.add(color));
    }

    return Array.from(colors);
  }

  private generateDescription(
    plan: CompositionPlan,
    context: SynthesisContext
  ): string {
    const componentCount = plan.components.length;
    const arrangement = plan.layout.arrangement;
    const motifs = [
      ...new Set(plan.components.map((c) => c.motif).filter(Boolean)),
    ];

    let description = `Generated SVG with ${componentCount} components`;

    if (arrangement !== "centered") {
      description += ` in ${arrangement} arrangement`;
    }

    if (motifs.length > 0) {
      description += ` featuring ${motifs.join(", ")}`;
    }

    return description;
  }

  private extractUsedObjects(grounding: GroundingData): string[] {
    const usedObjects: string[] = [];

    if (grounding.stylePack?.id) {
      usedObjects.push(grounding.stylePack.id);
    }

    if (grounding.motifs) {
      grounding.motifs.forEach((motif: any) => {
        if (motif.id) usedObjects.push(motif.id);
      });
    }

    if (grounding.components) {
      grounding.components.forEach((comp: any) => {
        if (comp.id) usedObjects.push(comp.id);
      });
    }

    return usedObjects;
  }

  /**
   * Validates that coordinates and dimensions are valid numbers
   */
  private validateCoordinates(
    position: { x: number; y: number },
    size: { width: number; height: number }
  ): void {
    if (!this.isValidNumber(position.x) || !this.isValidNumber(position.y)) {
      throw new Error(
        `Invalid position coordinates: x=${position.x}, y=${position.y}`
      );
    }

    if (!this.isValidNumber(size.width) || !this.isValidNumber(size.height)) {
      throw new Error(
        `Invalid size dimensions: width=${size.width}, height=${size.height}`
      );
    }

    if (size.width <= 0 || size.height <= 0) {
      throw new Error(
        `Size dimensions must be positive: width=${size.width}, height=${size.height}`
      );
    }
  }

  /**
   * Checks if a number is valid (not NaN, not Infinity)
   */
  private isValidNumber(value: number): boolean {
    return typeof value === "number" && isFinite(value) && !isNaN(value);
  }

  /**
   * Sanitizes a number by ensuring it's valid and rounding to 2 decimal places
   */
  private sanitizeNumber(value: number): number {
    if (!this.isValidNumber(value)) {
      throw new Error(`Invalid number value: ${value}`);
    }

    // Round to 2 decimal places to prevent excessive precision
    return Math.round(value * 100) / 100;
  }

  /**
   * Synthesize using layered generator
   */
  private async synthesizeWithLayeredGenerator(
    plan: UnifiedCompositionPlan,
    grounding: GroundingData,
    context: SynthesisContext
  ): Promise<UnifiedSynthesisResult> {
    if (!this.layeredGenerator) {
      throw new Error("Layered generator not initialized");
    }

    // Convert unified plan to generation request
    const request = this.convertToGenerationRequest(plan, context);

    // Generate using layered approach
    const response = await this.layeredGenerator.generate(request);

    // Convert response to AISVGDocument
    const document = this.convertResponseToDocument(response, plan, context);

    return {
      document,
      unifiedDocument: plan.unifiedDocument,
      layoutSpecifications: plan.layoutSpecifications,
      metadata: {
        synthesisMethod: "layered",
        layoutProcessed: true,
        coordinatesConverted: true,
      },
    };
  }

  /**
   * Synthesize using constrained generator
   */
  private async synthesizeWithConstrainedGenerator(
    plan: UnifiedCompositionPlan,
    grounding: GroundingData,
    context: SynthesisContext
  ): Promise<UnifiedSynthesisResult> {
    if (!this.constrainedGenerator) {
      throw new Error("Constrained generator not initialized");
    }

    // Generate using constrained approach
    const response =
      await this.constrainedGenerator.generateFromUnifiedDocument(
        plan.unifiedDocument
      );

    // Convert response to AISVGDocument
    const document = this.convertResponseToDocument(response, plan, context);

    return {
      document,
      unifiedDocument: plan.unifiedDocument,
      layoutSpecifications: plan.layoutSpecifications,
      metadata: {
        synthesisMethod: "constrained",
        layoutProcessed: true,
        coordinatesConverted: true,
      },
    };
  }

  /**
   * Synthesize with unified layout processing
   */
  private async synthesizeWithUnifiedLayout(
    plan: UnifiedCompositionPlan,
    grounding: GroundingData,
    context: SynthesisContext
  ): Promise<UnifiedSynthesisResult> {
    // Process layout specifications to get pixel coordinates
    const coordinateMapping = await this.processLayoutSpecifications(
      plan.layoutSpecifications,
      plan.unifiedDocument
    );

    // Convert unified document to traditional components
    const components = await this.convertUnifiedToComponents(
      plan.unifiedDocument,
      coordinateMapping
    );

    // Create traditional document
    const document: AISVGDocument = {
      components,
      metadata: this.createMetadataFromUnified(plan, context),
      bounds: {
        width: plan.unifiedDocument.canvas.width,
        height: plan.unifiedDocument.canvas.height,
      },
      palette: this.extractPaletteFromUnified(plan.unifiedDocument),
    };

    return {
      document,
      unifiedDocument: plan.unifiedDocument,
      layoutSpecifications: plan.layoutSpecifications,
      coordinateMapping,
      metadata: {
        synthesisMethod: "unified",
        layoutProcessed: true,
        coordinatesConverted: true,
      },
    };
  }

  /**
   * Process layout specifications to convert to pixel coordinates
   */
  private async processLayoutSpecifications(
    specifications: LayoutSpecification[],
    unifiedDoc: UnifiedLayeredSVGDocument
  ): Promise<{
    originalPositions: Array<{ x: number; y: number }>;
    mappedPositions: Array<{ x: number; y: number }>;
  }> {
    const originalPositions: Array<{ x: number; y: number }> = [];
    const mappedPositions: Array<{ x: number; y: number }> = [];

    for (const spec of specifications) {
      // Calculate position from layout specification
      const position = this.coordinateMapper.calculatePosition(spec);

      // Store original semantic position (normalized)
      const originalPos = this.getSemanticPosition(spec);
      originalPositions.push(originalPos);

      // Store mapped pixel position
      mappedPositions.push(position);
    }

    return { originalPositions, mappedPositions };
  }

  /**
   * Get semantic position from layout specification
   */
  private getSemanticPosition(spec: LayoutSpecification): {
    x: number;
    y: number;
  } {
    const region = spec.region || "center";
    const anchor = spec.anchor || "center";

    // Get region bounds (normalized 0-1)
    const regionBounds = this.regionManager.getRegionBounds(
      region as RegionName
    );

    // Calculate anchor position within region
    const anchorOffset = this.getAnchorOffset(anchor as AnchorPoint);

    return {
      x: regionBounds.x + regionBounds.width * anchorOffset.x,
      y: regionBounds.y + regionBounds.height * anchorOffset.y,
    };
  }

  /**
   * Get anchor offset within region
   */
  private getAnchorOffset(anchor: AnchorPoint): { x: number; y: number } {
    const anchorMap: Record<AnchorPoint, { x: number; y: number }> = {
      center: { x: 0.5, y: 0.5 },
      top_left: { x: 0, y: 0 },
      top_right: { x: 1, y: 0 },
      bottom_left: { x: 0, y: 1 },
      bottom_right: { x: 1, y: 1 },
      top_center: { x: 0.5, y: 0 },
      bottom_center: { x: 0.5, y: 1 },
      middle_left: { x: 0, y: 0.5 },
      middle_right: { x: 1, y: 0.5 },
    };

    return anchorMap[anchor] || { x: 0.5, y: 0.5 };
  }

  /**
   * Convert unified document to traditional SVG components
   */
  private async convertUnifiedToComponents(
    unifiedDoc: UnifiedLayeredSVGDocument,
    coordinateMapping: {
      originalPositions: Array<{ x: number; y: number }>;
      mappedPositions: Array<{ x: number; y: number }>;
    }
  ): Promise<SVGComponent[]> {
    const components: SVGComponent[] = [];
    let positionIndex = 0;

    for (const layer of unifiedDoc.layers) {
      for (const path of layer.paths) {
        const component = await this.convertPathToComponent(
          path,
          layer,
          coordinateMapping.mappedPositions[positionIndex] || { x: 256, y: 256 }
        );

        if (component) {
          components.push(component);
        }

        positionIndex++;
      }
    }

    return components;
  }

  /**
   * Convert unified path to SVG component
   */
  private async convertPathToComponent(
    path: any,
    layer: any,
    position: { x: number; y: number }
  ): Promise<SVGComponent | null> {
    // Create SVG component from path
    const component: SVGComponent = {
      id: path.id,
      type: "path",
      element: "path",
      attributes: {
        d: this.convertCommandsToPathData(path.commands),
        fill: path.style.fill || "none",
        stroke: path.style.stroke || "none",
      },
      metadata: {
        motif: layer.label,
        generated: true,
        reused: false,
      },
    };

    // Add optional style attributes
    if (path.style.strokeWidth) {
      component.attributes["stroke-width"] = path.style.strokeWidth;
    }
    if (path.style.opacity) {
      component.attributes.opacity = path.style.opacity;
    }
    if (path.style.strokeLinecap) {
      component.attributes["stroke-linecap"] = path.style.strokeLinecap;
    }
    if (path.style.strokeLinejoin) {
      component.attributes["stroke-linejoin"] = path.style.strokeLinejoin;
    }

    return component;
  }

  /**
   * Convert path commands to SVG path data string
   */
  private convertCommandsToPathData(commands: any[]): string {
    return commands
      .map((cmd) => {
        if (cmd.cmd === "Z") {
          return "Z";
        }
        return `${cmd.cmd} ${cmd.coords.join(" ")}`;
      })
      .join(" ");
  }

  /**
   * Convert unified plan to generation request
   */
  private convertToGenerationRequest(
    plan: UnifiedCompositionPlan,
    context: SynthesisContext
  ): any {
    return {
      prompt: context.prompt,
      size: {
        width: plan.unifiedDocument.canvas.width,
        height: plan.unifiedDocument.canvas.height,
      },
      palette: this.extractPaletteFromUnified(plan.unifiedDocument),
      seed: context.seed,
      model: "llm",
      userId: context.userId,
    };
  }

  /**
   * Convert generation response to AISVGDocument
   */
  private convertResponseToDocument(
    response: any,
    plan: UnifiedCompositionPlan,
    context: SynthesisContext
  ): AISVGDocument {
    // Parse SVG to extract components (simplified)
    const components = this.parseSVGToComponents(response.svg);

    return {
      components,
      metadata: this.createMetadataFromUnified(plan, context),
      bounds: {
        width: plan.unifiedDocument.canvas.width,
        height: plan.unifiedDocument.canvas.height,
      },
      palette:
        response.meta?.palette ||
        this.extractPaletteFromUnified(plan.unifiedDocument),
    };
  }

  /**
   * Parse SVG string to extract components (simplified implementation)
   */
  private parseSVGToComponents(svg: string): SVGComponent[] {
    // This is a simplified implementation
    // In practice, you'd use a proper SVG parser
    const components: SVGComponent[] = [];

    // Extract basic elements using regex (simplified)
    const pathMatches = svg.match(/<path[^>]*>/g) || [];
    pathMatches.forEach((match, index) => {
      const component: SVGComponent = {
        id: `parsed_path_${index}`,
        type: "path",
        element: "path",
        attributes: this.parseAttributes(match),
        metadata: {
          generated: true,
          reused: false,
        },
      };
      components.push(component);
    });

    return components;
  }

  /**
   * Parse attributes from SVG element string
   */
  private parseAttributes(
    elementString: string
  ): Record<string, string | number> {
    const attributes: Record<string, string | number> = {};

    // Simple attribute parsing (in practice, use a proper parser)
    const attrRegex = /(\w+)="([^"]*)"/g;
    let match;

    while ((match = attrRegex.exec(elementString)) !== null) {
      const [, name, value] = match;
      attributes[name] = value;
    }

    return attributes;
  }

  /**
   * Convert unified plan to traditional composition plan
   */
  private convertToTraditionalPlan(
    plan: UnifiedCompositionPlan
  ): CompositionPlan {
    const components: any[] = [];
    let componentIndex = 0;

    // Convert unified layers and paths to traditional components
    for (const layer of plan.unifiedDocument.layers) {
      for (const path of layer.paths) {
        const component = {
          id: path.id,
          type: "path",
          position: { x: 256, y: 256 }, // Default center position
          size: { width: 100, height: 100 }, // Default size
          rotation: 0,
          style: {
            fill: path.style.fill,
            stroke: path.style.stroke,
            strokeWidth: path.style.strokeWidth,
            opacity: path.style.opacity,
          },
          motif: layer.label,
        };
        components.push(component);
        componentIndex++;
      }
    }

    return {
      components,
      layout: {
        bounds: {
          width: plan.unifiedDocument.canvas.width,
          height: plan.unifiedDocument.canvas.height,
        },
        viewBox: `0 0 ${plan.unifiedDocument.canvas.width} ${plan.unifiedDocument.canvas.height}`,
        arrangement: "centered",
        spacing: 20,
      },
      zIndex: components.map((_, index) => index + 1),
    };
  }

  /**
   * Create metadata from unified plan
   */
  private createMetadataFromUnified(
    plan: UnifiedCompositionPlan,
    context: SynthesisContext
  ): DocumentMetadata {
    return {
      prompt: context.prompt,
      seed: context.seed,
      palette: this.extractPaletteFromUnified(plan.unifiedDocument),
      description: `Unified SVG with ${plan.metadata.totalLayers} layers and ${plan.metadata.totalPaths} paths`,
      generatedAt: new Date(),
      model: context.model || "unified-synthesizer-v1",
      usedObjects: [],
    };
  }

  /**
   * Extract palette from unified document
   */
  private extractPaletteFromUnified(
    unifiedDoc: UnifiedLayeredSVGDocument
  ): string[] {
    const colors = new Set<string>();

    for (const layer of unifiedDoc.layers) {
      for (const path of layer.paths) {
        if (path.style.fill && path.style.fill !== "none") {
          colors.add(path.style.fill);
        }
        if (path.style.stroke && path.style.stroke !== "none") {
          colors.add(path.style.stroke);
        }
      }
    }

    return Array.from(colors);
  }

  /**
   * Update aspect ratio for coordinate system
   */
  private updateAspectRatio(aspectRatio: AspectRatio): void {
    this.regionManager.updateAspectRatio(aspectRatio);
    const dimensions = this.regionManager.getCanvasDimensions();
    this.coordinateMapper.updateCanvasDimensions(
      dimensions.width,
      dimensions.height
    );
  }
}
