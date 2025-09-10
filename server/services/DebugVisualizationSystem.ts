/**
 * DebugVisualizationSystem - Comprehensive debug visualization for unified SVG generation
 * Renders region boundaries, anchor points, layer structure, and layout errors
 */

import {
  UnifiedLayeredSVGDocument,
  UnifiedLayer,
  UnifiedPath,
  RegionName,
  AnchorPoint,
  LayoutSpecification,
  REGION_BOUNDS,
  ANCHOR_OFFSETS,
} from "../types/unified-layered";
import { RegionManager } from "./RegionManager";
import { CoordinateMapper } from "./CoordinateMapper";
import { LayerManager, LayerAnalysis } from "./LayerManager";

export interface DebugVisualizationOptions {
  showRegionBoundaries: boolean;
  showAnchorPoints: boolean;
  showOffsetVectors: boolean;
  showLayerStructure: boolean;
  showLayoutErrors: boolean;
  showPerformanceMetrics: boolean;
  showCoordinateGrid: boolean;
  highlightComplexity: boolean;
  colorScheme: "light" | "dark" | "high-contrast";
  opacity: number; // 0-1 for overlay transparency
}

export interface DebugElement {
  type: "region" | "anchor" | "vector" | "layer" | "error" | "metric" | "grid";
  id: string;
  svg: string;
  metadata: Record<string, any>;
}

export interface DebugVisualizationResult {
  overlayElements: DebugElement[];
  totalElements: number;
  renderTime: number;
  warnings: string[];
  statistics: {
    regionsShown: number;
    anchorsShown: number;
    layersAnalyzed: number;
    errorsFound: number;
  };
}

export interface LayoutError {
  type:
    | "out_of_bounds"
    | "invalid_region"
    | "invalid_anchor"
    | "overlap"
    | "performance";
  severity: "low" | "medium" | "high";
  message: string;
  location: { x: number; y: number };
  affectedElements: string[];
  suggestions: string[];
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: "good" | "warning" | "critical";
  description: string;
}

export class DebugVisualizationSystem {
  private regionManager: RegionManager;
  private coordinateMapper: CoordinateMapper;
  private layerManager: LayerManager;
  private colorSchemes: Record<string, Record<string, string>>;

  constructor(
    regionManager: RegionManager,
    coordinateMapper: CoordinateMapper,
    layerManager: LayerManager
  ) {
    this.regionManager = regionManager;
    this.coordinateMapper = coordinateMapper;
    this.layerManager = layerManager;

    this.colorSchemes = {
      light: {
        regionBorder: "#3B82F6",
        regionFill: "rgba(59, 130, 246, 0.1)",
        anchorPoint: "#EF4444",
        offsetVector: "#10B981",
        layerBorder: "#8B5CF6",
        errorHighlight: "#F59E0B",
        gridLine: "#E5E7EB",
        text: "#374151",
      },
      dark: {
        regionBorder: "#60A5FA",
        regionFill: "rgba(96, 165, 250, 0.2)",
        anchorPoint: "#F87171",
        offsetVector: "#34D399",
        layerBorder: "#A78BFA",
        errorHighlight: "#FBBF24",
        gridLine: "#4B5563",
        text: "#F3F4F6",
      },
      "high-contrast": {
        regionBorder: "#000000",
        regionFill: "rgba(255, 255, 0, 0.3)",
        anchorPoint: "#FF0000",
        offsetVector: "#00FF00",
        layerBorder: "#0000FF",
        errorHighlight: "#FF00FF",
        gridLine: "#808080",
        text: "#000000",
      },
    };
  }

