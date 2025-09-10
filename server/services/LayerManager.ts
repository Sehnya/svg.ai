/**
 * LayerManager - Comprehensive layer management for unified SVG generation
 * Handles layer organization, metadata, validation, and optimization
 */

import {
  UnifiedLayer,
  UnifiedPath,
  UnifiedLayeredSVGDocument,
  LayerMetadata,
  LayoutSpecification,
  RegionName,
  AnchorPoint,
  PathCommand,
} from "../types/unified-layered";
import { RegionManager } from "./RegionManager";
import { CoordinateMapper } from "./CoordinateMapper";

export interface LayerAnalysis {
  id: string;
  label: string;
  pathCount: number;
  totalCommands: number;
  complexity: "low" | "medium" | "high";
  regions: string[];
  anchors: AnchorPoint[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  estimatedRenderTime: number;
  memoryUsage: number;
}

export interface LayerOptimization {
  originalLayerCount: number;
  optimizedLayerCount: number;
  mergedLayers: string[];
  removedLayers: string[];
  optimizations: string[];
  performanceGain: number;
}

export interface LayerValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface LayerHierarchy {
  id: string;
  label: string;
  level: number;
  parent?: string;
  children: string[];
  dependencies: string[];
}

export interface LayerGroup {
  name: string;
  layers: string[];
  purpose: string;
  priority: number;
}

export class LayerManager {
  private regionManager: RegionManager;
  private coordinateMapper: CoordinateMapper;
  private layerCache = new Map<string, LayerAnalysis>();
  private optimizationCache = new Map<string, LayerOptimization>();

  constructor(
    regionManager: RegionManager,
    coordinateMapper: CoordinateMapper
  ) {
    this.regionManager = regionManager;
    this.coordinateMapper = coordinateMapper;
  }

  /**
   * Analyze a single layer for metadata and performance characteristics
   */
  analyzeLayer(
    layer: UnifiedLayer,
    canvasWidth: number,
    canvasHeight: number
  ): LayerAnalysis {
    const cacheKey = this.generateLayerCacheKey(layer);
    const cached = this.layerCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const analysis = this.performLayerAnalysis(
      layer,
      canvasWidth,
      canvasHeight
    );
    this.layerCache.set(cacheKey, analysis);

    return analysis;
  }

  /**
   * Perform detailed layer analysis
   */
  private performLayerAnalysis(
    layer: UnifiedLayer,
    canvasWidth: number,
    canvasHeight: number
  ): LayerAnalysis {
    const pathCount = layer.paths.length;
    const totalCommands = layer.paths.reduce(
      (sum, path) => sum + path.commands.length,
      0
    );

    // Analyze regions used
    const regions = new Set<string>();
    const anchors = new Set<AnchorPoint>();

    if (layer.layout?.region) {
      regions.add(layer.layout.region);
    }
    if (layer.layout?.anchor) {
      anchors.add(layer.layout.anchor);
    }

    layer.paths.forEach((path) => {
      if (path.layout?.region) {
        regions.add(path.layout.region);
      }
      if (path.layout?.anchor) {
        anchors.add(path.layout.anchor);
      }
    });

    // Calculate bounds
    const bounds = this.calculateLayerBounds(layer);

    // Determine complexity
    const complexity = this.determineComplexity(pathCount, totalCommands);

    // Estimate performance metrics
    const estimatedRenderTime = this.estimateRenderTime(
      pathCount,
      totalCommands
    );
    const memoryUsage = this.estimateMemoryUsage(layer);

    return {
      id: layer.id,
      label: layer.label,
      pathCount,
      totalCommands,
      complexity,
      regions: Array.from(regions),
      anchors: Array.from(anchors),
      bounds,
      estimatedRenderTime,
      memoryUsage,
    };
  }

  /**
   * Generate metadata for all layers in a document
   */
  generateLayerMetadata(document: UnifiedLayeredSVGDocument): LayerMetadata[] {
    return document.layers.map((layer) => {
      const analysis = this.analyzeLayer(
        layer,
        document.canvas.width,
        document.canvas.height
      );

      return {
        id: layer.id,
        label: layer.label,
        pathCount: analysis.pathCount,
        region: layer.layout?.region,
        anchor: layer.layout?.anchor,
        bounds: analysis.bounds,
      };
    });
  }

