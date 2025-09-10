/**
 * JSONSchemaValidator - Validates JSON against layered-1.0 schema with coordinate and layout validation
 * Provides comprehensive validation, sanitization, and error reporting for unified SVG generation
 */

import { z } from "zod";
import { RegionManager } from "./RegionManager";
import { LayoutLanguageParser, ParseResult } from "./LayoutLanguageParser";
import { AspectRatio } from "./AspectRatioManager";
import {
  UnifiedLayeredSVGDocument,
  UnifiedLayeredSVGDocumentSchema,
  UnifiedLayer,
  UnifiedPath,
  PathCommand,
  LayoutSpecification,
  COORDINATE_BOUNDS,
} from "../types/unified-layered";

export interface ValidationOptions {
  strict?: boolean; // Strict validation mode
  sanitize?: boolean; // Auto-sanitize invalid values
  validateCoordinates?: boolean; // Validate coordinate bounds
  validateLayout?: boolean; // Validate layout specifications
  clampCoordinates?: boolean; // Clamp out-of-bounds coordinates
  roundPrecision?: number; // Round coordinates to specified precision
}

export interface ValidationResult {
  success: boolean;
  data?: UnifiedLayeredSVGDocument;
  errors: string[];
  warnings: string[];
  sanitized?: boolean; // Whether data was modified during validation
}

export interface CoordinateSanitizationResult {
  original: number[];
  sanitized: number[];
  clamped: boolean;
  rounded: boolean;
}

export interface ValidationContext {
  documentIndex?: number;
  layerIndex?: number;
  pathIndex?: number;
  commandIndex?: number;
}

/**
 * Validates and sanitizes JSON documents against the unified layered SVG schema
 */
export class JSONSchemaValidator {
  private regionManager: RegionManager;
  private layoutParser: LayoutLanguageParser;
  private options: Required<ValidationOptions>;

  constructor(
    regionManager: RegionManager,
    layoutParser: LayoutLanguageParser,
    options: ValidationOptions = {}
  ) {
    this.regionManager = regionManager;
    this.layoutParser = layoutParser;
    this.options = {
      strict: options.strict ?? true,
      sanitize: options.sanitize ?? true,
      validateCoordinates: options.validateCoordinates ?? true,
      validateLayout: options.validateLayout ?? true,
      clampCoordinates: options.clampCoordinates ?? true,
      roundPrecision: options.roundPrecision ?? COORDINATE_BOUNDS.PRECISION,
    };
  }

  /**
   * Validate a unified layered SVG document
   */
  validateDocument(input: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitized = false;

    try {
      // First, validate against Zod schema
      const schemaResult = UnifiedLayeredSVGDocumentSchema.safeParse(input);
      if (!schemaResult.success) {
        return {
          success: false,
          errors: schemaResult.error.errors.map(
            (e) => `Schema validation: ${e.path.join(".")}: ${e.message}`
          ),
          warnings,
        };
      }

      let document = schemaResult.data;

      // Validate and sanitize layers
      const layerResults = document.layers.map((layer, index) =>
        this.validateLayer(layer, { layerIndex: index })
      );

      // Collect errors and warnings from layers
      layerResults.forEach((result, index) => {
        errors.push(...result.errors.map((e) => `Layer ${index}: ${e}`));
        warnings.push(...result.warnings.map((w) => `Layer ${index}: ${w}`));
        if (result.sanitized) sanitized = true;
      });

      // Apply sanitized layers if sanitization occurred
      if (this.options.sanitize && sanitized) {
        document = {
          ...document,
          layers: layerResults
            .filter((r) => r.success && r.data)
            .map((r) => r.data!),
        };
      }

      // Validate layout configuration if present
      if (document.layout) {
        const layoutResult = this.layoutParser.parseLayoutConfig(
          document.layout
        );
        errors.push(...layoutResult.errors.map((e) => `Layout config: ${e}`));
        warnings.push(
          ...layoutResult.warnings.map((w) => `Layout config: ${w}`)
        );
      }

      // Perform document-level validation
      const documentValidation = this.validateDocumentLevel(document);
      errors.push(...documentValidation.errors);
      warnings.push(...documentValidation.warnings);

      return {
        success: errors.length === 0,
        data: document,
        errors,
        warnings,
        sanitized,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Validation error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        warnings,
      };
    }
  }

