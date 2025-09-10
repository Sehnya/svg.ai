/**
 * RegionManager - Manages semantic regions with normalized coordinate system
 * Provides region-based positioning for the unified SVG generation system
 */

import { AspectRatio, AspectRatioManager } from "./AspectRatioManager";
import {
  RegionName,
  CustomRegion,
  REGION_BOUNDS,
} from "../types/unified-layered";

export interface RegionBounds {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  width: number; // normalized 0-1
  height: number; // normalized 0-1
}

export interface PixelBounds {
  x: number; // pixel coordinates
  y: number; // pixel coordinates
  width: number; // pixel dimensions
  height: number; // pixel dimensions
}

export interface RegionInfo {
  name: string;
  bounds: RegionBounds;
  pixelBounds: PixelBounds;
  isCustom: boolean;
}

/**
 * Manages semantic regions with normalized coordinate system for consistent positioning
 */
export class RegionManager {
  private aspectRatio: AspectRatio;
  private canvasWidth: number;
  private canvasHeight: number;
  private customRegions: Map<string, RegionBounds>;

  constructor(aspectRatio: AspectRatio = "1:1") {
    this.aspectRatio = aspectRatio;
    const dimensions = AspectRatioManager.getCanvasDimensions(aspectRatio);
    this.canvasWidth = dimensions.width;
    this.canvasHeight = dimensions.height;
    this.customRegions = new Map();
  }

  /**
   * Get normalized bounds for a region (0-1 coordinate system)
   */
  getRegionBounds(regionName: RegionName | string): RegionBounds {
    // Check if it's a standard region
    if (this.isStandardRegion(regionName)) {
      return { ...REGION_BOUNDS[regionName as RegionName] };
    }

    // Check if it's a custom region
    const customBounds = this.customRegions.get(regionName);
    if (customBounds) {
      return { ...customBounds };
    }

    // Default to center region if not found
    console.warn(`Region '${regionName}' not found, defaulting to 'center'`);
    return { ...REGION_BOUNDS.center };
  }

  /**
   * Get pixel bounds for a region (actual canvas coordinates)
   */
  getPixelBounds(regionName: RegionName | string): PixelBounds {
    const normalizedBounds = this.getRegionBounds(regionName);

    return {
      x: normalizedBounds.x * this.canvasWidth,
      y: normalizedBounds.y * this.canvasHeight,
      width: normalizedBounds.width * this.canvasWidth,
      height: normalizedBounds.height * this.canvasHeight,
    };
  }

  /**
   * Get complete region information
   */
  getRegionInfo(regionName: RegionName | string): RegionInfo {
    const bounds = this.getRegionBounds(regionName);
    const pixelBounds = this.getPixelBounds(regionName);
    const isCustom = !this.isStandardRegion(regionName);

    return {
      name: regionName,
      bounds,
      pixelBounds,
      isCustom,
    };
  }

  /**
   * Add a custom region definition
   */
  addCustomRegion(name: string, bounds: RegionBounds): void {
    // Validate bounds
    if (!this.validateRegionBounds(bounds)) {
      throw new Error(
        `Invalid region bounds for '${name}': bounds must be within [0,1] range`
      );
    }

    // Prevent overriding standard regions
    if (this.isStandardRegion(name)) {
      throw new Error(`Cannot override standard region '${name}'`);
    }

    this.customRegions.set(name, { ...bounds });
  }

  /**
   * Remove a custom region
   */
  removeCustomRegion(name: string): boolean {
    if (this.isStandardRegion(name)) {
      throw new Error(`Cannot remove standard region '${name}'`);
    }

    return this.customRegions.delete(name);
  }

  /**
   * Get all available regions (standard + custom)
   */
  getAllRegions(): RegionInfo[] {
    const regions: RegionInfo[] = [];

    // Add standard regions
    Object.keys(REGION_BOUNDS).forEach((regionName) => {
      regions.push(this.getRegionInfo(regionName));
    });

    // Add custom regions
    this.customRegions.forEach((bounds, name) => {
      regions.push(this.getRegionInfo(name));
    });

    return regions;
  }

  /**
   * Get all standard region names
   */
  getStandardRegions(): RegionName[] {
    return Object.keys(REGION_BOUNDS) as RegionName[];
  }

  /**
   * Get all custom region names
   */
  getCustomRegions(): string[] {
    return Array.from(this.customRegions.keys());
  }

  /**
   * Check if a region exists (standard or custom)
   */
  hasRegion(regionName: string): boolean {
    return (
      this.isStandardRegion(regionName) || this.customRegions.has(regionName)
    );
  }

  /**
   * Calculate center point of a region in normalized coordinates
   */
  getRegionCenter(regionName: RegionName | string): { x: number; y: number } {
    const bounds = this.getRegionBounds(regionName);

    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
  }

  /**
   * Calculate center point of a region in pixel coordinates
   */
  getRegionCenterPixels(regionName: RegionName | string): {
    x: number;
    y: number;
  } {
    const center = this.getRegionCenter(regionName);

    return {
      x: center.x * this.canvasWidth,
      y: center.y * this.canvasHeight,
    };
  }

