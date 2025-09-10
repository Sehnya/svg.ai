/**
 * CoordinateMapper - Provides pixel-perfect positioning with anchor-based placement
 * Handles coordinate transformations for the unified SVG generation system
 */

import { RegionManager, RegionBounds } from "./RegionManager";
import { AspectRatio } from "./AspectRatioManager";
import {
  RegionName,
  AnchorPoint,
  LayoutSpecification,
  PathCommand,
  RepetitionSpec,
  SizeSpec,
  ANCHOR_OFFSETS,
  COORDINATE_BOUNDS,
} from "../types/unified-layered";

export interface CoordinateTransform {
  x: number;
  y: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
}

export interface PositionResult {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface RepetitionResult {
  positions: PositionResult[];
  totalBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Maps coordinates using anchor-based placement and normalized offset system
 */
export class CoordinateMapper {
  private canvasWidth: number;
  private canvasHeight: number;
  private regionManager: RegionManager;

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    regionManager: RegionManager
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.regionManager = regionManager;
  }

  /**
   * Calculate position using layout specification
   */
  calculatePosition(layout: LayoutSpecification): PositionResult {
    const region = layout.region || "center";
    const anchor = layout.anchor || "center";
    const offset = layout.offset || [0, 0];

    // Get region bounds
    const regionBounds = this.regionManager.getRegionBounds(region);
    const regionPixelBounds = this.regionManager.getPixelBounds(region);

    // Get anchor offset within the region
    const anchorOffset = ANCHOR_OFFSETS[anchor];

    // Calculate base position (region + anchor)
    const baseX =
      regionPixelBounds.x + regionPixelBounds.width * anchorOffset.x;
    const baseY =
      regionPixelBounds.y + regionPixelBounds.height * anchorOffset.y;

    // Apply normalized offset
    const offsetX = offset[0] * regionPixelBounds.width;
    const offsetY = offset[1] * regionPixelBounds.height;

    // Final position
    const x = baseX + offsetX;
    const y = baseY + offsetY;

    // Calculate size if specified
    let width: number | undefined;
    let height: number | undefined;

    if (layout.size) {
      const sizeResult = this.calculateSize(layout.size, regionBounds);
      width = sizeResult.width;
      height = sizeResult.height;
    }

    return {
      x: this.clampX(x),
      y: this.clampY(y),
      width,
      height,
    };
  }

  /**
   * Calculate size based on size specification
   */
  calculateSize(
    sizeSpec: SizeSpec,
    regionBounds: RegionBounds
  ): { width: number; height: number } {
    if (sizeSpec.absolute) {
      return {
        width: sizeSpec.absolute.width,
        height: sizeSpec.absolute.height,
      };
    }

    if (sizeSpec.relative !== undefined) {
      const regionPixelBounds = {
        width: regionBounds.width * this.canvasWidth,
        height: regionBounds.height * this.canvasHeight,
      };

      return {
        width: regionPixelBounds.width * sizeSpec.relative,
        height: regionPixelBounds.height * sizeSpec.relative,
      };
    }

    if (sizeSpec.aspect_constrained) {
      const width = sizeSpec.aspect_constrained.width;
      const height = width / sizeSpec.aspect_constrained.aspect;

      return { width, height };
    }

    // Default size (10% of region)
    return {
      width: regionBounds.width * this.canvasWidth * 0.1,
      height: regionBounds.height * this.canvasHeight * 0.1,
    };
  }

  /**
   * Generate repetition pattern positions
   */
  generateRepetition(
    layout: LayoutSpecification,
    basePosition: PositionResult
  ): RepetitionResult {
    if (!layout.repeat) {
      return {
        positions: [basePosition],
        totalBounds: {
          x: basePosition.x,
          y: basePosition.y,
          width: basePosition.width || 0,
          height: basePosition.height || 0,
        },
      };
    }

    const repetition = layout.repeat;
    const positions: PositionResult[] = [];

    if (repetition.type === "grid") {
      return this.generateGridRepetition(repetition, basePosition, layout);
    } else if (repetition.type === "radial") {
      return this.generateRadialRepetition(repetition, basePosition, layout);
    }

    // Fallback to single position
    return {
      positions: [basePosition],
      totalBounds: {
        x: basePosition.x,
        y: basePosition.y,
        width: basePosition.width || 0,
        height: basePosition.height || 0,
      },
    };
  }