  /**
   * Validate a layer
   */
  private validateLayer(
    layer: UnifiedLayer,
    context: ValidationContext
  ): ValidationResult & { data?: UnifiedLayer } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitized = false;

    // Validate layer layout specification
    if (layer.layout) {
      const layoutResult = this.layoutParser.parseLayoutSpecification(
        layer.layout
      );
      errors.push(...layoutResult.errors.map((e) => `Layout: ${e}`));
      warnings.push(...layoutResult.warnings.map((w) => `Layout: ${w}`));
    }

    // Validate and sanitize paths
    const pathResults = layer.paths.map((path, index) =>
      this.validatePath(path, { ...context, pathIndex: index })
    );

    // Collect errors and warnings from paths
    pathResults.forEach((result, index) => {
      errors.push(...result.errors.map((e) => `Path ${index}: ${e}`));
      warnings.push(...result.warnings.map((w) => `Path ${index}: ${w}`));
      if (result.sanitized) sanitized = true;
    });

    // Apply sanitized paths if sanitization occurred
    let sanitizedLayer = layer;
    if (this.options.sanitize && sanitized) {
      sanitizedLayer = {
        ...layer,
        paths: pathResults
          .filter((r) => r.success && r.data)
          .map((r) => r.data!),
      };
    }

    return {
      success: errors.length === 0,
      data: sanitizedLayer,
      errors,
      warnings,
      sanitized,
    };
  }

  /**
   * Validate a path
   */
  private validatePath(
    path: UnifiedPath,
    context: ValidationContext
  ): ValidationResult & { data?: UnifiedPath } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitized = false;

    // Validate path layout specification
    if (path.layout) {
      const layoutResult = this.layoutParser.parseLayoutSpecification(
        path.layout
      );
      errors.push(...layoutResult.errors.map((e) => `Layout: ${e}`));
      warnings.push(...layoutResult.warnings.map((w) => `Layout: ${w}`));
    }

    // Validate and sanitize path commands
    const commandResults = path.commands.map((command, index) =>
      this.validatePathCommand(command, { ...context, commandIndex: index })
    );

    // Collect errors and warnings from commands
    commandResults.forEach((result, index) => {
      errors.push(...result.errors.map((e) => `Command ${index}: ${e}`));
      warnings.push(...result.warnings.map((w) => `Command ${index}: ${w}`));
      if (result.sanitized) sanitized = true;
    });

    // Apply sanitized commands if sanitization occurred
    let sanitizedPath = path;
    if (this.options.sanitize && sanitized) {
      sanitizedPath = {
        ...path,
        commands: commandResults
          .filter((r) => r.success && r.data)
          .map((r) => r.data!),
      };
    }

    // Validate path-level constraints
    const pathValidation = this.validatePathConstraints(sanitizedPath);
    errors.push(...pathValidation.errors);
    warnings.push(...pathValidation.warnings);

    return {
      success: errors.length === 0,
      data: sanitizedPath,
      errors,
      warnings,
      sanitized,
    };
  }

  /**
   * Validate a path command
   */
  private validatePathCommand(
    command: PathCommand,
    context: ValidationContext
  ): ValidationResult & { data?: PathCommand } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let sanitized = false;

    // Validate coordinate bounds if enabled
    if (this.options.validateCoordinates && command.cmd !== "Z") {
      const coordResult = this.validateAndSanitizeCoordinates(command.coords);

      if (coordResult.clamped || coordResult.rounded) {
        sanitized = true;

        if (coordResult.clamped) {
          if (this.options.strict) {
            errors.push(
              `Coordinates out of bounds [${COORDINATE_BOUNDS.MIN}, ${COORDINATE_BOUNDS.MAX}]: ${coordResult.original.join(", ")}`
            );
          } else {
            warnings.push(
              `Coordinates clamped to bounds: ${coordResult.original.join(", ")} → ${coordResult.sanitized.join(", ")}`
            );
          }
        }

        if (coordResult.rounded) {
          warnings.push(
            `Coordinates rounded to ${this.options.roundPrecision} decimal places`
          );
        }
      }

      // Apply sanitized coordinates
      const sanitizedCommand: PathCommand = {
        ...command,
        coords: coordResult.sanitized,
      };

      return {
        success: errors.length === 0,
        data: sanitizedCommand,
        errors,
        warnings,
        sanitized,
      };
    }

    return {
      success: true,
      data: command,
      errors,
      warnings,
      sanitized: false,
    };
  }

  /**
   * Validate and sanitize coordinates
   */
  private validateAndSanitizeCoordinates(
    coords: number[]
  ): CoordinateSanitizationResult {
    const original = [...coords];
    let sanitized = [...coords];
    let clamped = false;
    let rounded = false;

    // Round coordinates to specified precision first
    if (this.options.roundPrecision >= 0) {
      const factor = Math.pow(10, this.options.roundPrecision);
      const roundedCoords = sanitized.map((coord) => {
        const roundedValue = Math.round(coord * factor) / factor;
        if (Math.abs(roundedValue - coord) > Number.EPSILON) rounded = true;
        return roundedValue;
      });
      sanitized = roundedCoords;
    }

    // Then clamp coordinates to bounds
    if (this.options.clampCoordinates) {
      const clampedCoords = sanitized.map((coord) => {
        const clampedValue = Math.max(
          COORDINATE_BOUNDS.MIN,
          Math.min(COORDINATE_BOUNDS.MAX, coord)
        );
        if (clampedValue !== coord) clamped = true;
        return clampedValue;
      });
      sanitized = clampedCoords;
    }

    return {
      original,
      sanitized,
      clamped,
      rounded,
    };
  }

  /**
   * Validate path-level constraints
   */
  private validatePathConstraints(path: UnifiedPath): ParseResult<void> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for empty paths
    if (path.commands.length === 0) {
      errors.push("Path must have at least one command");
      return { success: false, errors, warnings };
    }

    // Check that path starts with Move command
    if (path.commands[0].cmd !== "M") {
      errors.push("Path must start with a Move (M) command");
    }

    // Check for valid path structure
    let hasMove = false;
    for (const [index, command] of path.commands.entries()) {
      if (command.cmd === "M") {
        hasMove = true;
      } else if (!hasMove && command.cmd !== "Z") {
        errors.push(
          `Command at index ${index} (${command.cmd}) appears before any Move command`
        );
      }
    }

    // Check for reasonable path complexity
    if (path.commands.length > 1000) {
      warnings.push(
        `Path has ${path.commands.length} commands, which may impact performance`
      );
    }

    // Validate coordinate consistency
    const coordinateCount = path.commands.reduce(
      (total, cmd) => total + cmd.coords.length,
      0
    );
    if (coordinateCount > 2000) {
      warnings.push(
        `Path has ${coordinateCount} coordinates, which may impact performance`
      );
    }

    return { success: errors.length === 0, errors, warnings };
  }

  /**
   * Validate document-level constraints
   */
  private validateDocumentLevel(
    document: UnifiedLayeredSVGDocument
  ): ParseResult<void> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate layer IDs
    const layerIds = document.layers.map((layer) => layer.id);
    const duplicateLayerIds = layerIds.filter(
      (id, index) => layerIds.indexOf(id) !== index
    );
    if (duplicateLayerIds.length > 0) {
      errors.push(`Duplicate layer IDs found: ${duplicateLayerIds.join(", ")}`);
    }

    // Check for duplicate path IDs within layers
    document.layers.forEach((layer, layerIndex) => {
      const pathIds = layer.paths.map((path) => path.id);
      const duplicatePathIds = pathIds.filter(
        (id, index) => pathIds.indexOf(id) !== index
      );
      if (duplicatePathIds.length > 0) {
        errors.push(
          `Layer ${layerIndex} has duplicate path IDs: ${duplicatePathIds.join(", ")}`
        );
      }
    });

    // Check for reasonable document complexity
    const totalPaths = document.layers.reduce(
      (total, layer) => total + layer.paths.length,
      0
    );
    if (totalPaths > 100) {
      warnings.push(
        `Document has ${totalPaths} paths, which may impact performance`
      );
    }

    const totalCommands = document.layers.reduce(
      (total, layer) =>
        total +
        layer.paths.reduce(
          (pathTotal, path) => pathTotal + path.commands.length,
          0
        ),
      0
    );
    if (totalCommands > 1000) {
      warnings.push(
        `Document has ${totalCommands} path commands, which may impact performance`
      );
    }

    // Validate canvas dimensions
    if (document.canvas.width <= 0 || document.canvas.height <= 0) {
      errors.push("Canvas dimensions must be positive");
    }

    if (document.canvas.width > 4096 || document.canvas.height > 4096) {
      warnings.push("Large canvas dimensions may impact performance");
    }

    return { success: errors.length === 0, errors, warnings };
  }

  /**
   * Sanitize a document by applying all enabled sanitization options
   */
  sanitizeDocument(
    document: UnifiedLayeredSVGDocument
  ): UnifiedLayeredSVGDocument {
    const originalOptions = { ...this.options };

    // Temporarily enable sanitization
    this.options.sanitize = true;

    const result = this.validateDocument(document);

    // Restore original options
    this.options = originalOptions;

    return result.data || document;
  }

  /**
   * Validate coordinates only (utility method)
   */
  validateCoordinates(coords: number[]): CoordinateSanitizationResult {
    return this.validateAndSanitizeCoordinates(coords);
  }

  /**
   * Update validation options
   */
  updateOptions(options: Partial<ValidationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current validation options
   */
  getOptions(): Required<ValidationOptions> {
    return { ...this.options };
  }

  /**
   * Update region manager
   */
  updateRegionManager(regionManager: RegionManager): void {
    this.regionManager = regionManager;
    this.layoutParser.updateRegionManager(regionManager);
  }

  /**
   * Update layout parser
   */
  updateLayoutParser(layoutParser: LayoutLanguageParser): void {
    this.layoutParser = layoutParser;
  }

  /**
   * Create a validation report
   */
  createValidationReport(document: UnifiedLayeredSVGDocument): {
    isValid: boolean;
    summary: {
      layers: number;
      paths: number;
      commands: number;
      coordinates: number;
    };
    issues: {
      errors: string[];
      warnings: string[];
    };
    performance: {
      complexity: "low" | "medium" | "high";
      recommendations: string[];
    };
  } {
    const result = this.validateDocument(document);

    const summary = {
      layers: document.layers.length,
      paths: document.layers.reduce(
        (total, layer) => total + layer.paths.length,
        0
      ),
      commands: document.layers.reduce(
        (total, layer) =>
          total +
          layer.paths.reduce(
            (pathTotal, path) => pathTotal + path.commands.length,
            0
          ),
        0
      ),
      coordinates: document.layers.reduce(
        (total, layer) =>
          total +
          layer.paths.reduce(
            (pathTotal, path) =>
              pathTotal +
              path.commands.reduce(
                (cmdTotal, cmd) => cmdTotal + cmd.coords.length,
                0
              ),
            0
          ),
        0
      ),
    };

    const complexity =
      summary.commands > 500
        ? "high"
        : summary.commands > 100
          ? "medium"
          : "low";

    const recommendations: string[] = [];
    if (complexity === "high") {
      recommendations.push(
        "Consider reducing the number of path commands for better performance"
      );
    }
    if (summary.paths > 50) {
      recommendations.push("Consider consolidating paths where possible");
    }
    if (summary.coordinates > 1000) {
      recommendations.push("Consider simplifying path geometry");
    }

    return {
      isValid: result.success,
      summary,
      issues: {
        errors: result.errors,
        warnings: result.warnings,
      },
      performance: {
        complexity,
        recommendations,
      },
    };
  }
}
