/**
 * ViewportDebugger Tests
 */

import { ViewportDebugger } from "../../server/utils/viewportDebugger";
import { PathCommand } from "../../server/types/unified-layered";

describe("ViewportDebugger", () => {
  describe("analyzeViewport", () => {
    it("should detect clipping issues", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [100, 100] },
        { cmd: "L", coords: [600, 400] }, // Extends beyond 512x512 canvas
        { cmd: "Z", coords: [] },
      ];

      const analysis = ViewportDebugger.analyzeViewport(
        commands,
        "0 0 512 512",
        512,
        512
      );

      expect(analysis.issues.length).toBeGreaterThanOrEqual(1);
      expect(analysis.issues.some((issue) => issue.type === "clipping")).toBe(
        true
      );
      expect(
        analysis.issues
          .filter((issue) => issue.type === "clipping")
          .every((issue) => issue.severity === "high")
      ).toBe(true);
    });

    it("should detect empty content", () => {
      const commands: PathCommand[] = [];

      const analysis = ViewportDebugger.analyzeViewport(
        commands,
        "0 0 512 512",
        512,
        512
      );

      expect(analysis.issues.some((issue) => issue.type === "empty")).toBe(
        true
      );
    });

    it("should suggest appropriate viewBox for heart shape", () => {
      const heartCommands = ViewportDebugger.generateTestHeart(256, 256, 100);

      const analysis = ViewportDebugger.analyzeViewport(
        heartCommands,
        "0 0 512 512",
        512,
        512
      );

      expect(analysis.suggestedViewBox).toBeDefined();
      expect(analysis.bounds.width).toBeGreaterThan(0);
      expect(analysis.bounds.height).toBeGreaterThan(0);
    });
  });

  describe("fixViewportIssues", () => {
    it("should fix clipping by adjusting viewBox", () => {
      const commands: PathCommand[] = [
        { cmd: "M", coords: [100, 100] },
        { cmd: "L", coords: [600, 400] },
        { cmd: "Z", coords: [] },
      ];

      const fix = ViewportDebugger.fixViewportIssues(commands, 512, 512);

      expect(fix.newViewBox).not.toBe("0 0 512 512");
      expect(fix.transformApplied).toContain("viewBox adjusted");
    });

    it("should handle empty content gracefully", () => {
      const commands: PathCommand[] = [];

      const fix = ViewportDebugger.fixViewportIssues(commands, 512, 512);

      expect(fix.newViewBox).toBe("0 0 512 512");
      expect(fix.transformApplied).toContain("none");
    });

    it("should generate proper heart shape", () => {
      const heartCommands = ViewportDebugger.generateTestHeart(256, 256, 100);

      expect(heartCommands).toHaveLength(6); // M, C, C, C, C, Z
      expect(heartCommands[0].cmd).toBe("M");
      expect(heartCommands[5].cmd).toBe("Z");

      // Check that coordinates are reasonable
      const allCoords = heartCommands
        .filter((cmd) => cmd.cmd !== "Z")
        .flatMap((cmd) => cmd.coords);

      expect(Math.min(...allCoords)).toBeGreaterThan(0);
      expect(Math.max(...allCoords)).toBeLessThan(1000);
    });
  });

  describe("generateDebugSVG", () => {
    it("should generate valid debug SVG", () => {
      const heartCommands = ViewportDebugger.generateTestHeart(256, 256, 100);
      const debugSvg = ViewportDebugger.generateDebugSVG(
        heartCommands,
        "0 0 512 512",
        512,
        512
      );

      expect(debugSvg).toContain("<svg");
      expect(debugSvg).toContain("</svg>");
      expect(debugSvg).toContain("viewBox=");
      expect(debugSvg).toContain("path");
      expect(debugSvg).toContain("rect"); // Bounding box visualization
    });
  });
});
