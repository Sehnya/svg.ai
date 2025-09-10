/**
 * LayoutLanguageParser - Parses and validates layout language specifications
 * Integrates layout language with layered SVG generation system
 */

import { z } from "zod";
import { RegionManager } from "./RegionManager";
import { AspectRatio } from "./AspectRatioManager";
import {
  LayoutSpecification,
  LayoutSpecificationSchema,
  RegionName,
  AnchorPoint,
  SizeSpec,
  RepetitionSpec,
  CustomRegion,
  UnifiedLayoutConfig,
  UnifiedLayoutConfigSchema,
  isRegionName,
  isAnchorPoint,
  REGION_BOUNDS,
  ANCHOR_OFFSETS,
} from "../types/unified-layered";

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

export interface ValidationContext {
  regionManager: RegionManager;
  aspectRatio: AspectRatio;
  canvasWidth: number;
  canvasHeight: number;
}

export interface LayoutParseOptions {
  strict?: boolean; // Strict validation mode
  allowCustomRegions?: boolean; // Allow custom region names
  validateCoordinates?: boolean; // Validate coordinate bounds
  suggestAlternatives?: boolean; // Provide alternative suggestions
}

/**
 * Parses and validates layout language specifications with layered SVG integration
 */
export class LayoutLanguageParser {
  private regionManager: RegionManager;
  private options: Required<LayoutParseOptions>;

  constructor(regionManager: RegionManager, options: LayoutParseOptions = {}) {
    this.regionManager = regionManager;
    this.options = {
      strict: options.strict ?? true,
      allowCustomRegions: options.allowCustomRegions ?? true,
      validateCoordinates: options.validateCoordinates ?? true,
      suggestAlternatives: options.suggestAlternatives ?? true,
    };
  }

  /**
   * Parse and validate a layout specification
   */
  parseLayoutSpecification(
    input: unknown,
    context?: Partial<ValidationContext>
  ): ParseResult<LayoutSpecification> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // First, validate against Zod schema
      const schemaResult = LayoutSpecificationSchema.safeParse(input);
      if (!schemaResult.success) {
        return {
          success: false,
          errors: schemaResult.error.errors.map(
            (e) => `Schema validation: ${e.path.join(".")}: ${e.message}`
          ),
          warnings,
        };
      }

      const layout = schemaResult.data;

      // Validate region
      if (layout.region) {
        const regionValidation = this.validateRegion(layout.region);
        errors.push(...regionValidation.errors);
        warnings.push(...regionValidation.warnings);
      }

      // Validate anchor
      if (layout.anchor) {
        const anchorValidation = this.validateAnchor(layout.anchor);
        errors.push(...anchorValidation.errors);
        warnings.push(...anchorValidation.warnings);
      }

      // Validate offset
      if (layout.offset) {
        const offsetValidation = this.validateOffset(layout.offset);
        errors.push(...offsetValidation.errors);
        warnings.push(...offsetValidation.warnings);
      }

      // Validate size specification
      if (layout.size) {
        const sizeValidation = this.validateSizeSpec(layout.size, context);
        errors.push(...sizeValidation.errors);
        warnings.push(...sizeValidation.warnings);
      }

      // Validate repetition specification
      if (layout.repeat) {
        const repeatValidation = this.validateRepetitionSpec(
          layout.repeat,
          context
        );
        errors.push(...repeatValidation.errors);
        warnings.push(...repeatValidation.warnings);
      }

      // Cross-validation checks
      const crossValidation = this.performCrossValidation(layout, context);
      errors.push(...crossValidation.errors);
      warnings.push(...crossValidation.warnings);

