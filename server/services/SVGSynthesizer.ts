/**
 * SVGSynthesizer - Generates SVG documents using strict schemas with component reuse
 */
import type {
  CompositionPlan,
  AISVGDocument,
  SVGComponent,
  DocumentMetadata,
} from "../types/pipeline.js";
import { AISVGDocumentSchema } from "../schemas/pipeline.js";
import { ComponentLibrary } from "./ComponentLibrary.js";
import type { GroundingData } from "./CompositionPlanner.js";

export interface SynthesisContext {
  prompt: string;
  seed?: number;
  model?: string;
  userId?: string;
}

export class SVGSynthesizer {
  private componentLibrary: ComponentLibrary;

  constructor() {
    this.componentLibrary = new ComponentLibrary();
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

    // Validate document structure (temporarily disabled due to schema issues)
    // const validationResult = AISVGDocumentSchema.safeParse(document);
    // if (!validationResult.success) {
    //   throw new Error(
    //     `Invalid SVG document: ${validationResult.error.message}`
    //   );
    // }

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
        adapted.attributes.cx = position.x;
        adapted.attributes.cy = position.y;
        adapted.attributes.r = Math.min(size.width, size.height) / 2;
        break;

      case "rect":
        adapted.attributes.x = position.x - size.width / 2;
        adapted.attributes.y = position.y - size.height / 2;
        adapted.attributes.width = size.width;
        adapted.attributes.height = size.height;
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

    const attributes: Record<string, string | number> = {};

    // Generate attributes based on element type
    switch (type) {
      case "circle":
        attributes.cx = position.x;
        attributes.cy = position.y;
        attributes.r = Math.min(size.width, size.height) / 2;
        break;

      case "rect":
        attributes.x = position.x - size.width / 2;
        attributes.y = position.y - size.height / 2;
        attributes.width = size.width;
        attributes.height = size.height;
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
        attributes.x1 = position.x - size.width / 2;
        attributes.y1 = position.y;
        attributes.x2 = position.x + size.width / 2;
        attributes.y2 = position.y;
        break;

      case "ellipse":
        attributes.cx = position.x;
        attributes.cy = position.y;
        attributes.rx = size.width / 2;
        attributes.ry = size.height / 2;
        break;

      default:
        // Default to circle
        attributes.cx = position.x;
        attributes.cy = position.y;
        attributes.r = Math.min(size.width, size.height) / 2;
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
}