  /**
   * Generate comprehensive debug visualization
   */
  generateDebugVisualization(
    document: UnifiedLayeredSVGDocument,
    options: Partial<DebugVisualizationOptions> = {}
  ): DebugVisualizationResult {
    const startTime = performance.now();

    const fullOptions: DebugVisualizationOptions = {
      showRegionBoundaries: true,
      showAnchorPoints: true,
      showOffsetVectors: true,
      showLayerStructure: true,
      showLayoutErrors: true,
      showPerformanceMetrics: false,
      showCoordinateGrid: false,
      highlightComplexity: true,
      colorScheme: "light",
      opacity: 0.7,
      ...options,
    };

    const overlayElements: DebugElement[] = [];
    const warnings: string[] = [];
    const statistics = {
      regionsShown: 0,
      anchorsShown: 0,
      layersAnalyzed: 0,
      errorsFound: 0,
    };

    // Generate coordinate grid if requested
    if (fullOptions.showCoordinateGrid) {
      const gridElements = this.generateCoordinateGrid(
        document.canvas,
        fullOptions
      );
      overlayElements.push(...gridElements);
    }

    // Generate region boundaries
    if (fullOptions.showRegionBoundaries) {
      const regionElements = this.generateRegionBoundaries(
        document,
        fullOptions
      );
      overlayElements.push(...regionElements);
      statistics.regionsShown = regionElements.length;
    }

    // Generate anchor points
    if (fullOptions.showAnchorPoints) {
      const anchorElements = this.generateAnchorPoints(document, fullOptions);
      overlayElements.push(...anchorElements);
      statistics.anchorsShown = anchorElements.length;
    }

    // Generate offset vectors
    if (fullOptions.showOffsetVectors) {
      const vectorElements = this.generateOffsetVectors(document, fullOptions);
      overlayElements.push(...vectorElements);
    }

    // Generate layer structure visualization
    if (fullOptions.showLayerStructure) {
      const layerElements = this.generateLayerStructure(document, fullOptions);
      overlayElements.push(...layerElements);
      statistics.layersAnalyzed = document.layers.length;
    }

    // Detect and visualize layout errors
    if (fullOptions.showLayoutErrors) {
      const errorElements = this.generateLayoutErrors(document, fullOptions);
      overlayElements.push(...errorElements);
      statistics.errorsFound = errorElements.length;
    }

    // Generate performance metrics
    if (fullOptions.showPerformanceMetrics) {
      const metricElements = this.generatePerformanceMetrics(
        document,
        fullOptions
      );
      overlayElements.push(...metricElements);
    }

    const endTime = performance.now();

    return {
      overlayElements,
      totalElements: overlayElements.length,
      renderTime: endTime - startTime,
      warnings,
      statistics,
    };
  }

