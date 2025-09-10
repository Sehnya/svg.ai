/**
 * Basic integration tests for the unified SVG generation pipeline
 * Focuses on core functionality and realistic scenarios
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { RegionManager } from "../../server/services/RegionManager";
import { CoordinateMapper } from "../../server/services/CoordinateMapper";
import { LayerManager } from "../../server/services/LayerManager";
import { JSONSchemaValidator } from "../../server/services/JSONSchemaValidator";
import { LayoutLanguageParser } from "../../server/services/LayoutLanguageParser";
import { UnifiedErrorHandler } from "../../server/services/UnifiedErrorHandler";
import { DebugVisualizationSystem } from "../../server/services/DebugVisualizationSystem";
import {
  AspectRatioManager,
  AspectRatio,
} from "../../server/services/AspectRatioManager";
import { UnifiedLayeredSVGDocument } from "../../server/types/unified-layered";
import { UnifiedInterpreter } from "../../server/services/UnifiedInterpreter";

describe("Unified Pipeline Basic Integration Tests", () => {
  let regionManager: RegionManager;
  let coordinateMapper: CoordinateMapper;
  let layerManager: LayerManager;
  let validator: JSONSchemaValidator;
  let errorHandler: UnifiedErrorHandler;
  let debugSystem: DebugVisualizationSystem;
  let interpreter: UnifiedInterpreter;

  beforeEach(() => {
    const aspectRatio: AspectRatio = "1:1";
    regionManager = new RegionManager(aspectRatio);
    coordinateMapper = new CoordinateMapper(512, 512, regionManager);
    layerManager = new LayerManager(regionManager, coordinateMapper);
    const layoutParser = new LayoutLanguageParser(regionManager);
    validator = new JSONSchemaValidator(regionManager, layoutParser, {
      strict: false, // Allow coordinate clamping
      sanitize: true,
      clampCoordinates: true,
    });
    errorHandler = new UnifiedErrorHandler();
    debugSystem = new DebugVisualizationSystem(
      regionManager,
      coordinateMapper,
      layerManager
    );
    interpreter = new UnifiedInterpreter(aspectRatio);
  });

  describe("Component Integration", () => {
    it("should integrate all components successfully", () => {
      expect(regionManager).toBeDefined();
      expect(coordinateMapper).toBeDefined();
      expect(layerManager).toBeDefined();
      expect(validator).toBeDefined();
      expect(errorHandler).toBeDefined();
      expect(debugSystem).toBeDefined();
      expect(interpreter).toBeDefined();
    });

    it("should validate and convert a complete unified document", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "structure",
            label: "House Structure",
            layout: { region: "center", anchor: "center" },
            paths: [
              {
                id: "walls",
                style: { fill: "#E5E7EB", stroke: "#111827", strokeWidth: 4 },
                commands: [
                  { cmd: "M", coords: [200, 300] },
                  { cmd: "L", coords: [400, 300] },
                  { cmd: "L", coords: [400, 450] },
                  { cmd: "L", coords: [200, 450] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      // Validate document
      const validationResult = validator.validateDocument(document);
      expect(validationResult.success).toBe(true);

      // Convert to SVG
      const svg = interpreter.convertToSVG(document);
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain("viewBox=");
      expect(svg).toContain("<path");

      // Validate SVG output - basic structure check
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain("viewBox=");
      expect(svg).toContain("<path");
    });

    it("should handle different aspect ratios", () => {
      const aspectRatios: AspectRatio[] = ["1:1", "4:3", "16:9"];

      aspectRatios.forEach((aspectRatio) => {
        const dimensions = AspectRatioManager.getCanvasDimensions(aspectRatio);
        const localRegionManager = new RegionManager(aspectRatio);
        const localInterpreter = new UnifiedInterpreter(aspectRatio);

        const document: UnifiedLayeredSVGDocument = {
          version: "unified-layered-1.0",
          canvas: {
            width: dimensions.width,
            height: dimensions.height,
            aspectRatio,
          },
          layers: [
            {
              id: "test",
              label: "Test Layer",
              paths: [
                {
                  id: "test_path",
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

        const svg = localInterpreter.convertToSVG(document);
        expect(svg).toContain(`width="${dimensions.width}"`);
        expect(svg).toContain(`height="${dimensions.height}"`);
      });
    });

    it("should generate debug visualization", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test Layer",
            layout: { region: "center", anchor: "center" },
            paths: [
              {
                id: "test_path",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [256, 256] },
                  { cmd: "L", coords: [300, 300] },
                  { cmd: "Z", coords: [] },
                ],
                layout: { region: "center", anchor: "center" },
              },
            ],
          },
        ],
      };

      const debugResult = debugSystem.generateDebugVisualization(document);

      expect(debugResult.overlayElements.length).toBeGreaterThan(0);
      expect(debugResult.statistics.regionsShown).toBeGreaterThan(0);
      expect(debugResult.statistics.layersAnalyzed).toBe(1);
      expect(debugResult.renderTime).toBeGreaterThanOrEqual(0);

      const summary = debugSystem.getDebugSummary(debugResult);
      expect(summary.summary).toContain("Debug visualization generated");
    });

    it("should handle layout errors gracefully", () => {
      const documentWithErrors: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "error_layer",
            label: "Error Layer",
            paths: [
              {
                id: "out_of_bounds_path",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [1000, 1000] }, // Out of bounds
                  { cmd: "L", coords: [1100, 1100] }, // Out of bounds
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      // Should still validate (coordinates will be clamped)
      const validationResult = validator.validateDocument(documentWithErrors);
      // In non-strict mode, it should succeed with warnings
      expect(
        validationResult.success || validationResult.warnings.length > 0
      ).toBe(true);

      // Debug system should detect errors
      const debugResult = debugSystem.generateDebugVisualization(
        documentWithErrors,
        {
          showLayoutErrors: true,
        }
      );
      expect(debugResult.statistics.errorsFound).toBeGreaterThan(0);

      // Error handler exists and can be used for error handling
      expect(errorHandler).toBeDefined();
    });

    it("should optimize SVG output", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test Layer",
            paths: [
              {
                id: "test_path",
                style: { fill: "#FF0000", stroke: "#000000", strokeWidth: 2 },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "L", coords: [200, 100] },
                  { cmd: "L", coords: [200, 200] },
                  { cmd: "L", coords: [100, 200] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const svg = interpreter.convertToSVG(document);
      const optimizedSvg = interpreter.optimizeSVG(svg);

      expect(optimizedSvg.length).toBeLessThanOrEqual(svg.length);
      expect(optimizedSvg).toContain("<svg");
      expect(optimizedSvg).toContain("</svg>");
    });

    it("should calculate SVG bounds correctly", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test Layer",
            paths: [
              {
                id: "test_path",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [100, 150] },
                  { cmd: "L", coords: [300, 150] },
                  { cmd: "L", coords: [300, 250] },
                  { cmd: "L", coords: [100, 250] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const bounds = interpreter.getSVGBounds(document);

      expect(bounds.minX).toBe(100);
      expect(bounds.minY).toBe(150);
      expect(bounds.maxX).toBe(300);
      expect(bounds.maxY).toBe(250);
      expect(bounds.width).toBe(200);
      expect(bounds.height).toBe(100);
    });

    it("should convert between aspect ratios", () => {
      const originalDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "test",
            label: "Test Layer",
            paths: [
              {
                id: "test_path",
                style: { fill: "#FF0000" },
                commands: [
                  { cmd: "M", coords: [256, 256] },
                  { cmd: "L", coords: [300, 300] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const convertedDocument = interpreter.convertToAspectRatio(
        originalDocument,
        "16:9"
      );

      expect(convertedDocument.canvas.aspectRatio).toBe("16:9");
      expect(convertedDocument.canvas.width).toBe(512);
      expect(convertedDocument.canvas.height).toBe(288);
      expect(convertedDocument.layers).toEqual(originalDocument.layers);
    });
  });

  describe("Performance and Memory", () => {
    it("should handle large documents efficiently", () => {
      const startTime = performance.now();

      // Create a document with many layers and paths
      const layers = Array.from({ length: 20 }, (_, i) => ({
        id: `layer_${i}`,
        label: `Layer ${i}`,
        paths: Array.from({ length: 10 }, (_, j) => ({
          id: `path_${i}_${j}`,
          style: {
            fill: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          },
          commands: [
            { cmd: "M" as const, coords: [i * 10, j * 10] },
            { cmd: "L" as const, coords: [i * 10 + 20, j * 10] },
            { cmd: "L" as const, coords: [i * 10 + 20, j * 10 + 20] },
            { cmd: "L" as const, coords: [i * 10, j * 10 + 20] },
            { cmd: "Z" as const, coords: [] },
          ],
        })),
      }));

      const largeDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers,
      };

      // Validate
      const validationResult = validator.validateDocument(largeDocument);
      expect(validationResult.success).toBe(true);

      // Convert to SVG
      const svg = interpreter.convertToSVG(largeDocument);
      expect(svg).toContain("<svg");

      // Generate debug info
      const debugResult = debugSystem.generateDebugVisualization(largeDocument);
      expect(debugResult.statistics.layersAnalyzed).toBe(20);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should complete within reasonable time (5 seconds)
      expect(processingTime).toBeLessThan(5000);
    });

    it("should not leak memory during repeated operations", () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const document: UnifiedLayeredSVGDocument = {
          version: "unified-layered-1.0",
          canvas: { width: 512, height: 512, aspectRatio: "1:1" },
          layers: [
            {
              id: `test_${i}`,
              label: `Test Layer ${i}`,
              paths: [
                {
                  id: `path_${i}`,
                  style: { fill: "#FF0000" },
                  commands: [
                    { cmd: "M", coords: [i, i] },
                    { cmd: "L", coords: [i + 10, i + 10] },
                    { cmd: "Z", coords: [] },
                  ],
                },
              ],
            },
          ],
        };

        validator.validateDocument(document);
        interpreter.convertToSVG(document);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty documents", () => {
      const emptyDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [],
      };

      // Should fail validation (requires at least one layer)
      const validationResult = validator.validateDocument(emptyDocument);
      expect(validationResult.success).toBe(false);
    });

    it("should handle minimal valid documents", () => {
      const minimalDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "minimal",
            label: "Minimal Layer",
            paths: [
              {
                id: "minimal_path",
                style: { fill: "#000000" },
                commands: [{ cmd: "M", coords: [0, 0] }],
              },
            ],
          },
        ],
      };

      const validationResult = validator.validateDocument(minimalDocument);
      expect(validationResult.success).toBe(true);

      const svg = interpreter.convertToSVG(minimalDocument);
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
    });

    it("should handle boundary coordinate values", () => {
      const boundaryDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "boundary",
            label: "Boundary Layer",
            paths: [
              {
                id: "boundary_path",
                style: { fill: "none", stroke: "#000000" },
                commands: [
                  { cmd: "M", coords: [0, 0] },
                  { cmd: "L", coords: [512, 0] },
                  { cmd: "L", coords: [512, 512] },
                  { cmd: "L", coords: [0, 512] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const validationResult = validator.validateDocument(boundaryDocument);
      expect(validationResult.success).toBe(true);

      const svg = interpreter.convertToSVG(boundaryDocument);
      expect(svg).toContain("M 0 0");
      expect(svg).toContain("L 512 512");
    });

    it("should handle complex path commands", () => {
      const complexDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "complex",
            label: "Complex Paths",
            paths: [
              {
                id: "curve_path",
                style: { fill: "none", stroke: "#000000" },
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "C", coords: [150, 50, 200, 150, 250, 100] },
                  { cmd: "Q", coords: [300, 50, 350, 100] },
                  { cmd: "L", coords: [400, 200] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const validationResult = validator.validateDocument(complexDocument);
      expect(validationResult.success).toBe(true);

      const svg = interpreter.convertToSVG(complexDocument);
      expect(svg).toContain("C 150 50 200 150 250 100");
      expect(svg).toContain("Q 300 50 350 100");
    });
  });
});
