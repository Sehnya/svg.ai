/**
 * AspectRatioManager - Manages fixed canvas dimensions and aspect ratios for consistent SVG generation
 */

export type AspectRatio = "1:1" | "4:3" | "16:9" | "3:2" | "2:3" | "9:16";

export interface AspectRatioConfig {
  ratio: number;
  name: string;
  width: number;
  height: number;
  viewBox: string;
  commonSizes: { width: number; height: number }[];
}

export interface CanvasDimensions {
  width: number;
  height: number;
  viewBox: string;
  aspectRatio: AspectRatio;
}

/**
 * Manages aspect ratios with fixed 512x512 base canvas for consistent coordinate system
 */
export class AspectRatioManager {
  private static readonly BASE_SIZE = 512;

  private static readonly configs: Map<AspectRatio, AspectRatioConfig> =
    new Map([
      [
        "1:1",
        {
          ratio: 1.0,
          name: "Square",
          width: 512,
          height: 512,
          viewBox: "0 0 512 512",
          commonSizes: [
            { width: 256, height: 256 },
            { width: 512, height: 512 },
            { width: 1024, height: 1024 },
          ],
        },
      ],
      [
        "4:3",
        {
          ratio: 4 / 3,
          name: "Traditional",
          width: 512,
          height: 384,
          viewBox: "0 0 512 384",
          commonSizes: [
            { width: 320, height: 240 },
            { width: 640, height: 480 },
            { width: 1024, height: 768 },
          ],
        },
      ],
      [
        "16:9",
        {
          ratio: 16 / 9,
          name: "Widescreen",
          width: 512,
          height: 288,
          viewBox: "0 0 512 288",
          commonSizes: [
            { width: 320, height: 180 },
            { width: 640, height: 360 },
            { width: 1280, height: 720 },
          ],
        },
      ],
      [
        "3:2",
        {
          ratio: 3 / 2,
          name: "Photo",
          width: 512,
          height: 341,
          viewBox: "0 0 512 341",
          commonSizes: [
            { width: 300, height: 200 },
            { width: 600, height: 400 },
            { width: 1200, height: 800 },
          ],
        },
      ],
      [
        "2:3",
        {
          ratio: 2 / 3,
          name: "Portrait",
          width: 341,
          height: 512,
          viewBox: "0 0 341 512",
          commonSizes: [
            { width: 200, height: 300 },
            { width: 400, height: 600 },
            { width: 800, height: 1200 },
          ],
        },
      ],
      [
        "9:16",
        {
          ratio: 9 / 16,
          name: "Mobile Portrait",
          width: 288,
          height: 512,
          viewBox: "0 0 288 512",
          commonSizes: [
            { width: 180, height: 320 },
            { width: 360, height: 640 },
            { width: 720, height: 1280 },
          ],
        },
      ],
    ]);

  /**
   * Get configuration for a specific aspect ratio
   */
  static getConfig(ratio: AspectRatio): AspectRatioConfig {
    const config = this.configs.get(ratio);
    if (!config) {
      throw new Error(`Unsupported aspect ratio: ${ratio}`);
    }
    return { ...config }; // Return copy to prevent mutation
  }

  /**
   * Calculate canvas dimensions for a given aspect ratio and target width
   */
  static calculateDimensions(
    ratio: AspectRatio,
    targetWidth: number
  ): CanvasDimensions {
    const config = this.getConfig(ratio);
    const height = Math.round(targetWidth / config.ratio);

    return {
      width: targetWidth,
      height,
      viewBox: `0 0 ${config.width} ${config.height}`,
      aspectRatio: ratio,
    };
  }

  /**
   * Calculate canvas dimensions for a given aspect ratio and target height
   */
  static calculateDimensionsByHeight(
    ratio: AspectRatio,
    targetHeight: number
  ): CanvasDimensions {
    const config = this.getConfig(ratio);
    const width = Math.round(targetHeight * config.ratio);

    return {
      width,
      height: targetHeight,
      viewBox: `0 0 ${config.width} ${config.height}`,
      aspectRatio: ratio,
    };
  }