  /**
   * Generate coordinate grid overlay
   */
  private generateCoordinateGrid(
    canvas: { width: number; height: number },
    options: DebugVisualizationOptions
  ): DebugElement[] {
    const elements: DebugElement[] = [];
    const colors = this.colorSchemes[options.colorScheme];
    const gridSpacing = 32; // Grid every 32 pixels

    let gridSvg = "";

    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gridSpacing) {
      gridSvg += `<line x1="${x}" y1="0" x2="${x}" y2="${canvas.height}" stroke="${colors.gridLine}" stroke-width="0.5" opacity="${options.opacity * 0.5}"/>`;

      // Add coordinate labels
      if (x % (gridSpacing * 4) === 0) {
        gridSvg += `<text x="${x + 2}" y="12" font-family="monospace" font-size="8" fill="${colors.text}" opacity="${options.opacity}">${x}</text>`;
      }
    }

    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSpacing) {
      gridSvg += `<line x1="0" y1="${y}" x2="${canvas.width}" y2="${y}" stroke="${colors.gridLine}" stroke-width="0.5" opacity="${options.opacity * 0.5}"/>`;

      // Add coordinate labels
      if (y % (gridSpacing * 4) === 0 && y > 0) {
        gridSvg += `<text x="2" y="${y - 2}" font-family="monospace" font-size="8" fill="${colors.text}" opacity="${options.opacity}">${y}</text>`;
      }
    }

    elements.push({
      type: "grid",
      id: "coordinate_grid",
      svg: `<g id="debug-coordinate-grid">${gridSvg}</g>`,
      metadata: {
        gridSpacing,
        totalLines:
          Math.ceil(canvas.width / gridSpacing) +
          Math.ceil(canvas.height / gridSpacing),
      },
    });

    return elements;
  }

  /**
   * Generate region boundary overlays
   */
  private generateRegionBoundaries(
    document: UnifiedLayeredSVGDocument,
    options: DebugVisualizationOptions
  ): DebugElement[] {
    const elements: DebugElement[] = [];
    const colors = this.colorSchemes[options.colorScheme];
    const usedRegions = this.getUsedRegions(document);

    // Standard regions
    Object.entries(REGION_BOUNDS).forEach(([regionName, bounds]) => {
      const isUsed = usedRegions.has(regionName);
      const pixelBounds = this.regionManager.getPixelBounds(
        regionName as RegionName
      );

      const opacity = isUsed ? options.opacity : options.opacity * 0.3;
      const strokeWidth = isUsed ? 2 : 1;
      const strokeDashArray = isUsed ? "none" : "4,2";

      const regionSvg = `
        <g id="debug-region-${regionName}">
          <rect 
            x="${pixelBounds.x}" 
            y="${pixelBounds.y}" 
            width="${pixelBounds.width}" 
            height="${pixelBounds.height}"
            fill="${colors.regionFill}"
            stroke="${colors.regionBorder}"
            stroke-width="${strokeWidth}"
            stroke-dasharray="${strokeDashArray}"
            opacity="${opacity}"
          />
          <text 
            x="${pixelBounds.x + pixelBounds.width / 2}" 
            y="${pixelBounds.y + pixelBounds.height / 2}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="monospace"
            font-size="10"
            fill="${colors.text}"
            opacity="${opacity}"
          >${regionName}</text>
        </g>
      `;

      elements.push({
        type: "region",
        id: `region_${regionName}`,
        svg: regionSvg,
        metadata: {
          regionName,
          bounds: pixelBounds,
          isUsed,
          normalizedBounds: bounds,
        },
      });
    });

    // Custom regions
    // Note: Would need to implement custom region tracking in RegionManager

    return elements;
  }

  /**
   * Generate anchor point visualizations
   */
  private generateAnchorPoints(
    document: UnifiedLayeredSVGDocument,
    options: DebugVisualizationOptions
  ): DebugElement[] {
    const elements: DebugElement[] = [];
    const colors = this.colorSchemes[options.colorScheme];
    const usedAnchors = this.getUsedAnchors(document);

    // Show anchor points for each used region
    const usedRegions = this.getUsedRegions(document);

    usedRegions.forEach((regionName) => {
      const regionPixelBounds = this.regionManager.getPixelBounds(regionName);

      Object.entries(ANCHOR_OFFSETS).forEach(([anchorName, offset]) => {
        const isUsed = usedAnchors.has(anchorName as AnchorPoint);
        const anchorX =
          regionPixelBounds.x + regionPixelBounds.width * offset.x;
        const anchorY =
          regionPixelBounds.y + regionPixelBounds.height * offset.y;

        const opacity = isUsed ? options.opacity : options.opacity * 0.5;
        const radius = isUsed ? 4 : 2;

        const anchorSvg = `
          <g id="debug-anchor-${regionName}-${anchorName}">
            <circle 
              cx="${anchorX}" 
              cy="${anchorY}" 
              r="${radius}"
              fill="${colors.anchorPoint}"
              stroke="white"
              stroke-width="1"
              opacity="${opacity}"
            />
            <text 
              x="${anchorX + 6}" 
              y="${anchorY - 6}"
              font-family="monospace"
              font-size="8"
              fill="${colors.text}"
              opacity="${opacity * 0.8}"
            >${anchorName}</text>
          </g>
        `;

        elements.push({
          type: "anchor",
          id: `anchor_${regionName}_${anchorName}`,
          svg: anchorSvg,
          metadata: {
            regionName,
            anchorName,
            position: { x: anchorX, y: anchorY },
            isUsed,
          },
        });
      });
    });

    return elements;
  }

  /**
   * Generate offset vector visualizations
   */
  private generateOffsetVectors(
    document: UnifiedLayeredSVGDocument,
    options: DebugVisualizationOptions
  ): DebugElement[] {
    const elements: DebugElement[] = [];
    const colors = this.colorSchemes[options.colorScheme];

    document.layers.forEach((layer) => {
      if (
        layer.layout?.offset &&
        (layer.layout.offset[0] !== 0 || layer.layout.offset[1] !== 0)
      ) {
        const vectorElement = this.createOffsetVector(
          layer.id,
          layer.layout,
          colors,
          options.opacity
        );
        if (vectorElement) {
          elements.push(vectorElement);
        }
      }

      layer.paths.forEach((path) => {
        if (
          path.layout?.offset &&
          (path.layout.offset[0] !== 0 || path.layout.offset[1] !== 0)
        ) {
          const vectorElement = this.createOffsetVector(
            path.id,
            path.layout,
            colors,
            options.opacity
          );
          if (vectorElement) {
            elements.push(vectorElement);
          }
        }
      });
    });

    return elements;
  }

  /**
   * Generate layer structure visualization
   */
  private generateLayerStructure(
    document: UnifiedLayeredSVGDocument,
    options: DebugVisualizationOptions
  ): DebugElement[] {
    const elements: DebugElement[] = [];
    const colors = this.colorSchemes[options.colorScheme];

    document.layers.forEach((layer, index) => {
      const analysis = this.layerManager.analyzeLayer(
        layer,
        document.canvas.width,
        document.canvas.height
      );
      const complexityColor = this.getComplexityColor(
        analysis.complexity,
        options.colorScheme
      );

      const layerSvg = `
        <g id="debug-layer-${layer.id}">
          <rect 
            x="${analysis.bounds.x - 2}" 
            y="${analysis.bounds.y - 2}" 
            width="${analysis.bounds.width + 4}" 
            height="${analysis.bounds.height + 4}"
            fill="none"
            stroke="${options.highlightComplexity ? complexityColor : colors.layerBorder}"
            stroke-width="1"
            stroke-dasharray="2,2"
            opacity="${options.opacity * 0.8}"
          />
          <text 
            x="${analysis.bounds.x}" 
            y="${analysis.bounds.y - 4}"
            font-family="monospace"
            font-size="9"
            fill="${colors.text}"
            opacity="${options.opacity}"
          >${layer.label} (${analysis.pathCount}p, ${analysis.complexity})</text>
        </g>
      `;

      elements.push({
        type: "layer",
        id: `layer_${layer.id}`,
        svg: layerSvg,
        metadata: {
          layerId: layer.id,
          analysis,
          index,
        },
      });
    });

    return elements;
  }

  /**
   * Generate layout error visualizations
   */
  private generateLayoutErrors(
    document: UnifiedLayeredSVGDocument,
    options: DebugVisualizationOptions
  ): DebugElement[] {
    const elements: DebugElement[] = [];
    const colors = this.colorSchemes[options.colorScheme];
    const errors = this.detectLayoutErrors(document);

    errors.forEach((error, index) => {
      const errorSvg = `
        <g id="debug-error-${index}">
          <circle 
            cx="${error.location.x}" 
            cy="${error.location.y}" 
            r="8"
            fill="${colors.errorHighlight}"
            stroke="white"
            stroke-width="2"
            opacity="${options.opacity}"
          />
          <text 
            x="${error.location.x}" 
            y="${error.location.y}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family="monospace"
            font-size="10"
            font-weight="bold"
            fill="white"
          >!</text>
          <title>${error.message}</title>
        </g>
      `;

      elements.push({
        type: "error",
        id: `error_${index}`,
        svg: errorSvg,
        metadata: error,
      });
    });

    return elements;
  }

  /**
   * Generate performance metrics visualization
   */
  private generatePerformanceMetrics(
    document: UnifiedLayeredSVGDocument,
    options: DebugVisualizationOptions
  ): DebugElement[] {
    const elements: DebugElement[] = [];
    const colors = this.colorSchemes[options.colorScheme];
    const metrics = this.calculatePerformanceMetrics(document);

    const metricsPanel = this.createMetricsPanel(
      metrics,
      colors,
      options.opacity
    );

    elements.push({
      type: "metric",
      id: "performance_metrics",
      svg: metricsPanel,
      metadata: { metrics },
    });

    return elements;
  }

  // Helper methods

  private getUsedRegions(document: UnifiedLayeredSVGDocument): Set<string> {
    const regions = new Set<string>();

    document.layers.forEach((layer) => {
      if (layer.layout?.region) {
        regions.add(layer.layout.region);
      }

      layer.paths.forEach((path) => {
        if (path.layout?.region) {
          regions.add(path.layout.region);
        }
      });
    });

    // Add default region if none specified
    if (regions.size === 0) {
      regions.add("center");
    }

    return regions;
  }

  private getUsedAnchors(
    document: UnifiedLayeredSVGDocument
  ): Set<AnchorPoint> {
    const anchors = new Set<AnchorPoint>();

    document.layers.forEach((layer) => {
      if (layer.layout?.anchor) {
        anchors.add(layer.layout.anchor);
      }

      layer.paths.forEach((path) => {
        if (path.layout?.anchor) {
          anchors.add(path.layout.anchor);
        }
      });
    });

    // Add default anchor if none specified
    if (anchors.size === 0) {
      anchors.add("center");
    }

    return anchors;
  }

  private createOffsetVector(
    elementId: string,
    layout: LayoutSpecification,
    colors: Record<string, string>,
    opacity: number
  ): DebugElement | null {
    if (!layout.offset || !layout.region) return null;

    const regionPixelBounds = this.regionManager.getPixelBounds(layout.region);
    const anchor = layout.anchor || "center";
    const anchorOffset = ANCHOR_OFFSETS[anchor];

    const startX =
      regionPixelBounds.x + regionPixelBounds.width * anchorOffset.x;
    const startY =
      regionPixelBounds.y + regionPixelBounds.height * anchorOffset.y;

    const offsetX = layout.offset[0] * regionPixelBounds.width;
    const offsetY = layout.offset[1] * regionPixelBounds.height;

    const endX = startX + offsetX;
    const endY = startY + offsetY;

    const vectorSvg = `
      <g id="debug-vector-${elementId}">
        <line 
          x1="${startX}" 
          y1="${startY}" 
          x2="${endX}" 
          y2="${endY}"
          stroke="${colors.offsetVector}"
          stroke-width="2"
          marker-end="url(#debug-arrow)"
          opacity="${opacity}"
        />
        <text 
          x="${(startX + endX) / 2}" 
          y="${(startY + endY) / 2 - 8}"
          text-anchor="middle"
          font-family="monospace"
          font-size="8"
          fill="${colors.text}"
          opacity="${opacity * 0.8}"
        >[${layout.offset[0].toFixed(2)}, ${layout.offset[1].toFixed(2)}]</text>
      </g>
    `;

    return {
      type: "vector",
      id: `vector_${elementId}`,
      svg: vectorSvg,
      metadata: {
        elementId,
        offset: layout.offset,
        startPosition: { x: startX, y: startY },
        endPosition: { x: endX, y: endY },
      },
    };
  }

  private getComplexityColor(complexity: string, colorScheme: string): string {
    const complexityColors = {
      light: { low: "#10B981", medium: "#F59E0B", high: "#EF4444" },
      dark: { low: "#34D399", medium: "#FBBF24", high: "#F87171" },
      "high-contrast": { low: "#00FF00", medium: "#FFFF00", high: "#FF0000" },
    };

    return (
      complexityColors[colorScheme as keyof typeof complexityColors][
        complexity as keyof typeof complexityColors.light
      ] || "#6B7280"
    );
  }

  private detectLayoutErrors(
    document: UnifiedLayeredSVGDocument
  ): LayoutError[] {
    const errors: LayoutError[] = [];

    document.layers.forEach((layer) => {
      // Check for out-of-bounds coordinates
      layer.paths.forEach((path) => {
        path.commands.forEach((command) => {
          if (command.cmd !== "Z") {
            for (let i = 0; i < command.coords.length; i += 2) {
              const x = command.coords[i];
              const y = command.coords[i + 1];

              if (
                x < 0 ||
                x > document.canvas.width ||
                y < 0 ||
                y > document.canvas.height
              ) {
                errors.push({
                  type: "out_of_bounds",
                  severity: "medium",
                  message: `Coordinate out of bounds: (${x}, ${y}) in path ${path.id}`,
                  location: {
                    x: Math.max(0, Math.min(x, document.canvas.width)),
                    y: Math.max(0, Math.min(y, document.canvas.height)),
                  },
                  affectedElements: [path.id],
                  suggestions: [
                    "Clamp coordinates to canvas bounds",
                    "Adjust layout positioning",
                  ],
                });
              }
            }
          }
        });
      });

      // Check for invalid regions
      if (
        layer.layout?.region &&
        !this.regionManager.isValidRegion(layer.layout.region)
      ) {
        const centerX = document.canvas.width / 2;
        const centerY = document.canvas.height / 2;

        errors.push({
          type: "invalid_region",
          severity: "high",
          message: `Invalid region "${layer.layout.region}" in layer ${layer.id}`,
          location: { x: centerX, y: centerY },
          affectedElements: [layer.id],
          suggestions: [
            "Use a valid region name",
            "Define custom region if needed",
          ],
        });
      }
    });

    return errors;
  }

  private calculatePerformanceMetrics(
    document: UnifiedLayeredSVGDocument
  ): PerformanceMetric[] {
    const stats = this.layerManager.getLayerStatistics(document.layers);

    return [
      {
        name: "Layer Count",
        value: stats.totalLayers,
        unit: "layers",
        threshold: 15,
        status: stats.totalLayers > 15 ? "warning" : "good",
        description: "Total number of layers in the document",
      },
      {
        name: "Path Count",
        value: stats.totalPaths,
        unit: "paths",
        threshold: 100,
        status: stats.totalPaths > 100 ? "warning" : "good",
        description: "Total number of paths across all layers",
      },
      {
        name: "Command Count",
        value: stats.totalCommands,
        unit: "commands",
        threshold: 500,
        status: stats.totalCommands > 500 ? "warning" : "good",
        description: "Total number of path commands",
      },
      {
        name: "Estimated Render Time",
        value: stats.estimatedRenderTime,
        unit: "ms",
        threshold: 50,
        status: stats.estimatedRenderTime > 50 ? "warning" : "good",
        description: "Estimated time to render the SVG",
      },
      {
        name: "Memory Usage",
        value: Math.round(stats.estimatedMemoryUsage / 1024),
        unit: "KB",
        threshold: 100,
        status: stats.estimatedMemoryUsage > 100 * 1024 ? "warning" : "good",
        description: "Estimated memory usage",
      },
    ];
  }

  private createMetricsPanel(
    metrics: PerformanceMetric[],
    colors: Record<string, string>,
    opacity: number
  ): string {
    const panelWidth = 200;
    const panelHeight = metrics.length * 20 + 40;
    const panelX = 10;
    const panelY = 10;

    let panelSvg = `
      <g id="debug-metrics-panel">
        <rect 
          x="${panelX}" 
          y="${panelY}" 
          width="${panelWidth}" 
          height="${panelHeight}"
          fill="rgba(255, 255, 255, 0.9)"
          stroke="${colors.text}"
          stroke-width="1"
          opacity="${opacity}"
        />
        <text 
          x="${panelX + 10}" 
          y="${panelY + 20}"
          font-family="monospace"
          font-size="12"
          font-weight="bold"
          fill="${colors.text}"
        >Performance Metrics</text>
    `;

    metrics.forEach((metric, index) => {
      const y = panelY + 40 + index * 20;
      const statusColor =
        metric.status === "good"
          ? "#10B981"
          : metric.status === "warning"
            ? "#F59E0B"
            : "#EF4444";

      panelSvg += `
        <circle cx="${panelX + 15}" cy="${y - 3}" r="3" fill="${statusColor}"/>
        <text 
          x="${panelX + 25}" 
          y="${y}"
          font-family="monospace"
          font-size="10"
          fill="${colors.text}"
        >${metric.name}: ${metric.value}${metric.unit}</text>
      `;
    });

    panelSvg += "</g>";
    return panelSvg;
  }

  /**
   * Generate arrow marker definition for vectors
   */
  generateArrowMarker(colorScheme: string): string {
    const colors = this.colorSchemes[colorScheme];

    return `
      <defs>
        <marker 
          id="debug-arrow" 
          markerWidth="10" 
          markerHeight="10" 
          refX="8" 
          refY="3" 
          orient="auto" 
          markerUnits="strokeWidth"
        >
          <polygon 
            points="0,0 0,6 9,3" 
            fill="${colors.offsetVector}"
          />
        </marker>
      </defs>
    `;
  }

  /**
   * Create complete debug overlay SVG
   */
  createDebugOverlaySVG(
    document: UnifiedLayeredSVGDocument,
    debugResult: DebugVisualizationResult,
    options: Partial<DebugVisualizationOptions> = {}
  ): string {
    const fullOptions: DebugVisualizationOptions = {
      colorScheme: "light",
      ...options,
    };

    const arrowMarker = this.generateArrowMarker(fullOptions.colorScheme);
    const elements = debugResult.overlayElements
      .map((element) => element.svg)
      .join("\n");

    return `
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 ${document.canvas.width} ${document.canvas.height}"
        width="${document.canvas.width}" 
        height="${document.canvas.height}"
        style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 1000;"
      >
        ${arrowMarker}
        ${elements}
      </svg>
    `;
  }

  /**
   * Get debug information summary
   */
  getDebugSummary(debugResult: DebugVisualizationResult): {
    summary: string;
    details: Record<string, any>;
    recommendations: string[];
  } {
    const { statistics, warnings } = debugResult;
    const recommendations: string[] = [];

    if (statistics.errorsFound > 0) {
      recommendations.push(`Fix ${statistics.errorsFound} layout errors found`);
    }

    if (statistics.layersAnalyzed > 15) {
      recommendations.push(
        "Consider reducing layer count for better performance"
      );
    }

    if (warnings.length > 0) {
      recommendations.push("Address visualization warnings");
    }

    return {
      summary: `Debug visualization generated ${debugResult.totalElements} elements in ${debugResult.renderTime.toFixed(2)}ms`,
      details: {
        renderTime: debugResult.renderTime,
        totalElements: debugResult.totalElements,
        statistics,
        warnings,
      },
      recommendations,
    };
  }
}
