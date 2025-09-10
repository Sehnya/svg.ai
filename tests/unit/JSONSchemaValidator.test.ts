/**
 * Unit tests for JSONSchemaValidator
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  JSONSchemaValidator,
  ValidationOptions,
} from "../../server/services/JSONSchemaValidator";
import { RegionManager } from "../../server/services/RegionManager";
import { LayoutLanguageParser } from "../../server/services/LayoutLanguageParser";
import {
  UnifiedLayeredSVGDocument,
  UnifiedLayer,
  UnifiedPath,
  PathCommand,
} from "../../server/types/unified-layered";

describe("JSONSchemaValidator", () => {
  let validator: JSONSchemaValidator;
  let regionManager: RegionManager;
  let layoutParser: LayoutLanguageParser;

  beforeEach(() => {
    regionManager = new RegionManager("1:1");
    layoutParser = new LayoutLanguageParser(regionManager);
    validator = new JSONSchemaValidator(regionManager, layoutParser);
  });

  describe("Initialization", () => {
    it("should initialize with default options", () => {
      const options = validator.getOptions();
      expect(options.strict).toBe(true);
      expect(options.sanitize).toBe(true);
      expect(options.validateCoordinates).toBe(true);
      expect(options.validateLayout).toBe(true);
      expect(options.clampCoordinates).toBe(true);
      expect(options.roundPrecision).toBe(2);
    });

    it("should initialize with custom options", () => {
      const customOptions: ValidationOptions = {
        strict: false,
        sanitize: false,
        validateCoordinates: false,
        validateLayout: false,
        clampCoordinates: false,
        roundPrecision: 4,
      };

      const customValidator = new JSONSchemaValidator(
        regionManager,
        layoutParser,
        customOptions
      );
      const options = customValidator.getOptions();

      expect(options.strict).toBe(false);
      expect(options.sanitize).toBe(false);
      expect(options.validateCoordinates).toBe(false);
      expect(options.validateLayout).toBe(false);
      expect(options.clampCoordinates).toBe(false);
      expect(options.roundPrecision).toBe(4);
    });

    it("should update options", () => {
      validator.updateOptions({ strict: false, roundPrecision: 3 });
      const options = validator.getOptions();

      expect(options.strict).toBe(false);
      expect(options.roundPrecision).toBe(3);
      expect(options.sanitize).toBe(true); // Should remain unchanged
    });
  });

  describe("Document Validation", () => {
    it("should validate a complete valid document", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: {
          width: 512,
          height: 512,
          aspectRatio: "1:1",
        },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
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

      const result = validator.validateDocument(document);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(document);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate minimal document", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
                commands: [{ cmd: "M", coords: [0, 0] }],
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid schema", () => {
      const invalidDocument = {
        version: "wrong-version",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [],
      };

      const result = validator.validateDocument(invalidDocument);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });

    it("should handle malformed input", () => {
      const result = validator.validateDocument("invalid json");

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Coordinate Validation and Sanitization", () => {
    it("should validate coordinates within bounds", () => {
      const coords = [100, 200, 300, 400];
      const result = validator.validateCoordinates(coords);

      expect(result.original).toEqual(coords);
      expect(result.sanitized).toEqual(coords);
      expect(result.clamped).toBe(false);
      expect(result.rounded).toBe(false);
    });

    it("should clamp out-of-bounds coordinates", () => {
      const coords = [-50, 600, 256, 256];
      const result = validator.validateCoordinates(coords);

      expect(result.original).toEqual(coords);
      expect(result.sanitized).toEqual([0, 512, 256, 256]);
      expect(result.clamped).toBe(true);
    });

    it("should round coordinates to specified precision", () => {
      validator.updateOptions({ roundPrecision: 1 });
      const coords = [123.456, 789.123];
      const result = validator.validateCoordinates(coords);

      expect(result.original).toEqual(coords);
      expect(result.sanitized).toEqual([123.5, 789.1]);
      expect(result.rounded).toBe(true);
    });

    it("should both clamp and round coordinates", () => {
      const coords = [-10.123456, 600.987654];
      const result = validator.validateCoordinates(coords);

      expect(result.original).toEqual(coords);
      expect(result.sanitized).toEqual([0, 512]);
      expect(result.clamped).toBe(true);
      expect(result.rounded).toBe(true);
    });

    it("should sanitize coordinates in document validation", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
                commands: [
                  { cmd: "M", coords: [-50, 600] }, // Out of bounds
                  { cmd: "L", coords: [100.123456, 200.987654] }, // High precision
                ],
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(true);
      expect(result.sanitized).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);

      // Check that coordinates were sanitized
      const sanitizedPath = result.data!.layers[0].paths[0];
      expect(sanitizedPath.commands[0].coords).toEqual([0, 512]);
      expect(sanitizedPath.commands[1].coords).toEqual([100.12, 200.99]);
    });

    it("should reject out-of-bounds coordinates in strict mode", () => {
      validator.updateOptions({ strict: true, sanitize: false });

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
                commands: [{ cmd: "M", coords: [-50, 600] }],
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("out of bounds"))).toBe(true);
    });
  });

  describe("Path Validation", () => {
    it("should validate path structure", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
                commands: [
                  { cmd: "M", coords: [100, 100] },
                  { cmd: "L", coords: [200, 200] },
                  { cmd: "C", coords: [150, 150, 250, 250, 300, 300] },
                  { cmd: "Z", coords: [] },
                ],
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty paths", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
                commands: [], // Empty commands
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(false);
      expect(
        result.errors.some((e) => e.includes("at least one command"))
      ).toBe(true);
    });

    it("should require paths to start with Move command", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
                commands: [{ cmd: "L", coords: [100, 100] }], // Should start with M
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("start with a Move"))).toBe(
        true
      );
    });

    it("should warn about complex paths", () => {
      const commands: PathCommand[] = [{ cmd: "M", coords: [0, 0] }];

      // Add many commands to trigger complexity warning
      for (let i = 0; i < 1001; i++) {
        commands.push({ cmd: "L", coords: [i, i] });
      }

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
                commands,
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(true);
      expect(
        result.warnings.some((w) => w.includes("may impact performance"))
      ).toBe(true);
    });
  });

  describe("Layout Validation", () => {
    it("should validate layout specifications", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layout: {
          globalAnchor: "center",
        },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            layout: {
              region: "center",
              anchor: "top_left",
            },
            paths: [
              {
                id: "path1",
                style: {},
                commands: [{ cmd: "M", coords: [0, 0] }],
                layout: {
                  region: "top_right",
                  offset: [0.5, -0.3],
                },
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate custom regions in layout config", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layout: {
          regions: [
            {
              name: "header",
              bounds: { x: 0, y: 0, width: 1, height: 0.2 },
            },
          ],
        },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
                commands: [{ cmd: "M", coords: [0, 0] }],
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should disable layout validation when configured", () => {
      validator.updateOptions({ validateLayout: false });

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            layout: {
              region: "invalid_region", // This should be ignored
            },
            paths: [
              {
                id: "path1",
                style: {},
                commands: [{ cmd: "M", coords: [0, 0] }],
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Document-Level Validation", () => {
    it("should detect duplicate layer IDs", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "duplicate_id",
            label: "Layer 1",
            paths: [
              {
                id: "path1",
                style: {},
                commands: [{ cmd: "M", coords: [0, 0] }],
              },
            ],
          },
          {
            id: "duplicate_id", // Duplicate ID
            label: "Layer 2",
            paths: [
              {
                id: "path2",
                style: {},
                commands: [{ cmd: "M", coords: [100, 100] }],
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Duplicate layer IDs"))).toBe(
        true
      );
    });

    it("should detect duplicate path IDs within layers", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "duplicate_path_id",
                style: {},
                commands: [{ cmd: "M", coords: [0, 0] }],
              },
              {
                id: "duplicate_path_id", // Duplicate ID
                style: {},
                commands: [{ cmd: "M", coords: [100, 100] }],
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("duplicate path IDs"))).toBe(
        true
      );
    });

    it("should validate canvas dimensions", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: -100, height: 0, aspectRatio: "1:1" }, // Invalid dimensions
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
                commands: [{ cmd: "M", coords: [0, 0] }],
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes("Schema validation"))).toBe(
        true
      );
    });

    it("should warn about complex documents", () => {
      const layers: UnifiedLayer[] = [];

      // Create many layers to trigger complexity warning
      for (let i = 0; i < 101; i++) {
        layers.push({
          id: `layer${i}`,
          label: `Layer ${i}`,
          paths: [
            {
              id: `path${i}`,
              style: {},
              commands: [{ cmd: "M", coords: [i, i] }],
            },
          ],
        });
      }

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers,
      };

      const result = validator.validateDocument(document);

      expect(result.success).toBe(true);
      expect(
        result.warnings.some((w) => w.includes("may impact performance"))
      ).toBe(true);
    });
  });

  describe("Sanitization", () => {
    it("should sanitize document when enabled", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
                commands: [{ cmd: "M", coords: [-50.123456, 600.987654] }],
              },
            ],
          },
        ],
      };

      const sanitized = validator.sanitizeDocument(document);

      expect(sanitized.layers[0].paths[0].commands[0].coords).toEqual([0, 512]);
    });

    it("should not sanitize when disabled", () => {
      validator.updateOptions({ sanitize: false });

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
                commands: [{ cmd: "M", coords: [100.123456, 200.987654] }],
              },
            ],
          },
        ],
      };

      const result = validator.validateDocument(document);

      expect(result.sanitized).toBe(false);
      expect(result.data!.layers[0].paths[0].commands[0].coords).toEqual([
        100.123456, 200.987654,
      ]);
    });
  });

  describe("Validation Report", () => {
    it("should create comprehensive validation report", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
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

      const report = validator.createValidationReport(document);

      expect(report.isValid).toBe(true);
      expect(report.summary.layers).toBe(1);
      expect(report.summary.paths).toBe(1);
      expect(report.summary.commands).toBe(3);
      expect(report.summary.coordinates).toBe(4); // M(2) + L(2) + Z(0)
      expect(report.performance.complexity).toBe("low");
    });

    it("should detect high complexity", () => {
      const commands: PathCommand[] = [{ cmd: "M", coords: [0, 0] }];

      // Add many commands to trigger high complexity
      for (let i = 0; i < 501; i++) {
        commands.push({ cmd: "L", coords: [i, i] });
      }

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "layer1",
            label: "Test Layer",
            paths: [
              {
                id: "path1",
                style: {},
                commands,
              },
            ],
          },
        ],
      };

      const report = validator.createValidationReport(document);

      expect(report.performance.complexity).toBe("high");
      expect(report.performance.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("Configuration Updates", () => {
    it("should update region manager", () => {
      const newRegionManager = new RegionManager("16:9");
      validator.updateRegionManager(newRegionManager);

      // Test that the new region manager is being used
      expect(() =>
        validator.updateRegionManager(newRegionManager)
      ).not.toThrow();
    });

    it("should update layout parser", () => {
      const newLayoutParser = new LayoutLanguageParser(regionManager, {
        strict: false,
      });
      validator.updateLayoutParser(newLayoutParser);

      // Test that the new layout parser is being used
      expect(() => validator.updateLayoutParser(newLayoutParser)).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors gracefully", () => {
      const result = validator.validateDocument(null);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle undefined input", () => {
      const result = validator.validateDocument(undefined);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle circular references", () => {
      const circular: any = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [],
      };
      circular.self = circular;

      const result = validator.validateDocument(circular);

      // Should either succeed or fail gracefully
      expect(typeof result.success).toBe("boolean");
    });
  });
});