      return {
        success: errors.length === 0,
        data: layout,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Parse error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
        warnings,
      };
    }
  }

  /**
   * Parse and validate unified layout configuration
   */
  parseLayoutConfig(
    input: unknown,
    context?: Partial<ValidationContext>
  ): ParseResult<UnifiedLayoutConfig> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate against Zod schema
      const schemaResult = UnifiedLayoutConfigSchema.safeParse(input);
      if (!schemaResult.success) {
        return {
          success: false,
          errors: schemaResult.error.errors.map(
            (e) => `Schema validation: ${e.path.join(".")}: ${e.message}`
          ),
          warnings,
        };
      }

      const config = schemaResult.data;

      // Validate custom regions
      if (config.regions) {
        for (const [index, region] of config.regions.entries()) {
          const regionValidation = this.validateCustomRegion(region, index);
          errors.push(...regionValidation.errors);
          warnings.push(...regionValidation.warnings);
        }
      }

      // Validate global anchor
      if (config.globalAnchor) {
        const anchorValidation = this.validateAnchor(config.globalAnchor);
        errors.push(...anchorValidation.errors);
        warnings.push(...anchorValidation.warnings);
      }

      // Validate global offset
      if (config.globalOffset) {
        const offsetValidation = this.validateOffset(config.globalOffset);
        errors.push(...offsetValidation.errors);
        warnings.push(...offsetValidation.warnings);
      }

      return {
        success: errors.length === 0,
        data: config,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Parse error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
        warnings,
      };
    }
  }

  /**
   * Validate region name
   */
  private validateRegion(region: string): ParseResult<void> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if it's a standard region
    if (isRegionName(region)) {
      return { success: true, errors, warnings };
    }

    // Check if it's a custom region (if allowed)
    if (
      this.options.allowCustomRegions &&
      this.regionManager.hasRegion(region)
    ) {
      return { success: true, errors, warnings };
    }

    // Region not found
    if (this.options.strict) {
      errors.push(`Unknown region '${region}'`);
    } else {
      warnings.push(`Unknown region '${region}', will default to 'center'`);
    }

    // Suggest alternatives
    if (this.options.suggestAlternatives) {
      const suggestions = this.suggestSimilarRegions(region);
      if (suggestions.length > 0) {
        const message = `Did you mean: ${suggestions.join(", ")}?`;
        if (this.options.strict) {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }
    }

    return { success: errors.length === 0, errors, warnings };
  }

  /**
   * Validate anchor point
   */
  private validateAnchor(anchor: string): ParseResult<void> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!isAnchorPoint(anchor)) {
      if (this.options.strict) {
        errors.push(`Invalid anchor point '${anchor}'`);
      } else {
        warnings.push(
          `Invalid anchor point '${anchor}', will default to 'center'`
        );
      }

      // Suggest alternatives
      if (this.options.suggestAlternatives) {
        const suggestions = this.suggestSimilarAnchors(anchor);
        if (suggestions.length > 0) {
          const message = `Did you mean: ${suggestions.join(", ")}?`;
          if (this.options.strict) {
            errors.push(message);
          } else {
            warnings.push(message);
          }
        }
      }
    }

    return { success: errors.length === 0, errors, warnings };
  }

  /**
   * Validate offset values
   */
  private validateOffset(offset: [number, number]): ParseResult<void> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const [x, y] = offset;

    // Check if values are within valid range [-1, 1]
    if (x < -1 || x > 1) {
      if (this.options.strict) {
        errors.push(`Offset X value ${x} is outside valid range [-1, 1]`);
      } else {
        warnings.push(`Offset X value ${x} will be clamped to [-1, 1] range`);
      }
    }

    if (y < -1 || y > 1) {
      if (this.options.strict) {
        errors.push(`Offset Y value ${y} is outside valid range [-1, 1]`);
      } else {
        warnings.push(`Offset Y value ${y} will be clamped to [-1, 1] range`);
      }
    }

    // Check for extreme values that might indicate user error
    if (Math.abs(x) > 0.8 || Math.abs(y) > 0.8) {
      warnings.push(
        `Large offset values (${x}, ${y}) may position elements outside visible area`
      );
    }

    return { success: errors.length === 0, errors, warnings };
  }

  /**
   * Validate size specification
   */
  private validateSizeSpec(
    sizeSpec: SizeSpec,
    context?: Partial<ValidationContext>
  ): ParseResult<void> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check that exactly one size method is specified
    const methods = [
      sizeSpec.absolute,
      sizeSpec.relative,
      sizeSpec.aspect_constrained,
    ].filter(Boolean);
    if (methods.length !== 1) {
      errors.push(
        `Exactly one size specification method must be provided, found ${methods.length}`
      );
      return { success: false, errors, warnings };
    }

    // Validate absolute size
    if (sizeSpec.absolute) {
      const { width, height } = sizeSpec.absolute;

      if (width <= 0 || height <= 0) {
        errors.push(
          `Absolute size dimensions must be positive, got width: ${width}, height: ${height}`
        );
      }

      if (this.options.validateCoordinates && context) {
        const maxDimension = Math.max(
          context.canvasWidth || 512,
          context.canvasHeight || 512
        );
        if (width > maxDimension || height > maxDimension) {
          warnings.push(
            `Absolute size (${width}x${height}) may exceed canvas dimensions`
          );
        }
      }
    }

    // Validate relative size
    if (sizeSpec.relative !== undefined) {
      const relative = sizeSpec.relative;

      if (relative <= 0 || relative > 1) {
        errors.push(`Relative size must be between 0 and 1, got ${relative}`);
      }

      if (relative > 0.8) {
        warnings.push(
          `Large relative size (${relative}) may cause elements to overlap`
        );
      }
    }

    // Validate aspect-constrained size
    if (sizeSpec.aspect_constrained) {
      const { width, aspect } = sizeSpec.aspect_constrained;

      if (width <= 0) {
        errors.push(`Aspect-constrained width must be positive, got ${width}`);
      }

      if (aspect <= 0) {
        errors.push(`Aspect ratio must be positive, got ${aspect}`);
      }

      if (aspect > 10 || aspect < 0.1) {
        warnings.push(
          `Extreme aspect ratio (${aspect}) may result in unusual proportions`
        );
      }
    }

    return { success: errors.length === 0, errors, warnings };
  }

  /**
   * Validate repetition specification
   */
  private validateRepetitionSpec(
    repeatSpec: RepetitionSpec,
    context?: Partial<ValidationContext>
  ): ParseResult<void> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { type, count, spacing, radius } = repeatSpec;

    // Validate count
    if (Array.isArray(count)) {
      const [countX, countY] = count;
      if (countX <= 0 || countY <= 0) {
        errors.push(
          `Repetition count must be positive, got [${countX}, ${countY}]`
        );
      }
      if (countX > 20 || countY > 20) {
        warnings.push(
          `Large repetition count [${countX}, ${countY}] may impact performance`
        );
      }
    } else {
      if (count <= 0) {
        errors.push(`Repetition count must be positive, got ${count}`);
      }
      if (count > 50) {
        warnings.push(
          `Large repetition count (${count}) may impact performance`
        );
      }
    }

    // Validate type-specific properties
    if (type === "grid") {
      if (spacing !== undefined) {
        if (spacing <= 0 || spacing > 1) {
          errors.push(`Grid spacing must be between 0 and 1, got ${spacing}`);
        }
        if (spacing < 0.05) {
          warnings.push(
            `Very small grid spacing (${spacing}) may cause overlapping elements`
          );
        }
      }
    } else if (type === "radial") {
      if (radius !== undefined) {
        if (radius <= 0) {
          errors.push(`Radial radius must be positive, got ${radius}`);
        }
        if (this.options.validateCoordinates && context && radius > 200) {
          warnings.push(
            `Large radial radius (${radius}) may position elements outside canvas`
          );
        }
      }
    }

    return { success: errors.length === 0, errors, warnings };
  }

  /**
   * Validate custom region definition
   */
  private validateCustomRegion(
    region: CustomRegion,
    index: number
  ): ParseResult<void> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { name, bounds } = region;

    // Validate name
    if (!name || name.trim().length === 0) {
      errors.push(`Custom region at index ${index} must have a non-empty name`);
    }

    // Check if name conflicts with standard regions
    if (isRegionName(name)) {
      errors.push(
        `Custom region name '${name}' conflicts with standard region`
      );
    }

    // Validate bounds
    const { x, y, width, height } = bounds;

    if (x < 0 || x > 1 || y < 0 || y > 1) {
      errors.push(
        `Custom region '${name}' position (${x}, ${y}) must be within [0, 1] range`
      );
    }

    if (width <= 0 || height <= 0 || width > 1 || height > 1) {
      errors.push(
        `Custom region '${name}' dimensions (${width}x${height}) must be positive and within [0, 1] range`
      );
    }

    if (x + width > 1 || y + height > 1) {
      errors.push(`Custom region '${name}' extends beyond canvas bounds`);
    }

    // Check for very small regions
    if (width < 0.05 || height < 0.05) {
      warnings.push(
        `Custom region '${name}' is very small (${width}x${height}) and may be difficult to use`
      );
    }

    return { success: errors.length === 0, errors, warnings };
  }

  /**
   * Perform cross-validation checks
   */
  private performCrossValidation(
    layout: LayoutSpecification,
    context?: Partial<ValidationContext>
  ): ParseResult<void> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for conflicting specifications
    if (layout.size && layout.repeat) {
      const totalElements = Array.isArray(layout.repeat.count)
        ? layout.repeat.count[0] * layout.repeat.count[1]
        : layout.repeat.count;

      if (totalElements > 10) {
        warnings.push(
          `Large repetition count (${totalElements}) with explicit size may cause overlapping`
        );
      }
    }

    // Check for extreme combinations
    if (layout.offset && layout.repeat && layout.repeat.type === "radial") {
      const [offsetX, offsetY] = layout.offset;
      if (Math.abs(offsetX) > 0.5 || Math.abs(offsetY) > 0.5) {
        warnings.push(
          `Large offset with radial repetition may position elements outside expected area`
        );
      }
    }

    return { success: errors.length === 0, errors, warnings };
  }

  /**
   * Suggest similar region names
   */
  private suggestSimilarRegions(input: string): string[] {
    const allRegions = [
      ...Object.keys(REGION_BOUNDS),
      ...this.regionManager.getCustomRegions(),
    ];

    return allRegions
      .filter((region) => this.calculateSimilarity(input, region) > 0.5)
      .sort(
        (a, b) =>
          this.calculateSimilarity(input, b) -
          this.calculateSimilarity(input, a)
      )
      .slice(0, 3);
  }

  /**
   * Suggest similar anchor names
   */
  private suggestSimilarAnchors(input: string): string[] {
    const allAnchors = Object.keys(ANCHOR_OFFSETS);

    return allAnchors
      .filter((anchor) => this.calculateSimilarity(input, anchor) > 0.5)
      .sort(
        (a, b) =>
          this.calculateSimilarity(input, b) -
          this.calculateSimilarity(input, a)
      )
      .slice(0, 3);
  }

  /**
   * Calculate string similarity (simple Levenshtein-based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Update parser options
   */
  updateOptions(options: Partial<LayoutParseOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current parser options
   */
  getOptions(): Required<LayoutParseOptions> {
    return { ...this.options };
  }

  /**
   * Update region manager
   */
  updateRegionManager(regionManager: RegionManager): void {
    this.regionManager = regionManager;
  }
}