  /**
   * Get the fixed canvas dimensions for layout calculations (always uses base config)
   */
  static getCanvasDimensions(ratio: AspectRatio): CanvasDimensions {
    const config = this.getConfig(ratio);

    return {
      width: config.width,
      height: config.height,
      viewBox: config.viewBox,
      aspectRatio: ratio,
    };
  }

  /**
   * Generate viewBox string for given dimensions
   */
  static getViewBox(
    ratio: AspectRatio,
    width?: number,
    height?: number
  ): string {
    const config = this.getConfig(ratio);

    if (width && height) {
      // Custom dimensions - maintain aspect ratio
      const targetRatio = width / height;
      if (Math.abs(targetRatio - config.ratio) > 0.01) {
        console.warn(
          `Dimension ratio ${targetRatio.toFixed(2)} doesn't match aspect ratio ${config.ratio.toFixed(2)}`
        );
      }
    }

    return config.viewBox;
  }

  /**
   * Validate if a string is a valid aspect ratio
   */
  static isValidRatio(ratio: string): ratio is AspectRatio {
    return this.configs.has(ratio as AspectRatio);
  }

  /**
   * Get all supported aspect ratios
   */
  static getSupportedRatios(): AspectRatio[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Get the closest standard aspect ratio for given dimensions
   */
  static getClosestRatio(width: number, height: number): AspectRatio {
    const targetRatio = width / height;
    let closestRatio: AspectRatio = "1:1";
    let minDifference = Infinity;

    for (const [ratio, config] of this.configs) {
      const difference = Math.abs(config.ratio - targetRatio);
      if (difference < minDifference) {
        minDifference = difference;
        closestRatio = ratio;
      }
    }

    return closestRatio;
  }

  /**
   * Normalize coordinates from any canvas size to the fixed coordinate system
   */
  static normalizeCoordinates(
    x: number,
    y: number,
    fromWidth: number,
    fromHeight: number,
    toRatio: AspectRatio
  ): { x: number; y: number } {
    const config = this.getConfig(toRatio);

    return {
      x: (x / fromWidth) * config.width,
      y: (y / fromHeight) * config.height,
    };
  }

  /**
   * Scale coordinates from fixed coordinate system to target dimensions
   */
  static scaleCoordinates(
    x: number,
    y: number,
    fromRatio: AspectRatio,
    toWidth: number,
    toHeight: number
  ): { x: number; y: number } {
    const config = this.getConfig(fromRatio);

    return {
      x: (x / config.width) * toWidth,
      y: (y / config.height) * toHeight,
    };
  }

  /**
   * Clamp coordinates to canvas bounds
   */
  static clampCoordinates(
    x: number,
    y: number,
    ratio: AspectRatio
  ): { x: number; y: number } {
    const config = this.getConfig(ratio);

    return {
      x: Math.max(0, Math.min(config.width, x)),
      y: Math.max(0, Math.min(config.height, y)),
    };
  }

  /**
   * Validate that coordinates are within canvas bounds
   */
  static validateCoordinates(
    x: number,
    y: number,
    ratio: AspectRatio
  ): boolean {
    const config = this.getConfig(ratio);
    return x >= 0 && x <= config.width && y >= 0 && y <= config.height;
  }

  /**
   * Get default aspect ratio (1:1 square)
   */
  static getDefaultRatio(): AspectRatio {
    return "1:1";
  }

  /**
   * Create a canvas configuration for SVG generation
   */
  static createCanvasConfig(
    ratio: AspectRatio,
    backgroundColor: string = "#ffffff"
  ) {
    const config = this.getConfig(ratio);

    return {
      version: "path-1.0",
      canvas: {
        width: config.width,
        height: config.height,
        viewBox: config.viewBox,
        background: backgroundColor,
        aspectRatio: ratio,
      },
    };
  }
}
