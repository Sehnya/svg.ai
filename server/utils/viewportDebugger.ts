/**
 * ViewportDebugger - Utility to help debug and fix SVG viewport issues
 */

import { PathCommand } from "../types/unified-layered";

export interface ViewportIssue {
  type: "clipping" | "overflow" | "empty" | "aspect_mismatch";
  severity: "low" | "medium" | "high";
  description: string;
  suggestion: string;
}

export interface ViewportAnalysis {
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  viewBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  issues: ViewportIssue[];
  suggestedViewBox: string;
  suggestedPadding: number;
}

export class ViewportDebugger {
  /**
   * Analyze SVG viewport issues
   */
  static analyzeViewport(
    commands: PathCommand[],
    currentViewBox: string,
    canvasWidth: number,
    canvasHeight: number
  ): ViewportAnalysis {
    const bounds = this.calculateBounds(commands);
    const viewBox = this.parseViewBox(currentViewBox);
    const issues: ViewportIssue[] = [];

    // Check for clipping issues
    if (bounds.minX < viewBox.x || bounds.maxX > viewBox.x + viewBox.width) {
      issues.push({
        type: "clipping",
        severity: "high",
        description: "Shape extends beyond viewBox horizontally",
        suggestion: "Increase viewBox width or adjust shape positioning",
      });
    }

    if (bounds.minY < viewBox.y || bounds.maxY > viewBox.y + viewBox.height) {
      issues.push({
        type: "clipping",
        severity: "high",
        description: "Shape extends beyond viewBox vertically",
        suggestion: "Increase viewBox height or adjust shape positioning",
      });
    }

    // Check for empty content
    if (bounds.width === 0 || bounds.height === 0) {
      issues.push({
        type: "empty",
        severity: "high",
        description: "No visible content in SVG",
        suggestion: "Check path commands for valid coordinates",
      });
    }

    // Check for aspect ratio mismatch
    const boundsAspect = bounds.width / bounds.height;
    const viewBoxAspect = viewBox.width / viewBox.height;
    const canvasAspect = canvasWidth / canvasHeight;

    if (Math.abs(boundsAspect - canvasAspect) > 0.1) {
      issues.push({
        type: "aspect_mismatch",
        severity: "medium",
        description: "Content aspect ratio doesn't match canvas",
        suggestion: "Consider adjusting content proportions or canvas size",
      });
    }

    // Generate suggested viewBox with padding
    const padding = Math.max(bounds.width, bounds.height) * 0.1;
    const suggestedViewBox = `${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`;

    return {
      bounds,
      viewBox,
      issues,
      suggestedViewBox,
      suggestedPadding: padding,
    };
  }

