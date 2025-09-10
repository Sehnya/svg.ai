/**
 * CompositionPlanner - Generates layout plans with component positioning and z-index ordering
 * Enhanced to output unified specifications with semantic region selection and layout language support
 */
import type {
  DesignIntent,
  CompositionPlan,
  ComponentPlan,
  LayoutPlan,
} from "../types/pipeline.js";
import { CompositionPlanSchema } from "../schemas/pipeline.js";
import type {
  LayoutSpecification,
  RegionName,
  AnchorPoint,
  AspectRatio,
  SizeSpec,
  RepetitionSpec,
  UnifiedLayeredSVGDocument,
  UnifiedLayer,
  UnifiedPath,
  PathStyle,
} from "../types/unified-layered.js";
import { RegionManager } from "./RegionManager.js";
import { AspectRatioManager } from "./AspectRatioManager.js";

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
  aspectRatio?: AspectRatio;
  useUnifiedLayout?: boolean; // Enable unified layout specification generation
}

export interface UnifiedCompositionPlan {
  unifiedDocument: UnifiedLayeredSVGDocument;
  layoutSpecifications: LayoutSpecification[];
  semanticRegions: RegionName[];
  anchorPoints: AnchorPoint[];
  metadata: {
    totalLayers: number;
    totalPaths: number;
    usedRegions: RegionName[];
    designComplexity: "simple" | "medium" | "complex";
  };
}

export class CompositionPlanner {
  private rng: () => number;
  private regionManager: RegionManager;

  constructor(seed?: number, aspectRatio: AspectRatio = "1:1") {
    this.rng = this.createSeededRandom(seed);
    this.regionManager = new RegionManager(aspectRatio);
  }