  /**
   * Validate layer structure and organization
   */
  validateLayers(layers: UnifiedLayer[]): LayerValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for duplicate layer IDs
    const layerIds = new Set<string>();
    layers.forEach((layer) => {
      if (layerIds.has(layer.id)) {
        errors.push(`Duplicate layer ID: ${layer.id}`);
      }
      layerIds.add(layer.id);
    });

    // Validate individual layers
    layers.forEach((layer) => {
      const layerValidation = this.validateSingleLayer(layer);
      errors.push(...layerValidation.errors);
      warnings.push(...layerValidation.warnings);
      suggestions.push(...layerValidation.suggestions);
    });

    // Check layer organization
    const organizationIssues = this.validateLayerOrganization(layers);
    warnings.push(...organizationIssues.warnings);
    suggestions.push(...organizationIssues.suggestions);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validate a single layer
   */
  private validateSingleLayer(layer: UnifiedLayer): LayerValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate layer ID
    if (!layer.id || layer.id.trim().length === 0) {
      errors.push(`Layer must have a non-empty ID`);
    }

    // Validate layer label
    if (!layer.label || layer.label.trim().length === 0) {
      warnings.push(`Layer ${layer.id} should have a descriptive label`);
    }

    // Validate paths
    if (layer.paths.length === 0) {
      warnings.push(`Layer ${layer.id} has no paths`);
      suggestions.push(
        `Consider removing empty layer ${layer.id} or adding content`
      );
    }

    // Validate path IDs within layer
    const pathIds = new Set<string>();
    layer.paths.forEach((path) => {
      if (pathIds.has(path.id)) {
        errors.push(`Duplicate path ID in layer ${layer.id}: ${path.id}`);
      }
      pathIds.add(path.id);

      // Validate path commands
      if (path.commands.length === 0) {
        warnings.push(`Path ${path.id} in layer ${layer.id} has no commands`);
      }
    });

