/**
 * CompositionPlanner - Generates layout plans with component positioning and z-index ordering
 */
import type {
  DesignIntent,
  CompositionPlan,
  ComponentPlan,
  LayoutPlan,
} from "../types/pipeline.js";
import { CompositionPlanSchema } from "../schemas/pipeline.js";

export interface GroundingData {
  stylePack?: any;
  motifs?: any[];
  glossary?: any[];
  fewshot?: any[];
  components?: any[];
}

export interface PlanningContext {
  targetSize: { width: number; height: number };
  seed?: number;
  userPreferences?: Record<string, any>;
}

export class CompositionPlanner {
  private rng: () => number;

  constructor(seed?: number) {
    this.rng = this.createSeededRandom(seed);
  }

  async plan(
    intent: DesignIntent,
    grounding: GroundingData,
    context?: PlanningContext
  ): Promise<CompositionPlan> {
    // Create layout plan
    const layout = this.createLayoutPlan(intent, context);

    // Generate component plans
    const components = this.generateComponents(intent, grounding, layout);

    // Calculate z-index ordering
    const zIndex = this.calculateZIndex(components, intent);

    const plan: CompositionPlan = {
      components,
      layout,
      zIndex,
    };

    // Validate the generated plan
    const validationResult = CompositionPlanSchema.safeParse(plan);
    if (!validationResult.success) {
      throw new Error(
        `Invalid composition plan: ${validationResult.error.message}`
      );
    }

    return plan;
  }

  private createLayoutPlan(
    intent: DesignIntent,
    context?: PlanningContext
  ): LayoutPlan {
    const bounds = context?.targetSize || { width: 400, height: 400 };
    const viewBox = `0 0 ${bounds.width} ${bounds.height}`;

    // Determine spacing based on density
    const spacing =
      intent.style.density === "sparse"
        ? 40
        : intent.style.density === "dense"
          ? 10
          : 20;

    // Background color from palette (optional)
    const background =
      intent.style.palette.length > 3 ? intent.style.palette[3] : undefined;

    return {
      bounds,
      viewBox,
      background,
      arrangement: intent.layout.arrangement,
      spacing,
    };
  }

  private generateComponents(
    intent: DesignIntent,
    grounding: GroundingData,
    layout: LayoutPlan
  ): ComponentPlan[] {
    const components: ComponentPlan[] = [];

    // Determine number of components
    const componentCount = this.determineComponentCount(intent);

    // Generate positions based on arrangement
    const positions = this.generatePositions(layout, componentCount);

    // Create components
    for (let i = 0; i < componentCount; i++) {
      const component = this.createComponent(
        i,
        intent,
        grounding,
        layout,
        positions[i]
      );
      components.push(component);
    }

    return components;
  }

  private determineComponentCount(intent: DesignIntent): number {
    // Use preferred count from layout, fallback to density-based count
    const layoutCount = intent.layout.counts.find((c) => c.type === "element");
    if (layoutCount) {
      return Math.min(layoutCount.preferred, intent.constraints.maxElements);
    }

    // Fallback based on density
    const baseCount =
      intent.style.density === "sparse"
        ? 3
        : intent.style.density === "dense"
          ? 8
          : 5;

    return Math.min(baseCount, intent.constraints.maxElements);
  }

  private generatePositions(
    layout: LayoutPlan,
    count: number
  ): Array<{ x: number; y: number }> {
    const { bounds, spacing, arrangement } = layout;
    const positions: Array<{ x: number; y: number }> = [];

    switch (arrangement) {
      case "grid":
        return this.generateGridPositions(bounds, count, spacing);

      case "centered":
        return this.generateCenteredPositions(bounds, count, spacing);

      case "scattered":
        return this.generateScatteredPositions(bounds, count, spacing);

      case "organic":
        return this.generateOrganicPositions(bounds, count, spacing);

      default:
        return this.generateCenteredPositions(bounds, count, spacing);
    }
  }

  private generateGridPositions(
    bounds: { width: number; height: number },
    count: number,
    spacing: number
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    const cellWidth = (bounds.width - spacing * (cols + 1)) / cols;
    const cellHeight = (bounds.height - spacing * (rows + 1)) / rows;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = spacing + col * (cellWidth + spacing) + cellWidth / 2;
      const y = spacing + row * (cellHeight + spacing) + cellHeight / 2;

      positions.push({ x, y });
    }