  /**
   * Generate grid repetition pattern
   */
  private generateGridRepetition(
    repetition: RepetitionSpec,
    basePosition: PositionResult,
    layout: LayoutSpecification
  ): RepetitionResult {
    const positions: PositionResult[] = [];
    let countX: number, countY: number;

    if (Array.isArray(repetition.count)) {
      [countX, countY] = repetition.count;
    } else {
      countX = countY = repetition.count;
    }

    // Handle zero or negative counts
    if (countX <= 0 || countY <= 0) {
      return {
        positions: [],
        totalBounds: {
          x: basePosition.x,
          y: basePosition.y,
          width: 0,
          height: 0,
        },
      };
    }

    const spacing = repetition.spacing || 0.1;
    const region = layout.region || "center";
    const regionPixelBounds = this.regionManager.getPixelBounds(region);

    // Calculate spacing in pixels
    const spacingX = spacing * regionPixelBounds.width;
    const spacingY = spacing * regionPixelBounds.height;

    // Calculate total grid size
    const totalWidth = (countX - 1) * spacingX + (basePosition.width || 0);
    const totalHeight = (countY - 1) * spacingY + (basePosition.height || 0);

    // Calculate starting position to center the grid
    const startX = basePosition.x - totalWidth / 2;
    const startY = basePosition.y - totalHeight / 2;

    // Generate grid positions
    for (let row = 0; row < countY; row++) {
      for (let col = 0; col < countX; col++) {
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;

        positions.push({
          x: this.clampX(x),
          y: this.clampY(y),
          width: basePosition.width,
          height: basePosition.height,
        });
      }
    }

    return {
      positions,
      totalBounds: {
        x: startX,
        y: startY,
        width: totalWidth,
        height: totalHeight,
      },
    };
  }

  /**
   * Generate radial repetition pattern
   */
  private generateRadialRepetition(
    repetition: RepetitionSpec,
    basePosition: PositionResult,
    layout: LayoutSpecification
  ): RepetitionResult {
    const positions: PositionResult[] = [];
    const count = Array.isArray(repetition.count)
      ? repetition.count[0]
      : repetition.count;
    const radius = repetition.radius || 50;

    const centerX = basePosition.x;
    const centerY = basePosition.y;

    // Generate positions around a circle
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      positions.push({
        x: this.clampX(x),
        y: this.clampY(y),
        width: basePosition.width,
        height: basePosition.height,
      });
    }

    return {
      positions,
      totalBounds: {
        x: centerX - radius - (basePosition.width || 0) / 2,
        y: centerY - radius - (basePosition.height || 0) / 2,
        width: 2 * radius + (basePosition.width || 0),
        height: 2 * radius + (basePosition.height || 0),
      },
    };
  }

  /**
   * Transform path commands using layout specification
   */
  transformPathCommands(
    commands: PathCommand[],
    layout: LayoutSpecification
  ): PathCommand[] {
    const position = this.calculatePosition(layout);

    // If no repetition, just transform once
    if (!layout.repeat) {
      return this.applyTransformToCommands(commands, {
        x: position.x,
        y: position.y,
      });
    }

    // Handle repetition
    const repetitionResult = this.generateRepetition(layout, position);
    const transformedCommands: PathCommand[] = [];

    repetitionResult.positions.forEach((pos, index) => {
      const transform: CoordinateTransform = {
        x: pos.x,
        y: pos.y,
      };

      const transformed = this.applyTransformToCommands(commands, transform);

      // Add the transformed commands
      if (index === 0) {
        // First instance - use as is
        transformedCommands.push(...transformed);
      } else {
        // Subsequent instances - start with Move command
        if (transformed.length > 0 && transformed[0].cmd !== "M") {
          // Add a move command to the new position
          transformedCommands.push({
            cmd: "M",
            coords: [pos.x, pos.y],
          });
        }
        transformedCommands.push(...transformed);
      }
    });

    return transformedCommands;
  }

  /**
   * Apply coordinate transform to path commands
   */
  private applyTransformToCommands(
    commands: PathCommand[],
    transform: CoordinateTransform
  ): PathCommand[] {
    return commands.map((command) => {
      if (command.cmd === "Z") {
        return { ...command };
      }

      const transformedCoords = command.coords.map((coord, index) => {
        if (index % 2 === 0) {
          // X coordinate
          return this.clampX(coord + transform.x);
        } else {
          // Y coordinate
          return this.clampY(coord + transform.y);
        }
      });

      return {
        ...command,
        coords: transformedCoords,
      };
    });
  }