    // Check for layout consistency
    if (layer.layout) {
      const layoutValidation = this.validateLayoutSpecification(layer.layout);
      errors.push(...layoutValidation.errors);
      warnings.push(...layoutValidation.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validate layer organization and suggest improvements
   */
  private validateLayerOrganization(layers: UnifiedLayer[]): {
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for too many layers
    if (layers.length > 20) {
      warnings.push(
        `High layer count (${layers.length}) may impact performance`
      );
      suggestions.push(`Consider grouping related paths into fewer layers`);
    }

    // Check for layers with too many paths
    layers.forEach((layer) => {
      if (layer.paths.length > 50) {
        warnings.push(
          `Layer ${layer.id} has many paths (${layer.paths.length})`
        );
        suggestions.push(
          `Consider splitting layer ${layer.id} into multiple layers`
        );
      }
    });

    // Check for semantic naming
    const genericNames = layers.filter(
      (layer) =>
        /^(layer|group|item)\d*$/i.test(layer.id) ||
        /^(layer|group|item)\d*$/i.test(layer.label)
    );

    if (genericNames.length > 0) {
      suggestions.push(
        `Use more descriptive names for layers: ${genericNames.map((l) => l.id).join(", ")}`
      );
    }

    return { warnings, suggestions };
  }

  /**
   * Optimize layer structure for performance and organization
   */
  optimizeLayers(layers: UnifiedLayer[]): LayerOptimization {
    const cacheKey = this.generateOptimizationCacheKey(layers);
    const cached = this.optimizationCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const optimization = this.performLayerOptimization(layers);
    this.optimizationCache.set(cacheKey, optimization);

    return optimization;
  }

  /**
   * Perform layer optimization
   */
  private performLayerOptimization(layers: UnifiedLayer[]): LayerOptimization {
    const originalLayerCount = layers.length;
    const optimizations: string[] = [];
    const mergedLayers: string[] = [];
    const removedLayers: string[] = [];

    // Find empty layers
    const emptyLayers = layers.filter((layer) => layer.paths.length === 0);
    removedLayers.push(...emptyLayers.map((l) => l.id));

    if (emptyLayers.length > 0) {
      optimizations.push(`Removed ${emptyLayers.length} empty layers`);
    }

    // Find layers that can be merged
    const mergeCandidates = this.findMergeCandidates(layers);
    mergeCandidates.forEach((group) => {
      if (group.length > 1) {
        mergedLayers.push(...group.slice(1));
        optimizations.push(`Merged ${group.length} similar layers`);
      }
    });

    // Calculate performance gain
    const optimizedLayerCount =
      originalLayerCount - removedLayers.length - mergedLayers.length;
    const performanceGain =
      ((originalLayerCount - optimizedLayerCount) / originalLayerCount) * 100;

    return {
      originalLayerCount,
      optimizedLayerCount,
      mergedLayers,
      removedLayers,
      optimizations,
      performanceGain,
    };
  }

  /**
   * Find layers that can be merged based on similar characteristics
   */
  private findMergeCandidates(layers: UnifiedLayer[]): string[][] {
    const candidates: string[][] = [];
    const processed = new Set<string>();

    layers.forEach((layer) => {
      if (processed.has(layer.id)) return;

      const similarLayers = layers.filter(
        (otherLayer) =>
          otherLayer.id !== layer.id &&
          !processed.has(otherLayer.id) &&
          this.areLayersSimilar(layer, otherLayer)
      );

      if (similarLayers.length > 0) {
        const group = [layer.id, ...similarLayers.map((l) => l.id)];
        candidates.push(group);

        group.forEach((id) => processed.add(id));
      }
    });

    return candidates;
  }

  /**
   * Check if two layers are similar enough to be merged
   */
  private areLayersSimilar(
    layer1: UnifiedLayer,
    layer2: UnifiedLayer
  ): boolean {
    // Check if they use the same region
    const region1 = layer1.layout?.region || "center";
    const region2 = layer2.layout?.region || "center";

    if (region1 !== region2) return false;

    // Check if they have similar path counts
    const pathCount1 = layer1.paths.length;
    const pathCount2 = layer2.paths.length;

    if (Math.abs(pathCount1 - pathCount2) > 5) return false;

    // Check if they have similar styling
    const styles1 = layer1.paths.map((p) => JSON.stringify(p.style));
    const styles2 = layer2.paths.map((p) => JSON.stringify(p.style));

    const commonStyles = styles1.filter((style) => styles2.includes(style));
    const similarityRatio =
      commonStyles.length / Math.max(styles1.length, styles2.length);

    return similarityRatio > 0.7; // 70% style similarity
  }

  /**
   * Create layer hierarchy based on dependencies and relationships
   */
  createLayerHierarchy(layers: UnifiedLayer[]): LayerHierarchy[] {
    return layers.map((layer, index) => ({
      id: layer.id,
      label: layer.label,
      level: this.calculateLayerLevel(layer, layers),
      parent: this.findParentLayer(layer, layers),
      children: this.findChildLayers(layer, layers),
      dependencies: this.findLayerDependencies(layer, layers),
    }));
  }

  /**
   * Group layers by purpose and functionality
   */
  groupLayersByPurpose(layers: UnifiedLayer[]): LayerGroup[] {
    const groups: LayerGroup[] = [];

    // Group by region
    const regionGroups = new Map<string, string[]>();
    layers.forEach((layer) => {
      const region = layer.layout?.region || "center";
      if (!regionGroups.has(region)) {
        regionGroups.set(region, []);
      }
      regionGroups.get(region)!.push(layer.id);
    });

    regionGroups.forEach((layerIds, region) => {
      if (layerIds.length > 1) {
        groups.push({
          name: `${region}_group`,
          layers: layerIds,
          purpose: `Layers positioned in ${region} region`,
          priority: this.calculateGroupPriority(region),
        });
      }
    });

    // Group by semantic similarity
    const semanticGroups = this.groupBySemanticSimilarity(layers);
    groups.push(...semanticGroups);

    return groups;
  }

  /**
   * Get comprehensive layer statistics
   */
  getLayerStatistics(layers: UnifiedLayer[]): {
    totalLayers: number;
    totalPaths: number;
    totalCommands: number;
    averagePathsPerLayer: number;
    averageCommandsPerPath: number;
    regionDistribution: Record<string, number>;
    complexityDistribution: Record<string, number>;
    estimatedRenderTime: number;
    estimatedMemoryUsage: number;
  } {
    const totalLayers = layers.length;
    const totalPaths = layers.reduce(
      (sum, layer) => sum + layer.paths.length,
      0
    );
    const totalCommands = layers.reduce(
      (sum, layer) =>
        sum +
        layer.paths.reduce(
          (pathSum, path) => pathSum + path.commands.length,
          0
        ),
      0
    );

    const regionDistribution: Record<string, number> = {};
    const complexityDistribution: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
    };

    layers.forEach((layer) => {
      const region = layer.layout?.region || "center";
      regionDistribution[region] = (regionDistribution[region] || 0) + 1;

      const analysis = this.analyzeLayer(layer, 512, 512);
      complexityDistribution[analysis.complexity]++;
    });

    return {
      totalLayers,
      totalPaths,
      totalCommands,
      averagePathsPerLayer: totalPaths / totalLayers,
      averageCommandsPerPath: totalCommands / totalPaths,
      regionDistribution,
      complexityDistribution,
      estimatedRenderTime: this.estimateDocumentRenderTime(layers),
      estimatedMemoryUsage: this.estimateDocumentMemoryUsage(layers),
    };
  }

  // Private helper methods

  private generateLayerCacheKey(layer: UnifiedLayer): string {
    return `layer:${layer.id}:${JSON.stringify(layer.layout)}:${layer.paths.length}`;
  }

  private generateOptimizationCacheKey(layers: UnifiedLayer[]): string {
    const signature = layers.map((l) => `${l.id}:${l.paths.length}`).join("|");
    return `opt:${signature}`;
  }

  private calculateLayerBounds(layer: UnifiedLayer): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (layer.paths.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    layer.paths.forEach((path) => {
      path.commands.forEach((command) => {
        if (command.cmd !== "Z") {
          for (let i = 0; i < command.coords.length; i += 2) {
            const x = command.coords[i];
            const y = command.coords[i + 1];

            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      });
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private determineComplexity(
    pathCount: number,
    commandCount: number
  ): "low" | "medium" | "high" {
    if (pathCount <= 5 && commandCount <= 20) return "low";
    if (pathCount <= 15 && commandCount <= 100) return "medium";
    return "high";
  }

  private estimateRenderTime(pathCount: number, commandCount: number): number {
    // Rough estimation in milliseconds
    return pathCount * 0.1 + commandCount * 0.01;
  }

  private estimateMemoryUsage(layer: UnifiedLayer): number {
    // Rough estimation in bytes
    const baseSize = 100; // Base layer overhead
    const pathSize = layer.paths.length * 50; // Per path overhead
    const commandSize = layer.paths.reduce(
      (sum, path) => sum + path.commands.length * 20,
      0
    ); // Per command overhead

    return baseSize + pathSize + commandSize;
  }

  private estimateDocumentRenderTime(layers: UnifiedLayer[]): number {
    return layers.reduce((sum, layer) => {
      const analysis = this.analyzeLayer(layer, 512, 512);
      return sum + analysis.estimatedRenderTime;
    }, 0);
  }

  private estimateDocumentMemoryUsage(layers: UnifiedLayer[]): number {
    return layers.reduce((sum, layer) => {
      const analysis = this.analyzeLayer(layer, 512, 512);
      return sum + analysis.memoryUsage;
    }, 0);
  }

  private validateLayoutSpecification(
    layout: LayoutSpecification
  ): LayerValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (layout.region && !this.regionManager.isValidRegion(layout.region)) {
      errors.push(`Invalid region: ${layout.region}`);
    }

    if (layout.offset) {
      const [x, y] = layout.offset;
      if (Math.abs(x) > 1 || Math.abs(y) > 1) {
        warnings.push(
          `Large offset values may cause positioning issues: [${x}, ${y}]`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings, suggestions: [] };
  }

  private calculateLayerLevel(
    layer: UnifiedLayer,
    layers: UnifiedLayer[]
  ): number {
    // Simple heuristic based on layer position and dependencies
    const index = layers.findIndex((l) => l.id === layer.id);
    return Math.floor(index / 5); // Group every 5 layers into a level
  }

  private findParentLayer(
    layer: UnifiedLayer,
    layers: UnifiedLayer[]
  ): string | undefined {
    // Simple heuristic: previous layer in same region could be parent
    const region = layer.layout?.region || "center";
    const sameRegionLayers = layers.filter(
      (l) => (l.layout?.region || "center") === region
    );
    const index = sameRegionLayers.findIndex((l) => l.id === layer.id);

    return index > 0 ? sameRegionLayers[index - 1].id : undefined;
  }

  private findChildLayers(
    layer: UnifiedLayer,
    layers: UnifiedLayer[]
  ): string[] {
    // Simple heuristic: subsequent layers in same region could be children
    const region = layer.layout?.region || "center";
    const sameRegionLayers = layers.filter(
      (l) => (l.layout?.region || "center") === region
    );
    const index = sameRegionLayers.findIndex((l) => l.id === layer.id);

    return index < sameRegionLayers.length - 1
      ? [sameRegionLayers[index + 1].id]
      : [];
  }

  private findLayerDependencies(
    layer: UnifiedLayer,
    layers: UnifiedLayer[]
  ): string[] {
    // Simple heuristic: layers that share similar positioning or styling
    return layers
      .filter(
        (otherLayer) =>
          otherLayer.id !== layer.id && this.areLayersRelated(layer, otherLayer)
      )
      .map((l) => l.id);
  }

  private areLayersRelated(
    layer1: UnifiedLayer,
    layer2: UnifiedLayer
  ): boolean {
    // Check if layers share the same region
    const region1 = layer1.layout?.region || "center";
    const region2 = layer2.layout?.region || "center";

    return region1 === region2;
  }

  private groupBySemanticSimilarity(layers: UnifiedLayer[]): LayerGroup[] {
    const groups: LayerGroup[] = [];

    // Group by label keywords
    const keywordGroups = new Map<string, string[]>();

    layers.forEach((layer) => {
      const keywords = this.extractKeywords(layer.label);
      keywords.forEach((keyword) => {
        if (!keywordGroups.has(keyword)) {
          keywordGroups.set(keyword, []);
        }
        keywordGroups.get(keyword)!.push(layer.id);
      });
    });

    keywordGroups.forEach((layerIds, keyword) => {
      if (layerIds.length > 1) {
        groups.push({
          name: `${keyword}_semantic_group`,
          layers: layerIds,
          purpose: `Layers related to ${keyword}`,
          priority: layerIds.length, // Priority based on group size
        });
      }
    });

    return groups;
  }

  private extractKeywords(label: string): string[] {
    // Simple keyword extraction
    return label
      .toLowerCase()
      .split(/[\s_-]+/)
      .filter((word) => word.length > 2)
      .filter((word) => !["the", "and", "for", "with"].includes(word));
  }

  private calculateGroupPriority(region: string): number {
    // Priority based on region importance
    const priorities: Record<string, number> = {
      center: 10,
      top_center: 8,
      bottom_center: 7,
      middle_left: 6,
      middle_right: 6,
      top_left: 5,
      top_right: 5,
      bottom_left: 4,
      bottom_right: 4,
      full_canvas: 9,
    };

    return priorities[region] || 3;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.layerCache.clear();
    this.optimizationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    layerCacheSize: number;
    optimizationCacheSize: number;
  } {
    return {
      layerCacheSize: this.layerCache.size,
      optimizationCacheSize: this.optimizationCache.size,
    };
  }
}