    return positions;
  }

  private generateCenteredPositions(
    bounds: { width: number; height: number },
    count: number,
    spacing: number
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;

    if (count === 1) {
      positions.push({ x: centerX, y: centerY });
    } else {
      // Arrange in a circle around center
      const radius = Math.min(bounds.width, bounds.height) / 4;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        positions.push({ x, y });
      }
    }

    return positions;
  }

  private generateScatteredPositions(
    bounds: { width: number; height: number },
    count: number,
    spacing: number
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const margin = spacing * 2;

    for (let i = 0; i < count; i++) {
      const x = margin + this.rng() * (bounds.width - 2 * margin);
      const y = margin + this.rng() * (bounds.height - 2 * margin);
      positions.push({ x, y });
    }

    return positions;
  }

  private generateOrganicPositions(
    bounds: { width: number; height: number },
    count: number,
    spacing: number
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];

    // Use a flowing, natural arrangement
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;

    for (let i = 0; i < count; i++) {
      // Create flowing curves
      const t = i / (count - 1);
      const wave = Math.sin(t * Math.PI * 2) * 0.3;
      const spiral = t * 0.5;

      const x =
        centerX + (t - 0.5) * bounds.width * 0.6 + wave * bounds.width * 0.2;
      const y =
        centerY + spiral * bounds.height * 0.4 + wave * bounds.height * 0.1;

      positions.push({
        x: Math.max(spacing, Math.min(bounds.width - spacing, x)),
        y: Math.max(spacing, Math.min(bounds.height - spacing, y)),
      });
    }

    return positions;
  }

  private createComponent(
    index: number,
    intent: DesignIntent,
    grounding: GroundingData,
    layout: LayoutPlan,
    position: { x: number; y: number }
  ): ComponentPlan {
    // Determine component type and motif
    const motif = this.selectMotif(intent, grounding, index);
    const type = this.determineComponentType(motif, grounding);

    // Determine size
    const size = this.determineComponentSize(intent, layout, index);

    // Determine rotation
    const rotation = this.determineRotation(intent, index);

    // Determine style
    const style = this.determineComponentStyle(intent, index);

    return {
      id: `component-${index}`,
      type,
      position,
      size,
      rotation,
      style,
      motif,
    };
  }

  private selectMotif(
    intent: DesignIntent,
    grounding: GroundingData,
    index: number
  ): string | undefined {
    // Prioritize required motifs
    if (intent.constraints.requiredMotifs.length > 0) {
      const motifIndex = index % intent.constraints.requiredMotifs.length;
      return intent.constraints.requiredMotifs[motifIndex];
    }

    // Use available motifs
    if (intent.motifs.length > 0) {
      const motifIndex = index % intent.motifs.length;
      return intent.motifs[motifIndex];
    }

    // Use grounding motifs if available
    if (grounding.motifs && grounding.motifs.length > 0) {
      const motifIndex = index % grounding.motifs.length;
      return (
        grounding.motifs[motifIndex]?.name || grounding.motifs[motifIndex]?.type
      );
    }

    return undefined;
  }

  private determineComponentType(
    motif: string | undefined,
    grounding: GroundingData
  ): string {
    // Map motifs to component types
    const motifTypeMap = new Map([
      ["circle", "circle"],
      ["square", "rect"],
      ["triangle", "polygon"],
      ["line", "line"],
      ["curve", "path"],
      ["organic", "path"],
      ["geometric", "polygon"],
    ]);

    if (motif && motifTypeMap.has(motif)) {
      return motifTypeMap.get(motif)!;
    }

    // Use grounding components if available
    if (grounding.components && grounding.components.length > 0) {
      const component = grounding.components[0];
      return component.type || "path";
    }

    // Default to path for flexibility
    return "path";
  }

  private determineComponentSize(
    intent: DesignIntent,
    layout: LayoutPlan,
    index: number
  ): { width: number; height: number } {
    // Use layout size constraints
    const sizeConfig = intent.layout.sizes.find((s) => s.type === "default") ||
      intent.layout.sizes[0] || { minSize: 50, maxSize: 150 };

    // Add some variation
    const variation = 0.2; // 20% variation
    const baseSize =
      sizeConfig.minSize +
      (sizeConfig.maxSize - sizeConfig.minSize) * this.rng();
    const sizeVariation = 1 + (this.rng() - 0.5) * variation;

    const size = baseSize * sizeVariation;

    // Handle aspect ratio
    if (sizeConfig.aspectRatio) {
      return {
        width: size,
        height: size / sizeConfig.aspectRatio,
      };
    }

    return {
      width: size,
      height: size,
    };
  }

  private determineRotation(intent: DesignIntent, index: number): number {
    // No rotation for grid arrangements
    if (intent.layout.arrangement === "grid") {
      return 0;
    }

    // Symmetrical rotations
    if (intent.style.symmetry === "radial") {
      return (index * 360) / 8; // 8-fold symmetry
    }

    // Random rotation for organic/scattered
    if (
      intent.layout.arrangement === "organic" ||
      intent.layout.arrangement === "scattered"
    ) {
      return this.rng() * 360;
    }

    return 0;
  }

  private determineComponentStyle(intent: DesignIntent, index: number) {
    const palette = intent.style.palette;
    const strokeRules = intent.style.strokeRules;

    // Cycle through palette colors
    const colorIndex = index % palette.length;
    const color = palette[colorIndex];

    const style: any = {};

    if (strokeRules.strokeOnly) {
      style.stroke = color;
      style.strokeWidth =
        strokeRules.minStrokeWidth +
        (strokeRules.maxStrokeWidth - strokeRules.minStrokeWidth) * this.rng();
      style.fill = "none";
    } else {
      if (strokeRules.allowFill) {
        style.fill = color;
        style.opacity = 0.7 + this.rng() * 0.3; // 70-100% opacity
      }

      if (this.rng() > 0.5) {
        // 50% chance of stroke
        const strokeColorIndex = (colorIndex + 1) % palette.length;
        style.stroke = palette[strokeColorIndex];
        style.strokeWidth = strokeRules.minStrokeWidth;
      }
    }

    return style;
  }

  private calculateZIndex(
    components: ComponentPlan[],
    intent: DesignIntent
  ): number[] {
    const zIndex: number[] = [];

    // Simple z-index based on component order and arrangement
    for (let i = 0; i < components.length; i++) {
      if (intent.layout.arrangement === "centered") {
        // Center components on top
        const distanceFromCenter = Math.abs(i - components.length / 2);
        zIndex.push(Math.round(100 - distanceFromCenter * 10));
      } else {
        // Sequential ordering
        zIndex.push(i + 1);
      }
    }

    return zIndex;
  }

  private createSeededRandom(seed?: number): () => number {
    if (!seed) {
      return Math.random;
    }

    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }
}
