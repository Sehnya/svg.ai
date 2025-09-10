/**
 * OptimizedCoordinateMapper - High-performance coordinate transformations
 * Implements batch processing and caching for coordinate calculations
 */

import { RegionManager, RegionBounds } from "./RegionManager";
import {
  RegionName,
  AnchorPoint,
  LayoutSpecification,
  PathCommand,
  SizeSpec,
  ANCHOR_OFFSETS,
  COORDINATE_BOUNDS,
} from "../types/unified-layered";

export interface OptimizedPositionResult {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface BatchTransformResult {
  transformedCommands: PathCommand[][];
  totalCommands: number;
  processingTime: number;
}

export interface CoordinateCache {
  key: string;
  position: OptimizedPositionResult;
  timestamp: number;
}

/**
 * High-performance coordinate mapper with caching and batch processing
 */
export class OptimizedCoordinateMapper {
  private canvasWidth: number;
  private canvasHeight: number;
  private regionManager: RegionManager;

  // Performance optimizations
  private positionCache = new Map<string, CoordinateCache>();
  private readonly cacheSize = 1000;
  private readonly cacheTTL = 60000; // 1 minute

  // Pre-calculated values for common operations
  private precisionFactor: number;
  private canvasCenter: { x: number; y: number };

  // Batch processing thresholds
  private readonly batchThreshold = 50;
  private readonly maxBatchSize = 1000;

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    regionManager: RegionManager
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.regionManager = regionManager;

    // Pre-calculate common values
    this.precisionFactor = Math.pow(10, COORDINATE_BOUNDS.PRECISION);
    this.canvasCenter = {
      x: canvasWidth / 2,
      y: canvasHeight / 2,
    };
  }

  /**
   * Calculate position with caching for repeated calculations
   */
  calculateOptimizedPosition(
    layout: LayoutSpecification
  ): OptimizedPositionResult {
    // Generate cache key
    const cacheKey = this.generatePositionCacheKey(layout);

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached.position;
    }

    // Calculate position
    const position = this.calculatePositionInternal(layout);

    // Cache result
    this.setCache(cacheKey, position);

