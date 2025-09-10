/**
 * UnifiedInterpreter - Converts unified layered JSON with layout specifications to valid SVG
 * Handles layout language processing and SVG generation
 */

import {
  UnifiedLayeredSVGDocument,
  UnifiedLayer,
  UnifiedPath,
  PathCommand,
  PathStyle,
  AspectRatio,
  RegionName,
  AnchorPoint,
} from "../types/unified-layered";
import { RegionManager } from "./RegionManager";
import { CoordinateMapper } from "./CoordinateMapper";
import { AspectRatioManager } from "./AspectRatioManager";

export class UnifiedInterpreter {
  private regionManager: RegionManager;
  private coordinateMapper: CoordinateMapper;
  private aspectRatio: AspectRatio;

  constructor(aspectRatio: AspectRatio = "1:1") {
    this.aspectRatio = aspectRatio;
    this.regionManager = new RegionManager(aspectRatio);
    const dimensions = AspectRatioManager.getCanvasDimensions(aspectRatio);
    this.coordinateMapper = new CoordinateMapper(
      dimensions.width,
      dimensions.height,
      this.regionManager
    );
  }

  /**
   * Convert unified layered document to SVG markup
   */
  convertToSVG(doc: UnifiedLayeredSVGDocument): string {
    // Update managers for current document
    this.updateForDocument(doc);

    const { canvas, layers } = doc;
    const parts: string[] = [];

    // Add SVG header with proper viewBox
    // Use custom viewBox if provided, otherwise use default
    const viewBox =
      canvas.viewBox ||
      AspectRatioManager.getViewBox(
        canvas.aspectRatio,
        canvas.width,
        canvas.height
      );

    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${canvas.width}" height="${canvas.height}">`
    );

    // Process each layer
    for (const layer of layers) {
      parts.push(this.convertLayer(layer, doc));
    }

    parts.push("</svg>");

