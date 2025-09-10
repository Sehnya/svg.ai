/**
 * SizeSpecManager - Handles size calculations for unified layered SVG generation
 * Supports multiple sizing modes: absolute, relative, and aspect-constrained
 */

import { SizeSpec, RegionName, REGION_BOUNDS } from "../types/unified-layered";
import { RegionManager } from "./RegionManager";

export interface CalculatedSize {
  width: number;
  height: number;
  method: "absolute" | "relative" | "aspect_constrained";
}

export interface SizeCalculationContext {
  regionName: RegionName | string;
  canvasWidth: number;
  canvasHeight: number;
  regionManager: RegionManager;
}

export class SizeSpecManager {
  /**
   * Calculate actual pixel dimensions from a SizeSpec
   */
  static calculateSize(
    sizeSpec: SizeSpec,
    context: SizeCalculationContext
  ): CalculatedSize {
    // Get region bounds for calculations
    const regionBounds = context.regionManager.getRegionBounds(
      context.regionName as RegionName
    );

    const regionPixelWidth = regionBounds.width * context.canvasWidth;
    const regionPixelHeight = regionBounds.height * context.canvasHeight;

    if (sizeSpec.absolute) {
      return {
        width: sizeSpec.absolute.width,
        height: sizeSpec.absolute.height,
        method: "absolute",
      };
    }

    if (sizeSpec.relative !== undefined) {
      return {
        width: regionPixelWidth * sizeSpec.relative,
        height: regionPixelHeight * sizeSpec.relative,
        method: "relative",
      };
    }

    if (sizeSpec.aspect_constrained) {
      const { width, aspect } = sizeSpec.aspect_constrained;
      return {
        width,
        height: width / aspect,
        method: "aspect_constrained",
      };
    }

    // Default fallback - use 50% of region
    return {
      width: regionPixelWidth * 0.5,
      height: regionPixelHeight * 0.5,
      method: "relative",
    };
  }

  /**
   * Validate that a size specification is valid
   */
  static validateSizeSpec(sizeSpec: SizeSpec): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check that exactly one sizing method is specified
    const methods = [
      sizeSpec.absolute,
      sizeSpec.relative,
      sizeSpec.aspect_constrained,
    ].filter(Boolean);

    if (methods.length === 0) {
      errors.push("At least one sizing method must be specified");
    } else if (methods.length > 1) {
      errors.push("Only one sizing method can be specified");
    }

    // Validate absolute sizing
    if (sizeSpec.absolute) {
      if (sizeSpec.absolute.width <= 0) {
        errors.push("Absolute width must be positive");
      }
      if (sizeSpec.absolute.height <= 0) {
        errors.push("Absolute height must be positive");
      }
      if (sizeSpec.absolute.width > 512) {
        errors.push("Absolute width cannot exceed canvas size (512px)");
      }
      if (sizeSpec.absolute.height > 512) {
        errors.push("Absolute height cannot exceed canvas size (512px)");
      }
    }

    // Validate relative sizing
    if (sizeSpec.relative !== undefined) {
      if (sizeSpec.relative < 0 || sizeSpec.relative > 1) {
        errors.push("Relative size must be between 0 and 1");
      }
    }

    // Validate aspect-constrained sizing
    if (sizeSpec.aspect_constrained) {
      if (sizeSpec.aspect_constrained.width <= 0) {
        errors.push("Aspect-constrained width must be positive");
      }
      if (sizeSpec.aspect_constrained.aspect <= 0) {
        errors.push("Aspect ratio must be positive");
      }
      if (sizeSpec.aspect_constrained.width > 512) {
        errors.push(
          "Aspect-constrained width cannot exceed canvas size (512px)"
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a size specification that fits within a region
   */
  static createFittingSizeSpec(
    targetWidth: number,
    targetHeight: number,
    context: SizeCalculationContext
  ): SizeSpec {
    const regionBounds = context.regionManager.getRegionBounds(
      context.regionName as RegionName
    );

    const regionPixelWidth = regionBounds.width * context.canvasWidth;
    const regionPixelHeight = regionBounds.height * context.canvasHeight;

    // If target size fits within region, use absolute
    if (targetWidth <= regionPixelWidth && targetHeight <= regionPixelHeight) {
      return {
        absolute: {
          width: targetWidth,
          height: targetHeight,
        },
      };
    }

    // Otherwise, scale to fit using relative sizing
    const scaleX = regionPixelWidth / targetWidth;
    const scaleY = regionPixelHeight / targetHeight;
    const scale = Math.min(scaleX, scaleY);

    return {
      relative: scale,
    };
  }

  /**
   * Get the maximum size that fits within a region
   */
  static getMaxSizeForRegion(context: SizeCalculationContext): CalculatedSize {
    const regionBounds = context.regionManager.getRegionBounds(
      context.regionName as RegionName
    );

    return {
      width: regionBounds.width * context.canvasWidth,
      height: regionBounds.height * context.canvasHeight,
      method: "relative",
    };
  }

  /**
   * Scale a size specification by a factor
   */
  static scaleSizeSpec(sizeSpec: SizeSpec, factor: number): SizeSpec {
    if (sizeSpec.absolute) {
      return {
        absolute: {
          width: sizeSpec.absolute.width * factor,
          height: sizeSpec.absolute.height * factor,
        },
      };
    }

    if (sizeSpec.relative !== undefined) {
      return {
        relative: Math.min(1, sizeSpec.relative * factor),
      };
    }

    if (sizeSpec.aspect_constrained) {
      return {
        aspect_constrained: {
          width: sizeSpec.aspect_constrained.width * factor,
          aspect: sizeSpec.aspect_constrained.aspect,
        },
      };
    }

    return sizeSpec;
  }

  /**
   * Convert any size specification to absolute pixels
   */
  static toAbsolute(
    sizeSpec: SizeSpec,
    context: SizeCalculationContext
  ): { width: number; height: number } {
    const calculated = this.calculateSize(sizeSpec, context);
    return {
      width: calculated.width,
      height: calculated.height,
    };
  }

  /**
   * Check if a size specification would result in a size that fits within bounds
   */
  static fitsWithinBounds(
    sizeSpec: SizeSpec,
    context: SizeCalculationContext,
    maxWidth: number = 512,
    maxHeight: number = 512
  ): boolean {
    const calculated = this.calculateSize(sizeSpec, context);
    return calculated.width <= maxWidth && calculated.height <= maxHeight;
  }
}