  /**
   * Calculate bounding box of path commands
   */
  private static calculateBounds(commands: PathCommand[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const command of commands) {
      if (command.cmd !== "Z") {
        for (let i = 0; i < command.coords.length; i += 2) {
          const x = command.coords[i];
          const y = command.coords[i + 1];

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Handle empty case
    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Parse viewBox string
   */
  private static parseViewBox(viewBoxStr: string): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const parts = viewBoxStr.split(/\s+/).map(Number);
    return {
      x: parts[0] || 0,
      y: parts[1] || 0,
      width: parts[2] || 0,
      height: parts[3] || 0,
    };
  }

  /**
   * Generate a heart shape for testing viewport issues
   */
  static generateTestHeart(
    centerX: number = 256,
    centerY: number = 256,
    size: number = 100
  ): PathCommand[] {
    const scale = size / 100;

    return [
      {
        cmd: "M",
        coords: [centerX, centerY + 20 * scale],
      },
      {
        cmd: "C",
        coords: [
          centerX,
          centerY - 10 * scale,
          centerX - 40 * scale,
          centerY - 40 * scale,
          centerX - 40 * scale,
          centerY - 10 * scale,
        ],
      },
      {
        cmd: "C",
        coords: [
          centerX - 40 * scale,
          centerY + 10 * scale,
          centerX - 20 * scale,
          centerY + 20 * scale,
          centerX,
          centerY + 40 * scale,
        ],
      },
      {
        cmd: "C",
        coords: [
          centerX + 20 * scale,
          centerY + 20 * scale,
          centerX + 40 * scale,
          centerY + 10 * scale,
          centerX + 40 * scale,
          centerY - 10 * scale,
        ],
      },
      {
        cmd: "C",
        coords: [
          centerX + 40 * scale,
          centerY - 40 * scale,
          centerX,
          centerY - 10 * scale,
          centerX,
          centerY + 20 * scale,
        ],
      },
      {
        cmd: "Z",
        coords: [],
      },
    ];
  }

  /**
   * Fix viewport issues automatically
   */
  static fixViewportIssues(
    commands: PathCommand[],
    canvasWidth: number,
    canvasHeight: number,
    paddingPercent: number = 0.1
  ): {
    fixedCommands: PathCommand[];
    newViewBox: string;
    transformApplied: string;
  } {
    const bounds = this.calculateBounds(commands);

    if (bounds.width === 0 || bounds.height === 0) {
      return {
        fixedCommands: commands,
        newViewBox: `0 0 ${canvasWidth} ${canvasHeight}`,
        transformApplied: "none - empty content",
      };
    }

    // Calculate padding
    const padding = Math.max(bounds.width, bounds.height) * paddingPercent;

    // Calculate new viewBox that contains everything with padding
    const newViewBoxX = bounds.minX - padding;
    const newViewBoxY = bounds.minY - padding;
    const newViewBoxWidth = bounds.width + padding * 2;
    const newViewBoxHeight = bounds.height + padding * 2;

    const newViewBox = `${newViewBoxX} ${newViewBoxY} ${newViewBoxWidth} ${newViewBoxHeight}`;

    // Check if we need to scale to fit canvas aspect ratio
    const contentAspect = newViewBoxWidth / newViewBoxHeight;
    const canvasAspect = canvasWidth / canvasHeight;

    let transformApplied = "viewBox adjusted with padding";
    let fixedCommands = commands;

    // If aspect ratios are very different, we might want to scale content
    if (Math.abs(contentAspect - canvasAspect) > 0.5) {
      const scale = Math.min(
        (canvasWidth * 0.8) / bounds.width,
        (canvasHeight * 0.8) / bounds.height
      );

      if (scale < 1) {
        // Scale down the content
        fixedCommands = this.scaleCommands(commands, scale, bounds);
        transformApplied = `scaled by ${scale.toFixed(2)} and viewBox adjusted`;

        // Recalculate bounds after scaling
        const scaledBounds = this.calculateBounds(fixedCommands);
        const scaledPadding =
          Math.max(scaledBounds.width, scaledBounds.height) * paddingPercent;

        return {
          fixedCommands,
          newViewBox: `${scaledBounds.minX - scaledPadding} ${scaledBounds.minY - scaledPadding} ${scaledBounds.width + scaledPadding * 2} ${scaledBounds.height + scaledPadding * 2}`,
          transformApplied,
        };
      }
    }

    return {
      fixedCommands,
      newViewBox,
      transformApplied,
    };
  }

  /**
   * Scale path commands by a factor
   */
  private static scaleCommands(
    commands: PathCommand[],
    scale: number,
    originalBounds: {
      minX: number;
      minY: number;
      width: number;
      height: number;
    }
  ): PathCommand[] {
    const centerX = originalBounds.minX + originalBounds.width / 2;
    const centerY = originalBounds.minY + originalBounds.height / 2;

    return commands.map((command) => {
      if (command.cmd === "Z") {
        return { cmd: "Z", coords: [] };
      }

      const scaledCoords = [];
      for (let i = 0; i < command.coords.length; i += 2) {
        const x = command.coords[i];
        const y = command.coords[i + 1];

        // Scale around center point
        const scaledX = centerX + (x - centerX) * scale;
        const scaledY = centerY + (y - centerY) * scale;

        scaledCoords.push(scaledX, scaledY);
      }

      return {
        cmd: command.cmd,
        coords: scaledCoords,
      };
    });
  }

  /**
   * Generate debug SVG with viewport visualization
   */
  static generateDebugSVG(
    commands: PathCommand[],
    viewBox: string,
    canvasWidth: number,
    canvasHeight: number
  ): string {
    const analysis = this.analyzeViewport(
      commands,
      viewBox,
      canvasWidth,
      canvasHeight
    );
    const pathData = this.commandsToPathData(commands);

    const parts = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${canvasWidth}" height="${canvasHeight}">`,
      `  <!-- Original content -->`,
      `  <path d="${pathData}" fill="red" stroke="darkred" stroke-width="2" opacity="0.7"/>`,
      `  <!-- Bounding box visualization -->`,
      `  <rect x="${analysis.bounds.minX}" y="${analysis.bounds.minY}" width="${analysis.bounds.width}" height="${analysis.bounds.height}" fill="none" stroke="blue" stroke-width="1" stroke-dasharray="5,5"/>`,
      `  <!-- ViewBox visualization -->`,
      `  <rect x="${analysis.viewBox.x}" y="${analysis.viewBox.y}" width="${analysis.viewBox.width}" height="${analysis.viewBox.height}" fill="none" stroke="green" stroke-width="2" stroke-dasharray="10,5"/>`,
      `  <!-- Center markers -->`,
      `  <circle cx="${analysis.bounds.minX + analysis.bounds.width / 2}" cy="${analysis.bounds.minY + analysis.bounds.height / 2}" r="3" fill="blue"/>`,
      `  <circle cx="${analysis.viewBox.x + analysis.viewBox.width / 2}" cy="${analysis.viewBox.y + analysis.viewBox.height / 2}" r="3" fill="green"/>`,
      `</svg>`,
    ];

    return parts.join("\n");
  }

  /**
   * Convert path commands to SVG path data string
   */
  private static commandsToPathData(commands: PathCommand[]): string {
    return commands
      .map((cmd) => {
        if (cmd.cmd === "Z") {
          return "Z";
        }
        return `${cmd.cmd} ${cmd.coords.join(" ")}`;
      })
      .join(" ");
  }
}
