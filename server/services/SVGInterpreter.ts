/**
 * SVGInterpreter - Converts unified layered JSON to SVG markup
 * Handles layout language coordinate mapping and layer organization
 */

import {
  UnifiedLayeredSVGDocument,
  UnifiedLayer,
  UnifiedPath,
  PathCommand,
  PathStyle,
  LayoutSpecification,
  LayerMetadata,
  LayoutMetadata,
  RegionName,
  AnchorPoint,
} from "../types/unified-layered";
import { RegionManager } from "./RegionManager";
import { CoordinateMapper } from "./CoordinateMapper";
import { AspectRatioManager } from "./AspectRatioManager";
import { SizeSpecManager } from "./SizeSpecManager";
import { RepetitionSpecManager } from "./RepetitionSpecManager";

export interface SVGInterpreterOptions {
  includeMetadata?: boolean;
  includeDebugInfo?: boolean;
  optimizePaths?: boolean;
}

export interface SVGInterpreterResult {
  svg: string;
  layerMetadata: LayerMetadata[];
  layoutMetadata: LayoutMetadata;
  warnings: string[];
}

export class SVGInterpreter {
  private regionManager: RegionManager;
  private coordinateMapper: CoordinateMapper;
  private options: SVGInterpreterOptions;

  constructor(options: SVGInterpreterOptions = {}) {
    this.options = {
      includeMetadata: true,
      includeDebugInfo: false,
      optimizePaths: true,
      ...options,
    };

    // Initialize with default aspect ratio - will be updated per document
    this.regionManager = new RegionManager("1:1");
    this.coordinateMapper = new CoordinateMapper(512, 512, this.regionManager);
  }

  /**
   * Convert unified layered JSON document to SVG markup
   */
  convertToSVG(doc: UnifiedLayeredSVGDocument): SVGInterpreterResult {
    const warnings: string[] = [];

    // Update managers for current document
    this.updateForDocument(doc);

    // Process layers and generate SVG content
    const layerElements: string[] = [];
    const layerMetadata: LayerMetadata[] = [];

    for (const layer of doc.layers) {
      try {
        const { element, metadata } = this.processLayer(layer, doc);
        layerElements.push(element);
        layerMetadata.push(metadata);
      } catch (error) {
        warnings.push(`Error processing layer ${layer.id}: ${error.message}`);
        // Continue with other layers
      }
    }

    // Generate layout metadata
    const layoutMetadata = this.generateLayoutMetadata(doc, layerMetadata);

    // Build final SVG
    const svg = this.buildSVGDocument(doc, layerElements);

    return {
      svg,
      layerMetadata,
      layoutMetadata,
      warnings,
    };
  }

  /**
   * Update managers for the current document's configuration
   */
  private updateForDocument(doc: UnifiedLayeredSVGDocument): void {
    // Update region manager for current aspect ratio
    this.regionManager = new RegionManager(doc.canvas.aspectRatio);
    this.coordinateMapper = new CoordinateMapper(
      doc.canvas.width,
      doc.canvas.height,
      this.regionManager
    );

    // Add custom regions if defined
    if (doc.layout?.regions) {
      for (const region of doc.layout.regions) {
        this.regionManager.addCustomRegion(region.name, region.bounds);
      }
    }
  }

  /**
   * Process a single layer and return SVG element and metadata
   */
  private processLayer(
    layer: UnifiedLayer,
    doc: UnifiedLayeredSVGDocument
  ): { element: string; metadata: LayerMetadata } {
    const pathElements: string[] = [];
    let layerBounds = {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    };

    // Process each path in the layer
    for (const path of layer.paths) {
      try {
        const pathElement = this.processPath(path, layer, doc);
        pathElements.push(`  ${pathElement}`);

        // Update layer bounds
        const pathBounds = this.calculatePathBounds(path, layer, doc);
        layerBounds.minX = Math.min(layerBounds.minX, pathBounds.minX);
        layerBounds.minY = Math.min(layerBounds.minY, pathBounds.minY);
        layerBounds.maxX = Math.max(layerBounds.maxX, pathBounds.maxX);
        layerBounds.maxY = Math.max(layerBounds.maxY, pathBounds.maxY);
      } catch (error) {
        // Log warning but continue with other paths
        console.warn(
          `Error processing path ${path.id} in layer ${layer.id}:`,
          error
        );
      }
    }

    // Build layer group element
    const layerAttributes = this.buildLayerAttributes(layer);
    const layerElement = `<g ${layerAttributes}>\n${pathElements.join("\n")}\n</g>`;

    // Create layer metadata
    const metadata: LayerMetadata = {
      id: layer.id,
      label: layer.label,
      pathCount: layer.paths.length,
      region: layer.layout?.region,
      anchor: layer.layout?.anchor,
      bounds: {
        x: layerBounds.minX === Infinity ? 0 : layerBounds.minX,
        y: layerBounds.minY === Infinity ? 0 : layerBounds.minY,
        width:
          layerBounds.maxX === -Infinity
            ? 0
            : layerBounds.maxX - layerBounds.minX,
        height:
          layerBounds.maxY === -Infinity
            ? 0
            : layerBounds.maxY - layerBounds.minY,
      },
    };

    return { element: layerElement, metadata };
  }