    return position;
  }

  /**
   * Internal position calculation with optimizations
   */
  private calculatePositionInternal(
    layout: LayoutSpecification
  ): OptimizedPositionResult {
    const region = layout.region || "center";
    const anchor = layout.anchor || "center";
    const offset = layout.offset || [0, 0];

    // Use pre-calculated region bounds
    const regionPixelBounds = this.regionManager.getPixelBounds(region);
    const anchorOffset = ANCHOR_OFFSETS[anchor];

    // Optimized position calculation
    const baseX =
      regionPixelBounds.x + regionPixelBounds.width * anchorOffset.x;
    const baseY =
      regionPixelBounds.y + regionPixelBounds.height * anchorOffset.y;

    // Apply offset with single multiplication
    const offsetX = offset[0] * regionPixelBounds.width;
    const offsetY = offset[1] * regionPixelBounds.height;

    // Final position with rounding
    const x = this.roundCoordinate(baseX + offsetX);
    const y = this.roundCoordinate(baseY + offsetY);

    // Calculate size if specified
    let width: number | undefined;
    let height: number | undefined;

    if (layout.size) {
      const regionBounds = this.regionManager.getRegionBounds(region);
      const sizeResult = this.calculateOptimizedSize(layout.size, regionBounds);
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
   * Optimized size calculation with pre-computed values
   */
  private calculateOptimizedSize(
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
      // Pre-calculate region pixel dimensions
      const regionPixelWidth = regionBounds.width * this.canvasWidth;
      const regionPixelHeight = regionBounds.height * this.canvasHeight;

      return {
        width: regionPixelWidth * sizeSpec.relative,
        height: regionPixelHeight * sizeSpec.relative,
      };
    }

    if (sizeSpec.aspect_constrained) {
      const width = sizeSpec.aspect_constrained.width;
      const height = width / sizeSpec.aspect_constrained.aspect;
      return { width, height };
    }

    // Default size (10% of region) - pre-calculated
    const defaultFactor = 0.1;
    return {
      width: regionBounds.width * this.canvasWidth * defaultFactor,
      height: regionBounds.height * this.canvasHeight * defaultFactor,
    };
  }

  /**
   * Batch transform path commands for multiple layouts
   */
  batchTransformPathCommands(
    commands: PathCommand[],
    layouts: LayoutSpecification[]
  ): BatchTransformResult {
    const startTime = performance.now();

    if (layouts.length < this.batchThreshold) {
      // Use standard processing for small batches
      const transformedCommands = layouts.map((layout) =>
        this.transformPathCommands(commands, layout)
      );

      return {
        transformedCommands,
        totalCommands: transformedCommands.reduce(
          (sum, cmds) => sum + cmds.length,
          0
        ),
        processingTime: performance.now() - startTime,
      };
    }

    // Use optimized batch processing for large batches
    return this.batchTransformLarge(commands, layouts, startTime);
  }

  /**
   * Optimized batch processing for large command sets
   */
  private batchTransformLarge(
    commands: PathCommand[],
    layouts: LayoutSpecification[],
    startTime: number
  ): BatchTransformResult {
    const transformedCommands: PathCommand[][] = new Array(layouts.length);

    // Pre-calculate positions for all layouts
    const positions = layouts.map((layout) =>
      this.calculateOptimizedPosition(layout)
    );

    // Process in chunks to avoid memory pressure
    const chunkSize = Math.min(this.maxBatchSize, layouts.length);

    for (let i = 0; i < layouts.length; i += chunkSize) {
      const endIndex = Math.min(i + chunkSize, layouts.length);

      for (let j = i; j < endIndex; j++) {
        transformedCommands[j] = this.applyTransformToCommands(
          commands,
          positions[j]
        );
      }
    }

    const totalCommands = transformedCommands.reduce(
      (sum, cmds) => sum + cmds.length,
      0
    );

    return {
      transformedCommands,
      totalCommands,
      processingTime: performance.now() - startTime,
    };
  }

  /**
   * Transform path commands using layout specification (optimized)
   */
  transformPathCommands(
    commands: PathCommand[],
    layout: LayoutSpecification
  ): PathCommand[] {
    const position = this.calculateOptimizedPosition(layout);

    // Handle repetition if specified
    if (layout.repeat) {
      return this.handleRepetitionTransform(commands, layout, position);
    }

    // Simple transform without repetition
    return this.applyTransformToCommands(commands, position);
  }

  /**
   * Handle repetition transformation with optimizations
   */
  private handleRepetitionTransform(
    commands: PathCommand[],
    layout: LayoutSpecification,
    basePosition: OptimizedPositionResult
  ): PathCommand[] {
    const repetition = layout.repeat!;

    if (repetition.type === "grid") {
      return this.handleGridRepetition(
        commands,
        repetition,
        basePosition,
        layout
      );
    } else if (repetition.type === "radial") {
      return this.handleRadialRepetition(commands, repetition, basePosition);
    }

    return this.applyTransformToCommands(commands, basePosition);
  }

  /**
   * Optimized grid repetition handling
   */
  private handleGridRepetition(
    commands: PathCommand[],
    repetition: any,
    basePosition: OptimizedPositionResult,
    layout: LayoutSpecification
  ): PathCommand[] {
    const [cols, rows] = Array.isArray(repetition.count)
      ? repetition.count
      : [repetition.count, repetition.count];

    const spacing = repetition.spacing || 0.1;
    const region = layout.region || "center";
    const regionPixelBounds = this.regionManager.getPixelBounds(region);

    // Pre-calculate spacing and steps
    const spacingX = spacing * regionPixelBounds.width;
    const spacingY = spacing * regionPixelBounds.height;
    const totalWidth = (cols - 1) * spacingX;
    const totalHeight = (rows - 1) * spacingY;
    const startX = basePosition.x - totalWidth / 2;
    const startY = basePosition.y - totalHeight / 2;

    const allCommands: PathCommand[] = [];

    // Generate grid positions and transform commands
    for (let row = 0; row < rows; row++) {
      const y = startY + row * spacingY;

      for (let col = 0; col < cols; col++) {
        const x = startX + col * spacingX;

        const position = {
          x: this.clampX(this.roundCoordinate(x)),
          y: this.clampY(this.roundCoordinate(y)),
        };

        const transformed = this.applyTransformToCommands(commands, position);

        // Add move command for subsequent instances
        if (allCommands.length > 0 && transformed.length > 0) {
          allCommands.push({
            cmd: "M",
            coords: [position.x, position.y],
          });
        }

        allCommands.push(...transformed);
      }
    }

    return allCommands;
  }

  /**
   * Optimized radial repetition handling
   */
  private handleRadialRepetition(
    commands: PathCommand[],
    repetition: any,
    basePosition: OptimizedPositionResult
  ): PathCommand[] {
    const count = Array.isArray(repetition.count)
      ? repetition.count[0]
      : repetition.count;
    const radius = repetition.radius || 50;

    const angleStep = (2 * Math.PI) / count;
    const allCommands: PathCommand[] = [];

    // Pre-calculate trigonometric values for better performance
    const cosValues = new Float32Array(count);
    const sinValues = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = i * angleStep;
      cosValues[i] = Math.cos(angle);
      sinValues[i] = Math.sin(angle);
    }

    // Generate radial positions and transform commands
    for (let i = 0; i < count; i++) {
      const x = basePosition.x + cosValues[i] * radius;
      const y = basePosition.y + sinValues[i] * radius;

      const position = {
        x: this.clampX(this.roundCoordinate(x)),
        y: this.clampY(this.roundCoordinate(y)),
      };

      const transformed = this.applyTransformToCommands(commands, position);

      // Add move command for subsequent instances
      if (allCommands.length > 0 && transformed.length > 0) {
        allCommands.push({
          cmd: "M",
          coords: [position.x, position.y],
        });
      }

      allCommands.push(...transformed);
    }

    return allCommands;
  }

  /**
   * Apply coordinate transform to path commands (optimized)
   */
  private applyTransformToCommands(
    commands: PathCommand[],
    position: OptimizedPositionResult
  ): PathCommand[] {
    // Pre-allocate result array
    const result = new Array(commands.length);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      if (command.cmd === "Z") {
        result[i] = { cmd: "Z", coords: [] };
        continue;
      }

      // Optimized coordinate transformation
      const transformedCoords = new Array(command.coords.length);

      for (let j = 0; j < command.coords.length; j += 2) {
        const x = command.coords[j] + position.x;
        const y = command.coords[j + 1] + position.y;

        transformedCoords[j] = this.clampX(this.roundCoordinate(x));
        transformedCoords[j + 1] = this.clampY(this.roundCoordinate(y));
      }

      result[i] = {
        cmd: command.cmd,
        coords: transformedCoords,
      };
    }

    return result;
  }

  /**
   * Calculate bounding box with optimized algorithm
   */
  calculateOptimizedBoundingBox(commands: PathCommand[]): {
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
    let hasCoordinates = false;

    // Single pass through all coordinates
    for (const command of commands) {
      if (command.cmd !== "Z") {
        const coords = command.coords;

        // Process coordinates in pairs for better cache locality
        for (let i = 0; i < coords.length; i += 2) {
          const x = coords[i];
          const y = coords[i + 1];

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasCoordinates = true;
        }
      }
    }

    // If no coordinates found, return zero bounds
    if (!hasCoordinates) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Scale path commands with optimized algorithm
   */
  scalePathToFitOptimized(
    commands: PathCommand[],
    targetWidth: number,
    targetHeight: number,
    maintainAspectRatio: boolean = true
  ): PathCommand[] {
    const bounds = this.calculateOptimizedBoundingBox(commands);

    if (bounds.width === 0 || bounds.height === 0) {
      return commands;
    }

    // Add padding to ensure shape isn't clipped (10% margin)
    const padding = 0.1;
    const availableWidth = targetWidth * (1 - padding * 2);
    const availableHeight = targetHeight * (1 - padding * 2);

    // Calculate scale factors
    let scaleX = availableWidth / bounds.width;
    let scaleY = availableHeight / bounds.height;

    if (maintainAspectRatio) {
      const scale = Math.min(scaleX, scaleY);
      scaleX = scaleY = scale;
    }

    // Calculate centering offset
    const scaledWidth = bounds.width * scaleX;
    const scaledHeight = bounds.height * scaleY;
    const offsetX = (targetWidth - scaledWidth) / 2;
    const offsetY = (targetHeight - scaledHeight) / 2;

    // Pre-allocate result array
    const result = new Array(commands.length);

    // Apply scaling in single pass
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      if (command.cmd === "Z") {
        result[i] = { cmd: "Z", coords: [] };
        continue;
      }

      const scaledCoords = new Array(command.coords.length);

      for (let j = 0; j < command.coords.length; j += 2) {
        const x = (command.coords[j] - bounds.x) * scaleX + offsetX;
        const y = (command.coords[j + 1] - bounds.y) * scaleY + offsetY;

        // Use soft clamping to avoid cutting off shapes
        scaledCoords[j] = this.softClampX(this.roundCoordinate(x));
        scaledCoords[j + 1] = this.softClampY(this.roundCoordinate(y));
      }

      result[i] = {
        cmd: command.cmd,
        coords: scaledCoords,
      };
    }

    return result;
  }

  /**
   * Auto-fit path commands to canvas with proper viewport sizing
   */
  autoFitPathToCanvas(commands: PathCommand[]): {
    commands: PathCommand[];
    viewBox: string;
    bounds: { x: number; y: number; width: number; height: number };
  } {
    const bounds = this.calculateOptimizedBoundingBox(commands);

    if (bounds.width === 0 || bounds.height === 0) {
      return {
        commands,
        viewBox: `0 0 ${this.canvasWidth} ${this.canvasHeight}`,
        bounds,
      };
    }

    // Add 20% padding around the shape
    const padding = 0.2;
    const paddedWidth = bounds.width * (1 + padding);
    const paddedHeight = bounds.height * (1 + padding);
    const paddingX = (paddedWidth - bounds.width) / 2;
    const paddingY = (paddedHeight - bounds.height) / 2;

    // Calculate new viewBox that contains the full shape with padding
    const viewBoxX = bounds.x - paddingX;
    const viewBoxY = bounds.y - paddingY;
    const viewBox = `${viewBoxX} ${viewBoxY} ${paddedWidth} ${paddedHeight}`;

    return {
      commands,
      viewBox,
      bounds: {
        x: viewBoxX,
        y: viewBoxY,
        width: paddedWidth,
        height: paddedHeight,
      },
    };
  }

  /**
   * Performance benchmark for coordinate operations
   */
  benchmarkCoordinatePerformance(
    commands: PathCommand[],
    layouts: LayoutSpecification[],
    iterations: number = 100
  ): {
    averageTime: number;
    commandsPerMs: number;
    cacheHitRate: number;
  } {
    const times: number[] = [];
    let cacheHits = 0;
    let cacheAttempts = 0;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      for (const layout of layouts) {
        const cacheKey = this.generatePositionCacheKey(layout);
        cacheAttempts++;

        if (this.positionCache.has(cacheKey)) {
          cacheHits++;
        }

        this.transformPathCommands(commands, layout);
      }

      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const averageTime =
      times.reduce((sum, time) => sum + time, 0) / times.length;
    const totalCommands = commands.length * layouts.length * iterations;
    const commandsPerMs = totalCommands / (averageTime * iterations);
    const cacheHitRate = cacheAttempts > 0 ? cacheHits / cacheAttempts : 0;

    return {
      averageTime,
      commandsPerMs,
      cacheHitRate,
    };
  }

  // Cache management methods

  private generatePositionCacheKey(layout: LayoutSpecification): string {
    return JSON.stringify({
      region: layout.region || "center",
      anchor: layout.anchor || "center",
      offset: layout.offset || [0, 0],
      size: layout.size,
    });
  }

  private getFromCache(key: string): CoordinateCache | null {
    const cached = this.positionCache.get(key);

    if (!cached) {
      return null;
    }

    // Check TTL
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.positionCache.delete(key);
      return null;
    }

    return cached;
  }

  private setCache(key: string, position: OptimizedPositionResult): void {
    // Implement LRU eviction
    if (this.positionCache.size >= this.cacheSize) {
      const firstKey = this.positionCache.keys().next().value;
      this.positionCache.delete(firstKey);
    }

    this.positionCache.set(key, {
      key,
      position,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear position cache
   */
  clearCache(): void {
    this.positionCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    return {
      size: this.positionCache.size,
      maxSize: this.cacheSize,
      hitRate: 0, // Would need to track hits/misses for accurate rate
    };
  }

  // Utility methods

  private roundCoordinate(value: number): number {
    return Math.round(value * this.precisionFactor) / this.precisionFactor;
  }

  private clampX(x: number): number {
    return Math.max(COORDINATE_BOUNDS.MIN, Math.min(COORDINATE_BOUNDS.MAX, x));
  }

  private clampY(y: number): number {
    return Math.max(COORDINATE_BOUNDS.MIN, Math.min(COORDINATE_BOUNDS.MAX, y));
  }

  /**
   * Soft clamping that allows slight overflow to prevent shape clipping
   */
  private softClampX(x: number): number {
    const margin = this.canvasWidth * 0.1; // 10% margin
    return Math.max(-margin, Math.min(this.canvasWidth + margin, x));
  }

  private softClampY(y: number): number {
    const margin = this.canvasHeight * 0.1; // 10% margin
    return Math.max(-margin, Math.min(this.canvasHeight + margin, y));
  }

  /**
   * Update canvas dimensions and recalculate cached values
   */
  updateCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.canvasCenter = {
      x: width / 2,
      y: height / 2,
    };

    // Update region manager with new dimensions
    this.regionManager.updateCanvasDimensions(width, height);

    // Clear cache as positions may have changed
    this.clearCache();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    cacheSize: number;
    canvasDimensions: { width: number; height: number };
    precisionFactor: number;
  } {
    return {
      cacheSize: this.positionCache.size,
      canvasDimensions: {
        width: this.canvasWidth,
        height: this.canvasHeight,
      },
      precisionFactor: this.precisionFactor,
    };
  }
}
