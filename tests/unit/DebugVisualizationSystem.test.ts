import { describe, it, expect, beforeEach } from "vitest";
import { DebugVisualizationSystem } from "../../server/services/DebugVisualizationSystem";
import { RegionManager } from "../../server/services/RegionManager";
import { CoordinateMapper } from "../../server/services/CoordinateMapper";
import { LayerManager } from "../../server/services/LayerManager";
import {
  UnifiedLayeredSVGDocument,
  UnifiedLayer,
  UnifiedPath,
  PathCommand,
} from "../../server/types/unified-layered";
import { AspectRatio } from "../../server/services/AspectRatioManager";

describe("DebugVisualizationSystem", () => {
  let debugSystem: DebugVisualizationSystem;
  let regionManager: RegionManager;
  let coordinateMapper: CoordinateMapper;
  let layerManager: LayerManager;

  beforeEach(() => {
    const aspectRatio: AspectRatio = "1:1";
    regionManager = new RegionManager(aspectRatio);
    coordinateMapper = new CoordinateMapper(512, 512, regionManager);
    layerManager = new LayerManager(regionManager, coordinateMapper);
    debugSystem = new DebugVisualizationSystem(
      regionManager,
      coordinateMapper,
      layerManager
    );
  });

  const createSamplePath = (
    id: string,
    commands?: PathCommand[]
  ): UnifiedPath => ({
    id,
    style: { fill: "#000000", stroke: "none" },
    commands: commands || [
      { cmd: "M", coords: [100, 100] },
      { cmd: "L", coords: [200, 200] },
      { cmd: "Z", coords: [] },
    ],
  });

  const createSampleLayer = (
    id: string,
    region: string = "center"
  ): UnifiedLayer => ({
    id,
    label: `${id} Layer`,
    layout: { region, anchor: "center" },
    paths: [createSamplePath(`${id}_path`)],
  });

  const createSampleDocument = (): UnifiedLayeredSVGDocument => ({
    version: "unified-layered-1.0",
    canvas: { width: 512, height: 512, aspectRatio: "1:1" },
    layers: [
      createSampleLayer("layer1", "center"),
      createSampleLayer("layer2", "top_left"),
    ],
  });

  describe("Debug Visualization Generation", () => {
    it("should generate comprehensive debug visualization", () => {
      const document = createSampleDocument();
      const result = debugSystem.generateDebugVisualization(document);

      expect(result.overlayElements.length).toBeGreaterThan(0);
      expect(result.totalElements).toBe(result.overlayElements.length);
      expect(result.renderTime).toBeGreaterThanOrEqual(0);
      expect(result.statistics.regionsShown).toBeGreaterThan(0);
      expect(result.statistics.anchorsShown).toBeGreaterThan(0);
      expect(result.statistics.layersAnalyzed).toBe(2);
    });

    it("should respect visualization options", () => {
      const document = createSampleDocument();
      const options = {
        showRegionBoundaries: false,
        showAnchorPoints: false,
        showLayerStructure: true,
        showLayoutErrors: true,
      };

      const result = debugSystem.generateDebugVisualization(document, options);

      // Should not have region or anchor elements
      const regionElements = result.overlayElements.filter(
        (e) => e.type === "region"
      );
      const anchorElements = result.overlayElements.filter(
        (e) => e.type === "anchor"
      );
      const layerElements = result.overlayElements.filter(
        (e) => e.type === "layer"
      );

      expect(regionElements.length).toBe(0);
      expect(anchorElements.length).toBe(0);
      expect(layerElements.length).toBeGreaterThan(0);
    });

    it("should use different color schemes", () => {
      const document = createSampleDocument();

      const lightResult = debugSystem.generateDebugVisualization(document, {
        colorScheme: "light",
      });
      const darkResult = debugSystem.generateDebugVisualization(document, {
        colorScheme: "dark",
      });
      const contrastResult = debugSystem.generateDebugVisualization(document, {
        colorScheme: "high-contrast",
      });

      expect(lightResult.overlayElements.length).toBeGreaterThan(0);
      expect(darkResult.overlayElements.length).toBeGreaterThan(0);
      expect(contrastResult.overlayElements.length).toBeGreaterThan(0);

      // SVG content should be different due to different colors
      expect(lightResult.overlayElements[0].svg).not.toBe(
        darkResult.overlayElements[0].svg
      );
    });

    it("should handle empty documents gracefully", () => {
      const emptyDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [],
      };

      const result = debugSystem.generateDebugVisualization(emptyDocument);

      expect(result.overlayElements.length).toBeGreaterThan(0); // Should still show regions
      expect(result.statistics.layersAnalyzed).toBe(0);
      expect(result.statistics.errorsFound).toBe(0);
    });
  });

  describe("Coordinate Grid Generation", () => {
    it("should generate coordinate grid when requested", () => {
      const document = createSampleDocument();
      const result = debugSystem.generateDebugVisualization(document, {
        showCoordinateGrid: true,
      });

      const gridElements = result.overlayElements.filter(
        (e) => e.type === "grid"
      );
      expect(gridElements.length).toBe(1);
      expect(gridElements[0].svg).toContain("line");
      expect(gridElements[0].svg).toContain("text");
      expect(gridElements[0].metadata.gridSpacing).toBeDefined();
    });

    it("should not generate coordinate grid by default", () => {
      const document = createSampleDocument();
      const result = debugSystem.generateDebugVisualization(document);

      const gridElements = result.overlayElements.filter(
        (e) => e.type === "grid"
      );
      expect(gridElements.length).toBe(0);
    });
  });

  describe("Region Boundary Visualization", () => {
    it("should generate region boundaries for used regions", () => {
      const document = createSampleDocument();
      const result = debugSystem.generateDebugVisualization(document, {
        showRegionBoundaries: true,
      });

      const regionElements = result.overlayElements.filter(
        (e) => e.type === "region"
      );
      expect(regionElements.length).toBeGreaterThan(0);

      // Should include center and top_left regions (used in document)
      const regionIds = regionElements.map((e) => e.metadata.regionName);
      expect(regionIds).toContain("center");
      expect(regionIds).toContain("top_left");
    });

    it("should show all standard regions", () => {
      const document = createSampleDocument();
      const result = debugSystem.generateDebugVisualization(document, {
        showRegionBoundaries: true,
      });

      const regionElements = result.overlayElements.filter(
        (e) => e.type === "region"
      );

      // Should show all 10 standard regions
      expect(regionElements.length).toBe(10);

      const regionNames = regionElements.map((e) => e.metadata.regionName);
      expect(regionNames).toContain("center");
      expect(regionNames).toContain("top_left");
      expect(regionNames).toContain("bottom_right");
      expect(regionNames).toContain("full_canvas");
    });

    it("should include region metadata", () => {
      const document = createSampleDocument();
      const result = debugSystem.generateDebugVisualization(document, {
        showRegionBoundaries: true,
      });

      const regionElements = result.overlayElements.filter(
        (e) => e.type === "region"
      );
      const centerRegion = regionElements.find(
        (e) => e.metadata.regionName === "center"
      );

      expect(centerRegion).toBeDefined();
      expect(centerRegion?.metadata.bounds).toBeDefined();
      expect(centerRegion?.metadata.isUsed).toBe(true);
      expect(centerRegion?.metadata.normalizedBounds).toBeDefined();
    });
  });

  describe("Anchor Point Visualization", () => {
    it("should generate anchor points for used regions", () => {
      const document = createSampleDocument();
      const result = debugSystem.generateDebugVisualization(document, {
        showAnchorPoints: true,
      });

      const anchorElements = result.overlayElements.filter(
        (e) => e.type === "anchor"
      );
      expect(anchorElements.length).toBeGreaterThan(0);

      // Should include anchors for center and top_left regions
      const anchorRegions = anchorElements.map((e) => e.metadata.regionName);
      expect(anchorRegions).toContain("center");
      expect(anchorRegions).toContain("top_left");
    });

    it("should include anchor metadata", () => {
      const document = createSampleDocument();
      const result = debugSystem.generateDebugVisualization(document, {
        showAnchorPoints: true,
      });

      const anchorElements = result.overlayElements.filter(
        (e) => e.type === "anchor"
      );
      const centerAnchor = anchorElements.find(
        (e) =>
          e.metadata.regionName === "center" &&
          e.metadata.anchorName === "center"
      );

      expect(centerAnchor).toBeDefined();
      expect(centerAnchor?.metadata.position).toBeDefined();
      expect(centerAnchor?.metadata.position.x).toBeCloseTo(256, 1); // Center of 512x512
      expect(centerAnchor?.metadata.position.y).toBeCloseTo(256, 1);
    });
  });

  describe("Offset Vector Visualization", () => {
    it("should generate offset vectors for elements with offsets", () => {
      const layerWithOffset: UnifiedLayer = {
        id: "offset_layer",
        label: "Layer with Offset",
        layout: { region: "center", anchor: "center", offset: [0.2, -0.1] },
        paths: [createSamplePath("path1")],
      };

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [layerWithOffset],
      };

      const result = debugSystem.generateDebugVisualization(document, {
        showOffsetVectors: true,
      });

      const vectorElements = result.overlayElements.filter(
        (e) => e.type === "vector"
      );
      expect(vectorElements.length).toBe(1);
      expect(vectorElements[0].metadata.offset).toEqual([0.2, -0.1]);
      expect(vectorElements[0].svg).toContain("line");
      expect(vectorElements[0].svg).toContain("marker-end");
    });

    it("should not generate vectors for elements without offsets", () => {
      const document = createSampleDocument(); // No offsets in sample document
      const result = debugSystem.generateDebugVisualization(document, {
        showOffsetVectors: true,
      });

      const vectorElements = result.overlayElements.filter(
        (e) => e.type === "vector"
      );
      expect(vectorElements.length).toBe(0);
    });

    it("should handle path-level offsets", () => {
      const pathWithOffset: UnifiedPath = {
        id: "offset_path",
        style: { fill: "#000000" },
        commands: [{ cmd: "M", coords: [0, 0] }],
        layout: { region: "center", anchor: "center", offset: [0.1, 0.1] },
      };

      const layer: UnifiedLayer = {
        id: "layer",
        label: "Layer",
        paths: [pathWithOffset],
      };

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [layer],
      };

      const result = debugSystem.generateDebugVisualization(document, {
        showOffsetVectors: true,
      });

      const vectorElements = result.overlayElements.filter(
        (e) => e.type === "vector"
      );
      expect(vectorElements.length).toBe(1);
      expect(vectorElements[0].metadata.elementId).toBe("offset_path");
    });
  });

  describe("Layer Structure Visualization", () => {
    it("should generate layer structure visualization", () => {
      const document = createSampleDocument();
      const result = debugSystem.generateDebugVisualization(document, {
        showLayerStructure: true,
      });

      const layerElements = result.overlayElements.filter(
        (e) => e.type === "layer"
      );
      expect(layerElements.length).toBe(2);

      const layer1Element = layerElements.find(
        (e) => e.metadata.layerId === "layer1"
      );
      const layer2Element = layerElements.find(
        (e) => e.metadata.layerId === "layer2"
      );

      expect(layer1Element).toBeDefined();
      expect(layer2Element).toBeDefined();
      expect(layer1Element?.metadata.analysis).toBeDefined();
      expect(layer2Element?.metadata.analysis).toBeDefined();
    });

    it("should highlight complexity when requested", () => {
      const complexLayer: UnifiedLayer = {
        id: "complex",
        label: "Complex Layer",
        paths: Array.from({ length: 20 }, (_, i) =>
          createSamplePath(`path_${i}`)
        ),
      };

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [complexLayer],
      };

      const result = debugSystem.generateDebugVisualization(document, {
        showLayerStructure: true,
        highlightComplexity: true,
      });

      const layerElements = result.overlayElements.filter(
        (e) => e.type === "layer"
      );
      expect(layerElements.length).toBe(1);
      expect(layerElements[0].svg).toContain("stroke="); // Should have stroke color
    });
  });

  describe("Layout Error Detection", () => {
    it("should detect out-of-bounds coordinates", () => {
      const pathWithOutOfBounds: UnifiedPath = {
        id: "out_of_bounds_path",
        style: { fill: "#000000" },
        commands: [
          { cmd: "M", coords: [-10, -10] }, // Out of bounds
          { cmd: "L", coords: [600, 600] }, // Out of bounds
        ],
      };

      const layer: UnifiedLayer = {
        id: "error_layer",
        label: "Error Layer",
        paths: [pathWithOutOfBounds],
      };

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [layer],
      };

      const result = debugSystem.generateDebugVisualization(document, {
        showLayoutErrors: true,
      });

      const errorElements = result.overlayElements.filter(
        (e) => e.type === "error"
      );
      expect(errorElements.length).toBeGreaterThan(0);
      expect(result.statistics.errorsFound).toBeGreaterThan(0);
    });

    it("should detect invalid regions", () => {
      const layerWithInvalidRegion: UnifiedLayer = {
        id: "invalid_region_layer",
        label: "Invalid Region Layer",
        layout: { region: "nonexistent_region" },
        paths: [createSamplePath("path1")],
      };

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [layerWithInvalidRegion],
      };

      const result = debugSystem.generateDebugVisualization(document, {
        showLayoutErrors: true,
      });

      const errorElements = result.overlayElements.filter(
        (e) => e.type === "error"
      );
      expect(errorElements.length).toBeGreaterThan(0);

      const invalidRegionError = errorElements.find(
        (e) => e.metadata.type === "invalid_region"
      );
      expect(invalidRegionError).toBeDefined();
      expect(invalidRegionError?.metadata.message).toContain(
        "nonexistent_region"
      );
    });

    it("should provide error suggestions", () => {
      const pathWithOutOfBounds: UnifiedPath = {
        id: "out_of_bounds_path",
        style: { fill: "#000000" },
        commands: [{ cmd: "M", coords: [600, 600] }],
      };

      const layer: UnifiedLayer = {
        id: "error_layer",
        label: "Error Layer",
        paths: [pathWithOutOfBounds],
      };

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [layer],
      };

      const result = debugSystem.generateDebugVisualization(document, {
        showLayoutErrors: true,
      });

      const errorElements = result.overlayElements.filter(
        (e) => e.type === "error"
      );
      expect(errorElements.length).toBeGreaterThan(0);
      expect(errorElements[0].metadata.suggestions).toBeDefined();
      expect(errorElements[0].metadata.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("Performance Metrics Visualization", () => {
    it("should generate performance metrics when requested", () => {
      const document = createSampleDocument();
      const result = debugSystem.generateDebugVisualization(document, {
        showPerformanceMetrics: true,
      });

      const metricElements = result.overlayElements.filter(
        (e) => e.type === "metric"
      );
      expect(metricElements.length).toBe(1);
      expect(metricElements[0].metadata.metrics).toBeDefined();
      expect(metricElements[0].svg).toContain("Performance Metrics");
    });

    it("should calculate accurate performance metrics", () => {
      const complexDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: Array.from({ length: 10 }, (_, i) =>
          createSampleLayer(`layer_${i}`)
        ),
      };

      const result = debugSystem.generateDebugVisualization(complexDocument, {
        showPerformanceMetrics: true,
      });

      const metricElements = result.overlayElements.filter(
        (e) => e.type === "metric"
      );
      const metrics = metricElements[0].metadata.metrics;

      expect(metrics.find((m: any) => m.name === "Layer Count").value).toBe(10);
      expect(metrics.find((m: any) => m.name === "Path Count").value).toBe(10);
      expect(
        metrics.find((m: any) => m.name === "Command Count").value
      ).toBeGreaterThan(0);
    });

    it("should indicate performance warnings", () => {
      const heavyDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: Array.from({ length: 20 }, (_, i) =>
          createSampleLayer(`layer_${i}`)
        ), // > 15 layers
      };

      const result = debugSystem.generateDebugVisualization(heavyDocument, {
        showPerformanceMetrics: true,
      });

      const metricElements = result.overlayElements.filter(
        (e) => e.type === "metric"
      );
      const metrics = metricElements[0].metadata.metrics;
      const layerCountMetric = metrics.find(
        (m: any) => m.name === "Layer Count"
      );

      expect(layerCountMetric.status).toBe("warning");
    });
  });

  describe("SVG Generation", () => {
    it("should generate complete debug overlay SVG", () => {
      const document = createSampleDocument();
      const debugResult = debugSystem.generateDebugVisualization(document);
      const overlaySvg = debugSystem.createDebugOverlaySVG(
        document,
        debugResult
      );

      expect(overlaySvg).toContain("<svg");
      expect(overlaySvg).toContain("xmlns=");
      expect(overlaySvg).toContain("viewBox=");
      expect(overlaySvg).toContain("</svg>");
      expect(overlaySvg).toContain("debug-arrow"); // Arrow marker
    });

    it("should generate arrow marker definition", () => {
      const arrowMarker = debugSystem.generateArrowMarker("light");

      expect(arrowMarker).toContain("<defs>");
      expect(arrowMarker).toContain("<marker");
      expect(arrowMarker).toContain('id="debug-arrow"');
      expect(arrowMarker).toContain("</defs>");
    });

    it("should handle different color schemes in SVG", () => {
      const document = createSampleDocument();
      const debugResult = debugSystem.generateDebugVisualization(document);

      const lightSvg = debugSystem.createDebugOverlaySVG(
        document,
        debugResult,
        { colorScheme: "light" }
      );
      const darkSvg = debugSystem.createDebugOverlaySVG(document, debugResult, {
        colorScheme: "dark",
      });

      expect(lightSvg).not.toBe(darkSvg);
      expect(lightSvg).toContain("svg");
      expect(darkSvg).toContain("svg");
    });
  });

  describe("Debug Summary", () => {
    it("should provide comprehensive debug summary", () => {
      const document = createSampleDocument();
      const debugResult = debugSystem.generateDebugVisualization(document);
      const summary = debugSystem.getDebugSummary(debugResult);

      expect(summary.summary).toContain("Debug visualization generated");
      expect(summary.summary).toContain("elements");
      expect(summary.summary).toContain("ms");
      expect(summary.details.renderTime).toBeDefined();
      expect(summary.details.totalElements).toBeDefined();
      expect(summary.details.statistics).toBeDefined();
      expect(Array.isArray(summary.recommendations)).toBe(true);
    });

    it("should provide recommendations based on findings", () => {
      const documentWithErrors: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          {
            id: "error_layer",
            label: "Error Layer",
            layout: { region: "invalid_region" },
            paths: [createSamplePath("path1")],
          },
        ],
      };

      const debugResult = debugSystem.generateDebugVisualization(
        documentWithErrors,
        {
          showLayoutErrors: true,
        }
      );
      const summary = debugSystem.getDebugSummary(debugResult);

      expect(summary.recommendations.length).toBeGreaterThan(0);
      expect(summary.recommendations.some((r) => r.includes("Fix"))).toBe(true);
    });

    it("should recommend performance improvements for complex documents", () => {
      const complexDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: Array.from({ length: 20 }, (_, i) =>
          createSampleLayer(`layer_${i}`)
        ),
      };

      const debugResult =
        debugSystem.generateDebugVisualization(complexDocument);
      const summary = debugSystem.getDebugSummary(debugResult);

      expect(
        summary.recommendations.some((r) => r.includes("performance"))
      ).toBe(true);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle documents with no layout specifications", () => {
      const minimalLayer: UnifiedLayer = {
        id: "minimal",
        label: "Minimal Layer",
        paths: [
          {
            id: "minimal_path",
            style: { fill: "#000000" },
            commands: [{ cmd: "M", coords: [0, 0] }],
          },
        ],
      };

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [minimalLayer],
      };

      const result = debugSystem.generateDebugVisualization(document);

      expect(result.overlayElements.length).toBeGreaterThan(0);
      expect(result.statistics.layersAnalyzed).toBe(1);
    });

    it("should handle very small canvas sizes", () => {
      const smallDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 50, height: 50, aspectRatio: "1:1" },
        layers: [createSampleLayer("small")],
      };

      const result = debugSystem.generateDebugVisualization(smallDocument);

      expect(result.overlayElements.length).toBeGreaterThan(0);
      expect(result.renderTime).toBeGreaterThanOrEqual(0);
    });

    it("should handle very large canvas sizes", () => {
      const largeDocument: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 2048, height: 2048, aspectRatio: "1:1" },
        layers: [createSampleLayer("large")],
      };

      const result = debugSystem.generateDebugVisualization(largeDocument);

      expect(result.overlayElements.length).toBeGreaterThan(0);
      expect(result.renderTime).toBeGreaterThanOrEqual(0);
    });

    it("should handle paths with only Z commands", () => {
      const pathWithOnlyZ: UnifiedPath = {
        id: "z_only_path",
        style: { fill: "#000000" },
        commands: [{ cmd: "Z", coords: [] }],
      };

      const layer: UnifiedLayer = {
        id: "z_layer",
        label: "Z Layer",
        paths: [pathWithOnlyZ],
      };

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [layer],
      };

      const result = debugSystem.generateDebugVisualization(document, {
        showLayoutErrors: true,
      });

      // Should not crash and should handle gracefully
      expect(result.overlayElements.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle extreme opacity values", () => {
      const document = createSampleDocument();

      const result1 = debugSystem.generateDebugVisualization(document, {
        opacity: 0,
      });
      const result2 = debugSystem.generateDebugVisualization(document, {
        opacity: 1,
      });
      const result3 = debugSystem.generateDebugVisualization(document, {
        opacity: 2,
      }); // > 1

      expect(result1.overlayElements.length).toBeGreaterThan(0);
      expect(result2.overlayElements.length).toBeGreaterThan(0);
      expect(result3.overlayElements.length).toBeGreaterThan(0);
    });
  });
});
