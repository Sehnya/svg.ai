/**
 * OptimizedRepetitionManager - High-performance repetition pattern generation
 * Implements O(n) algorithms for grid and radial patterns with batch processing
 */

import {
  RepetitionSpec,
  RegionName,
  AnchorPoint,
  PathCommand,
} from "../types/unified-layered";
import { RegionManager } from "./RegionManager";
import { CoordinateMapper } from "./CoordinateMapper";

export interface OptimizedRepetitionInstance {
  index: number;
  position: { x: number; y: number };
  rotation?: number;
  scale?: number;
}

export interface OptimizedRepetitionResult {
  instances: OptimizedRepetitionInstance[];
  totalCount: number;
  pattern: "grid" | "radial";
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  generationTime: number; // Performance metric
}

export interface BatchCoordinateResult {
  coordinates: Float32Array; // Optimized storage for large datasets
  count: number;
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

export class OptimizedRepetitionManager {
  private static readonly MAX_BATCH_SIZE = 10000;
  private static readonly COORDINATE_PRECISION = 2;
  private static readonly PERFORMANCE_THRESHOLD_MS = 10;

  /**
   * Generate optimized repetition instances with performance tracking
   */
  static generateOptimizedRepetition(
    repetitionSpec: RepetitionSpec,
    context: RepetitionContext
  ): OptimizedRepetitionResult {
    const startTime = performance.now();

    let result: OptimizedRepetitionResult;

    if (repetitionSpec.type === "grid") {
      result = this.generateOptimizedGridRepetition(repetitionSpec, context);
    } else if (repetitionSpec.type === "radial") {
      result = this.generateOptimizedRadialRepetition(repetitionSpec, context);
    } else {
      throw new Error(`Unsupported repetition type: ${repetitionSpec.type}`);
    }

    const endTime = performance.now();
    result.generationTime = endTime - startTime;

    // Log performance warning if generation takes too long
    if (result.generationTime > this.PERFORMANCE_THRESHOLD_MS) {
      console.warn(
        `Repetition generation took ${result.generationTime.toFixed(2)}ms for ${result.totalCount} instances`
      );
    }

    return result;
  }

  /**
   * Optimized grid generation with O(n) complexity
   * Uses pre-calculated step values and batch coordinate generation
   */
  private static generateOptimizedGridRepetition(
    repetitionSpec: RepetitionSpec,
    context: RepetitionContext
  ): OptimizedRepetitionResult {
    const { count, spacing = 0.1 } = repetitionSpec;

    // Parse count efficiently
    const [cols, rows] = Array.isArray(count) ? count : [count, count];
    const totalCount = cols * rows;

    // Early return for empty grids
    if (totalCount === 0) {
      return {
        instances: [],
        totalCount: 0,
        pattern: "grid",
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
        generationTime: 0,
      };
    }

    // Pre-calculate region bounds once
    const regionBounds = context.regionManager.getRegionBounds(
      context.regionName as RegionName
    );
    const regionPixelWidth = regionBounds.width * context.canvasWidth;
    const regionPixelHeight = regionBounds.height * context.canvasHeight;

    // Pre-calculate base position once
    const basePosition = context.coordinateMapper.calculatePosition({
      region: context.regionName,
      anchor: context.anchor,
      offset: context.offset,
    });

    // Pre-calculate spacing and step values
    const spacingX = regionPixelWidth * spacing;
    const spacingY = regionPixelHeight * spacing;
    const availableWidth = regionPixelWidth - spacingX * (cols - 1);
    const availableHeight = regionPixelHeight - spacingY * (rows - 1);
    const stepX = cols > 1 ? availableWidth / (cols - 1) : 0;
    const stepY = rows > 1 ? availableHeight / (rows - 1) : 0;

    // Pre-calculate starting offsets
    const startOffsetX = cols > 1 ? -availableWidth / 2 : 0;
    const startOffsetY = rows > 1 ? -availableHeight / 2 : 0;

    // Use batch coordinate generation for large grids
    if (totalCount > 100) {
      return this.generateBatchGridCoordinates(
        cols,
        rows,
        basePosition,
        stepX,
        stepY,
        spacingX,
        spacingY,
        startOffsetX,
        startOffsetY
      );
    }

    // Standard generation for smaller grids
    const instances: OptimizedRepetitionInstance[] = new Array(totalCount);
    let index = 0;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    // Optimized nested loop with pre-calculated values
    for (let row = 0; row < rows; row++) {
      const y = basePosition.y + startOffsetY + row * (stepY + spacingY);

      for (let col = 0; col < cols; col++) {
        const x = basePosition.x + startOffsetX + col * (stepX + spacingX);

        // Round coordinates for consistency
        const roundedX = Math.round(x * 100) / 100;
        const roundedY = Math.round(y * 100) / 100;

        instances[index] = {
          index,
          position: { x: roundedX, y: roundedY },
        };

        // Update bounds efficiently
        if (roundedX < minX) minX = roundedX;
        if (roundedX > maxX) maxX = roundedX;
        if (roundedY < minY) minY = roundedY;
        if (roundedY > maxY) maxY = roundedY;

        index++;
      }
    }

    return {
      instances,
      totalCount,
      pattern: "grid",
      bounds: { minX, maxX, minY, maxY },
      generationTime: 0, // Will be set by caller
    };
  }