  /**
   * Calculate anchor position within a region
   */
  calculateAnchorPosition(
    regionName: RegionName | string,
    anchor: AnchorPoint
  ): PositionResult {
    const regionPixelBounds = this.regionManager.getPixelBounds(regionName);
    const anchorOffset = ANCHOR_OFFSETS[anchor];

    const x = regionPixelBounds.x + regionPixelBounds.width * anchorOffset.x;
    const y = regionPixelBounds.y + regionPixelBounds.height * anchorOffset.y;

    return {
      x: this.clampX(x),
      y: this.clampY(y),
    };
  }

  /**
   * Calculate offset from anchor position
   */
  calculateOffsetPosition(
    basePosition: PositionResult,
    offset: [number, number],
    regionName: RegionName | string
  ): PositionResult {
    const regionPixelBounds = this.regionManager.getPixelBounds(regionName);

    const offsetX = offset[0] * regionPixelBounds.width;
    const offsetY = offset[1] * regionPixelBounds.height;

    return {
      x: this.clampX(basePosition.x + offsetX),
      y: this.clampY(basePosition.y + offsetY),
      width: basePosition.width,
      height: basePosition.height,
    };
  }

  /**
   * Convert normalized coordinates to pixel coordinates
   */
  normalizedToPixel(x: number, y: number): PositionResult {
    return {
      x: this.clampX(x * this.canvasWidth),
      y: this.clampY(y * this.canvasHeight),
    };
  }

  /**
   * Convert pixel coordinates to normalized coordinates
   */
  pixelToNormalized(x: number, y: number): { x: number; y: number } {
    return {
      x: x / this.canvasWidth,
      y: y / this.canvasHeight,
    };
  }

  /**
   * Calculate bounding box for a set of path commands
   */
  calculateBoundingBox(commands: PathCommand[]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (commands.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    commands.forEach((command) => {
      if (command.cmd !== "Z") {
        for (let i = 0; i < command.coords.length; i += 2) {
          const x = command.coords[i];
          const y = command.coords[i + 1];

          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Scale path commands to fit within specified bounds
   */
  scalePathToFit(
    commands: PathCommand[],
    targetWidth: number,
    targetHeight: number,
    maintainAspectRatio: boolean = true
  ): PathCommand[] {
    const bounds = this.calculateBoundingBox(commands);

    if (bounds.width === 0 || bounds.height === 0) {
      return commands;
    }

    let scaleX = targetWidth / bounds.width;
    let scaleY = targetHeight / bounds.height;

    if (maintainAspectRatio) {
      const scale = Math.min(scaleX, scaleY);
      scaleX = scaleY = scale;
    }

    return commands.map((command) => {
      if (command.cmd === "Z") {
        return { ...command };
      }

      const scaledCoords = command.coords.map((coord, index) => {
        if (index % 2 === 0) {
          // X coordinate
          return this.clampX((coord - bounds.x) * scaleX);
        } else {
          // Y coordinate
          return this.clampY((coord - bounds.y) * scaleY);
        }
      });

      return {
        ...command,
        coords: scaledCoords,
      };
    });
  }

  /**
   * Update canvas dimensions
   */
  updateCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /**
   * Get current canvas dimensions
   */
  getCanvasDimensions(): { width: number; height: number } {
    return {
      width: this.canvasWidth,
      height: this.canvasHeight,
    };
  }

  /**
   * Validate that coordinates are within canvas bounds
   */
  validateCoordinates(x: number, y: number): boolean {
    return (
      x >= COORDINATE_BOUNDS.MIN &&
      x <= COORDINATE_BOUNDS.MAX &&
      y >= COORDINATE_BOUNDS.MIN &&
      y <= COORDINATE_BOUNDS.MAX
    );
  }

  /**
   * Round coordinates to specified precision
   */
  roundCoordinates(
    x: number,
    y: number,
    precision: number = COORDINATE_BOUNDS.PRECISION
  ): { x: number; y: number } {
    const factor = Math.pow(10, precision);
    return {
      x: Math.round(x * factor) / factor,
      y: Math.round(y * factor) / factor,
    };
  }

  // Private helper methods

  private clampX(x: number): number {
    return Math.max(COORDINATE_BOUNDS.MIN, Math.min(COORDINATE_BOUNDS.MAX, x));
  }

  private clampY(y: number): number {
    return Math.max(COORDINATE_BOUNDS.MIN, Math.min(COORDINATE_BOUNDS.MAX, y));
  }
}
