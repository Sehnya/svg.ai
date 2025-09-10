/**
 * PathCommandGenerator - Generates precise geometry using M, L, C, Q, Z commands
 * Integrates with layout language for region-aware path generation
 */

import {
  PathCommand,
  RegionName,
  AnchorPoint,
  LayoutSpecification,
} from "../types/unified-layered";
import { RegionManager } from "./RegionManager";
import { CoordinateMapper } from "./CoordinateMapper";

export interface GeometryOptions {
  smoothness?: number; // 0-1, higher = smoother curves
  precision?: number; // Decimal places for coordinates
  closed?: boolean; // Whether to add Z command
}

export interface ShapeOptions extends GeometryOptions {
  width?: number;
  height?: number;
  radius?: number;
  sides?: number; // For polygons
  startAngle?: number; // In degrees
  endAngle?: number; // In degrees
}

export interface CurveOptions extends GeometryOptions {
  controlPointOffset?: number; // 0-1, how far control points are from endpoints
  tension?: number; // 0-1, curve tension
}

export interface PathGenerationContext {
  regionManager: RegionManager;
  coordinateMapper: CoordinateMapper;
  canvasWidth: number;
  canvasHeight: number;
}

export class PathCommandGenerator {
  private context: PathGenerationContext;
  private defaultOptions: Required<GeometryOptions>;

  constructor(context: PathGenerationContext) {
    this.context = context;
    this.defaultOptions = {
      smoothness: 0.5,
      precision: 2,
      closed: true,
    };
  }