  /**
   * Generate unified composition plan with layout specifications
   */
  async planUnified(
    intent: DesignIntent,
    grounding: GroundingData,
    context?: PlanningContext
  ): Promise<UnifiedCompositionPlan> {
    // Update region manager for current aspect ratio
    if (context?.aspectRatio) {
      this.regionManager = new RegionManager(context.aspectRatio);
    }

    // Determine design complexity
    const complexity = this.determineDesignComplexity(intent);

    // Generate semantic region assignments
    const semanticRegions = this.generateSemanticRegions(intent, complexity);

    // Generate anchor points for different shape types
    const anchorPoints = this.generateAnchorPoints(intent, semanticRegions);

    // Create unified layered document
    const unifiedDocument = this.createUnifiedDocument(
      intent,
      grounding,
      context,
      semanticRegions,
      anchorPoints
    );

    // Extract layout specifications
    const layoutSpecifications =
      this.extractLayoutSpecifications(unifiedDocument);

    return {
      unifiedDocument,
      layoutSpecifications,
      semanticRegions,
      anchorPoints,
      metadata: {
        totalLayers: unifiedDocument.layers.length,
        totalPaths: unifiedDocument.layers.reduce(
          (sum, layer) => sum + layer.paths.length,
          0
        ),
        usedRegions: semanticRegions,
        designComplexity: complexity,
      },
    };
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

  /**
   * Determine design complexity based on intent
   */
  private determineDesignComplexity(
    intent: DesignIntent
  ): "simple" | "medium" | "complex" {
    const elementCount = this.determineComponentCount(intent);
    const motifCount = intent.motifs.length;
    const hasSymmetry = intent.style.symmetry !== "none";
    const isDense = intent.style.density === "dense";

    if (elementCount <= 3 && motifCount <= 2 && !hasSymmetry) {
      return "simple";
    } else if (elementCount <= 8 && motifCount <= 5) {
      return "medium";
    } else {
      return "complex";
    }
  }

  /**
   * Generate semantic region assignments based on design intent
   */
  private generateSemanticRegions(
    intent: DesignIntent,
    complexity: "simple" | "medium" | "complex"
  ): RegionName[] {
    const regions: RegionName[] = [];

    switch (intent.layout.arrangement) {
      case "centered":
        regions.push("center");
        if (complexity !== "simple") {
          regions.push("top_center", "bottom_center");
        }
        break;

      case "grid":
        if (complexity === "simple") {
          regions.push("center", "top_left", "bottom_right");
        } else if (complexity === "medium") {
          regions.push("top_left", "top_center", "top_right", "center");
        } else {
          regions.push(
            "top_left",
            "top_center",
            "top_right",
            "middle_left",
            "center",
            "middle_right",
            "bottom_left",
            "bottom_center",
            "bottom_right"
          );
        }
        break;

      case "scattered":
        // Use random regions for scattered arrangement
        const allRegions: RegionName[] = [
          "top_left",
          "top_center",
          "top_right",
          "middle_left",
          "center",
          "middle_right",
          "bottom_left",
          "bottom_center",
          "bottom_right",
        ];
        const regionCount = Math.min(
          complexity === "simple" ? 3 : complexity === "medium" ? 5 : 7,
          allRegions.length
        );

        for (let i = 0; i < regionCount; i++) {
          const randomIndex = Math.floor(this.rng() * allRegions.length);
          const region = allRegions.splice(randomIndex, 1)[0];
          regions.push(region);
        }
        break;

      case "organic":
        // Use flowing regions for organic arrangement
        regions.push("center");
        if (complexity !== "simple") {
          regions.push(
            "top_center",
            "middle_left",
            "middle_right",
            "bottom_center"
          );
        }
        break;

      default:
        regions.push("center");
    }

    return regions;
  }

  /**
   * Generate anchor points for different shape types
   */
  private generateAnchorPoints(
    intent: DesignIntent,
    regions: RegionName[]
  ): AnchorPoint[] {
    const anchors: AnchorPoint[] = [];

    // Determine anchor strategy based on symmetry and arrangement
    if (intent.style.symmetry === "horizontal") {
      anchors.push("center", "middle_left", "middle_right");
    } else if (intent.style.symmetry === "vertical") {
      anchors.push("center", "top_center", "bottom_center");
    } else if (intent.style.symmetry === "radial") {
      anchors.push("center");
    } else {
      // No symmetry - use varied anchors based on motifs
      for (const motif of intent.motifs) {
        const anchor = this.selectAnchorForMotif(motif);
        if (!anchors.includes(anchor)) {
          anchors.push(anchor);
        }
      }

      // Ensure we have at least center anchor
      if (anchors.length === 0) {
        anchors.push("center");
      }
    }

    return anchors;
  }

  /**
   * Select appropriate anchor point for a motif type
   */
  private selectAnchorForMotif(motif: string): AnchorPoint {
    const motifAnchorMap: Record<string, AnchorPoint> = {
      circle: "center",
      square: "center",
      rectangle: "center",
      triangle: "bottom_center",
      line: "middle_left",
      curve: "center",
      organic: "center",
      geometric: "center",
      star: "center",
      polygon: "center",
      text: "top_left",
      icon: "center",
    };

    return motifAnchorMap[motif.toLowerCase()] || "center";
  }

  /**
   * Create unified layered SVG document
   */
  private createUnifiedDocument(
    intent: DesignIntent,
    grounding: GroundingData,
    context: PlanningContext | undefined,
    regions: RegionName[],
    anchors: AnchorPoint[]
  ): UnifiedLayeredSVGDocument {
    const aspectRatio = context?.aspectRatio || "1:1";
    const canvasSize = AspectRatioManager.getCanvasDimensions(aspectRatio);

    // Create layers based on design intent
    const layers = this.createUnifiedLayers(
      intent,
      grounding,
      regions,
      anchors
    );

    return {
      version: "unified-layered-1.0",
      canvas: {
        width: canvasSize.width,
        height: canvasSize.height,
        aspectRatio,
      },
      layers,
    };
  }

  /**
   * Create unified layers with layout specifications
   */
  private createUnifiedLayers(
    intent: DesignIntent,
    grounding: GroundingData,
    regions: RegionName[],
    anchors: AnchorPoint[]
  ): UnifiedLayer[] {
    const layers: UnifiedLayer[] = [];
    const componentCount = this.determineComponentCount(intent);

    // Group components into logical layers
    const layerGroups = this.groupComponentsIntoLayers(intent, componentCount);

    for (let layerIndex = 0; layerIndex < layerGroups.length; layerIndex++) {
      const group = layerGroups[layerIndex];
      const layer = this.createUnifiedLayer(
        layerIndex,
        group,
        intent,
        grounding,
        regions,
        anchors
      );
      layers.push(layer);
    }

    return layers;
  }

  /**
   * Group components into logical layers
   */
  private groupComponentsIntoLayers(
    intent: DesignIntent,
    componentCount: number
  ): Array<{ type: string; count: number; motifs: string[] }> {
    const groups: Array<{ type: string; count: number; motifs: string[] }> = [];

    if (intent.style.density === "sparse" || componentCount <= 3) {
      // Single layer for simple designs
      groups.push({
        type: "main",
        count: componentCount,
        motifs: intent.motifs,
      });
    } else {
      // Multiple layers for complex designs
      const backgroundCount = Math.ceil(componentCount * 0.3);
      const mainCount = Math.ceil(componentCount * 0.5);
      const detailCount = componentCount - backgroundCount - mainCount;

      if (backgroundCount > 0) {
        groups.push({
          type: "background",
          count: backgroundCount,
          motifs: intent.motifs.slice(0, 1), // Use first motif for background
        });
      }

      groups.push({
        type: "main",
        count: mainCount,
        motifs: intent.motifs,
      });

      if (detailCount > 0) {
        groups.push({
          type: "details",
          count: detailCount,
          motifs: intent.motifs.slice(-1), // Use last motif for details
        });
      }
    }

    return groups;
  }

  /**
   * Create a unified layer with layout specifications
   */
  private createUnifiedLayer(
    layerIndex: number,
    group: { type: string; count: number; motifs: string[] },
    intent: DesignIntent,
    grounding: GroundingData,
    regions: RegionName[],
    anchors: AnchorPoint[]
  ): UnifiedLayer {
    const layerId = `${group.type}_layer`;
    const layerLabel = this.formatLayerLabel(group.type);

    // Determine layer layout
    const layerLayout = this.createLayerLayout(group.type, regions, layerIndex);

    // Create paths for this layer
    const paths = this.createUnifiedPaths(
      group,
      intent,
      grounding,
      regions,
      anchors
    );

    return {
      id: layerId,
      label: layerLabel,
      layout: layerLayout,
      paths,
    };
  }

  /**
   * Format layer label for human readability
   */
  private formatLayerLabel(type: string): string {
    const labelMap: Record<string, string> = {
      background: "Background Elements",
      main: "Main Content",
      details: "Detail Elements",
      foreground: "Foreground Elements",
    };

    return (
      labelMap[type] || `${type.charAt(0).toUpperCase()}${type.slice(1)} Layer`
    );
  }

  /**
   * Create layer layout specification
   */
  private createLayerLayout(
    layerType: string,
    regions: RegionName[],
    layerIndex: number
  ): LayoutSpecification {
    const layout: LayoutSpecification = {
      zIndex: layerIndex + 1,
    };

    // Assign region based on layer type
    switch (layerType) {
      case "background":
        layout.region = "full_canvas";
        layout.anchor = "top_left";
        break;
      case "main":
        layout.region = regions[0] || "center";
        layout.anchor = "center";
        break;
      case "details":
        layout.region = regions[regions.length - 1] || "center";
        layout.anchor = "center";
        layout.offset = [0.1, 0.1]; // Slight offset for details
        break;
      default:
        layout.region = "center";
        layout.anchor = "center";
    }

    return layout;
  }

  /**
   * Create unified paths with layout specifications
   */
  private createUnifiedPaths(
    group: { type: string; count: number; motifs: string[] },
    intent: DesignIntent,
    grounding: GroundingData,
    regions: RegionName[],
    anchors: AnchorPoint[]
  ): UnifiedPath[] {
    const paths: UnifiedPath[] = [];

    for (let pathIndex = 0; pathIndex < group.count; pathIndex++) {
      const path = this.createUnifiedPath(
        pathIndex,
        group,
        intent,
        grounding,
        regions,
        anchors
      );
      paths.push(path);
    }

    return paths;
  }

  /**
   * Create a unified path with layout specification
   */
  private createUnifiedPath(
    pathIndex: number,
    group: { type: string; count: number; motifs: string[] },
    intent: DesignIntent,
    grounding: GroundingData,
    regions: RegionName[],
    anchors: AnchorPoint[]
  ): UnifiedPath {
    const pathId = `${group.type}_path_${pathIndex}`;

    // Select motif for this path
    const motif = group.motifs[pathIndex % group.motifs.length] || "shape";

    // Create path style
    const style = this.createUnifiedPathStyle(intent, pathIndex);

    // Create basic path commands (will be refined by layout processing)
    const commands = this.createBasicPathCommands(motif);

    // Create path layout specification
    const layout = this.createPathLayout(
      pathIndex,
      group,
      regions,
      anchors,
      motif
    );

    return {
      id: pathId,
      style,
      commands,
      layout,
    };
  }

  /**
   * Create path style from design intent
   */
  private createUnifiedPathStyle(
    intent: DesignIntent,
    pathIndex: number
  ): PathStyle {
    const palette = intent.style.palette;
    const strokeRules = intent.style.strokeRules;
    const colorIndex = pathIndex % palette.length;

    const style: PathStyle = {};

    if (strokeRules.strokeOnly) {
      style.fill = "none";
      style.stroke = palette[colorIndex];
      style.strokeWidth =
        strokeRules.minStrokeWidth +
        (strokeRules.maxStrokeWidth - strokeRules.minStrokeWidth) * this.rng();
    } else {
      if (strokeRules.allowFill) {
        style.fill = palette[colorIndex];
        style.opacity = 0.7 + this.rng() * 0.3;
      }

      if (this.rng() > 0.5) {
        const strokeColorIndex = (colorIndex + 1) % palette.length;
        style.stroke = palette[strokeColorIndex];
        style.strokeWidth = strokeRules.minStrokeWidth;
      }
    }

    return style;
  }

  /**
   * Create basic path commands for a motif
   */
  private createBasicPathCommands(motif: string) {
    // Create simple placeholder commands - these will be refined by layout processing
    switch (motif.toLowerCase()) {
      case "circle":
        return [
          { cmd: "M" as const, coords: [256, 156] },
          { cmd: "C" as const, coords: [311.23, 156, 356, 200.77, 356, 256] },
          { cmd: "C" as const, coords: [356, 311.23, 311.23, 356, 256, 356] },
          { cmd: "C" as const, coords: [200.77, 356, 156, 311.23, 156, 256] },
          { cmd: "C" as const, coords: [156, 200.77, 200.77, 156, 256, 156] },
          { cmd: "Z" as const, coords: [] },
        ];

      case "square":
      case "rectangle":
        return [
          { cmd: "M" as const, coords: [206, 206] },
          { cmd: "L" as const, coords: [306, 206] },
          { cmd: "L" as const, coords: [306, 306] },
          { cmd: "L" as const, coords: [206, 306] },
          { cmd: "Z" as const, coords: [] },
        ];

      case "triangle":
        return [
          { cmd: "M" as const, coords: [256, 156] },
          { cmd: "L" as const, coords: [356, 306] },
          { cmd: "L" as const, coords: [156, 306] },
          { cmd: "Z" as const, coords: [] },
        ];

      default:
        // Default to a simple shape
        return [
          { cmd: "M" as const, coords: [200, 200] },
          { cmd: "L" as const, coords: [312, 312] },
          { cmd: "Z" as const, coords: [] },
        ];
    }
  }

  /**
   * Create path layout specification
   */
  private createPathLayout(
    pathIndex: number,
    group: { type: string; count: number; motifs: string[] },
    regions: RegionName[],
    anchors: AnchorPoint[],
    motif: string
  ): LayoutSpecification {
    const layout: LayoutSpecification = {};

    // Assign region based on path index and group type
    if (group.type === "background") {
      layout.region = "full_canvas";
      layout.anchor = "top_left";
    } else {
      const regionIndex = pathIndex % regions.length;
      layout.region = regions[regionIndex];

      const anchorIndex = pathIndex % anchors.length;
      layout.anchor = anchors[anchorIndex];
    }

    // Add size specification
    layout.size = this.createSizeSpec(group.type, motif);

    // Add repetition for patterns
    if (group.count > 1 && group.type !== "background") {
      layout.repeat = this.createRepetitionSpec(group.count);
    }

    return layout;
  }

  /**
   * Create size specification for a path
   */
  private createSizeSpec(groupType: string, motif: string): SizeSpec {
    const sizeMap: Record<string, number> = {
      background: 1.0,
      main: 0.6,
      details: 0.3,
    };

    const baseSize = sizeMap[groupType] || 0.5;

    // Adjust size based on motif
    const motifMultiplier =
      motif === "circle" ? 1.2 : motif === "triangle" ? 0.8 : 1.0;

    return {
      relative: baseSize * motifMultiplier,
    };
  }

  /**
   * Create repetition specification
   */
  private createRepetitionSpec(count: number): RepetitionSpec {
    if (count <= 4) {
      return {
        type: "grid",
        count: [Math.min(count, 2), Math.ceil(count / 2)],
        spacing: 0.2,
      };
    } else {
      return {
        type: "radial",
        count,
        radius: 0.3,
      };
    }
  }

  /**
   * Extract layout specifications from unified document
   */
  private extractLayoutSpecifications(
    doc: UnifiedLayeredSVGDocument
  ): LayoutSpecification[] {
    const specifications: LayoutSpecification[] = [];

    for (const layer of doc.layers) {
      if (layer.layout) {
        specifications.push(layer.layout);
      }

      for (const path of layer.paths) {
        if (path.layout) {
          specifications.push(path.layout);
        }
      }
    }

    return specifications;
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