  /**
   * Batch coordinate generation for large grids using typed arrays
   */
  private static generateBatchGridCoordinates(
    cols: number,
    rows: number,
    basePosition: { x: number; y: number },
    stepX: number,
    stepY: number,
    spacingX: number,
    spacingY: number,
    startOffsetX: number,
    startOffsetY: number
  ): OptimizedRepetitionResult {
    const totalCount = cols * rows;
    const instances: OptimizedRepetitionInstance[] = new Array(totalCount);

    // Use typed arrays for better performance with large datasets
    const coordinates = new Float32Array(totalCount * 2);

    let index = 0;
    let coordIndex = 0;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    // Batch calculate all coordinates
    for (let row = 0; row < rows; row++) {
      const baseY = basePosition.y + startOffsetY + row * (stepY + spacingY);

      for (let col = 0; col < cols; col++) {
        const x = basePosition.x + startOffsetX + col * (stepX + spacingX);
        const y = baseY;

        // Round coordinates
        const roundedX = Math.round(x * 100) / 100;
        const roundedY = Math.round(y * 100) / 100;

        // Store in typed array for potential future use
        coordinates[coordIndex++] = roundedX;
        coordinates[coordIndex++] = roundedY;

        // Create instance
        instances[index] = {
          index,
          position: { x: roundedX, y: roundedY },
        };

        // Update bounds
        if (roundedX < minX) minX = roundedX;
        if (roundedX > maxX) maxX = roundedX;
        if (roundedY < minY) minY = roundedY;
        if (roundedY > maxY) maxY = roundedY;

        index++;
      }
    }

    return {
      instances,
      totalCount,
      pattern: "grid",
      bounds: { minX, maxX, minY, maxY },
      generationTime: 0,
    };
  }

  /**
   * Optimized radial pattern generation with trigonometric pre-calculation
   */
  private static generateOptimizedRadialRepetition(
    repetitionSpec: RepetitionSpec,
    context: RepetitionContext
  ): OptimizedRepetitionResult {
    const { count, radius = 0.3 } = repetitionSpec;
    const instanceCount = Array.isArray(count) ? count[0] : count;

    // Early return for empty patterns
    if (instanceCount <= 0) {
      return {
        instances: [],
        totalCount: 0,
        pattern: "radial",
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
        generationTime: 0,
      };
    }

    // Pre-calculate region and radius values
    const regionBounds = context.regionManager.getRegionBounds(
      context.regionName as RegionName
    );
    const regionSize = Math.min(
      regionBounds.width * context.canvasWidth,
      regionBounds.height * context.canvasHeight
    );
    const radiusPixels = regionSize * radius;

    // Pre-calculate center position
    const centerPosition = context.coordinateMapper.calculatePosition({
      region: context.regionName,
      anchor: context.anchor,
      offset: context.offset,
    });

    // Pre-calculate angle step
    const angleStep = (2 * Math.PI) / instanceCount;

    // Use optimized trigonometric calculation
    if (instanceCount > 50) {
      return this.generateBatchRadialCoordinates(
        instanceCount,
        centerPosition,
        radiusPixels,
        angleStep
      );
    }

    // Standard generation for smaller patterns
    const instances: OptimizedRepetitionInstance[] = new Array(instanceCount);

    // Pre-calculate bounds (circle bounds)
    const minX = centerPosition.x - radiusPixels;
    const maxX = centerPosition.x + radiusPixels;
    const minY = centerPosition.y - radiusPixels;
    const maxY = centerPosition.y + radiusPixels;

    // Generate instances with optimized trigonometry
    for (let i = 0; i < instanceCount; i++) {
      const angle = i * angleStep;

      // Use optimized trigonometric functions
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      const x =
        Math.round((centerPosition.x + cosAngle * radiusPixels) * 100) / 100;
      const y =
        Math.round((centerPosition.y + sinAngle * radiusPixels) * 100) / 100;
      const rotation = Math.round(((angle * 180) / Math.PI) * 100) / 100;

      instances[i] = {
        index: i,
        position: { x, y },
        rotation,
      };
    }

    return {
      instances,
      totalCount: instanceCount,
      pattern: "radial",
      bounds: { minX, maxX, minY, maxY },
      generationTime: 0,
    };
  }