  /**
   * Find the region that contains a given point (normalized coordinates)
   */
  findRegionAtPoint(x: number, y: number): RegionInfo | null {
    // Check custom regions first (they might override standard regions)
    for (const [name, bounds] of this.customRegions) {
      if (this.pointInRegion(x, y, bounds)) {
        return this.getRegionInfo(name);
      }
    }

    // Check standard regions
    for (const [name, bounds] of Object.entries(REGION_BOUNDS)) {
      if (this.pointInRegion(x, y, bounds)) {
        return this.getRegionInfo(name);
      }
    }

    return null;
  }

  /**
   * Find the region that contains a given point (pixel coordinates)
   */
  findRegionAtPixelPoint(x: number, y: number): RegionInfo | null {
    const normalizedX = x / this.canvasWidth;
    const normalizedY = y / this.canvasHeight;

    return this.findRegionAtPoint(normalizedX, normalizedY);
  }

  /**
   * Calculate the overlap between two regions
   */
  calculateRegionOverlap(
    region1: RegionName | string,
    region2: RegionName | string
  ): number {
    const bounds1 = this.getRegionBounds(region1);
    const bounds2 = this.getRegionBounds(region2);

    const overlapX = Math.max(
      0,
      Math.min(bounds1.x + bounds1.width, bounds2.x + bounds2.width) -
        Math.max(bounds1.x, bounds2.x)
    );
    const overlapY = Math.max(
      0,
      Math.min(bounds1.y + bounds1.height, bounds2.y + bounds2.height) -
        Math.max(bounds1.y, bounds2.y)
    );

    const overlapArea = overlapX * overlapY;
    const totalArea =
      bounds1.width * bounds1.height +
      bounds2.width * bounds2.height -
      overlapArea;

    return totalArea > 0 ? overlapArea / totalArea : 0;
  }

  /**
   * Get regions sorted by distance from a point
   */
  getRegionsByDistance(x: number, y: number): RegionInfo[] {
    const regions = this.getAllRegions();

    return regions.sort((a, b) => {
      const centerA = this.getRegionCenter(a.name);
      const centerB = this.getRegionCenter(b.name);

      const distanceA = Math.sqrt(
        Math.pow(centerA.x - x, 2) + Math.pow(centerA.y - y, 2)
      );
      const distanceB = Math.sqrt(
        Math.pow(centerB.x - x, 2) + Math.pow(centerB.y - y, 2)
      );

      return distanceA - distanceB;
    });
  }

  /**
   * Update aspect ratio and recalculate canvas dimensions
   */
  updateAspectRatio(aspectRatio: AspectRatio): void {
    this.aspectRatio = aspectRatio;
    const dimensions = AspectRatioManager.getCanvasDimensions(aspectRatio);
    this.canvasWidth = dimensions.width;
    this.canvasHeight = dimensions.height;
  }

  /**
   * Update canvas dimensions directly
   */
  updateCanvasDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /**
   * Check if a region name is valid (either standard or custom)
   */
  isValidRegion(regionName: string): boolean {
    return (
      this.isStandardRegion(regionName) || this.customRegions.has(regionName)
    );
  }

  /**
   * Get current canvas dimensions
   */
  getCanvasDimensions(): {
    width: number;
    height: number;
    aspectRatio: AspectRatio;
  } {
    return {
      width: this.canvasWidth,
      height: this.canvasHeight,
      aspectRatio: this.aspectRatio,
    };
  }

  /**
   * Convert normalized coordinates to pixel coordinates
   */
  normalizedToPixel(x: number, y: number): { x: number; y: number } {
    return {
      x: x * this.canvasWidth,
      y: y * this.canvasHeight,
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
   * Clamp normalized coordinates to valid range [0,1]
   */
  clampNormalized(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
  }

  /**
   * Clamp pixel coordinates to canvas bounds
   */
  clampPixel(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.max(0, Math.min(this.canvasWidth, x)),
      y: Math.max(0, Math.min(this.canvasHeight, y)),
    };
  }

  /**
   * Validate that coordinates are within normalized range
   */
  validateNormalizedCoordinates(x: number, y: number): boolean {
    return x >= 0 && x <= 1 && y >= 0 && y <= 1;
  }

  /**
   * Validate that coordinates are within pixel bounds
   */
  validatePixelCoordinates(x: number, y: number): boolean {
    return x >= 0 && x <= this.canvasWidth && y >= 0 && y <= this.canvasHeight;
  }

  // Private helper methods

  private isStandardRegion(regionName: string): regionName is RegionName {
    return regionName in REGION_BOUNDS;
  }

  private validateRegionBounds(bounds: RegionBounds): boolean {
    return (
      bounds.x >= 0 &&
      bounds.x <= 1 &&
      bounds.y >= 0 &&
      bounds.y <= 1 &&
      bounds.width > 0 &&
      bounds.width <= 1 &&
      bounds.height > 0 &&
      bounds.height <= 1 &&
      bounds.x + bounds.width <= 1 &&
      bounds.y + bounds.height <= 1
    );
  }

  private pointInRegion(x: number, y: number, bounds: RegionBounds): boolean {
    return (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    );
  }
}
