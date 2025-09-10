/**
 * ConstrainedSVGGenerator - SVG generator with layout language support
 * Enforces 512x512 canvas dimensions and absolute coordinates within 0-512 range
 */

import { SVGGenerator } from "./SVGGenerator";
import { SVGInterpreter } from "./SVGInterpreter";
import { RegionManager } from "./RegionManager";
import { CoordinateMapper } from "./CoordinateMapper";
import { AspectRatioManager, AspectRatio } from "./AspectRatioManager";
import {
  GenerationRequest,
  GenerationResponse,
  ValidationResult,
  LayerInfo,
  SVGMetadata,
} from "../types";
import {
  UnifiedLayeredSVGDocument,
  UnifiedLayer,
  UnifiedPath,
  PathCommand,
  PathStyle,
  LayoutSpecification,
  RegionName,
  AnchorPoint,
  COORDINATE_BOUNDS,
} from "../types/unified-layered";

export interface ConstrainedGenerationOptions {
  enforceCanvasSize?: boolean;
  validateCoordinates?: boolean;
  allowRelativeCommands?: boolean;
  allowTransforms?: boolean;
  includeLayoutMetadata?: boolean;
}

export interface ConstrainedValidationResult extends ValidationResult {
  coordinateViolations?: string[];
  canvasSizeViolations?: string[];
  commandViolations?: string[];
}

export class ConstrainedSVGGenerator extends SVGGenerator {
  private interpreter: SVGInterpreter;
  private regionManager: RegionManager;
  private coordinateMapper: CoordinateMapper;
  private options: Required<ConstrainedGenerationOptions>;

  constructor(options: ConstrainedGenerationOptions = {}) {
    super();

    this.options = {
      enforceCanvasSize: true,
      validateCoordinates: true,
      allowRelativeCommands: false,
      allowTransforms: false,
      includeLayoutMetadata: true,
      ...options,
    };

    this.interpreter = new SVGInterpreter({
      includeMetadata: this.options.includeLayoutMetadata,
      includeDebugInfo: false,
      optimizePaths: true,
    });

    // Initialize with default aspect ratio - will be updated per request
    this.regionManager = new RegionManager("1:1");
    this.coordinateMapper = new CoordinateMapper(512, 512, this.regionManager);
  }