  /**
   * Batch radial coordinate generation using lookup tables for trigonometry
   */
  private static generateBatchRadialCoordinates(
    instanceCount: number,
    centerPosition: { x: number; y: number },
    radiusPixels: number,
    angleStep: number
  ): OptimizedRepetitionResult {
    const instances: OptimizedRepetitionInstance[] = new Array(instanceCount);

    // Pre-calculate bounds
    const minX = centerPosition.x - radiusPixels;
    const maxX = centerPosition.x + radiusPixels;
    const minY = centerPosition.y - radiusPixels;
    const maxY = centerPosition.y + radiusPixels;

    // Batch calculate trigonometric values
    const cosValues = new Float32Array(instanceCount);
    const sinValues = new Float32Array(instanceCount);

    for (let i = 0; i < instanceCount; i++) {
      const angle = i * angleStep;
      cosValues[i] = Math.cos(angle);
      sinValues[i] = Math.sin(angle);
    }

    // Generate instances using pre-calculated values
    for (let i = 0; i < instanceCount; i++) {
      const x =
        Math.round((centerPosition.x + cosValues[i] * radiusPixels) * 100) /
        100;
      const y =
        Math.round((centerPosition.y + sinValues[i] * radiusPixels) * 100) /
        100;
      const rotation =
        Math.round(((i * angleStep * 180) / Math.PI) * 100) / 100;

      instances[i] = {
        index: i,
        position: { x, y },
        rotation,
      };
    }

    return {
      instances,
      totalCount: instanceCount,
      pattern: "radial",
      bounds: { minX, maxX, minY, maxY },
      generationTime: 0,
    };
  }

  /**
   * Optimized path command transformation with batch processing
   */
  static applyOptimizedRepetitionToCommands(
    originalCommands: PathCommand[],
    repetitionResult: OptimizedRepetitionResult
  ): PathCommand[][] {
    const { instances } = repetitionResult;

    // Early return for empty results
    if (instances.length === 0) {
      return [];
    }

    // Use batch processing for large repetitions
    if (instances.length > 100) {
      return this.batchTransformCommands(originalCommands, instances);
    }

    // Standard processing for smaller repetitions
    return instances.map((instance) =>
      this.transformCommandsForInstance(originalCommands, instance)
    );
  }

  /**
   * Batch transform commands for better performance with large datasets
   */
  private static batchTransformCommands(
    originalCommands: PathCommand[],
    instances: OptimizedRepetitionInstance[]
  ): PathCommand[][] {
    const results: PathCommand[][] = new Array(instances.length);

    // Pre-calculate command structure for reuse
    const commandTemplate = originalCommands.map((cmd) => ({
      cmd: cmd.cmd,
      coordCount: cmd.coords.length,
    }));

    // Batch process instances
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      const transformedCommands: PathCommand[] = new Array(
        originalCommands.length
      );

      for (let j = 0; j < originalCommands.length; j++) {
        const originalCmd = originalCommands[j];
        const template = commandTemplate[j];

        if (template.cmd === "Z") {
          transformedCommands[j] = { cmd: "Z", coords: [] };
        } else {
          const transformedCoords = this.batchTransformCoordinates(
            originalCmd.coords,
            instance.position,
            instance.rotation
          );

          transformedCommands[j] = {
            cmd: originalCmd.cmd,
            coords: transformedCoords,
          };
        }
      }

      results[i] = transformedCommands;
    }

    return results;
  }

  /**
   * Optimized coordinate transformation with minimal allocations
   */
  private static batchTransformCoordinates(
    coords: number[],
    position: { x: number; y: number },
    rotation?: number
  ): number[] {
    const transformed = new Array(coords.length);

    if (rotation !== undefined) {
      // Pre-calculate rotation values
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      // Apply rotation and translation in single pass
      for (let i = 0; i < coords.length; i += 2) {
        const x = coords[i];
        const y = coords[i + 1];

        const rotatedX = x * cos - y * sin;
        const rotatedY = x * sin + y * cos;

        transformed[i] = Math.round((rotatedX + position.x) * 100) / 100;
        transformed[i + 1] = Math.round((rotatedY + position.y) * 100) / 100;
      }
    } else {
      // Simple translation without rotation
      for (let i = 0; i < coords.length; i += 2) {
        transformed[i] = Math.round((coords[i] + position.x) * 100) / 100;
        transformed[i + 1] =
          Math.round((coords[i + 1] + position.y) * 100) / 100;
      }
    }

    return transformed;
  }