    return parts.join("\n");
  }

  /**
   * Update managers for current document
   */
  private updateForDocument(doc: UnifiedLayeredSVGDocument): void {
    this.aspectRatio = doc.canvas.aspectRatio;
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
   * Convert a single layer to SVG group
   */
  private convertLayer(
    layer: UnifiedLayer,
    doc: UnifiedLayeredSVGDocument
  ): string {
    const parts: string[] = [];

    // Add layer comment
    parts.push(`  <!-- Layer: ${layer.label} -->`);

    // Create layer group
    const layerAttributes = this.buildLayerAttributes(layer);
    parts.push(`  <g ${layerAttributes}>`);

    // Process each path in the layer
    for (const path of layer.paths) {
      const pathElement = this.convertPath(path, layer, doc);
      parts.push(`    ${pathElement}`);
    }

    parts.push("  </g>");

    return parts.join("\n");
  }

  /**
   * Convert a single path to SVG path element
   */
  private convertPath(
    path: UnifiedPath,
    layer: UnifiedLayer,
    doc: UnifiedLayeredSVGDocument
  ): string {
    // Apply layout transformations if specified
    let commands = path.commands;

    if (path.layout || layer.layout) {
      commands = this.applyLayoutTransformations(path, layer, doc);
    }

    // Build path data string
    const d = this.buildPathData(commands);

    // Build style attributes
    const style = this.buildStyleAttributes(path.style);

    // Build layout metadata attributes
    const layoutMetadata = this.buildLayoutMetadata(path.layout);

    return `<path id="${path.id}" d="${d}"${style}${layoutMetadata}/>`;
  }

  /**
   * Apply layout transformations to path commands
   */
  private applyLayoutTransformations(
    path: UnifiedPath,
    layer: UnifiedLayer,
    doc: UnifiedLayeredSVGDocument
  ): PathCommand[] {
    // Determine effective layout settings (path overrides layer overrides document)
    const effectiveLayout = {
      region: path.layout?.region || layer.layout?.region || "center",
      anchor:
        path.layout?.anchor ||
        layer.layout?.anchor ||
        doc.layout?.globalAnchor ||
        "center",
      offset: path.layout?.offset || layer.layout?.offset || [0, 0],
    };

    // If no layout transformations needed, return original commands
    if (
      effectiveLayout.region === "center" &&
      effectiveLayout.anchor === "center" &&
      effectiveLayout.offset[0] === 0 &&
      effectiveLayout.offset[1] === 0
    ) {
      return path.commands;
    }

    // Apply coordinate transformations
    return this.coordinateMapper.transformPathCommands(path.commands, {
      region: effectiveLayout.region as RegionName,
      anchor: effectiveLayout.anchor as AnchorPoint,
      offset: effectiveLayout.offset as [number, number],
    });
  }

  /**
   * Build SVG path data string from commands
   */
  private buildPathData(commands: PathCommand[]): string {
    return commands
      .map((cmd) => {
        if (cmd.cmd === "Z") {
          return "Z";
        }

        // Format coordinates with appropriate precision
        const coords = cmd.coords.map((coord) =>
          Number.isInteger(coord) ? coord.toString() : coord.toFixed(2)
        );

        return `${cmd.cmd} ${coords.join(" ")}`;
      })
      .join(" ");
  }

  /**
   * Build style attributes string
   */
  private buildStyleAttributes(style: PathStyle): string {
    const attrs: string[] = [];

    // Fill
    attrs.push(`fill="${style.fill || "none"}"`);

    // Stroke
    attrs.push(`stroke="${style.stroke || "none"}"`);

    // Stroke width
    if (style.strokeWidth !== undefined) {
      attrs.push(`stroke-width="${style.strokeWidth}"`);
    }

    // Stroke linecap
    if (style.strokeLinecap) {
      attrs.push(`stroke-linecap="${style.strokeLinecap}"`);
    }

    // Stroke linejoin
    if (style.strokeLinejoin) {
      attrs.push(`stroke-linejoin="${style.strokeLinejoin}"`);
    }

    // Opacity
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
    attrs.push(`data-label="${this.escapeAttribute(layer.label)}"`);

    if (layer.layout?.region) {
      attrs.push(`data-region="${layer.layout.region}"`);
    }

    if (layer.layout?.anchor) {
      attrs.push(`data-anchor="${layer.layout.anchor}"`);
    }

    if (layer.layout?.zIndex !== undefined) {
      attrs.push(`data-z-index="${layer.layout.zIndex}"`);
    }

    return attrs.join(" ");
  }

  /**
   * Build layout metadata attributes for paths
   */
  private buildLayoutMetadata(layout?: UnifiedPath["layout"]): string {
    if (!layout) return "";

    const attrs: string[] = [];

    if (layout.region) {
      attrs.push(`data-region="${layout.region}"`);
    }

    if (layout.anchor) {
      attrs.push(`data-anchor="${layout.anchor}"`);
    }

    if (layout.offset) {
      attrs.push(`data-offset="${layout.offset.join(",")}"`);
    }

    if (layout.size) {
      attrs.push(
        `data-size="${JSON.stringify(layout.size).replace(/"/g, "&quot;")}"`
      );
    }

    if (layout.repeat) {
      attrs.push(
        `data-repeat="${JSON.stringify(layout.repeat).replace(/"/g, "&quot;")}"`
      );
    }

    return attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
  }

  /**
   * Escape attribute values for SVG
   */
  private escapeAttribute(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * Validate SVG output
   */
  validateSVG(svg: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic structure validation
    if (!svg.includes("<svg")) {
      errors.push("Missing SVG root element");
    }

    if (!svg.includes("</svg>")) {
      errors.push("Missing SVG closing tag");
    }

    // Namespace validation
    if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
      errors.push("Missing SVG namespace declaration");
    }

    // ViewBox validation
    if (!svg.includes("viewBox=")) {
      errors.push("Missing viewBox attribute");
    }

    // Path validation
    const pathMatches = svg.match(/<path[^>]*d="([^"]*)"[^>]*>/g);
    if (pathMatches) {
      pathMatches.forEach((pathMatch, index) => {
        const dMatch = pathMatch.match(/d="([^"]*)"/);
        if (dMatch) {
          const pathData = dMatch[1];
          if (!this.isValidPathData(pathData)) {
            errors.push(`Invalid path data in path ${index + 1}: ${pathData}`);
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate SVG path data
   */
  private isValidPathData(pathData: string): boolean {
    // Basic validation - check for valid commands and coordinate format
    const validCommands = /^[MLCQZ\s\d\.\-,]+$/i;

    if (!validCommands.test(pathData)) {
      return false;
    }

    // Check that commands are followed by appropriate number of coordinates
    const commands = pathData.match(/[MLCQZ][^MLCQZ]*/gi);
    if (!commands) return false;

    for (const command of commands) {
      const cmd = command[0].toUpperCase();
      const coords = command
        .slice(1)
        .trim()
        .split(/[\s,]+/)
        .filter((c) => c);

      switch (cmd) {
        case "M":
        case "L":
          if (coords.length % 2 !== 0) return false;
          break;
        case "C":
          if (coords.length % 6 !== 0) return false;
          break;
        case "Q":
          if (coords.length % 4 !== 0) return false;
          break;
        case "Z":
          if (coords.length !== 0) return false;
          break;
        default:
          return false;
      }
    }

    return true;
  }

  /**
   * Get SVG bounds from document
   */
  getSVGBounds(doc: UnifiedLayeredSVGDocument): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    doc.layers.forEach((layer) => {
      layer.paths.forEach((path) => {
        path.commands.forEach((command) => {
          if (command.cmd !== "Z") {
            for (let i = 0; i < command.coords.length; i += 2) {
              const x = command.coords[i];
              const y = command.coords[i + 1];

              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        });
      });
    });

    // Handle empty documents
    if (minX === Infinity) {
      minX = 0;
      minY = 0;
      maxX = doc.canvas.width;
      maxY = doc.canvas.height;
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Optimize SVG output
   */
  optimizeSVG(svg: string): string {
    return (
      svg
        // Remove extra whitespace
        .replace(/\s+/g, " ")
        // Remove unnecessary spaces around operators
        .replace(/\s*([<>])\s*/g, "$1")
        // Optimize path data
        .replace(/d="([^"]+)"/g, (match, pathData) => {
          const optimized = pathData
            .replace(/\s+/g, " ")
            .replace(/([MLCQZ])\s+/g, "$1")
            .trim();
          return `d="${optimized}"`;
        })
        // Remove trailing spaces
        .replace(/\s+>/g, ">")
        .trim()
    );
  }

  /**
   * Convert document to different aspect ratio
   */
  convertToAspectRatio(
    doc: UnifiedLayeredSVGDocument,
    newAspectRatio: AspectRatio
  ): UnifiedLayeredSVGDocument {
    const newDimensions =
      AspectRatioManager.getCanvasDimensions(newAspectRatio);

    return {
      ...doc,
      canvas: {
        ...doc.canvas,
        width: newDimensions.width,
        height: newDimensions.height,
        aspectRatio: newAspectRatio,
      },
    };
  }
}
