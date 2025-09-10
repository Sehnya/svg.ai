import { describe, it, expect, beforeEach } from "vitest";
import { LayerManager } from "../../server/services/LayerManager";
import { RegionManager } from "../../server/services/RegionManager";
import { CoordinateMapper } from "../../server/services/CoordinateMapper";
import {
  UnifiedLayer,
  UnifiedLayeredSVGDocument,
  UnifiedPath,
  PathCommand,
} from "../../server/types/unified-layered";
import { AspectRatio } from "../../server/services/AspectRatioManager";

describe("LayerManager", () => {
  let layerManager: LayerManager;
  let regionManager: RegionManager;
  let coordinateMapper: CoordinateMapper;

  beforeEach(() => {
    const aspectRatio: AspectRatio = "1:1";
    regionManager = new RegionManager(aspectRatio);
    coordinateMapper = new CoordinateMapper(512, 512, regionManager);
    layerManager = new LayerManager(regionManager, coordinateMapper);
  });

  const createSamplePath = (
    id: string,
    commands?: PathCommand[]
  ): UnifiedPath => ({
    id,
    style: { fill: "#000000", stroke: "none" },
    commands: commands || [
      { cmd: "M", coords: [0, 0] },
      { cmd: "L", coords: [10, 10] },
      { cmd: "Z", coords: [] },
    ],
  });

  const createSampleLayer = (
    id: string,
    pathCount: number = 2
  ): UnifiedLayer => ({
    id,
    label: `${id} Layer`,
    layout: { region: "center", anchor: "center" },
    paths: Array.from({ length: pathCount }, (_, i) =>
      createSamplePath(`${id}_path_${i}`)
    ),
  });

  describe("Layer Analysis", () => {
    it("should analyze a single layer correctly", () => {
      const layer = createSampleLayer("test", 3);
      const analysis = layerManager.analyzeLayer(layer, 512, 512);

      expect(analysis.id).toBe("test");
      expect(analysis.label).toBe("test Layer");
      expect(analysis.pathCount).toBe(3);
      expect(analysis.totalCommands).toBe(9); // 3 commands per path * 3 paths
      expect(analysis.complexity).toBe("low");
      expect(analysis.regions).toContain("center");
      expect(analysis.anchors).toContain("center");
      expect(analysis.bounds).toHaveProperty("x");
      expect(analysis.bounds).toHaveProperty("y");
      expect(analysis.bounds).toHaveProperty("width");
      expect(analysis.bounds).toHaveProperty("height");
      expect(analysis.estimatedRenderTime).toBeGreaterThan(0);
      expect(analysis.memoryUsage).toBeGreaterThan(0);
    });

    it("should determine complexity levels correctly", () => {
      const lowComplexityLayer = createSampleLayer("low", 2);
      const mediumComplexityLayer = createSampleLayer("medium", 10);
      const highComplexityLayer = createSampleLayer("high", 20);

      const lowAnalysis = layerManager.analyzeLayer(
        lowComplexityLayer,
        512,
        512
      );
      const mediumAnalysis = layerManager.analyzeLayer(
        mediumComplexityLayer,
        512,
        512
      );
      const highAnalysis = layerManager.analyzeLayer(
        highComplexityLayer,
        512,
        512
      );

      expect(lowAnalysis.complexity).toBe("low");
      expect(mediumAnalysis.complexity).toBe("medium");
      expect(highAnalysis.complexity).toBe("high");
    });

    it("should cache layer analysis results", () => {
      const layer = createSampleLayer("cached", 5);

      const analysis1 = layerManager.analyzeLayer(layer, 512, 512);
      const analysis2 = layerManager.analyzeLayer(layer, 512, 512);

      expect(analysis1).toBe(analysis2); // Should be the same object reference (cached)
    });

    it("should handle layers with different regions and anchors", () => {
      const layer: UnifiedLayer = {
        id: "multi_region",
        label: "Multi Region Layer",
        layout: { region: "top_left", anchor: "top_left" },
        paths: [
          {
            ...createSamplePath("path1"),
            layout: { region: "center", anchor: "center" },
          },
          {
            ...createSamplePath("path2"),
            layout: { region: "bottom_right", anchor: "bottom_right" },
          },
        ],
      };

      const analysis = layerManager.analyzeLayer(layer, 512, 512);

      expect(analysis.regions).toContain("top_left");
      expect(analysis.regions).toContain("center");
      expect(analysis.regions).toContain("bottom_right");
      expect(analysis.anchors).toContain("top_left");
      expect(analysis.anchors).toContain("center");
      expect(analysis.anchors).toContain("bottom_right");
    });
  });

  describe("Layer Metadata Generation", () => {
    it("should generate metadata for all layers in a document", () => {
      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [
          createSampleLayer("layer1", 2),
          createSampleLayer("layer2", 3),
          createSampleLayer("layer3", 1),
        ],
      };

      const metadata = layerManager.generateLayerMetadata(document);

      expect(metadata).toHaveLength(3);
      expect(metadata[0].id).toBe("layer1");
      expect(metadata[0].pathCount).toBe(2);
      expect(metadata[1].id).toBe("layer2");
      expect(metadata[1].pathCount).toBe(3);
      expect(metadata[2].id).toBe("layer3");
      expect(metadata[2].pathCount).toBe(1);
    });

    it("should include layout information in metadata", () => {
      const layer: UnifiedLayer = {
        id: "positioned_layer",
        label: "Positioned Layer",
        layout: { region: "top_right", anchor: "top_right" },
        paths: [createSamplePath("path1")],
      };

      const document: UnifiedLayeredSVGDocument = {
        version: "unified-layered-1.0",
        canvas: { width: 512, height: 512, aspectRatio: "1:1" },
        layers: [layer],
      };

      const metadata = layerManager.generateLayerMetadata(document);

      expect(metadata[0].region).toBe("top_right");
      expect(metadata[0].anchor).toBe("top_right");
    });
  });

  describe("Layer Validation", () => {
    it("should validate correct layer structure", () => {
      const layers = [
        createSampleLayer("layer1", 2),
        createSampleLayer("layer2", 3),
      ];

      const validation = layerManager.validateLayers(layers);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect duplicate layer IDs", () => {
      const layers = [
        createSampleLayer("duplicate", 2),
        createSampleLayer("duplicate", 3), // Same ID
      ];

      const validation = layerManager.validateLayers(layers);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Duplicate layer ID: duplicate");
    });

    it("should detect layers without IDs", () => {
      const invalidLayer: UnifiedLayer = {
        id: "", // Empty ID
        label: "Invalid Layer",
        paths: [createSamplePath("path1")],
      };

      const validation = layerManager.validateLayers([invalidLayer]);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Layer must have a non-empty ID");
    });

    it("should warn about empty layers", () => {
      const emptyLayer: UnifiedLayer = {
        id: "empty",
        label: "Empty Layer",
        paths: [], // No paths
      };

      const validation = layerManager.validateLayers([emptyLayer]);

      expect(validation.valid).toBe(true); // Not an error, just a warning
      expect(validation.warnings).toContain("Layer empty has no paths");
      expect(validation.suggestions).toContain(
        "Consider removing empty layer empty or adding content"
      );
    });

    it("should detect duplicate path IDs within a layer", () => {
      const layerWithDuplicatePaths: UnifiedLayer = {
        id: "layer_with_duplicates",
        label: "Layer with Duplicate Paths",
        paths: [
          createSamplePath("duplicate_path"),
          createSamplePath("duplicate_path"), // Same path ID
        ],
      };

      const validation = layerManager.validateLayers([layerWithDuplicatePaths]);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        "Duplicate path ID in layer layer_with_duplicates: duplicate_path"
      );
    });

    it("should warn about layers with too many paths", () => {
      const layerWithManyPaths = createSampleLayer("many_paths", 60); // > 50 paths

      const validation = layerManager.validateLayers([layerWithManyPaths]);

      expect(validation.warnings).toContain(
        "Layer many_paths has many paths (60)"
      );
      expect(validation.suggestions).toContain(
        "Consider splitting layer many_paths into multiple layers"
      );
    });

    it("should warn about too many layers", () => {
      const manyLayers = Array.from({ length: 25 }, (_, i) =>
        createSampleLayer(`layer_${i}`, 1)
      );

      const validation = layerManager.validateLayers(manyLayers);

      expect(validation.warnings).toContain(
        "High layer count (25) may impact performance"
      );
      expect(validation.suggestions).toContain(
        "Consider grouping related paths into fewer layers"
      );
    });

    it("should suggest better naming for generic layer names", () => {
      const genericLayers = [
        { ...createSampleLayer("layer1", 1), id: "layer1", label: "layer1" },
        { ...createSampleLayer("group2", 1), id: "group2", label: "group2" },
      ];

      const validation = layerManager.validateLayers(genericLayers);

      expect(
        validation.suggestions.some((s) => s.includes("more descriptive names"))
      ).toBe(true);
    });
  });

  describe("Layer Optimization", () => {
    it("should identify empty layers for removal", () => {
      const layers = [
        createSampleLayer("normal", 2),
        { ...createSampleLayer("empty", 0), paths: [] },
        createSampleLayer("another_normal", 1),
      ];

      const optimization = layerManager.optimizeLayers(layers);

      expect(optimization.originalLayerCount).toBe(3);
      expect(optimization.removedLayers).toContain("empty");
      expect(optimization.optimizations).toContain("Removed 1 empty layers");
      expect(optimization.performanceGain).toBeGreaterThan(0);
    });

    it("should identify layers that can be merged", () => {
      const similarLayer1: UnifiedLayer = {
        id: "similar1",
        label: "Similar Layer 1",
        layout: { region: "center" },
        paths: [
          { ...createSamplePath("path1"), style: { fill: "#ff0000" } },
          { ...createSamplePath("path2"), style: { fill: "#ff0000" } },
        ],
      };

      const similarLayer2: UnifiedLayer = {
        id: "similar2",
        label: "Similar Layer 2",
        layout: { region: "center" },
        paths: [
          { ...createSamplePath("path3"), style: { fill: "#ff0000" } },
          { ...createSamplePath("path4"), style: { fill: "#ff0000" } },
        ],
      };

      const layers = [similarLayer1, similarLayer2];
      const optimization = layerManager.optimizeLayers(layers);

      expect(optimization.mergedLayers.length).toBeGreaterThan(0);
      expect(
        optimization.optimizations.some((opt) => opt.includes("Merged"))
      ).toBe(true);
    });

    it("should cache optimization results", () => {
      const layers = [createSampleLayer("test", 2)];

      const optimization1 = layerManager.optimizeLayers(layers);
      const optimization2 = layerManager.optimizeLayers(layers);

      expect(optimization1).toBe(optimization2); // Should be the same object reference (cached)
    });

    it("should calculate performance gain correctly", () => {
      const layers = [
        createSampleLayer("normal", 2),
        { ...createSampleLayer("empty1", 0), paths: [] },
        { ...createSampleLayer("empty2", 0), paths: [] },
      ];

      const optimization = layerManager.optimizeLayers(layers);

      expect(optimization.originalLayerCount).toBe(3);
      expect(optimization.optimizedLayerCount).toBe(1);
      expect(optimization.performanceGain).toBeCloseTo(66.67, 1); // 2/3 * 100
    });
  });

  describe("Layer Hierarchy", () => {
    it("should create layer hierarchy", () => {
      const layers = [
        createSampleLayer("base", 1),
        createSampleLayer("middle", 1),
        createSampleLayer("top", 1),
      ];

      const hierarchy = layerManager.createLayerHierarchy(layers);

      expect(hierarchy).toHaveLength(3);
      expect(hierarchy[0].id).toBe("base");
      expect(hierarchy[0].level).toBe(0);
      expect(hierarchy[1].id).toBe("middle");
      expect(hierarchy[2].id).toBe("top");
    });

    it("should identify parent-child relationships", () => {
      const layers = [
        { ...createSampleLayer("parent", 1), layout: { region: "center" } },
        { ...createSampleLayer("child", 1), layout: { region: "center" } },
      ];

      const hierarchy = layerManager.createLayerHierarchy(layers);

      expect(hierarchy[1].parent).toBe("parent");
      expect(hierarchy[0].children).toContain("child");
    });

    it("should identify layer dependencies", () => {
      const layers = [
        { ...createSampleLayer("layer1", 1), layout: { region: "center" } },
        { ...createSampleLayer("layer2", 1), layout: { region: "center" } },
        { ...createSampleLayer("layer3", 1), layout: { region: "top_left" } },
      ];

      const hierarchy = layerManager.createLayerHierarchy(layers);

      // Layers in the same region should be related
      expect(hierarchy[0].dependencies).toContain("layer2");
      expect(hierarchy[1].dependencies).toContain("layer1");
      expect(hierarchy[2].dependencies).not.toContain("layer1");
    });
  });

  describe("Layer Grouping", () => {
    it("should group layers by region", () => {
      const layers = [
        { ...createSampleLayer("center1", 1), layout: { region: "center" } },
        { ...createSampleLayer("center2", 1), layout: { region: "center" } },
        { ...createSampleLayer("top1", 1), layout: { region: "top_left" } },
        { ...createSampleLayer("top2", 1), layout: { region: "top_left" } },
      ];

      const groups = layerManager.groupLayersByPurpose(layers);

      const centerGroup = groups.find((g) => g.name === "center_group");
      const topGroup = groups.find((g) => g.name === "top_left_group");

      expect(centerGroup).toBeDefined();
      expect(centerGroup?.layers).toContain("center1");
      expect(centerGroup?.layers).toContain("center2");

      expect(topGroup).toBeDefined();
      expect(topGroup?.layers).toContain("top1");
      expect(topGroup?.layers).toContain("top2");
    });

    it("should group layers by semantic similarity", () => {
      const layers = [
        { ...createSampleLayer("house_roof", 1), label: "House Roof" },
        { ...createSampleLayer("house_wall", 1), label: "House Wall" },
        { ...createSampleLayer("tree_trunk", 1), label: "Tree Trunk" },
        { ...createSampleLayer("tree_leaves", 1), label: "Tree Leaves" },
      ];

      const groups = layerManager.groupLayersByPurpose(layers);

      const houseGroup = groups.find((g) => g.name.includes("house"));
      const treeGroup = groups.find((g) => g.name.includes("tree"));

      expect(houseGroup).toBeDefined();
      expect(houseGroup?.layers).toContain("house_roof");
      expect(houseGroup?.layers).toContain("house_wall");

      expect(treeGroup).toBeDefined();
      expect(treeGroup?.layers).toContain("tree_trunk");
      expect(treeGroup?.layers).toContain("tree_leaves");
    });

    it("should assign priorities to groups", () => {
      const layers = [
        { ...createSampleLayer("center1", 1), layout: { region: "center" } },
        { ...createSampleLayer("center2", 1), layout: { region: "center" } },
      ];

      const groups = layerManager.groupLayersByPurpose(layers);
      const centerGroup = groups.find((g) => g.name === "center_group");

      expect(centerGroup?.priority).toBe(10); // Center should have high priority
    });
  });

  describe("Layer Statistics", () => {
    it("should calculate comprehensive layer statistics", () => {
      const layers = [
        createSampleLayer("layer1", 2), // 2 paths, 6 commands
        createSampleLayer("layer2", 3), // 3 paths, 9 commands
        { ...createSampleLayer("layer3", 1), layout: { region: "top_left" } }, // 1 path, 3 commands
      ];

      const stats = layerManager.getLayerStatistics(layers);

      expect(stats.totalLayers).toBe(3);
      expect(stats.totalPaths).toBe(6);
      expect(stats.totalCommands).toBe(18);
      expect(stats.averagePathsPerLayer).toBe(2);
      expect(stats.averageCommandsPerPath).toBe(3);
      expect(stats.regionDistribution.center).toBe(2);
      expect(stats.regionDistribution.top_left).toBe(1);
      expect(stats.complexityDistribution.low).toBe(3);
      expect(stats.estimatedRenderTime).toBeGreaterThan(0);
      expect(stats.estimatedMemoryUsage).toBeGreaterThan(0);
    });

    it("should handle empty layer arrays", () => {
      const stats = layerManager.getLayerStatistics([]);

      expect(stats.totalLayers).toBe(0);
      expect(stats.totalPaths).toBe(0);
      expect(stats.totalCommands).toBe(0);
      expect(stats.averagePathsPerLayer).toBeNaN();
      expect(stats.averageCommandsPerPath).toBeNaN();
    });
  });

  describe("Cache Management", () => {
    it("should provide cache statistics", () => {
      const layer = createSampleLayer("test", 2);

      // Trigger some cache entries
      layerManager.analyzeLayer(layer, 512, 512);
      layerManager.optimizeLayers([layer]);

      const stats = layerManager.getCacheStats();

      expect(stats.layerCacheSize).toBeGreaterThan(0);
      expect(stats.optimizationCacheSize).toBeGreaterThan(0);
    });

    it("should clear all caches", () => {
      const layer = createSampleLayer("test", 2);

      // Add some cache entries
      layerManager.analyzeLayer(layer, 512, 512);
      layerManager.optimizeLayers([layer]);

      let stats = layerManager.getCacheStats();
      expect(stats.layerCacheSize).toBeGreaterThan(0);
      expect(stats.optimizationCacheSize).toBeGreaterThan(0);

      // Clear cache
      layerManager.clearCache();

      stats = layerManager.getCacheStats();
      expect(stats.layerCacheSize).toBe(0);
      expect(stats.optimizationCacheSize).toBe(0);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle layers with no paths gracefully", () => {
      const emptyLayer: UnifiedLayer = {
        id: "empty",
        label: "Empty Layer",
        paths: [],
      };

      const analysis = layerManager.analyzeLayer(emptyLayer, 512, 512);

      expect(analysis.pathCount).toBe(0);
      expect(analysis.totalCommands).toBe(0);
      expect(analysis.bounds.width).toBe(0);
      expect(analysis.bounds.height).toBe(0);
    });

    it("should handle paths with no commands", () => {
      const pathWithNoCommands: UnifiedPath = {
        id: "empty_path",
        style: { fill: "#000000" },
        commands: [],
      };

      const layer: UnifiedLayer = {
        id: "layer_with_empty_path",
        label: "Layer with Empty Path",
        paths: [pathWithNoCommands],
      };

      const validation = layerManager.validateLayers([layer]);

      expect(validation.warnings).toContain(
        "Path empty_path in layer layer_with_empty_path has no commands"
      );
    });

    it("should handle invalid regions in layout", () => {
      const layerWithInvalidRegion: UnifiedLayer = {
        id: "invalid_region_layer",
        label: "Invalid Region Layer",
        layout: { region: "nonexistent_region" },
        paths: [createSamplePath("path1")],
      };

      const validation = layerManager.validateLayers([layerWithInvalidRegion]);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Invalid region: nonexistent_region");
    });

    it("should handle extreme offset values", () => {
      const layerWithExtremeOffset: UnifiedLayer = {
        id: "extreme_offset_layer",
        label: "Extreme Offset Layer",
        layout: { region: "center", offset: [5, -3] }, // Large offsets
        paths: [createSamplePath("path1")],
      };

      const validation = layerManager.validateLayers([layerWithExtremeOffset]);

      expect(
        validation.warnings.some((w) => w.includes("Large offset values"))
      ).toBe(true);
    });

    it("should handle layers with complex path commands", () => {
      const complexCommands: PathCommand[] = [
        { cmd: "M", coords: [0, 0] },
        { cmd: "C", coords: [10, 0, 20, 10, 30, 10] },
        { cmd: "Q", coords: [40, 20, 50, 30] },
        { cmd: "L", coords: [60, 40] },
        { cmd: "Z", coords: [] },
      ];

      const complexPath = createSamplePath("complex", complexCommands);
      const layer: UnifiedLayer = {
        id: "complex_layer",
        label: "Complex Layer",
        paths: [complexPath],
      };

      const analysis = layerManager.analyzeLayer(layer, 512, 512);

      expect(analysis.totalCommands).toBe(5);
      expect(analysis.complexity).toBe("low"); // Still low due to single path
    });
  });
});
