/**
 * RepetitionSpecManager - Handles repetition patterns for unified layered SVG generation
 * Supports grid and radial repetition patterns with deterministic positioning
 */

import {
  RepetitionSpec,
  RegionName,
  AnchorPoint,
  PathCommand,
} from "../types/unified-layered";
import { RegionManager } from "./RegionManager";
import { CoordinateMapper } from "./CoordinateMapper";

export interface RepetitionInstance {
  index: number;
  position: { x: number; y: number };
  rotation?: number; // For radial patterns
  scale?: number; // Optional scaling per instance
}

export interface RepetitionResult {
  instances: RepetitionInstance[];
  totalCount: number;
  pattern: "grid" | "radial";
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface RepetitionContext {
  regionName: RegionName | string;
  anchor: AnchorPoint;
  offset: [number, number];
  canvasWidth: number;
  canvasHeight: number;
  regionManager: RegionManager;
  coordinateMapper: CoordinateMapper;
}

export class RepetitionSpecManager {
  /**
   * Generate repetition instances based on specification
   */
  static generateRepetition(
    repetitionSpec: RepetitionSpec,
    context: RepetitionContext
  ): RepetitionResult {
    if (repetitionSpec.type === "grid") {
      return this.generateGridRepetition(repetitionSpec, context);
    } else if (repetitionSpec.type === "radial") {
      return this.generateRadialRepetition(repetitionSpec, context);
    }

    throw new Error(`Unsupported repetition type: ${repetitionSpec.type}`);
  }

  /**
   * Generate grid-based repetition pattern
   */
  private static generateGridRepetition(
    repetitionSpec: RepetitionSpec,
    context: RepetitionContext
  ): RepetitionResult {
    const { count, spacing = 0.1 } = repetitionSpec;

    // Parse count - can be single number or [cols, rows]
    const [cols, rows] = Array.isArray(count) ? count : [count, count];

    const regionBounds = context.regionManager.getRegionBounds(
      context.regionName as RegionName
    );

    const regionPixelWidth = regionBounds.width * context.canvasWidth;
    const regionPixelHeight = regionBounds.height * context.canvasHeight;

    // Calculate spacing between instances
    const spacingX = regionPixelWidth * spacing;
    const spacingY = regionPixelHeight * spacing;

    // Calculate available space for instances
    const availableWidth = regionPixelWidth - spacingX * (cols - 1);
    const availableHeight = regionPixelHeight - spacingY * (rows - 1);

    // Calculate step size
    const stepX = cols > 1 ? availableWidth / (cols - 1) : 0;
    const stepY = rows > 1 ? availableHeight / (rows - 1) : 0;

    const instances: RepetitionInstance[] = [];
    let index = 0;

    // Get base position for the region
    const basePosition = context.coordinateMapper.calculatePosition({
      region: context.regionName,
      anchor: context.anchor,
      offset: context.offset,
    });

    // Calculate starting offset to center the grid
    const startOffsetX = cols > 1 ? -availableWidth / 2 : 0;
    const startOffsetY = rows > 1 ? -availableHeight / 2 : 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const offsetX = startOffsetX + col * (stepX + spacingX);
        const offsetY = startOffsetY + row * (stepY + spacingY);

        instances.push({
          index: index++,
          position: {
            x: basePosition.x + offsetX,
            y: basePosition.y + offsetY,
          },
        });
      }
    }

    // Calculate bounds
    const positions = instances.map((i) => i.position);
    const bounds = {
      minX: Math.min(...positions.map((p) => p.x)),
      maxX: Math.max(...positions.map((p) => p.x)),
      minY: Math.min(...positions.map((p) => p.y)),
      maxY: Math.max(...positions.map((p) => p.y)),
    };