  /**
   * Generate SVG from a unified layered document
   */
  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.success) {
      return {
        svg: this.createErrorSVG(request),
        meta: this.createErrorMetadata(request),
        layers: [],
        warnings: [],
        errors: [`Invalid request: ${validation.errors.join(", ")}`],
        eventId: request.userId ? this.generateEventId() : undefined,
      };
    }

    try {
      // Create unified layered document from request
      const unifiedDoc = await this.createUnifiedDocument(request);

      // Validate the unified document
      const docValidation = this.validateUnifiedDocument(unifiedDoc);
      if (!docValidation.success) {
        throw new Error(
          `Invalid unified document: ${docValidation.errors.join(", ")}`
        );
      }

      // Convert to SVG using interpreter
      const interpreterResult = this.interpreter.convertToSVG(unifiedDoc);

      // Build response
      const response: GenerationResponse = {
        svg: interpreterResult.svg,
        meta: this.createSVGMetadata(unifiedDoc, request),
        layers: this.createLayerInfo(interpreterResult.layerMetadata),
        warnings: interpreterResult.warnings,
        errors: [],
        eventId: request.userId ? this.generateEventId() : undefined,
      };

      return response;
    } catch (error) {
      return {
        svg: this.createErrorSVG(request),
        meta: this.createErrorMetadata(request),
        layers: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : "Unknown error"],
        eventId: request.userId ? this.generateEventId() : undefined,
      };
    }
  }

  /**
   * Generate SVG from a pre-built unified layered document
   */
  async generateFromUnified(
    unifiedDoc: UnifiedLayeredSVGDocument,
    originalRequest?: Partial<GenerationRequest>
  ): Promise<GenerationResponse> {
    // Validate the unified document
    const validation = this.validateUnifiedDocument(unifiedDoc);
    if (!validation.success) {
      throw new Error(
        `Invalid unified document: ${validation.errors.join(", ")}`
      );
    }

    // Convert to SVG using interpreter
    const interpreterResult = this.interpreter.convertToSVG(unifiedDoc);

    // Create mock request for metadata if not provided
    const request: GenerationRequest = {
      prompt: "Generated from unified document",
      size: {
        width: unifiedDoc.canvas.width,
        height: unifiedDoc.canvas.height,
      },
      ...originalRequest,
    };

    // Build response
    return {
      svg: interpreterResult.svg,
      meta: this.createSVGMetadata(unifiedDoc, request),
      layers: this.createLayerInfo(interpreterResult.layerMetadata),
      warnings: interpreterResult.warnings,
      errors: [],
    };
  }

  /**
   * Validate a unified layered document against constraints
   */
  validateUnifiedDocument(
    doc: UnifiedLayeredSVGDocument
  ): ConstrainedValidationResult {
    const errors: string[] = [];
    const coordinateViolations: string[] = [];
    const canvasSizeViolations: string[] = [];
    const commandViolations: string[] = [];

    // Validate canvas size constraints
    if (this.options.enforceCanvasSize) {
      if (doc.canvas.width !== 512 || doc.canvas.height !== 512) {
        canvasSizeViolations.push(
          `Canvas size must be 512x512, got ${doc.canvas.width}x${doc.canvas.height}`
        );
      }
    }

    // Validate coordinates and commands
    if (this.options.validateCoordinates) {
      for (const layer of doc.layers) {
        for (const path of layer.paths) {
          const pathValidation = this.validatePathConstraints(path, layer.id);
          coordinateViolations.push(...pathValidation.coordinateViolations);
          commandViolations.push(...pathValidation.commandViolations);
        }
      }
    }

    // Collect all errors
    errors.push(
      ...coordinateViolations,
      ...canvasSizeViolations,
      ...commandViolations
    );

    return {
      success: errors.length === 0,
      errors,
      coordinateViolations,
      canvasSizeViolations,
      commandViolations,
    };
  }

  /**
   * Validate path constraints (coordinates, commands)
   */
  private validatePathConstraints(
    path: UnifiedPath,
    layerId: string
  ): { coordinateViolations: string[]; commandViolations: string[] } {
    const coordinateViolations: string[] = [];
    const commandViolations: string[] = [];

    for (let i = 0; i < path.commands.length; i++) {
      const cmd = path.commands[i];

      // Validate command types
      if (!this.options.allowRelativeCommands) {
        const allowedCommands = ["M", "L", "C", "Q", "Z"];
        if (!allowedCommands.includes(cmd.cmd)) {
          commandViolations.push(
            `Path ${path.id} in layer ${layerId}: Relative command ${cmd.cmd} not allowed`
          );
        }
      }

      // Validate coordinates
      if (cmd.cmd !== "Z") {
        for (let j = 0; j < cmd.coords.length; j += 2) {
          const x = cmd.coords[j];
          const y = cmd.coords[j + 1];

          if (
            x < COORDINATE_BOUNDS.MIN ||
            x > COORDINATE_BOUNDS.MAX ||
            y < COORDINATE_BOUNDS.MIN ||
            y > COORDINATE_BOUNDS.MAX
          ) {
            coordinateViolations.push(
              `Path ${path.id} in layer ${layerId}: Coordinate (${x}, ${y}) outside bounds [${COORDINATE_BOUNDS.MIN}, ${COORDINATE_BOUNDS.MAX}]`
            );
          }
        }
      }
    }

    return { coordinateViolations, commandViolations };
  }

  /**
   * Sanitize and clamp coordinates to valid range
   */
  sanitizeCoordinates(
    doc: UnifiedLayeredSVGDocument
  ): UnifiedLayeredSVGDocument {
    const sanitizedLayers = doc.layers.map((layer) => ({
      ...layer,
      paths: layer.paths.map((path) => ({
        ...path,
        commands: path.commands.map((cmd) => {
          if (cmd.cmd === "Z") return cmd;

          const clampedCoords = cmd.coords.map((coord) => {
            const clamped = Math.max(
              COORDINATE_BOUNDS.MIN,
              Math.min(COORDINATE_BOUNDS.MAX, coord)
            );
            return this.limitPrecision(clamped, COORDINATE_BOUNDS.PRECISION);
          });

          return { ...cmd, coords: clampedCoords };
        }),
      })),
    }));

    return {
      ...doc,
      layers: sanitizedLayers,
    };
  }

  /**
   * Create a unified document from a generation request
   * This is a basic implementation - in practice, this would be handled by AI generators
   */
  private async createUnifiedDocument(
    request: GenerationRequest
  ): Promise<UnifiedLayeredSVGDocument> {
    // Determine aspect ratio from request size
    const aspectRatio = this.determineAspectRatio(
      request.size.width,
      request.size.height
    );

    // Create basic document structure
    const doc: UnifiedLayeredSVGDocument = {
      version: "unified-layered-1.0",
      canvas: {
        width: 512,
        height: 512,
        aspectRatio,
      },
      layers: [
        {
          id: "generated",
          label: "Generated Content",
          layout: {
            region: "center",
            anchor: "center",
          },
          paths: [
            {
              id: "placeholder",
              style: {
                fill: request.palette?.[0] || "#3B82F6",
                stroke: "#111827",
                strokeWidth: 2,
              },
              commands: [
                { cmd: "M", coords: [200, 200] },
                { cmd: "L", coords: [312, 200] },
                { cmd: "L", coords: [312, 312] },
                { cmd: "L", coords: [200, 312] },
                { cmd: "Z", coords: [] },
              ],
              layout: {
                region: "center",
                anchor: "center",
              },
            },
          ],
        },
      ],
    };

    return doc;
  }

  /**
   * Determine aspect ratio from width and height
   */
  private determineAspectRatio(width: number, height: number): AspectRatio {
    const ratio = width / height;

    if (Math.abs(ratio - 1) < 0.1) return "1:1";
    if (Math.abs(ratio - 4 / 3) < 0.1) return "4:3";
    if (Math.abs(ratio - 16 / 9) < 0.1) return "16:9";
    if (Math.abs(ratio - 3 / 2) < 0.1) return "3:2";
    if (Math.abs(ratio - 2 / 3) < 0.1) return "2:3";
    if (Math.abs(ratio - 9 / 16) < 0.1) return "9:16";

    // Default to 1:1 for constrained generator
    return "1:1";
  }

  /**
   * Create SVG metadata from unified document
   */
  private createSVGMetadata(
    doc: UnifiedLayeredSVGDocument,
    request: GenerationRequest
  ): SVGMetadata {
    const viewBox = AspectRatioManager.getViewBox(
      doc.canvas.aspectRatio,
      doc.canvas.width,
      doc.canvas.height
    );

    // Extract palette from document
    const palette = new Set<string>();
    for (const layer of doc.layers) {
      for (const path of layer.paths) {
        if (path.style.fill && path.style.fill !== "none") {
          palette.add(path.style.fill);
        }
        if (path.style.stroke && path.style.stroke !== "none") {
          palette.add(path.style.stroke);
        }
      }
    }

    return {
      width: doc.canvas.width,
      height: doc.canvas.height,
      viewBox,
      backgroundColor: "transparent",
      palette: Array.from(palette),
      description: `Generated SVG: ${request.prompt}`,
      seed: request.seed || this.generateSeed(),
    };
  }

  /**
   * Create layer info from layer metadata
   */
  private createLayerInfo(layerMetadata: any[]): LayerInfo[] {
    return layerMetadata.map((layer) => ({
      id: layer.id,
      label: layer.label,
      type: "path" as const, // Unified system primarily uses paths
    }));
  }

  /**
   * Create error SVG for failed generations
   */
  private createErrorSVG(request: GenerationRequest): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect x="0" y="0" width="512" height="512" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>
  <text x="256" y="256" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="16" fill="#DC2626">
    Generation Error
  </text>
</svg>`;
  }

  /**
   * Create error metadata for failed generations
   */
  private createErrorMetadata(request: GenerationRequest): SVGMetadata {
    return {
      width: 512,
      height: 512,
      viewBox: "0 0 512 512",
      backgroundColor: "#FEF2F2",
      palette: ["#DC2626", "#FEF2F2"],
      description: `Error generating SVG: ${request.prompt}`,
      seed: request.seed || this.generateSeed(),
    };
  }

  /**
   * Generate event ID for tracking
   */
  private generateEventId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /**
   * Update managers for a specific aspect ratio
   */
  updateAspectRatio(aspectRatio: AspectRatio): void {
    this.regionManager = new RegionManager(aspectRatio);
    this.coordinateMapper = new CoordinateMapper(512, 512, this.regionManager);
  }

  /**
   * Get current region manager (for testing/debugging)
   */
  getRegionManager(): RegionManager {
    return this.regionManager;
  }

  /**
   * Get current coordinate mapper (for testing/debugging)
   */
  getCoordinateMapper(): CoordinateMapper {
    return this.coordinateMapper;
  }
}