  /**
   * Process a single path and return SVG path element
   */
  private processPath(
    path: UnifiedPath,
    layer: UnifiedLayer,
    doc: UnifiedLayeredSVGDocument
  ): string {
    // Apply layout transformations if specified
    let commands = path.commands;

    if (path.layout || layer.layout) {
      commands = this.applyLayoutTransformations(path, layer, doc);
    }

    // Handle repetition if specified
    if (path.layout?.repeat) {
      return this.processRepeatedPath(path, layer, doc, commands);
    }

    // Build single path element
    const d = this.buildPathData(commands);
    const style = this.buildStyleAttributes(path.style);
    const metadata = this.buildPathMetadata(path);

    return `<path id="${path.id}" d="${d}"${style}${metadata}/>`;
  }

  /**
   * Process a path with repetition specification
   */
  private processRepeatedPath(
    path: UnifiedPath,
    layer: UnifiedLayer,
    doc: UnifiedLayeredSVGDocument,
    commands: PathCommand[]
  ): string {
    const repetitionSpec = path.layout!.repeat!;

    // Create repetition context
    const context = {
      regionName: path.layout?.region || layer.layout?.region || "center",
      anchor: path.layout?.anchor || layer.layout?.anchor || "center",
      offset: path.layout?.offset || layer.layout?.offset || [0, 0],
      canvasWidth: doc.canvas.width,
      canvasHeight: doc.canvas.height,
      regionManager: this.regionManager,
      coordinateMapper: this.coordinateMapper,
    };

    // Generate repetition instances
    const repetitionResult = RepetitionSpecManager.generateRepetition(
      repetitionSpec,
      context
    );

    // Apply repetition to commands
    const repeatedCommands = RepetitionSpecManager.applyRepetitionToCommands(
      commands,
      repetitionResult
    );

    // Create path elements for each instance
    const pathElements = repeatedCommands.map((instanceCommands, index) => {
      const d = this.buildPathData(instanceCommands);
      const style = this.buildStyleAttributes(path.style);
      const instanceId = `${path.id}_${index}`;

      return `<path id="${instanceId}" d="${d}"${style}/>`;
    });

    // Wrap in a group for the repeated path
    const groupId = `${path.id}_group`;
    const metadata = this.buildPathMetadata(path);

    return `<g id="${groupId}"${metadata}>\n${pathElements.map((p) => `  ${p}`).join("\n")}\n</g>`;
  }

  /**
   * Apply layout language transformations to path commands
   */
  private applyLayoutTransformations(
    path: UnifiedPath,
    layer: UnifiedLayer,
    doc: UnifiedLayeredSVGDocument
  ): PathCommand[] {
    // Determine effective layout specification (path overrides layer)
    const effectiveLayout: LayoutSpecification = {
      region: path.layout?.region || layer.layout?.region || "center",
      anchor: path.layout?.anchor || layer.layout?.anchor || "center",
      offset: path.layout?.offset || layer.layout?.offset || [0, 0],
      size: path.layout?.size,
    };

    // Apply size transformations if specified
    if (effectiveLayout.size) {
      return this.applySizeTransformations(path.commands, effectiveLayout, doc);
    }

    // Apply coordinate transformations for positioning
    return this.coordinateMapper.transformPathCommands(
      path.commands,
      effectiveLayout
    );
  }

