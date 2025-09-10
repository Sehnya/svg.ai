/**
 * Unit tests for Enhanced LLMIntentNormalizer with unified layered SVG support
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { LLMIntentNormalizer } from "../../server/services/LLMIntentNormalizer";
import { UnifiedLayeredSVGDocument } from "../../server/types/unified-layered";

// Mock fetch for OpenAI API calls
global.fetch = vi.fn();

describe("Enhanced LLMIntentNormalizer", () => {
  let normalizer: LLMIntentNormalizer;

  beforeEach(() => {
    normalizer = new LLMIntentNormalizer({
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 4000,
      apiKey: "test-api-key",
    });

    // Reset fetch mock
    vi.clearAllMocks();
  });

  describe("generateUnifiedLayeredSVG", () => {
    it("should generate unified layered SVG document", async () => {
      const mockResponse = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "main",
            label: "Main Shape",
            layout: {
              region: "center",
              anchor: "center",
            },
            paths: [
              {
                id: "square",
                style: {
                  fill: "#3B82F6",
                  stroke: "#1E40AF",
                  strokeWidth: 2,
                },
                commands: [
                  { cmd: "M", coords: [206, 206] },
                  { cmd: "L", coords: [306, 206] },
                  { cmd: "L", coords: [306, 306] },
                  { cmd: "L", coords: [206, 306] },
                  { cmd: "Z", coords: [] },
                ],
                layout: {
                  region: "center",
                  anchor: "center",
                },
              },
            ],
          },
        ],
      };

      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockResponse),
              },
            },
          ],
        }),
      });

      const request = {
        prompt: "blue square in the center",
        context: {
          defaultPalette: ["#3B82F6", "#1E40AF"],
        },
        options: {
          enforceCanvasConstraints: true,
          includeLayoutLanguage: true,
        },
      };

      const result = await normalizer.generateUnifiedLayeredSVG(request);

      expect(result).toEqual(mockResponse);
      expect(result.version).toBe("unified-layered-1.0");
      expect(result.canvas.width).toBe(512);
      expect(result.canvas.height).toBe(512);
      expect(result.layers).toHaveLength(1);
    });

    it("should include layout language in system prompt", async () => {
      const mockResponse = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      const request = {
        prompt: "simple shape",
        options: {
          includeLayoutLanguage: true,
        },
      };

      await normalizer.generateUnifiedLayeredSVG(request);

      // Check that fetch was called with layout language content
      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemPrompt = requestBody.messages[0].content;

      expect(systemPrompt).toContain("SEMANTIC REGIONS");
      expect(systemPrompt).toContain("ANCHOR POINTS");
      expect(systemPrompt).toContain("top_left");
      expect(systemPrompt).toContain("center");
      expect(systemPrompt).toContain("bottom_right");
    });

    it("should include geometry examples in system prompt", async () => {
      const mockResponse = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      const request = {
        prompt: "geometric shape",
        options: {
          includeGeometryExamples: true,
        },
      };

      await normalizer.generateUnifiedLayeredSVG(request);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemPrompt = requestBody.messages[0].content;

      expect(systemPrompt).toContain("GEOMETRY EXAMPLES");
      expect(systemPrompt).toContain("SMOOTH CURVES");
      expect(systemPrompt).toContain("SHARP GEOMETRY");
      expect(systemPrompt).toContain("CIRCLE");
    });

    it("should enforce canvas constraints in system prompt", async () => {
      const mockResponse = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      const request = {
        prompt: "test shape",
        options: {
          enforceCanvasConstraints: true,
          maxLayers: 5,
          maxPathsPerLayer: 10,
        },
      };

      await normalizer.generateUnifiedLayeredSVG(request);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemPrompt = requestBody.messages[0].content;

      expect(systemPrompt).toContain("Canvas: MUST be exactly 512x512");
      expect(systemPrompt).toContain(
        "ALL coordinates MUST be absolute numbers between 0 and 512"
      );
      expect(systemPrompt).toContain(
        "Commands: ONLY M (move), L (line), C (cubic curve)"
      );
      expect(systemPrompt).toContain("Layer Limits: Maximum 5 layers total");
      expect(systemPrompt).toContain("Path Limits: Maximum 10 paths per layer");
    });

    it("should include preferred regions in user prompt", async () => {
      const mockResponse = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      const request = {
        prompt: "test design",
        options: {
          preferredRegions: ["top_left", "center", "bottom_right"],
        },
      };

      await normalizer.generateUnifiedLayeredSVG(request);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const userPrompt = requestBody.messages[1].content;

      expect(userPrompt).toContain("top_left, center, bottom_right");
    });

    it("should validate generated document", async () => {
      const invalidResponse = {
        version: "wrong-version",
        canvas: { width: 256, height: 256, aspectRatio: "1:1" },
        layers: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(invalidResponse) } }],
        }),
      });

      const request = {
        prompt: "test shape",
      };

      await expect(
        normalizer.generateUnifiedLayeredSVG(request)
      ).rejects.toThrow("Failed to parse unified layered SVG response");
    });

    it("should handle API errors gracefully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      });

      const request = {
        prompt: "test shape",
      };

      await expect(
        normalizer.generateUnifiedLayeredSVG(request)
      ).rejects.toThrow("OpenAI API error: 429");
    });

    it("should handle invalid JSON responses", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "invalid json {" } }],
        }),
      });

      const request = {
        prompt: "test shape",
      };

      await expect(
        normalizer.generateUnifiedLayeredSVG(request)
      ).rejects.toThrow("Failed to parse unified layered SVG response");
    });
  });

  describe("document validation", () => {
    it("should validate correct unified document", () => {
      const validDoc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "layer1",
            label: "Layer 1",
            paths: [
              {
                id: "path1",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "L", coords: [200, 200] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      // Access private method for testing
      const isValid = (normalizer as any).validateUnifiedDocument(validDoc);
      expect(isValid).toBe(true);
    });

    it("should reject document with wrong version", () => {
      const invalidDoc = {
        version: "wrong-version",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Layer 1",
            paths: [
              {
                id: "path1",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const isValid = (normalizer as any).validateUnifiedDocument(invalidDoc);
      expect(isValid).toBe(false);
    });

    it("should reject document with wrong canvas size", () => {
      const invalidDoc = {
        version: "unified-layered-1.0",
        canvas: { width: 256, height: 256, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Layer 1",
            paths: [
              {
                id: "path1",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const isValid = (normalizer as any).validateUnifiedDocument(invalidDoc);
      expect(isValid).toBe(false);
    });

    it("should reject document with out-of-bounds coordinates", () => {
      const invalidDoc = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Layer 1",
            paths: [
              {
                id: "path1",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [600, 100] }, // Out of bounds
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const isValid = (normalizer as any).validateUnifiedDocument(invalidDoc);
      expect(isValid).toBe(false);
    });

    it("should reject document with missing required fields", () => {
      const invalidDoc = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            // Missing id and label
            paths: [
              {
                id: "path1",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const isValid = (normalizer as any).validateUnifiedDocument(invalidDoc);
      expect(isValid).toBe(false);
    });

    it("should validate coordinate count for each command type", () => {
      const testCases = [
        { cmd: "M", coords: [100, 100], valid: true },
        { cmd: "M", coords: [100], valid: false }, // Too few coords
        { cmd: "L", coords: [200, 200], valid: true },
        { cmd: "L", coords: [200, 200, 300], valid: false }, // Too many coords
        { cmd: "C", coords: [100, 100, 150, 150, 200, 200], valid: true },
        { cmd: "C", coords: [100, 100, 150, 150], valid: false }, // Too few coords
        { cmd: "Q", coords: [100, 100, 200, 200], valid: true },
        { cmd: "Q", coords: [100, 100, 200], valid: false }, // Too few coords
        { cmd: "Z", coords: [], valid: true },
        { cmd: "Z", coords: [100], valid: false }, // Should have no coords
      ];

      testCases.forEach(({ cmd, coords, valid }) => {
        const doc = {
          version: "unified-layered-1.0",
          canvas: { width: 512, height: 512, aspectRatio: "1:1" },
          layers: [
            {
              id: "layer1",
              label: "Layer 1",
              paths: [
                {
                  id: "path1",
                  style: { fill: "#FF0000" },
                  commands: [{ cmd, coords }],
                },
              ],
            },
          ],
        };

        const isValid = (normalizer as any).validateUnifiedDocument(doc);
        expect(isValid).toBe(valid);
      });
    });

    it("should reject invalid hex colors", () => {
      const invalidColors = ["red", "rgb(255,0,0)", "#FF", "#GGGGGG", "none"];
      const validColors = ["#FF0000", "#00FF00", "#0000FF", "none"];

      [...invalidColors.slice(0, -1), ...validColors].forEach((color) => {
        const doc = {
          version: "unified-layered-1.0",
          canvas: { width: 512, height: 512, aspectRatio: "1:1" },
          layers: [
            {
              id: "layer1",
              label: "Layer 1",
              paths: [
                {
                  id: "path1",
                  style: { fill: color },
                  commands: [
                    { cmd: "M", coords: [100, 100] },
                    { cmd: "Z", coords: [] },
                  ],
                },
              ],
            },
          ],
        };

        const isValid = (normalizer as any).validateUnifiedDocument(doc);
        const shouldBeValid =
          validColors.includes(color) ||
          (invalidColors.includes(color) && color === "none");
        expect(isValid).toBe(shouldBeValid);
      });
    });

    it("should reject invalid region and anchor names", () => {
      const invalidRegions = ["invalid_region", "top_middle", "center_left"];
      const validRegions = ["center", "top_left", "bottom_right"];

      [...invalidRegions, ...validRegions].forEach((region) => {
        const doc = {
          version: "unified-layered-1.0",
          canvas: { width: 512, height: 512, aspectRatio: "1:1" },
          layers: [
            {
              id: "layer1",
              label: "Layer 1",
              layout: { region },
              paths: [
                {
                  id: "path1",
                  style: { fill: "#FF0000" },
                  commands: [
                    { cmd: "M", coords: [100, 100] },
                    { cmd: "Z", coords: [] },
                  ],
                },
              ],
            },
          ],
        };

        const isValid = (normalizer as any).validateUnifiedDocument(doc);
        const shouldBeValid = validRegions.includes(region);
        expect(isValid).toBe(shouldBeValid);
      });
    });

    it("should detect duplicate IDs", () => {
      const docWithDuplicateLayerIds = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "duplicate",
            label: "Layer 1",
            paths: [
              {
                id: "path1",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
          {
            id: "duplicate", // Duplicate layer ID
            label: "Layer 2",
            paths: [
              {
                id: "path2",
                style: { fill: "#00FF00" },
                commands: [
                  { cmd: "M", coords: [200, 200] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const isValid = (normalizer as any).validateUnifiedDocument(
        docWithDuplicateLayerIds
      );
      expect(isValid).toBe(false);

      const docWithDuplicatePathIds = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Layer 1",
            paths: [
              {
                id: "duplicate",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
              {
                id: "duplicate", // Duplicate path ID
                style: { fill: "#00FF00" },
                commands: [
                  { cmd: "M", coords: [200, 200] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const isValid2 = (normalizer as any).validateUnifiedDocument(
        docWithDuplicatePathIds
      );
      expect(isValid2).toBe(false);
    });
  });

  describe("enhanced validation with error reporting", () => {
    it("should provide detailed error messages", () => {
      const invalidDoc = {
        version: "wrong-version",
        canvas: { width: 256, height: 256, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Layer 1",
            layout: { region: "invalid_region" },
            paths: [
              {
                id: "path1",
                style: { fill: "invalid_color" },
                commands: [
                  { cmd: "M", coords: [600, 100] }, // Out of bounds
                  { cmd: "X", coords: [100, 100] }, // Invalid command
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = (normalizer as any).validateUnifiedDocumentWithErrors(
        invalidDoc
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Invalid version: wrong-version (expected: unified-layered-1.0)"
      );
      expect(result.errors).toContain(
        "Invalid canvas width: 256 (must be 512)"
      );
      expect(result.errors).toContain(
        "Invalid canvas height: 256 (must be 512)"
      );
      expect(result.errors.some((e) => e.includes("Invalid region"))).toBe(
        true
      );
      expect(result.errors.some((e) => e.includes("Invalid fill color"))).toBe(
        true
      );
      expect(result.errors.some((e) => e.includes("Coordinate"))).toBe(true);
      expect(result.errors.some((e) => e.includes("Invalid command"))).toBe(
        true
      );
    });

    it("should validate correct document with no errors", () => {
      const validDoc: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Layer 1",
            layout: { region: "center", anchor: "center" },
            paths: [
              {
                id: "path1",
                style: { fill: "#FF0000", stroke: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "L", coords: [200, 200] },
                  { cmd: "Z", coords: [] },
                ],
                layout: { region: "center", anchor: "top_left" },
              },
            ],
          },
        ],
      };

      const result = (normalizer as any).validateUnifiedDocumentWithErrors(
        validDoc
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("prompt constraint enforcement", () => {
    it("should enforce strict canvas constraints in system prompt", async () => {
      const mockResponse = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      const request = {
        prompt: "test shape",
        options: { enforceCanvasConstraints: true },
      };

      await normalizer.generateUnifiedLayeredSVG(request);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemPrompt = requestBody.messages[0].content;

      expect(systemPrompt).toContain(
        "CRITICAL CANVAS CONSTRAINTS (STRICTLY ENFORCED)"
      );
      expect(systemPrompt).toContain(
        "Canvas: MUST be exactly 512x512 pixels (width: 512, height: 512)"
      );
      expect(systemPrompt).toContain(
        "ALL coordinates MUST be absolute numbers between 0 and 512 (inclusive)"
      );
      expect(systemPrompt).toContain(
        "NO relative commands (m, l, c, q), NO transforms, NO percentages"
      );
      expect(systemPrompt).toContain("STRUCTURED JSON RESPONSE FORMAT");
      expect(systemPrompt).toContain("AUTOMATIC REJECTION CRITERIA");
      expect(systemPrompt).toContain("Any coordinate < 0 or > 512 → INVALID");
    });

    it("should include coordinate validation examples", async () => {
      const mockResponse = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      const request = {
        prompt: "test shape",
        options: { includeGeometryExamples: true },
      };

      await normalizer.generateUnifiedLayeredSVG(request);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemPrompt = requestBody.messages[0].content;

      expect(systemPrompt).toContain("COORDINATE VALIDATION EXAMPLES");
      expect(systemPrompt).toContain('✓ VALID: {"cmd": "M", "coords": [0, 0]}');
      expect(systemPrompt).toContain(
        '✓ VALID: {"cmd": "L", "coords": [512, 512]}'
      );
      expect(systemPrompt).toContain(
        '✗ INVALID: {"cmd": "M", "coords": [-10, 50]}'
      );
      expect(systemPrompt).toContain(
        '✗ INVALID: {"cmd": "L", "coords": [600, 300]}'
      );
      expect(systemPrompt).toContain(
        '✗ INVALID: {"cmd": "m", "coords": [10, 10]}'
      );
    });

    it("should include layout language integration in geometry examples", async () => {
      const mockResponse = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      const request = {
        prompt: "test shape",
        options: { includeGeometryExamples: true },
      };

      await normalizer.generateUnifiedLayeredSVG(request);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemPrompt = requestBody.messages[0].content;

      expect(systemPrompt).toContain("GEOMETRY EXAMPLES WITH LAYOUT LANGUAGE");
      expect(systemPrompt).toContain("Rounded rectangle in center region");
      expect(systemPrompt).toContain("Triangle in top center");
      expect(systemPrompt).toContain("Circle in center with relative sizing");
      expect(systemPrompt).toContain("Leaf shape with semantic positioning");
      expect(systemPrompt).toContain("Grid of squares using layout language");
      expect(systemPrompt).toContain(
        '"layout": {"region": "center", "anchor": "center"}'
      );
    });

    it("should include enhanced few-shot examples with layout language", async () => {
      const mockResponse = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      await normalizer.normalizeWithUnifiedExamples("test shape");

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemPrompt = requestBody.messages[0].content;

      expect(systemPrompt).toContain(
        "UNIFIED LAYERED SVG EXAMPLES WITH LAYOUT LANGUAGE"
      );
      expect(systemPrompt).toContain(
        "Sharp Geometric Shape with Semantic Positioning"
      );
      expect(systemPrompt).toContain(
        "Smooth Organic Shape with Layout Language"
      );
      expect(systemPrompt).toContain(
        "Multi-Layer Design with Layout Specifications"
      );
      expect(systemPrompt).toContain(
        "Pattern with Repetition and Layout Language"
      );
      expect(systemPrompt).toContain("LAYOUT LANGUAGE DEMONSTRATION");
      expect(systemPrompt).toContain(
        "Sharp geometry: Use L commands for crisp edges"
      );
      expect(systemPrompt).toContain(
        "Smooth geometry: Use C commands for organic curves"
      );
    });
  });

  describe("prompt building", () => {
    it("should build layout language guide", () => {
      const guide = (normalizer as any).buildLayoutLanguageGuide();

      expect(guide).toContain("SEMANTIC REGIONS");
      expect(guide).toContain("ANCHOR POINTS");
      expect(guide).toContain("POSITIONING EXAMPLES");
      expect(guide).toContain("top_left");
      expect(guide).toContain("center");
      expect(guide).toContain("bottom_right");
    });

    it("should build geometry examples", () => {
      const examples = (normalizer as any).buildGeometryExamples();

      expect(examples).toContain("GEOMETRY EXAMPLES WITH LAYOUT LANGUAGE");
      expect(examples).toContain("SMOOTH CURVES");
      expect(examples).toContain("SHARP GEOMETRY");
      expect(examples).toContain("PERFECT CIRCLE");
      expect(examples).toContain("Triangle in top center");
      expect(examples).toContain("Rounded rectangle in center region");
    });

    it("should build unified few-shot examples", () => {
      const examples = (normalizer as any).getUnifiedFewShotExamples();

      expect(examples).toContain("UNIFIED LAYERED SVG EXAMPLES");
      expect(examples).toContain("blue square in the center");
      expect(examples).toContain("green leaf with smooth curves");
      expect(examples).toContain("unified-layered-1.0");
      expect(examples).toContain("512");
    });

    it("should include grounding data in examples", () => {
      const grounding = {
        fewshot: [
          {
            input: "custom example",
            output: { version: "unified-layered-1.0", canvas: {}, layers: [] },
          },
        ],
      };

      const examples = (normalizer as any).getUnifiedFewShotExamples(grounding);

      expect(examples).toContain("Additional examples from knowledge base");
      expect(examples).toContain("custom example");
    });
  });

  describe("normalizeWithUnifiedExamples", () => {
    it("should use unified examples in normalization", async () => {
      const mockDesignIntent = {
        style: {
          palette: ["#3B82F6"],
          strokeRules: {
            strokeOnly: false,
            minStrokeWidth: 1,
            maxStrokeWidth: 3,
            allowFill: true,
          },
          density: "medium",
          symmetry: "none",
        },
        motifs: ["square"],
        layout: {
          sizes: [{ type: "shape", minSize: 50, maxSize: 100 }],
          counts: [{ type: "element", min: 1, max: 1, preferred: 1 }],
          arrangement: "centered",
        },
        constraints: {
          strokeOnly: false,
          maxElements: 5,
          requiredMotifs: ["square"],
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockDesignIntent) } }],
        }),
      });

      const result =
        await normalizer.normalizeWithUnifiedExamples("blue square");

      expect(result).toEqual(mockDesignIntent);

      // Check that unified examples were included in the prompt
      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemPrompt = requestBody.messages[0].content;

      expect(systemPrompt).toContain("UNIFIED LAYERED SVG EXAMPLES");
    });
  });

  describe("configuration options", () => {
    it("should respect default options", async () => {
      const mockResponse = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      const request = {
        prompt: "test shape",
        // No options provided, should use defaults
      };

      await normalizer.generateUnifiedLayeredSVG(request);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemPrompt = requestBody.messages[0].content;
      const userPrompt = requestBody.messages[1].content;

      // Should include default features
      expect(systemPrompt).toContain("SEMANTIC REGIONS");
      expect(systemPrompt).toContain("GEOMETRY EXAMPLES");
      expect(systemPrompt).toContain("Layer Limits: Maximum 10 layers total");
      expect(userPrompt).toContain("center, top_center, bottom_center");
    });

    it("should respect custom options", async () => {
      const mockResponse = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test",
            paths: [
              {
                id: "path",
                style: { fill: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockResponse) } }],
        }),
      });

      const request = {
        prompt: "test shape",
        options: {
          enforceCanvasConstraints: false,
          includeLayoutLanguage: false,
          includeGeometryExamples: false,
          maxLayers: 3,
          maxPathsPerLayer: 5,
          preferredRegions: ["top_left"],
        },
      };

      await normalizer.generateUnifiedLayeredSVG(request);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemPrompt = requestBody.messages[0].content;
      const userPrompt = requestBody.messages[1].content;

      // Should respect disabled features
      expect(systemPrompt).not.toContain("SEMANTIC REGIONS");
      expect(systemPrompt).not.toContain("GEOMETRY EXAMPLES");
      expect(systemPrompt).not.toContain("STRICT VALIDATION RULES");
      expect(userPrompt).toContain("top_left");
    });
  });
});
