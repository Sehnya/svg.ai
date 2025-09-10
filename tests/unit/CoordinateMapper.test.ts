/**
 * Unit tests for CoordinateMapper
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  CoordinateMapper,
  PositionResult,
} from "../../server/services/CoordinateMapper";
import { RegionManager } from "../../server/services/RegionManager";
import {
  LayoutSpecification,
  PathCommand,
  RepetitionSpec,
  SizeSpec,
} from "../../server/types/unified-layered";

describe("CoordinateMapper", () => {
  let coordinateMapper: CoordinateMapper;
  let regionManager: RegionManager;

  beforeEach(() => {
    regionManager = new RegionManager("1:1");
    coordinateMapper = new CoordinateMapper(512, 512, regionManager);
  });

  describe("Initialization", () => {
    it("should initialize with canvas dimensions", () => {
      const dimensions = coordinateMapper.getCanvasDimensions();
      expect(dimensions.width).toBe(512);
      expect(dimensions.height).toBe(512);
    });

    it("should update canvas dimensions", () => {
      coordinateMapper.updateCanvasDimensions(1024, 768);
      const dimensions = coordinateMapper.getCanvasDimensions();
      expect(dimensions.width).toBe(1024);
      expect(dimensions.height).toBe(768);
    });
  });

  describe("Basic Position Calculation", () => {
    it("should calculate center position with default layout", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
      };

      const position = coordinateMapper.calculatePosition(layout);

      // Center of center region should be around (256, 256) for 512x512 canvas
      expect(position.x).toBeCloseTo(256, 1);
      expect(position.y).toBeCloseTo(256, 1);
    });

    it("should calculate position with offset", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [0.5, -0.5], // Move right and up
      };

      const position = coordinateMapper.calculatePosition(layout);

      // Should be offset from center by half the region width/height
      const centerRegionBounds = regionManager.getPixelBounds("center");
      const expectedX = 256 + 0.5 * centerRegionBounds.width;
      const expectedY = 256 - 0.5 * centerRegionBounds.height;

      expect(position.x).toBeCloseTo(expectedX, 1);
      expect(position.y).toBeCloseTo(expectedY, 1);
    });

    it("should calculate position with different anchors", () => {
      const topLeftLayout: LayoutSpecification = {
        region: "center",
        anchor: "top_left",
      };

      const bottomRightLayout: LayoutSpecification = {
        region: "center",
        anchor: "bottom_right",
      };

      const topLeftPos = coordinateMapper.calculatePosition(topLeftLayout);
      const bottomRightPos =
        coordinateMapper.calculatePosition(bottomRightLayout);

      // Top-left should be less than bottom-right
      expect(topLeftPos.x).toBeLessThan(bottomRightPos.x);
      expect(topLeftPos.y).toBeLessThan(bottomRightPos.y);
    });

    it("should handle different regions", () => {
      const topLeftRegion: LayoutSpecification = {
        region: "top_left",
        anchor: "center",
      };

      const bottomRightRegion: LayoutSpecification = {
        region: "bottom_right",
        anchor: "center",
      };

      const topLeftPos = coordinateMapper.calculatePosition(topLeftRegion);
      const bottomRightPos =
        coordinateMapper.calculatePosition(bottomRightRegion);

      expect(topLeftPos.x).toBeLessThan(bottomRightPos.x);
      expect(topLeftPos.y).toBeLessThan(bottomRightPos.y);
    });
  });

  describe("Size Calculation", () => {
    it("should calculate absolute size", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        size: {
          absolute: { width: 100, height: 80 },
        },
      };

      const position = coordinateMapper.calculatePosition(layout);
      expect(position.width).toBe(100);
      expect(position.height).toBe(80);
    });

    it("should calculate relative size", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        size: {
          relative: 0.5, // 50% of region size
        },
      };

      const position = coordinateMapper.calculatePosition(layout);
      const centerRegionBounds = regionManager.getPixelBounds("center");

      expect(position.width).toBeCloseTo(centerRegionBounds.width * 0.5, 1);
      expect(position.height).toBeCloseTo(centerRegionBounds.height * 0.5, 1);
    });

    it("should calculate aspect-constrained size", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        size: {
          aspect_constrained: { width: 100, aspect: 2 }, // 2:1 aspect ratio
        },
      };

      const position = coordinateMapper.calculatePosition(layout);
      expect(position.width).toBe(100);
      expect(position.height).toBe(50); // 100 / 2
    });
  });

  describe("Anchor Position Calculation", () => {
    it("should calculate anchor positions correctly", () => {
      const centerAnchor = coordinateMapper.calculateAnchorPosition(
        "center",
        "center"
      );
      const topLeftAnchor = coordinateMapper.calculateAnchorPosition(
        "center",
        "top_left"
      );
      const bottomRightAnchor = coordinateMapper.calculateAnchorPosition(
        "center",
        "bottom_right"
      );

      expect(topLeftAnchor.x).toBeLessThan(centerAnchor.x);
      expect(topLeftAnchor.y).toBeLessThan(centerAnchor.y);
      expect(bottomRightAnchor.x).toBeGreaterThan(centerAnchor.x);
      expect(bottomRightAnchor.y).toBeGreaterThan(centerAnchor.y);
    });

    it("should calculate offset positions", () => {
      const basePosition: PositionResult = { x: 256, y: 256 };
      const offset: [number, number] = [0.2, -0.3];

      const offsetPosition = coordinateMapper.calculateOffsetPosition(
        basePosition,
        offset,
        "center"
      );

      const centerRegionBounds = regionManager.getPixelBounds("center");
      const expectedX = 256 + 0.2 * centerRegionBounds.width;
      const expectedY = 256 - 0.3 * centerRegionBounds.height;

      expect(offsetPosition.x).toBeCloseTo(expectedX, 1);
      expect(offsetPosition.y).toBeCloseTo(expectedY, 1);
    });
  });

  describe("Grid Repetition", () => {
    it("should generate grid repetition pattern", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        repeat: {
          type: "grid",
          count: [3, 2], // 3x2 grid
          spacing: 0.2,
        },
      };

      const basePosition = coordinateMapper.calculatePosition(layout);
      const repetition = coordinateMapper.generateRepetition(
        layout,
        basePosition
      );

      expect(repetition.positions).toHaveLength(6); // 3 * 2

      // Check that positions are different
      const uniquePositions = new Set(
        repetition.positions.map((p) => `${p.x},${p.y}`)
      );
      expect(uniquePositions.size).toBe(6);
    });

    it("should generate square grid with single count", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        repeat: {
          type: "grid",
          count: 3, // 3x3 grid
          spacing: 0.1,
        },
      };

      const basePosition = coordinateMapper.calculatePosition(layout);
      const repetition = coordinateMapper.generateRepetition(
        layout,
        basePosition
      );

      expect(repetition.positions).toHaveLength(9); // 3 * 3
    });

    it("should handle grid spacing correctly", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        repeat: {
          type: "grid",
          count: [2, 1], // 2x1 grid
          spacing: 0.5,
        },
      };

      const basePosition = coordinateMapper.calculatePosition(layout);
      const repetition = coordinateMapper.generateRepetition(
        layout,
        basePosition
      );

      expect(repetition.positions).toHaveLength(2);

      // Check spacing between positions
      const pos1 = repetition.positions[0];
      const pos2 = repetition.positions[1];
      const distance = Math.abs(pos2.x - pos1.x);

      const centerRegionBounds = regionManager.getPixelBounds("center");
      const expectedSpacing = 0.5 * centerRegionBounds.width;

      expect(distance).toBeCloseTo(expectedSpacing, 1);
    });
  });

  describe("Radial Repetition", () => {
    it("should generate radial repetition pattern", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        repeat: {
          type: "radial",
          count: 6,
          radius: 50,
        },
      };

      const basePosition = coordinateMapper.calculatePosition(layout);
      const repetition = coordinateMapper.generateRepetition(
        layout,
        basePosition
      );

      expect(repetition.positions).toHaveLength(6);

      // Check that all positions are roughly the same distance from center
      const centerX = basePosition.x;
      const centerY = basePosition.y;

      repetition.positions.forEach((pos) => {
        const distance = Math.sqrt(
          Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2)
        );
        expect(distance).toBeCloseTo(50, 1);
      });
    });

    it("should distribute radial positions evenly", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        repeat: {
          type: "radial",
          count: 4, // Should be at 90-degree intervals
          radius: 100,
        },
      };

      const basePosition = coordinateMapper.calculatePosition(layout);
      const repetition = coordinateMapper.generateRepetition(
        layout,
        basePosition
      );

      expect(repetition.positions).toHaveLength(4);

      // Check that positions are at expected angles (0°, 90°, 180°, 270°)
      const centerX = basePosition.x;
      const centerY = basePosition.y;

      const angles = repetition.positions.map((pos) => {
        return Math.atan2(pos.y - centerY, pos.x - centerX);
      });

      // Angles should be evenly distributed
      angles.sort((a, b) => a - b);
      for (let i = 1; i < angles.length; i++) {
        const angleDiff = angles[i] - angles[i - 1];
        expect(angleDiff).toBeCloseTo(Math.PI / 2, 0.1);
      }
    });
  });

  describe("Path Command Transformation", () => {
    it("should transform simple path commands", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [0, 0] },
        { cmd: "L", coords: [10, 10] },
        { cmd: "Z", coords: [] },
      ];

      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
      };

      const transformed = coordinateMapper.transformPathCommands(
        commands,
        layout
      );

      expect(transformed).toHaveLength(3);
      expect(transformed[0].cmd).toBe("M");
      expect(transformed[1].cmd).toBe("L");
      expect(transformed[2].cmd).toBe("Z");

      // Coordinates should be transformed (moved to center region)
      expect(transformed[0].coords[0]).toBeGreaterThan(200); // Moved from 0
      expect(transformed[0].coords[1]).toBeGreaterThan(200); // Moved from 0
    });

    it("should handle Z commands correctly", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [0, 0] },
        { cmd: "L", coords: [10, 0] },
        { cmd: "Z", coords: [] },
      ];

      const layout: LayoutSpecification = {
        region: "top_left",
        anchor: "center",
      };

      const transformed = coordinateMapper.transformPathCommands(
        commands,
        layout
      );

      // Z command should remain unchanged
      const zCommand = transformed.find((cmd) => cmd.cmd === "Z");
      expect(zCommand?.coords).toEqual([]);
    });

    it("should transform path commands with repetition", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [0, 0] },
        { cmd: "L", coords: [10, 10] },
        { cmd: "Z", coords: [] },
      ];

      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        repeat: {
          type: "grid",
          count: [2, 1],
          spacing: 0.2,
        },
      };

      const transformed = coordinateMapper.transformPathCommands(
        commands,
        layout
      );

      // Should have commands for both repetitions
      expect(transformed.length).toBeGreaterThan(3);

      // Should have multiple M commands (one for each repetition)
      const moveCommands = transformed.filter((cmd) => cmd.cmd === "M");
      expect(moveCommands.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Coordinate Conversion", () => {
    it("should convert normalized to pixel coordinates", () => {
      const pixel = coordinateMapper.normalizedToPixel(0.5, 0.75);

      expect(pixel.x).toBe(256); // 0.5 * 512
      expect(pixel.y).toBe(384); // 0.75 * 512
    });

    it("should convert pixel to normalized coordinates", () => {
      const normalized = coordinateMapper.pixelToNormalized(256, 128);

      expect(normalized.x).toBe(0.5); // 256 / 512
      expect(normalized.y).toBe(0.25); // 128 / 512
    });

    it("should round coordinates to specified precision", () => {
      const rounded = coordinateMapper.roundCoordinates(
        123.456789,
        987.654321,
        2
      );

      expect(rounded.x).toBe(123.46);
      expect(rounded.y).toBe(987.65);
    });
  });

  describe("Bounding Box Calculation", () => {
    it("should calculate bounding box for path commands", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [10, 20] },
        { cmd: "L", coords: [50, 30] },
        { cmd: "L", coords: [40, 60] },
        { cmd: "Z", coords: [] },
      ];

      const bounds = coordinateMapper.calculateBoundingBox(commands);

      expect(bounds.x).toBe(10); // min x
      expect(bounds.y).toBe(20); // min y
      expect(bounds.width).toBe(40); // 50 - 10
      expect(bounds.height).toBe(40); // 60 - 20
    });

    it("should handle empty command list", () => {
      const bounds = coordinateMapper.calculateBoundingBox([]);

      expect(bounds.x).toBe(0);
      expect(bounds.y).toBe(0);
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(0);
    });

    it("should ignore Z commands in bounding box calculation", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [10, 10] },
        { cmd: "Z", coords: [] },
        { cmd: "L", coords: [20, 20] },
      ];

      const bounds = coordinateMapper.calculateBoundingBox(commands);

      expect(bounds.x).toBe(10);
      expect(bounds.y).toBe(10);
      expect(bounds.width).toBe(10);
      expect(bounds.height).toBe(10);
    });
  });

  describe("Path Scaling", () => {
    it("should scale path to fit target dimensions", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [0, 0] },
        { cmd: "L", coords: [100, 100] },
        { cmd: "Z", coords: [] },
      ];

      const scaled = coordinateMapper.scalePathToFit(commands, 50, 50, true);

      // Should be scaled down by 0.5
      expect(scaled[0].coords[0]).toBe(0);
      expect(scaled[0].coords[1]).toBe(0);
      expect(scaled[1].coords[0]).toBe(50);
      expect(scaled[1].coords[1]).toBe(50);
    });

    it("should maintain aspect ratio when requested", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [0, 0] },
        { cmd: "L", coords: [100, 50] }, // 2:1 aspect ratio
        { cmd: "Z", coords: [] },
      ];

      const scaled = coordinateMapper.scalePathToFit(commands, 200, 200, true);

      // Should scale to fit within 200x200 while maintaining 2:1 aspect ratio
      // So it should be scaled to 200x100
      expect(scaled[1].coords[0]).toBe(200);
      expect(scaled[1].coords[1]).toBe(100);
    });

    it("should not maintain aspect ratio when not requested", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [0, 0] },
        { cmd: "L", coords: [100, 50] },
        { cmd: "Z", coords: [] },
      ];

      const scaled = coordinateMapper.scalePathToFit(commands, 200, 200, false);

      // Should stretch to fill 200x200
      expect(scaled[1].coords[0]).toBe(200);
      expect(scaled[1].coords[1]).toBe(200);
    });
  });

  describe("Coordinate Validation and Clamping", () => {
    it("should validate coordinates within bounds", () => {
      expect(coordinateMapper.validateCoordinates(256, 256)).toBe(true);
      expect(coordinateMapper.validateCoordinates(0, 0)).toBe(true);
      expect(coordinateMapper.validateCoordinates(512, 512)).toBe(true);
      expect(coordinateMapper.validateCoordinates(-1, 256)).toBe(false);
      expect(coordinateMapper.validateCoordinates(256, 600)).toBe(false);
    });

    it("should clamp coordinates to canvas bounds", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        offset: [10, -10], // Large offset that would go out of bounds
      };

      const position = coordinateMapper.calculatePosition(layout);

      // Should be clamped to canvas bounds
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.x).toBeLessThanOrEqual(512);
      expect(position.y).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeLessThanOrEqual(512);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle missing layout properties with defaults", () => {
      const layout: LayoutSpecification = {}; // Empty layout

      const position = coordinateMapper.calculatePosition(layout);

      // Should use defaults (center region, center anchor, no offset)
      expect(position.x).toBeCloseTo(256, 1);
      expect(position.y).toBeCloseTo(256, 1);
    });

    it("should handle zero-sized regions gracefully", () => {
      // This shouldn't happen with standard regions, but test robustness
      const commands: PathCommand[] = [
        { cmd: "M", coords: [0, 0] },
        { cmd: "L", coords: [0, 0] },
      ];

      const bounds = coordinateMapper.calculateBoundingBox(commands);
      const scaled = coordinateMapper.scalePathToFit(commands, 100, 100);

      // Should handle gracefully without errors
      expect(scaled).toHaveLength(2);
    });

    it("should handle repetition with zero count gracefully", () => {
      const layout: LayoutSpecification = {
        region: "center",
        anchor: "center",
        repeat: {
          type: "grid",
          count: 0,
        },
      };

      const basePosition = coordinateMapper.calculatePosition(layout);
      const repetition = coordinateMapper.generateRepetition(
        layout,
        basePosition
      );

      // Should return empty positions when count is 0
      expect(repetition.positions).toHaveLength(0);
    });
  });
});