  /**
   * Apply size transformations to path commands
   */
  private applySizeTransformations(
    commands: PathCommand[],
    layout: LayoutSpecification,
    doc: UnifiedLayeredSVGDocument
  ): PathCommand[] {
    if (!layout.size) return commands;

    // Calculate target size
    const context = {
      regionName: layout.region!,
      canvasWidth: doc.canvas.width,
      canvasHeight: doc.canvas.height,
      regionManager: this.regionManager,
    };

    const calculatedSize = SizeSpecManager.calculateSize(layout.size, context);

    // Calculate current path bounds
    const bounds = this.calculateCommandsBounds(commands);
    const currentWidth = bounds.maxX - bounds.minX;
    const currentHeight = bounds.maxY - bounds.minY;

    // Calculate scale factors
    const scaleX = calculatedSize.width / currentWidth;
    const scaleY = calculatedSize.height / currentHeight;

    // Apply scaling to commands
    return commands.map((cmd) => {
      if (cmd.cmd === "Z") return cmd;

      const scaledCoords = cmd.coords.map((coord, index) => {
        return index % 2 === 0 ? coord * scaleX : coord * scaleY;
      });

      return { ...cmd, coords: scaledCoords };
    });
  }

  /**
   * Calculate bounds of path commands
   */
  private calculateCommandsBounds(commands: PathCommand[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    for (const cmd of commands) {
      if (cmd.cmd === "Z") continue;

      for (let i = 0; i < cmd.coords.length; i += 2) {
        const x = cmd.coords[i];
        const y = cmd.coords[i + 1];

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }

    return { minX, maxX, minY, maxY };
  }

  /**
   * Calculate bounds of a path considering layout transformations
   */
  private calculatePathBounds(
    path: UnifiedPath,
    layer: UnifiedLayer,
    doc: UnifiedLayeredSVGDocument
  ): { minX: number; maxX: number; minY: number; maxY: number } {
    const transformedCommands = this.applyLayoutTransformations(
      path,
      layer,
      doc
    );
    return this.calculateCommandsBounds(transformedCommands);
  }

  /**
   * Build SVG path data string from commands
   */
  private buildPathData(commands: PathCommand[]): string {
    return commands
      .map((cmd) => {
        if (cmd.cmd === "Z") return "Z";

        // Round coordinates to reduce file size
        const roundedCoords = cmd.coords.map(
          (coord) => Math.round(coord * 100) / 100
        );

        return `${cmd.cmd} ${roundedCoords.join(" ")}`;
      })
      .join(" ");
  }

  /**
   * Build style attributes string from PathStyle
   */
  private buildStyleAttributes(style: PathStyle): string {
    const attrs: string[] = [];

    attrs.push(`fill="${style.fill || "none"}"`);
    attrs.push(`stroke="${style.stroke || "none"}"`);

    if (style.strokeWidth !== undefined) {
      attrs.push(`stroke-width="${style.strokeWidth}"`);
    }
    if (style.strokeLinecap) {
      attrs.push(`stroke-linecap="${style.strokeLinecap}"`);
    }
    if (style.strokeLinejoin) {
      attrs.push(`stroke-linejoin="${style.strokeLinejoin}"`);
    }
    if (style.opacity !== undefined) {
      attrs.push(`opacity="${style.opacity}"`);
    }

    return attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
  }

  /**
   * Build layer group attributes
   */
  private buildLayerAttributes(layer: UnifiedLayer): string {
    const attrs: string[] = [];

    attrs.push(`id="${layer.id}"`);

    if (this.options.includeMetadata) {
      attrs.push(`data-label="${layer.label}"`);

      if (layer.layout?.region) {
        attrs.push(`data-region="${layer.layout.region}"`);
      }
      if (layer.layout?.anchor) {
        attrs.push(`data-anchor="${layer.layout.anchor}"`);
      }
      if (layer.layout?.zIndex !== undefined) {
        attrs.push(`data-z-index="${layer.layout.zIndex}"`);
      }
    }

    return attrs.join(" ");
  }

  /**
   * Build path metadata attributes
   */
  private buildPathMetadata(path: UnifiedPath): string {
    if (!this.options.includeMetadata) return "";

    const attrs: string[] = [];

    if (path.layout?.region) {
      attrs.push(`data-region="${path.layout.region}"`);
    }
    if (path.layout?.anchor) {
      attrs.push(`data-anchor="${path.layout.anchor}"`);
    }
    if (path.layout?.offset) {
      attrs.push(`data-offset="${path.layout.offset.join(",")}"`);
    }

    return attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
  }

  /**
   * Generate layout metadata for the document
   */
  private generateLayoutMetadata(
    doc: UnifiedLayeredSVGDocument,
    layerMetadata: LayerMetadata[]
  ): LayoutMetadata {
    // Track which regions are used
    const usedRegions = new Set<string>();
    const usedAnchors = new Set<AnchorPoint>();

    // Collect usage from layers
    for (const layer of doc.layers) {
      if (layer.layout?.region) {
        usedRegions.add(layer.layout.region);
      }
      if (layer.layout?.anchor) {
        usedAnchors.add(layer.layout.anchor);
      }

      // Collect usage from paths
      for (const path of layer.paths) {
        if (path.layout?.region) {
          usedRegions.add(path.layout.region);
        }
        if (path.layout?.anchor) {
          usedAnchors.add(path.layout.anchor);
        }
      }
    }

    // Build region metadata using RegionManager.getAllRegions()
    const allRegionInfos = this.regionManager.getAllRegions();
    const regions = allRegionInfos.map((regionInfo) => ({
      name: regionInfo.name as RegionName | string,
      bounds: {
        x: regionInfo.bounds.x * doc.canvas.width,
        y: regionInfo.bounds.y * doc.canvas.height,
        width: regionInfo.bounds.width * doc.canvas.width,
        height: regionInfo.bounds.height * doc.canvas.height,
      },
      used: usedRegions.has(regionInfo.name),
    }));

    // Calculate coordinate range from layer metadata
    const allBounds = layerMetadata.map((layer) => layer.bounds);
    const coordinateRange =
      allBounds.length > 0
        ? {
            minX: Math.min(...allBounds.map((b) => b.x)),
            maxX: Math.max(...allBounds.map((b) => b.x + b.width)),
            minY: Math.min(...allBounds.map((b) => b.y)),
            maxY: Math.max(...allBounds.map((b) => b.y + b.height)),
          }
        : {
            minX: 0,
            maxX: doc.canvas.width,
            minY: 0,
            maxY: doc.canvas.height,
          };

    return {
      regions,
      anchorsUsed: Array.from(usedAnchors),
      coordinateRange,
    };
  }

  /**
   * Build the final SVG document
   */
  private buildSVGDocument(
    doc: UnifiedLayeredSVGDocument,
    layerElements: string[]
  ): string {
    const { canvas } = doc;

    // Calculate viewBox
    const viewBox = AspectRatioManager.getViewBox(
      canvas.aspectRatio,
      canvas.width,
      canvas.height
    );

    // Build SVG content
    const content = layerElements.join("\n");

    // Add debug information if requested
    const debugInfo = this.options.includeDebugInfo
      ? this.generateDebugOverlay(doc)
      : "";

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${canvas.width}" height="${canvas.height}">
${content}${debugInfo}
</svg>`;
  }

  /**
   * Generate debug overlay showing regions and anchors
   */
  private generateDebugOverlay(doc: UnifiedLayeredSVGDocument): string {
    if (!this.options.includeDebugInfo) return "";

    const debugElements: string[] = [];

    // Add region boundaries
    const regions = this.regionManager.getAllRegions();
    for (const regionInfo of regions) {
      const x = regionInfo.bounds.x * doc.canvas.width;
      const y = regionInfo.bounds.y * doc.canvas.height;
      const width = regionInfo.bounds.width * doc.canvas.width;
      const height = regionInfo.bounds.height * doc.canvas.height;

      debugElements.push(
        `  <rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
          `fill="none" stroke="red" stroke-width="1" stroke-dasharray="2,2" ` +
          `data-debug-region="${regionInfo.name}"/>`
      );

      // Add region label
      debugElements.push(
        `  <text x="${x + width / 2}" y="${y + height / 2}" ` +
          `text-anchor="middle" dominant-baseline="middle" ` +
          `font-family="monospace" font-size="10" fill="red" ` +
          `data-debug-label="${regionInfo.name}">${regionInfo.name}</text>`
      );
    }

    return debugElements.length > 0
      ? `\n<!-- Debug Overlay -->\n<g data-debug="regions">\n${debugElements.join("\n")}\n</g>`
      : "";
  }
}