  /**
   * Generate a rectangle using line commands
   */
  generateRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    options: GeometryOptions = {}
  ): PathCommand[] {
    const opts = { ...this.defaultOptions, ...options };

    const commands: PathCommand[] = [
      { cmd: "M", coords: this.roundCoords([x, y], opts.precision) },
      { cmd: "L", coords: this.roundCoords([x + width, y], opts.precision) },
      {
        cmd: "L",
        coords: this.roundCoords([x + width, y + height], opts.precision),
      },
      { cmd: "L", coords: this.roundCoords([x, y + height], opts.precision) },
    ];

    if (opts.closed) {
      commands.push({ cmd: "Z", coords: [] });
    }

    return commands;
  }

  /**
   * Generate a circle using cubic Bezier curves
   */
  generateCircle(
    centerX: number,
    centerY: number,
    radius: number,
    options: GeometryOptions = {}
  ): PathCommand[] {
    const opts = { ...this.defaultOptions, ...options };

    // Magic number for cubic Bezier approximation of circle
    const kappa = 0.5522847498307936;
    const controlOffset = radius * kappa;

    const commands: PathCommand[] = [
      // Start at top
      {
        cmd: "M",
        coords: this.roundCoords([centerX, centerY - radius], opts.precision),
      },

      // Top-right quadrant
      {
        cmd: "C",
        coords: this.roundCoords(
          [
            centerX + controlOffset,
            centerY - radius,
            centerX + radius,
            centerY - controlOffset,
            centerX + radius,
            centerY,
          ],
          opts.precision
        ),
      },

      // Bottom-right quadrant
      {
        cmd: "C",
        coords: this.roundCoords(
          [
            centerX + radius,
            centerY + controlOffset,
            centerX + controlOffset,
            centerY + radius,
            centerX,
            centerY + radius,
          ],
          opts.precision
        ),
      },

      // Bottom-left quadrant
      {
        cmd: "C",
        coords: this.roundCoords(
          [
            centerX - controlOffset,
            centerY + radius,
            centerX - radius,
            centerY + controlOffset,
            centerX - radius,
            centerY,
          ],
          opts.precision
        ),
      },

      // Top-left quadrant
      {
        cmd: "C",
        coords: this.roundCoords(
          [
            centerX - radius,
            centerY - controlOffset,
            centerX - controlOffset,
            centerY - radius,
            centerX,
            centerY - radius,
          ],
          opts.precision
        ),
      },
    ];

    if (opts.closed) {
      commands.push({ cmd: "Z", coords: [] });
    }

    return commands;
  }

  /**
   * Generate an ellipse using cubic Bezier curves
   */
  generateEllipse(
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    options: GeometryOptions = {}
  ): PathCommand[] {
    const opts = { ...this.defaultOptions, ...options };

    const kappa = 0.5522847498307936;
    const controlOffsetX = radiusX * kappa;
    const controlOffsetY = radiusY * kappa;

    const commands: PathCommand[] = [
      // Start at top
      {
        cmd: "M",
        coords: this.roundCoords([centerX, centerY - radiusY], opts.precision),
      },

      // Top-right quadrant
      {
        cmd: "C",
        coords: this.roundCoords(
          [
            centerX + controlOffsetX,
            centerY - radiusY,
            centerX + radiusX,
            centerY - controlOffsetY,
            centerX + radiusX,
            centerY,
          ],
          opts.precision
        ),
      },

      // Bottom-right quadrant
      {
        cmd: "C",
        coords: this.roundCoords(
          [
            centerX + radiusX,
            centerY + controlOffsetY,
            centerX + controlOffsetX,
            centerY + radiusY,
            centerX,
            centerY + radiusY,
          ],
          opts.precision
        ),
      },

      // Bottom-left quadrant
      {
        cmd: "C",
        coords: this.roundCoords(
          [
            centerX - controlOffsetX,
            centerY + radiusY,
            centerX - radiusX,
            centerY + controlOffsetY,
            centerX - radiusX,
            centerY,
          ],
          opts.precision
        ),
      },

      // Top-left quadrant
      {
        cmd: "C",
        coords: this.roundCoords(
          [
            centerX - radiusX,
            centerY - controlOffsetY,
            centerX - controlOffsetX,
            centerY - radiusY,
            centerX,
            centerY - radiusY,
          ],
          opts.precision
        ),
      },
    ];

    if (opts.closed) {
      commands.push({ cmd: "Z", coords: [] });
    }

    return commands;
  }

  /**
   * Generate a regular polygon using line commands
   */
  generatePolygon(
    centerX: number,
    centerY: number,
    radius: number,
    sides: number,
    options: ShapeOptions = {}
  ): PathCommand[] {
    const opts = { ...this.defaultOptions, ...options };

    if (sides < 3) {
      throw new Error("Polygon must have at least 3 sides");
    }

    const angleStep = (2 * Math.PI) / sides;
    const startAngle = ((options.startAngle || 0) * Math.PI) / 180;

    const commands: PathCommand[] = [];

    // Calculate first point
    const firstX = centerX + radius * Math.cos(startAngle);
    const firstY = centerY + radius * Math.sin(startAngle);
    commands.push({
      cmd: "M",
      coords: this.roundCoords([firstX, firstY], opts.precision),
    });

    // Add remaining points
    for (let i = 1; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      commands.push({
        cmd: "L",
        coords: this.roundCoords([x, y], opts.precision),
      });
    }

    if (opts.closed) {
      commands.push({ cmd: "Z", coords: [] });
    }

    return commands;
  }

  /**
   * Generate a star shape using line commands
   */
  generateStar(
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
    points: number,
    options: ShapeOptions = {}
  ): PathCommand[] {
    const opts = { ...this.defaultOptions, ...options };

    if (points < 3) {
      throw new Error("Star must have at least 3 points");
    }

    const angleStep = Math.PI / points;
    const startAngle = ((options.startAngle || -90) * Math.PI) / 180;

    const commands: PathCommand[] = [];

    // Calculate first outer point
    const firstX = centerX + outerRadius * Math.cos(startAngle);
    const firstY = centerY + outerRadius * Math.sin(startAngle);
    commands.push({
      cmd: "M",
      coords: this.roundCoords([firstX, firstY], opts.precision),
    });

    // Alternate between outer and inner points
    for (let i = 1; i < points * 2; i++) {
      const angle = startAngle + i * angleStep;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      commands.push({
        cmd: "L",
        coords: this.roundCoords([x, y], opts.precision),
      });
    }

    if (opts.closed) {
      commands.push({ cmd: "Z", coords: [] });
    }

    return commands;
  }

  /**
   * Generate a smooth curve through points using cubic Bezier
   */
  generateSmoothCurve(
    points: [number, number][],
    options: CurveOptions = {}
  ): PathCommand[] {
    const opts = { ...this.defaultOptions, ...options };

    if (points.length < 2) {
      throw new Error("Curve must have at least 2 points");
    }

    const commands: PathCommand[] = [];
    const tension = options.tension || 0.3;

    // Start at first point
    commands.push({
      cmd: "M",
      coords: this.roundCoords(points[0], opts.precision),
    });

    if (points.length === 2) {
      // Simple line for 2 points
      commands.push({
        cmd: "L",
        coords: this.roundCoords(points[1], opts.precision),
      });
    } else {
      // Generate smooth curve through all points
      for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const prev = i > 0 ? points[i - 1] : current;
        const afterNext = i < points.length - 2 ? points[i + 2] : next;

        // Calculate control points
        const cp1 = this.calculateControlPoint(
          prev,
          current,
          next,
          tension,
          false
        );
        const cp2 = this.calculateControlPoint(
          current,
          next,
          afterNext,
          tension,
          true
        );

        commands.push({
          cmd: "C",
          coords: this.roundCoords(
            [cp1[0], cp1[1], cp2[0], cp2[1], next[0], next[1]],
            opts.precision
          ),
        });
      }
    }

    if (opts.closed && points.length > 2) {
      commands.push({ cmd: "Z", coords: [] });
    }

    return commands;
  }

  /**
   * Generate a quadratic Bezier curve
   */
  generateQuadraticCurve(
    startX: number,
    startY: number,
    controlX: number,
    controlY: number,
    endX: number,
    endY: number,
    options: GeometryOptions = {}
  ): PathCommand[] {
    const opts = { ...this.defaultOptions, ...options };

    return [
      { cmd: "M", coords: this.roundCoords([startX, startY], opts.precision) },
      {
        cmd: "Q",
        coords: this.roundCoords(
          [controlX, controlY, endX, endY],
          opts.precision
        ),
      },
    ];
  }

  /**
   * Generate an arc using cubic Bezier approximation
   */
  generateArc(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    options: ShapeOptions = {}
  ): PathCommand[] {
    const opts = { ...this.defaultOptions, ...options };

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    let totalAngle = endRad - startRad;

    // Normalize angle
    if (totalAngle < 0) {
      totalAngle += 2 * Math.PI;
    }

    // Break large arcs into smaller segments
    const maxSegmentAngle = Math.PI / 2; // 90 degrees
    const numSegments = Math.ceil(totalAngle / maxSegmentAngle);
    const segmentAngle = totalAngle / numSegments;

    const commands: PathCommand[] = [];

    // Start point
    const startX = centerX + radius * Math.cos(startRad);
    const startY = centerY + radius * Math.sin(startRad);
    commands.push({
      cmd: "M",
      coords: this.roundCoords([startX, startY], opts.precision),
    });

    // Generate segments
    for (let i = 0; i < numSegments; i++) {
      const segmentStart = startRad + i * segmentAngle;
      const segmentEnd = startRad + (i + 1) * segmentAngle;

      const arcCommands = this.generateArcSegment(
        centerX,
        centerY,
        radius,
        segmentStart,
        segmentEnd,
        opts.precision
      );

      commands.push(...arcCommands);
    }

    return commands;
  }

  /**
   * Generate path commands with layout language positioning
   */
  generateWithLayout(
    shapeGenerator: () => PathCommand[],
    layout: LayoutSpecification
  ): PathCommand[] {
    // Generate base shape
    const baseCommands = shapeGenerator();

    // Apply layout transformations
    return this.context.coordinateMapper.transformPathCommands(
      baseCommands,
      layout
    );
  }

  /**
   * Generate a shape positioned in a specific region
   */
  generateInRegion(
    shapeGenerator: (centerX: number, centerY: number) => PathCommand[],
    region: RegionName | string,
    anchor: AnchorPoint = "center",
    offset: [number, number] = [0, 0]
  ): PathCommand[] {
    // Calculate position in region
    const position = this.context.coordinateMapper.calculatePosition({
      region,
      anchor,
      offset,
    });

    // Generate shape at calculated position
    return shapeGenerator(position.x, position.y);
  }

  /**
   * Calculate control point for smooth curves
   */
  private calculateControlPoint(
    prev: [number, number],
    current: [number, number],
    next: [number, number],
    tension: number,
    reverse: boolean
  ): [number, number] {
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];

    const factor = reverse ? -tension : tension;

    return [current[0] + factor * dx, current[1] + factor * dy];
  }

  /**
   * Generate a single arc segment using cubic Bezier
   */
  private generateArcSegment(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    precision: number
  ): PathCommand[] {
    const angle = endAngle - startAngle;
    const alpha =
      (Math.sin(angle) * (Math.sqrt(4 + 3 * Math.tan(angle / 2) ** 2) - 1)) / 3;

    const cos1 = Math.cos(startAngle);
    const sin1 = Math.sin(startAngle);
    const cos2 = Math.cos(endAngle);
    const sin2 = Math.sin(endAngle);

    const cp1x = centerX + radius * (cos1 - alpha * sin1);
    const cp1y = centerY + radius * (sin1 + alpha * cos1);
    const cp2x = centerX + radius * (cos2 + alpha * sin2);
    const cp2y = centerY + radius * (sin2 - alpha * cos2);
    const endX = centerX + radius * cos2;
    const endY = centerY + radius * sin2;

    return [
      {
        cmd: "C",
        coords: this.roundCoords(
          [cp1x, cp1y, cp2x, cp2y, endX, endY],
          precision
        ),
      },
    ];
  }

  /**
   * Round coordinates to specified precision
   */
  private roundCoords(coords: number[], precision: number): number[] {
    return coords.map(
      (coord) =>
        Math.round(coord * Math.pow(10, precision)) / Math.pow(10, precision)
    );
  }

  /**
   * Validate that coordinates are within canvas bounds
   */
  validateCoordinates(commands: PathCommand[]): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      if (cmd.cmd === "Z") continue;

      for (let j = 0; j < cmd.coords.length; j += 2) {
        const x = cmd.coords[j];
        const y = cmd.coords[j + 1];

        if (x < 0 || x > this.context.canvasWidth) {
          violations.push(
            `Command ${i}: X coordinate ${x} outside canvas bounds [0, ${this.context.canvasWidth}]`
          );
        }
        if (y < 0 || y > this.context.canvasHeight) {
          violations.push(
            `Command ${i}: Y coordinate ${y} outside canvas bounds [0, ${this.context.canvasHeight}]`
          );
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Clamp coordinates to canvas bounds
   */
  clampToCanvas(commands: PathCommand[]): PathCommand[] {
    return commands.map((cmd) => {
      if (cmd.cmd === "Z") return cmd;

      const clampedCoords = cmd.coords.map((coord, index) => {
        const isX = index % 2 === 0;
        const max = isX ? this.context.canvasWidth : this.context.canvasHeight;
        return Math.max(0, Math.min(max, coord));
      });

      return { ...cmd, coords: clampedCoords };
    });
  }

  /**
   * Update the generation context
   */
  updateContext(context: PathGenerationContext): void {
    this.context = context;
  }
}