    return {
      instances,
      totalCount: cols * rows,
      pattern: "grid",
      bounds,
    };
  }

  /**
   * Generate radial repetition pattern
   */
  private static generateRadialRepetition(
    repetitionSpec: RepetitionSpec,
    context: RepetitionContext
  ): RepetitionResult {
    const { count, radius = 0.3 } = repetitionSpec;

    // For radial, count should be a single number
    const instanceCount = Array.isArray(count) ? count[0] : count;

    const regionBounds = context.regionManager.getRegionBounds(
      context.regionName as RegionName
    );

    // Calculate radius in pixels
    const regionSize = Math.min(
      regionBounds.width * context.canvasWidth,
      regionBounds.height * context.canvasHeight
    );
    const radiusPixels = regionSize * radius;

    // Get center position
    const centerPosition = context.coordinateMapper.calculatePosition({
      region: context.regionName,
      anchor: context.anchor,
      offset: context.offset,
    });

    const instances: RepetitionInstance[] = [];
    const angleStep = (2 * Math.PI) / instanceCount;

    for (let i = 0; i < instanceCount; i++) {
      const angle = i * angleStep;
      const x = centerPosition.x + Math.cos(angle) * radiusPixels;
      const y = centerPosition.y + Math.sin(angle) * radiusPixels;

      instances.push({
        index: i,
        position: { x, y },
        rotation: (angle * 180) / Math.PI, // Convert to degrees
      });
    }

    // Calculate bounds
    const bounds = {
      minX: centerPosition.x - radiusPixels,
      maxX: centerPosition.x + radiusPixels,
      minY: centerPosition.y - radiusPixels,
      maxY: centerPosition.y + radiusPixels,
    };

    return {
      instances,
      totalCount: instanceCount,
      pattern: "radial",
      bounds,
    };
  }

  /**
   * Apply repetition to a set of path commands
   */
  static applyRepetitionToCommands(
    originalCommands: PathCommand[],
    repetitionResult: RepetitionResult
  ): PathCommand[][] {
    return repetitionResult.instances.map((instance) => {
      return this.transformCommandsForInstance(originalCommands, instance);
    });
  }

  /**
   * Transform path commands for a specific repetition instance
   */
  private static transformCommandsForInstance(
    commands: PathCommand[],
    instance: RepetitionInstance
  ): PathCommand[] {
    const { position, rotation } = instance;

    return commands.map((cmd) => {
      if (cmd.cmd === "Z") {
        return cmd; // Z command has no coordinates
      }

      // Transform coordinates
      const transformedCoords = this.transformCoordinates(
        cmd.coords,
        position,
        rotation
      );

      return {
        ...cmd,
        coords: transformedCoords,
      };
    });
  }

  /**
   * Transform coordinates for position and rotation
   */
  private static transformCoordinates(
    coords: number[],
    position: { x: number; y: number },
    rotation?: number
  ): number[] {
    const transformed: number[] = [];

    for (let i = 0; i < coords.length; i += 2) {
      let x = coords[i];
      let y = coords[i + 1];

      // Apply rotation if specified
      if (rotation !== undefined) {
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const rotatedX = x * cos - y * sin;
        const rotatedY = x * sin + y * cos;

        x = rotatedX;
        y = rotatedY;
      }

      // Apply translation
      transformed.push(x + position.x);
      transformed.push(y + position.y);
    }

    return transformed;
  }

  /**
   * Validate repetition specification
   */
  static validateRepetitionSpec(repetitionSpec: RepetitionSpec): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate type
    if (!["grid", "radial"].includes(repetitionSpec.type)) {
      errors.push("Repetition type must be 'grid' or 'radial'");
    }

    // Validate count
    if (Array.isArray(repetitionSpec.count)) {
      const [cols, rows] = repetitionSpec.count;
      if (cols <= 0 || rows <= 0) {
        errors.push("Grid count values must be positive integers");
      }
      if (!Number.isInteger(cols) || !Number.isInteger(rows)) {
        errors.push("Grid count values must be integers");
      }
      if (cols > 20 || rows > 20) {
        errors.push("Grid count values should not exceed 20 for performance");
      }
    } else {
      if (repetitionSpec.count <= 0) {
        errors.push("Count must be a positive integer");
      }
      if (!Number.isInteger(repetitionSpec.count)) {
        errors.push("Count must be an integer");
      }
      if (repetitionSpec.count > 50) {
        errors.push("Count should not exceed 50 for performance");
      }
    }

    // Validate spacing (optional)
    if (repetitionSpec.spacing !== undefined) {
      if (repetitionSpec.spacing < 0) {
        errors.push("Spacing must be non-negative");
      }
      if (repetitionSpec.spacing > 1) {
        errors.push("Spacing should not exceed 1 (100% of region)");
      }
    }

    // Validate radius for radial patterns
    if (
      repetitionSpec.type === "radial" &&
      repetitionSpec.radius !== undefined
    ) {
      if (repetitionSpec.radius <= 0) {
        errors.push("Radius must be positive");
      }
      if (repetitionSpec.radius > 1) {
        errors.push("Radius should not exceed 1 (100% of region)");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate optimal spacing for a grid to fit within a region
   */
  static calculateOptimalSpacing(
    cols: number,
    rows: number,
    regionWidth: number,
    regionHeight: number,
    itemWidth: number,
    itemHeight: number
  ): { spacingX: number; spacingY: number } {
    // Calculate available space for spacing
    const totalItemWidth = cols * itemWidth;
    const totalItemHeight = rows * itemHeight;

    const availableSpacingX = regionWidth - totalItemWidth;
    const availableSpacingY = regionHeight - totalItemHeight;

    // Distribute spacing evenly
    const spacingX = cols > 1 ? availableSpacingX / (cols - 1) : 0;
    const spacingY = rows > 1 ? availableSpacingY / (rows - 1) : 0;

    return {
      spacingX: Math.max(0, spacingX),
      spacingY: Math.max(0, spacingY),
    };
  }

  /**
   * Get the total bounds of a repetition pattern
   */
  static getPatternBounds(
    repetitionResult: RepetitionResult,
    itemWidth: number,
    itemHeight: number
  ): { x: number; y: number; width: number; height: number } {
    const { bounds } = repetitionResult;

    return {
      x: bounds.minX - itemWidth / 2,
      y: bounds.minY - itemHeight / 2,
      width: bounds.maxX - bounds.minX + itemWidth,
      height: bounds.maxY - bounds.minY + itemHeight,
    };
  }
}
