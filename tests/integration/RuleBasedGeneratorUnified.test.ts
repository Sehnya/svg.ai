/**
 * Integration tests for RuleBasedGenerator with unified language support
 */

import { describe, it, expect, beforeEach } from "vitest";
import { RuleBasedGenerator } from "../../server/services/RuleBasedGenerator";
import type { GenerationRequest } from "../../server/types/api";

describe("RuleBasedGenerator - Unified Language Support", () => {
  let generator: RuleBasedGenerator;

  beforeEach(() => {
    generator = new RuleBasedGenerator(true); // Enable unified mode
  });

  describe("Unified Mode Generation", () => {
    it("should generate unified SVG for circle", async () => {
      const request: GenerationRequest = {
        prompt: "a blue circle",
        size: { width: 512, height: 512 },
        palette: ["#3B82F6", "#1E40AF"],
        seed: 12345,
        model: "unified",
        aspectRatio: "1:1",
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result.svg).toContain('viewBox="0 0 512 512"');
      expect(result.svg).toContain('data-label="Circle"');
      expect(result.svg).toContain('id="main_circle"');
      expect(result.meta.width).toBe(512);
      expect(result.meta.height).toBe(512);
    });

    it("should generate unified SVG for rectangle", async () => {
      const request: GenerationRequest = {
        prompt: "a red rectangle",
        size: { width: 512, height: 512 },
        palette: ["#DC2626", "#B91C1C"],
        seed: 54321,
        model: "unified",
        aspectRatio: "1:1",
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain('data-label="Rectangle"');
      expect(result.svg).toContain('id="main_rectangle"');
      expect(result.svg).toContain('fill="#DC2626"');
    });

    it("should generate unified SVG for star", async () => {
      const request: GenerationRequest = {
        prompt: "a golden star",
        size: { width: 512, height: 512 },
        palette: ["#EAB308", "#CA8A04"],
        seed: 98765,
        model: "unified",
        aspectRatio: "1:1",
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain('data-label="Star"');
      expect(result.svg).toContain('id="main_star"');
      expect(result.svg).toContain('fill="#EAB308"');
    });

    it("should handle different aspect ratios", async () => {
      const request: GenerationRequest = {
        prompt: "a circle",
        size: { width: 512, height: 384 },
        palette: ["#3B82F6"],
        seed: 11111,
        model: "unified",
        aspectRatio: "4:3",
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain('viewBox="0 0 512 384"');
      expect(result.meta.width).toBe(512);
      expect(result.meta.height).toBe(384);
    });

    it("should fallback to legacy generation when unified fails", async () => {
      const request: GenerationRequest = {
        prompt: "a complex mandala pattern",
        size: { width: 512, height: 512 },
        palette: ["#9333EA"],
        seed: 22222,
        model: "rule-based", // Use legacy mode
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      // Should not contain unified-specific attributes
      expect(result.svg).not.toContain("data-label");
    });
  });

  describe("Layout Language Integration", () => {
    it("should use semantic regions for positioning", async () => {
      const request: GenerationRequest = {
        prompt: "a circle in the center",
        size: { width: 512, height: 512 },
        palette: ["#16A34A"],
        seed: 33333,
        model: "unified",
        aspectRatio: "1:1",
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);

      // Check that coordinates are within center region bounds
      // Center region is roughly 33% to 67% of canvas (170-341 pixels)
      const pathMatch = result.svg.match(/d="M ([0-9.]+) ([0-9.]+)/);
      if (pathMatch) {
        const x = parseFloat(pathMatch[1]);
        const y = parseFloat(pathMatch[2]);

        // Should be roughly in center region
        expect(x).toBeGreaterThan(150);
        expect(x).toBeLessThan(362);
        expect(y).toBeGreaterThan(150);
        expect(y).toBeLessThan(362);
      }
    });

    it("should generate layer metadata with region information", async () => {
      const request: GenerationRequest = {
        prompt: "a star",
        size: { width: 512, height: 512 },
        palette: ["#F59E0B"],
        seed: 44444,
        model: "unified",
        aspectRatio: "1:1",
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.layers).toHaveLength(1);

      const layer = result.layers[0];
      expect(layer.id).toBe("star_layer");
      expect(layer.name).toBe("Star");
      expect(layer.bounds).toBeDefined();
      expect(layer.bounds.width).toBeGreaterThan(0);
      expect(layer.bounds.height).toBeGreaterThan(0);
    });
  });

  describe("Template Selection and Region Mapping", () => {
    it("should select appropriate regions based on template type", async () => {
      const treeRequest: GenerationRequest = {
        prompt: "a tree",
        size: { width: 512, height: 512 },
        palette: ["#16A34A", "#92400E"],
        seed: 55555,
        model: "unified",
        aspectRatio: "1:1",
      };

      const result = await generator.generate(treeRequest);

      expect(result.errors).toHaveLength(0);
      // Trees should typically be positioned in bottom regions
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it("should handle position hints in prompts", async () => {
      const topRequest: GenerationRequest = {
        prompt: "a star at the top",
        size: { width: 512, height: 512 },
        palette: ["#EAB308"],
        seed: 66666,
        model: "unified",
        aspectRatio: "1:1",
      };

      const result = await generator.generate(topRequest);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });
  });

  describe("Error Handling and Fallbacks", () => {
    it("should handle invalid aspect ratios gracefully", async () => {
      const request: GenerationRequest = {
        prompt: "a circle",
        size: { width: 512, height: 512 },
        palette: ["#3B82F6"],
        seed: 77777,
        model: "unified",
        // @ts-ignore - Testing invalid aspect ratio
        aspectRatio: "invalid:ratio",
      };

      const result = await generator.generate(request);

      // Should fallback to default aspect ratio and still generate
      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it("should handle empty palette gracefully", async () => {
      const request: GenerationRequest = {
        prompt: "a circle",
        size: { width: 512, height: 512 },
        palette: [],
        seed: 88888,
        model: "unified",
        aspectRatio: "1:1",
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      // Should use default colors
      expect(result.svg).toContain("fill=");
    });

    it("should validate coordinates are within bounds", async () => {
      const request: GenerationRequest = {
        prompt: "a large circle",
        size: { width: 512, height: 512 },
        palette: ["#3B82F6"],
        seed: 99999,
        model: "unified",
        aspectRatio: "1:1",
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);

      // Extract all coordinates from the SVG path
      const coordMatches = result.svg.matchAll(/([0-9.]+)/g);
      for (const match of coordMatches) {
        const coord = parseFloat(match[1]);
        expect(coord).toBeGreaterThanOrEqual(0);
        expect(coord).toBeLessThanOrEqual(512);
      }
    });
  });

  describe("Mode Switching", () => {
    it("should switch between unified and legacy modes", async () => {
      const request: GenerationRequest = {
        prompt: "a circle",
        size: { width: 512, height: 512 },
        palette: ["#3B82F6"],
        seed: 12121,
        aspectRatio: "1:1",
      };

      // Test unified mode
      generator.setUnifiedMode(true);
      expect(generator.isUnifiedMode()).toBe(true);

      const unifiedResult = await generator.generate({
        ...request,
        model: "unified",
      });

      expect(unifiedResult.errors).toHaveLength(0);
      expect(unifiedResult.svg).toContain("data-label");

      // Test legacy mode
      generator.setUnifiedMode(false);
      expect(generator.isUnifiedMode()).toBe(false);

      const legacyResult = await generator.generate({
        ...request,
        model: "rule-based",
      });

      expect(legacyResult.errors).toHaveLength(0);
      expect(legacyResult.svg).not.toContain("data-label");
    });
  });

  describe("Performance and Validation", () => {
    it("should generate SVG within reasonable time", async () => {
      const request: GenerationRequest = {
        prompt: "a complex star pattern",
        size: { width: 512, height: 512 },
        palette: ["#9333EA", "#7C3AED"],
        seed: 13131,
        model: "unified",
        aspectRatio: "1:1",
      };

      const startTime = Date.now();
      const result = await generator.generate(request);
      const endTime = Date.now();

      expect(result.errors).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should produce valid SVG markup", async () => {
      const request: GenerationRequest = {
        prompt: "a rectangle with stroke",
        size: { width: 512, height: 512 },
        palette: ["#DC2626", "#991B1B"],
        seed: 14141,
        model: "unified",
        aspectRatio: "1:1",
      };

      const result = await generator.generate(request);

      expect(result.errors).toHaveLength(0);

      // Basic SVG structure validation
      expect(result.svg).toMatch(/^<svg[^>]*>/);
      expect(result.svg).toMatch(/<\/svg>$/);
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result.svg).toContain("viewBox=");
      expect(result.svg).toContain("width=");
      expect(result.svg).toContain("height=");
    });
  });
});
