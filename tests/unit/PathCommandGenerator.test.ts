/**
 * Unit tests for PathCommandGenerator
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  PathCommandGenerator,
  PathGenerationContext,
} from "../../server/services/PathCommandGenerator";
import { RegionManager } from "../../server/services/RegionManager";
import { CoordinateMapper } from "../../server/services/CoordinateMapper";
import { PathCommand } from "../../server/types/unified-layered";

describe("PathCommandGenerator", () => {
  let generator: PathCommandGenerator;
  let context: PathGenerationContext;

  beforeEach(() => {
    const regionManager = new RegionManager("1:1");
    const coordinateMapper = new CoordinateMapper(512, 512, regionManager);

    context = {
      regionManager,
      coordinateMapper,
      canvasWidth: 512,
      canvasHeight: 512,
    };

    generator = new PathCommandGenerator(context);
  });

  describe("generateRectangle", () => {
    it("should generate rectangle with correct coordinates", () => {
      const commands = generator.generateRectangle(100, 100, 200, 150);

      expect(commands).toHaveLength(5); // M, L, L, L, Z
      expect(commands[0]).toEqual({ cmd: "M", coords: [100, 100] });
      expect(commands[1]).toEqual({ cmd: "L", coords: [300, 100] });
      expect(commands[2]).toEqual({ cmd: "L", coords: [300, 250] });
      expect(commands[3]).toEqual({ cmd: "L", coords: [100, 250] });
      expect(commands[4]).toEqual({ cmd: "Z", coords: [] });
    });

    it("should generate open rectangle when closed=false", () => {
      const commands = generator.generateRectangle(0, 0, 100, 100, {
        closed: false,
      });

      expect(commands).toHaveLength(4); // M, L, L, L (no Z)
      expect(commands[3].cmd).toBe("L");
    });

    it("should round coordinates to specified precision", () => {
      const commands = generator.generateRectangle(
        100.123,
        100.456,
        200.789,
        150.321,
        { precision: 1 }
      );

      expect(commands[0].coords).toEqual([100.1, 100.5]);
      expect(commands[1].coords).toEqual([300.9, 100.5]);
    });
  });

  describe("generateCircle", () => {
    it("should generate circle with cubic Bezier curves", () => {
      const commands = generator.generateCircle(256, 256, 100);

      expect(commands).toHaveLength(6); // M + 4 C commands + Z
      expect(commands[0].cmd).toBe("M");
      expect(commands[1].cmd).toBe("C");
      expect(commands[2].cmd).toBe("C");
      expect(commands[3].cmd).toBe("C");
      expect(commands[4].cmd).toBe("C");
      expect(commands[5]).toEqual({ cmd: "Z", coords: [] });
    });

    it("should start at top of circle", () => {
      const commands = generator.generateCircle(256, 256, 100);

      expect(commands[0].coords).toEqual([256, 156]); // Top point
    });

    it("should use correct control points for smooth circle", () => {
      const commands = generator.generateCircle(0, 0, 100);

      // First curve should go from top to right
      const firstCurve = commands[1];
      expect(firstCurve.coords).toHaveLength(6); // 3 points (6 coordinates)

      // Control points should create smooth curve
      expect(firstCurve.coords[4]).toBeCloseTo(100, 1); // End X should be radius
      expect(firstCurve.coords[5]).toBeCloseTo(0, 1); // End Y should be center
    });
  });

  describe("generateEllipse", () => {
    it("should generate ellipse with different radii", () => {
      const commands = generator.generateEllipse(256, 256, 150, 100);

      expect(commands).toHaveLength(6); // M + 4 C commands + Z
      expect(commands[0].coords).toEqual([256, 156]); // Top point (centerY - radiusY)
    });

    it("should handle horizontal ellipse", () => {
      const commands = generator.generateEllipse(0, 0, 200, 100);

      // First curve should end at right side
      const firstCurve = commands[1];
      expect(firstCurve.coords[4]).toBeCloseTo(200, 1); // radiusX
      expect(firstCurve.coords[5]).toBeCloseTo(0, 1); // centerY
    });
  });

  describe("generatePolygon", () => {
    it("should generate triangle", () => {
      const commands = generator.generatePolygon(256, 256, 100, 3);

      expect(commands).toHaveLength(4); // M + 2 L + Z
      expect(commands[0].cmd).toBe("M");
      expect(commands[1].cmd).toBe("L");
      expect(commands[2].cmd).toBe("L");
      expect(commands[3]).toEqual({ cmd: "Z", coords: [] });
    });

    it("should generate square", () => {
      const commands = generator.generatePolygon(0, 0, 100, 4, {
        startAngle: 45,
      });

      expect(commands).toHaveLength(5); // M + 3 L + Z
    });

    it("should generate hexagon", () => {
      const commands = generator.generatePolygon(256, 256, 100, 6);

      expect(commands).toHaveLength(7); // M + 5 L + Z
    });

    it("should throw error for invalid sides", () => {
      expect(() => {
        generator.generatePolygon(0, 0, 100, 2);
      }).toThrow("Polygon must have at least 3 sides");
    });

    it("should respect start angle", () => {
      const commands = generator.generatePolygon(0, 0, 100, 4, {
        startAngle: 0,
      });

      // First point should be at angle 0 (right side)
      expect(commands[0].coords[0]).toBeCloseTo(100, 1);
      expect(commands[0].coords[1]).toBeCloseTo(0, 1);
    });
  });

  describe("generateStar", () => {
    it("should generate 5-pointed star", () => {
      const commands = generator.generateStar(256, 256, 100, 50, 5);

      expect(commands).toHaveLength(11); // M + 9 L + Z (5 outer + 5 inner points)
    });

    it("should alternate between outer and inner radius", () => {
      const commands = generator.generateStar(0, 0, 100, 50, 3);

      // Should have 6 points total (3 outer + 3 inner)
      expect(commands).toHaveLength(7); // M + 5 L + Z
    });

    it("should throw error for invalid points", () => {
      expect(() => {
        generator.generateStar(0, 0, 100, 50, 2);
      }).toThrow("Star must have at least 3 points");
    });
  });

  describe("generateSmoothCurve", () => {
    it("should generate line for 2 points", () => {
      const points: [number, number][] = [
        [0, 0],
        [100, 100],
      ];
      const commands = generator.generateSmoothCurve(points);

      expect(commands).toHaveLength(2); // M + L
      expect(commands[0]).toEqual({ cmd: "M", coords: [0, 0] });
      expect(commands[1]).toEqual({ cmd: "L", coords: [100, 100] });
    });

    it("should generate smooth curve for multiple points", () => {
      const points: [number, number][] = [
        [0, 0],
        [100, 50],
        [200, 0],
        [300, 100],
      ];
      const commands = generator.generateSmoothCurve(points);

      expect(commands).toHaveLength(5); // M + 3 C + Z (closed by default)
      expect(commands[0].cmd).toBe("M");
      expect(commands[1].cmd).toBe("C");
      expect(commands[2].cmd).toBe("C");
      expect(commands[3].cmd).toBe("C");
    });

    it("should throw error for insufficient points", () => {
      expect(() => {
        generator.generateSmoothCurve([[0, 0]]);
      }).toThrow("Curve must have at least 2 points");
    });

    it("should close curve when requested", () => {
      const points: [number, number][] = [
        [0, 0],
        [100, 0],
        [50, 100],
      ];
      const commands = generator.generateSmoothCurve(points, { closed: true });

      expect(commands[commands.length - 1]).toEqual({ cmd: "Z", coords: [] });
    });
  });

  describe("generateQuadraticCurve", () => {
    it("should generate quadratic Bezier curve", () => {
      const commands = generator.generateQuadraticCurve(0, 0, 50, 100, 100, 0);

      expect(commands).toHaveLength(2); // M + Q
      expect(commands[0]).toEqual({ cmd: "M", coords: [0, 0] });
      expect(commands[1]).toEqual({ cmd: "Q", coords: [50, 100, 100, 0] });
    });
  });

  describe("generateArc", () => {
    it("should generate arc from 0 to 90 degrees", () => {
      const commands = generator.generateArc(256, 256, 100, 0, 90);

      expect(commands[0].cmd).toBe("M");
      expect(commands[1].cmd).toBe("C");

      // Start point should be at 0 degrees (right side)
      expect(commands[0].coords[0]).toBeCloseTo(356, 1); // 256 + 100
      expect(commands[0].coords[1]).toBeCloseTo(256, 1);
    });

    it("should break large arcs into segments", () => {
      const commands = generator.generateArc(0, 0, 100, 0, 180);

      expect(commands[0].cmd).toBe("M");
      // Should have multiple C commands for 180-degree arc
      const cCommands = commands.filter((cmd) => cmd.cmd === "C");
      expect(cCommands.length).toBeGreaterThan(1);
    });

    it("should handle negative angles", () => {
      const commands = generator.generateArc(0, 0, 100, 90, -90);

      expect(commands[0].cmd).toBe("M");
      // Should have multiple C commands for large angle difference
      const cCommands = commands.filter((cmd) => cmd.cmd === "C");
      expect(cCommands.length).toBeGreaterThan(0);
    });
  });

  describe("generateWithLayout", () => {
    it("should apply layout transformations to generated shape", () => {
      const shapeGenerator = () => generator.generateRectangle(0, 0, 100, 100);

      const commands = generator.generateWithLayout(shapeGenerator, {
        region: "center",
        anchor: "center",
        offset: [0.1, -0.1],
      });

      // Commands should be transformed by layout
      expect(commands).toHaveLength(5);
      expect(commands[0].cmd).toBe("M");

      // Coordinates should be different from original (0, 0)
      expect(commands[0].coords[0]).not.toBe(0);
      expect(commands[0].coords[1]).not.toBe(0);
    });
  });

  describe("generateInRegion", () => {
    it("should position shape in specified region", () => {
      const shapeGenerator = (centerX: number, centerY: number) =>
        generator.generateCircle(centerX, centerY, 50);

      const commands = generator.generateInRegion(shapeGenerator, "top_left");

      expect(commands[0].cmd).toBe("M");

      // Should be positioned in top-left region, not at origin
      const startX = commands[0].coords[0];
      const startY = commands[0].coords[1];

      expect(startX).toBeGreaterThan(0);
      expect(startX).toBeLessThan(256); // Should be in left half
      expect(startY).toBeGreaterThan(0);
      expect(startY).toBeLessThan(256); // Should be in top half
    });

    it("should apply anchor and offset", () => {
      const shapeGenerator = (centerX: number, centerY: number) =>
        generator.generateRectangle(centerX - 25, centerY - 25, 50, 50);

      const commands = generator.generateInRegion(
        shapeGenerator,
        "center",
        "top_left",
        [0.2, -0.1]
      );

      expect(commands).toHaveLength(5);
      expect(commands[0].cmd).toBe("M");
    });
  });

  describe("validateCoordinates", () => {
    it("should validate coordinates within canvas bounds", () => {
      const validCommands: PathCommand[] = [
        { cmd: "M", coords: [100, 100] },
        { cmd: "L", coords: [200, 200] },
        { cmd: "Z", coords: [] },
      ];

      const result = generator.validateCoordinates(validCommands);

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("should detect out-of-bounds coordinates", () => {
      const invalidCommands: PathCommand[] = [
        { cmd: "M", coords: [-10, 600] }, // Both out of bounds
        { cmd: "L", coords: [100, 100] }, // Valid
        { cmd: "C", coords: [1000, 50, 200, 200, 300, -50] }, // Multiple violations
      ];

      const result = generator.validateCoordinates(invalidCommands);

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]).toContain("outside canvas bounds");
    });

    it("should ignore Z commands", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [100, 100] },
        { cmd: "Z", coords: [] },
      ];

      const result = generator.validateCoordinates(commands);

      expect(result.valid).toBe(true);
    });
  });

  describe("clampToCanvas", () => {
    it("should clamp out-of-bounds coordinates", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [-50, 600] },
        { cmd: "L", coords: [1000, -100] },
        { cmd: "Z", coords: [] },
      ];

      const clamped = generator.clampToCanvas(commands);

      expect(clamped[0].coords).toEqual([0, 512]); // Clamped to bounds
      expect(clamped[1].coords).toEqual([512, 0]); // Clamped to bounds
      expect(clamped[2]).toEqual({ cmd: "Z", coords: [] }); // Unchanged
    });

    it("should preserve valid coordinates", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [100, 200] },
        { cmd: "L", coords: [300, 400] },
      ];

      const clamped = generator.clampToCanvas(commands);

      expect(clamped[0].coords).toEqual([100, 200]);
      expect(clamped[1].coords).toEqual([300, 400]);
    });
  });

  describe("precision and rounding", () => {
    it("should round coordinates to default precision", () => {
      const commands = generator.generateRectangle(
        100.123456,
        200.987654,
        50.555555,
        75.777777
      );

      // Default precision is 2
      expect(commands[0].coords).toEqual([100.12, 200.99]);
      expect(commands[1].coords).toEqual([150.68, 200.99]);
    });

    it("should respect custom precision", () => {
      const commands = generator.generateCircle(
        256.123456,
        256.987654,
        100.555555,
        { precision: 0 }
      );

      // All coordinates should be integers
      commands.forEach((cmd) => {
        if (cmd.cmd !== "Z") {
          cmd.coords.forEach((coord) => {
            expect(coord % 1).toBe(0); // Should be integer
          });
        }
      });
    });
  });

  describe("complex shapes", () => {
    it("should generate complex star with many points", () => {
      const commands = generator.generateStar(256, 256, 100, 40, 8);

      expect(commands).toHaveLength(17); // M + 15 L + Z (8 outer + 8 inner)

      // Should be closed
      expect(commands[commands.length - 1]).toEqual({ cmd: "Z", coords: [] });
    });

    it("should generate smooth curve with tension", () => {
      const points: [number, number][] = [
        [0, 100],
        [100, 0],
        [200, 100],
        [300, 0],
        [400, 100],
      ];

      const commands = generator.generateSmoothCurve(points, { tension: 0.5 });

      expect(commands[0].cmd).toBe("M");
      // All commands except first (M) and possibly last (Z) should be C
      const middleCommands = commands.slice(
        1,
        commands[commands.length - 1].cmd === "Z" ? -1 : commands.length
      );
      expect(middleCommands.every((cmd) => cmd.cmd === "C")).toBe(true);
    });

    it("should generate full circle arc", () => {
      const commands = generator.generateArc(256, 256, 100, 0, 360);

      expect(commands[0].cmd).toBe("M");

      // Should have multiple segments for full circle
      const cCommands = commands.filter((cmd) => cmd.cmd === "C");
      expect(cCommands.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("context updates", () => {
    it("should update context and affect coordinate validation", () => {
      const newRegionManager = new RegionManager("16:9");
      const newCoordinateMapper = new CoordinateMapper(
        1920,
        1080,
        newRegionManager
      );

      const newContext: PathGenerationContext = {
        regionManager: newRegionManager,
        coordinateMapper: newCoordinateMapper,
        canvasWidth: 1920,
        canvasHeight: 1080,
      };

      generator.updateContext(newContext);

      // Now coordinates up to 1920x1080 should be valid
      const commands: PathCommand[] = [{ cmd: "M", coords: [1900, 1000] }];

      const result = generator.validateCoordinates(commands);
      expect(result.valid).toBe(true);
    });
  });
});