  /**
   * Transform single instance commands (optimized version)
   */
  private static transformCommandsForInstance(
    commands: PathCommand[],
    instance: OptimizedRepetitionInstance
  ): PathCommand[] {
    return commands.map((cmd) => {
      if (cmd.cmd === "Z") {
        return cmd;
      }

      const transformedCoords = this.batchTransformCoordinates(
        cmd.coords,
        instance.position,
        instance.rotation
      );

      return {
        ...cmd,
        coords: transformedCoords,
      };
    });
  }

  /**
   * Performance benchmark for repetition generation
   */
  static benchmarkRepetitionPerformance(
    repetitionSpec: RepetitionSpec,
    context: RepetitionContext,
    iterations: number = 100
  ): {
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalInstances: number;
    instancesPerMs: number;
  } {
    const times: number[] = [];
    let totalInstances = 0;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const result = this.generateOptimizedRepetition(repetitionSpec, context);
      const endTime = performance.now();

      times.push(endTime - startTime);
      totalInstances = result.totalCount;
    }

    const averageTime =
      times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const instancesPerMs = totalInstances / averageTime;

    return {
      averageTime,
      minTime,
      maxTime,
      totalInstances,
      instancesPerMs,
    };
  }

  /**
   * Validate repetition specification with performance considerations
   */
  static validateOptimizedRepetitionSpec(repetitionSpec: RepetitionSpec): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    estimatedComplexity: "low" | "medium" | "high";
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!["grid", "radial"].includes(repetitionSpec.type)) {
      errors.push("Repetition type must be 'grid' or 'radial'");
    }

    let totalInstances = 0;

    // Count-specific validation
    if (Array.isArray(repetitionSpec.count)) {
      const [cols, rows] = repetitionSpec.count;
      totalInstances = cols * rows;

      if (cols <= 0 || rows <= 0) {
        errors.push("Grid count values must be positive integers");
      }
      if (!Number.isInteger(cols) || !Number.isInteger(rows)) {
        errors.push("Grid count values must be integers");
      }
    } else {
      totalInstances = repetitionSpec.count;

      if (repetitionSpec.count <= 0) {
        errors.push("Count must be a positive integer");
      }
      if (!Number.isInteger(repetitionSpec.count)) {
        errors.push("Count must be an integer");
      }
    }

    // Performance-based validation and warnings
    let estimatedComplexity: "low" | "medium" | "high" = "low";

    if (totalInstances > 1000) {
      estimatedComplexity = "high";
      warnings.push(
        `High instance count (${totalInstances}) may impact performance`
      );
    } else if (totalInstances > 100) {
      estimatedComplexity = "medium";
      warnings.push(
        `Medium instance count (${totalInstances}) - consider batch processing`
      );
    }

    // Hard limits for performance
    if (totalInstances > 10000) {
      errors.push(
        `Instance count (${totalInstances}) exceeds maximum limit of 10,000`
      );
    }

    // Spacing validation
    if (repetitionSpec.spacing !== undefined) {
      if (repetitionSpec.spacing < 0) {
        errors.push("Spacing must be non-negative");
      }
      if (repetitionSpec.spacing > 1) {
        warnings.push(
          "Large spacing values may cause instances to exceed region bounds"
        );
      }
    }

    // Radius validation for radial patterns
    if (
      repetitionSpec.type === "radial" &&
      repetitionSpec.radius !== undefined
    ) {
      if (repetitionSpec.radius <= 0) {
        errors.push("Radius must be positive");
      }
      if (repetitionSpec.radius > 1) {
        warnings.push(
          "Large radius values may cause instances to exceed canvas bounds"
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      estimatedComplexity,
    };
  }

  /**
   * Get memory usage estimate for repetition pattern
   */
  static estimateMemoryUsage(repetitionSpec: RepetitionSpec): {
    estimatedBytes: number;
    instanceCount: number;
    recommendation: string;
  } {
    const instanceCount = Array.isArray(repetitionSpec.count)
      ? repetitionSpec.count[0] * repetitionSpec.count[1]
      : repetitionSpec.count;

    // Estimate memory per instance (position + metadata)
    const bytesPerInstance = 64; // Rough estimate including object overhead
    const estimatedBytes = instanceCount * bytesPerInstance;

    let recommendation = "Optimal memory usage";

    if (estimatedBytes > 1024 * 1024) {
      // > 1MB
      recommendation =
        "Consider reducing instance count or using streaming processing";
    } else if (estimatedBytes > 100 * 1024) {
      // > 100KB
      recommendation = "Consider batch processing for better performance";
    }

    return {
      estimatedBytes,
      instanceCount,
      recommendation,
    };
  }
}
