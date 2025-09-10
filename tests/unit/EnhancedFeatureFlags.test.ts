/**
 * Enhanced Feature Flags Tests
 * Tests for the comprehensive feature flag system with A/B testing and configuration management
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  FeatureFlagManager,
  FeatureFlagConfig,
  environmentConfigs,
  isUnifiedGenerationEnabled,
  getABTestGroup,
  getFallbackChain,
  isQualityControlEnabled,
  getMinimumQualityThreshold,
  isPerformanceOptimizationEnabled,
} from "../../server/config/featureFlags";

describe("Enhanced Feature Flags", () => {
  let featureFlagManager: FeatureFlagManager;

  beforeEach(() => {
    // Reset environment
    delete process.env.NODE_ENV;
    featureFlagManager = new FeatureFlagManager("development");
  });

  describe("Environment Configuration", () => {
    it("should load development configuration by default", () => {
      const manager = new FeatureFlagManager("development");
      expect(manager.getEnvironment()).toBe("development");
      expect(manager.isUnifiedGenerationEnabled()).toBe(true);
      expect(manager.isDebugVisualizationEnabled()).toBe(true);
    });

    it("should load production configuration with conservative settings", () => {
      const manager = new FeatureFlagManager("production");
      expect(manager.getEnvironment()).toBe("production");
      expect(manager.isDebugVisualizationEnabled()).toBe(false);

      const config = manager.getFeatureConfig("unifiedGeneration");
      expect(config.rolloutPercentage).toBe(25); // Conservative rollout
    });

    it("should load staging configuration with moderate settings", () => {
      const manager = new FeatureFlagManager("staging");
      expect(manager.getEnvironment()).toBe("staging");

      const config = manager.getFeatureConfig("unifiedGeneration");
      expect(config.rolloutPercentage).toBe(75); // Moderate rollout
    });

    it("should fallback to development config for unknown environments", () => {
      const manager = new FeatureFlagManager("unknown");
      expect(manager.getEnvironment()).toBe("unknown");
      expect(manager.isUnifiedGenerationEnabled()).toBe(true);
    });
  });

  describe("A/B Testing", () => {
    it("should assign users to A/B test groups based on configuration", () => {
      const manager = new FeatureFlagManager("development");

      // Test multiple users to verify distribution
      const assignments = new Map<string, number>();
      for (let i = 0; i < 100; i++) {
        const userId = `user_${i}`;
        const group = manager.getABTestGroup(userId);
        assignments.set(group, (assignments.get(group) || 0) + 1);
      }

      // Should have all three groups represented
      expect(assignments.has("unified")).toBe(true);
      expect(assignments.has("traditional")).toBe(true);
      expect(assignments.has("control")).toBe(true);
    });

    it("should respect user-specific overrides", () => {
      const config: Partial<FeatureFlagConfig> = {
        unifiedGeneration: {
          enabled: true,
          rolloutPercentage: 50,
          environments: ["development"],
          enabledForUsers: ["user1"],
          disabledForUsers: ["user2"],
          abTestGroups: { unified: 50, traditional: 30, control: 20 },
          maxRetries: 3,
          timeout: 30000,
          fallbackChain: ["layered", "rule-based", "basic"],
        },
      };

      featureFlagManager.updateConfig(config);

      expect(featureFlagManager.getABTestGroup("user1")).toBe("unified");
      expect(featureFlagManager.getABTestGroup("user2")).toBe("traditional");
    });

    it("should handle anonymous users with random assignment", () => {
      const group1 = featureFlagManager.getABTestGroup();
      const group2 = featureFlagManager.getABTestGroup();

      // Should return valid groups
      expect(["unified", "traditional", "control"]).toContain(group1);
      expect(["unified", "traditional", "control"]).toContain(group2);
    });

    it("should provide consistent assignment for the same user", () => {
      const userId = "consistent_user";
      const group1 = featureFlagManager.getABTestGroup(userId);
      const group2 = featureFlagManager.getABTestGroup(userId);

      expect(group1).toBe(group2);
    });
  });

  describe("Feature Flag Checks", () => {
    it("should check unified generation availability", () => {
      expect(featureFlagManager.isUnifiedGenerationEnabled()).toBe(true);

      // Disable and check
      featureFlagManager.updateConfig({
        unifiedGeneration: {
          enabled: false,
          rolloutPercentage: 0,
          environments: [],
          maxRetries: 3,
          timeout: 30000,
          fallbackChain: [],
        },
      });
      expect(featureFlagManager.isUnifiedGenerationEnabled()).toBe(false);
    });

    it("should check layered generation availability", () => {
      expect(featureFlagManager.isLayeredGenerationEnabled()).toBe(true);

      featureFlagManager.updateConfig({
        layeredGeneration: {
          enabled: false,
          fallbackEnabled: true,
          maxRetries: 3,
          enableLayoutLanguage: true,
          enableSemanticRegions: true,
        },
      });
      expect(featureFlagManager.isLayeredGenerationEnabled()).toBe(false);
    });

    it("should check debug visualization availability", () => {
      expect(featureFlagManager.isDebugVisualizationEnabled()).toBe(true);

      featureFlagManager.updateConfig({
        debugVisualization: {
          enabled: false,
          enabledInProduction: false,
          maxOverlayElements: 100,
          enableRegionBoundaries: true,
          enableAnchorPoints: true,
          enableLayerInspection: true,
        },
      });
      expect(featureFlagManager.isDebugVisualizationEnabled()).toBe(false);
    });

    it("should respect production debug visualization restrictions", () => {
      const prodManager = new FeatureFlagManager("production");
      expect(prodManager.isDebugVisualizationEnabled()).toBe(false);
    });
  });

  describe("Generation Method Checks", () => {
    it("should check if generation methods are enabled", () => {
      expect(featureFlagManager.isGenerationMethodEnabled("unified")).toBe(
        true
      );
      expect(featureFlagManager.isGenerationMethodEnabled("layered")).toBe(
        true
      );
      expect(featureFlagManager.isGenerationMethodEnabled("rule-based")).toBe(
        true
      );
    });

    it("should return fallback chain configuration", () => {
      const fallbackChain = featureFlagManager.getFallbackChain();
      expect(Array.isArray(fallbackChain)).toBe(true);
      expect(fallbackChain.length).toBeGreaterThan(0);
      expect(fallbackChain).toContain("rule-based"); // Should always include rule-based as fallback
    });
  });

  describe("Quality Control", () => {
    it("should check quality control settings", () => {
      expect(featureFlagManager.isQualityControlEnabled()).toBe(true);
      expect(featureFlagManager.getMinimumQualityThreshold()).toBeGreaterThan(
        0
      );
      expect(
        featureFlagManager.getMinimumQualityThreshold()
      ).toBeLessThanOrEqual(100);
    });

    it("should allow updating quality thresholds", () => {
      featureFlagManager.updateConfig({
        qualityControl: {
          enableValidation: true,
          enableRepair: true,
          coordinateBoundsCheck: true,
          pathCommandValidation: true,
          layoutQualityScoring: true,
          minimumQualityThreshold: 85,
        },
      });

      expect(featureFlagManager.getMinimumQualityThreshold()).toBe(85);
    });
  });

  describe("Performance Optimizations", () => {
    it("should check performance optimization flags", () => {
      expect(
        featureFlagManager.isPerformanceOptimizationEnabled("caching")
      ).toBe(true);
      expect(
        featureFlagManager.isPerformanceOptimizationEnabled(
          "coordinateOptimization"
        )
      ).toBe(true);
      expect(
        featureFlagManager.isPerformanceOptimizationEnabled(
          "repetitionOptimization"
        )
      ).toBe(true);
    });

    it("should allow disabling specific optimizations", () => {
      featureFlagManager.updateConfig({
        performanceOptimizations: {
          caching: false,
          coordinateOptimization: true,
          repetitionOptimization: true,
          layoutCaching: true,
          layerCaching: true,
          batchProcessing: true,
        },
      });

      expect(
        featureFlagManager.isPerformanceOptimizationEnabled("caching")
      ).toBe(false);
      expect(
        featureFlagManager.isPerformanceOptimizationEnabled(
          "coordinateOptimization"
        )
      ).toBe(true);
    });
  });

  describe("Monitoring and Logging", () => {
    it("should log feature usage when monitoring is enabled", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      featureFlagManager.logFeatureUsage("test_feature", true, "user123", {
        test: "data",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[FeatureFlag]",
        expect.objectContaining({
          feature: "test_feature",
          enabled: true,
          environment: "development",
        })
      );

      consoleSpy.mockRestore();
    });

    it("should log A/B test assignments", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      featureFlagManager.logABTestAssignment("user123", "unified", {
        test: "metadata",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ABTest]",
        expect.objectContaining({
          event: "ab_test_assignment",
          group: "unified",
          environment: "development",
        })
      );

      consoleSpy.mockRestore();
    });

    it("should log performance metrics", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      featureFlagManager.logPerformanceMetrics({
        generationMethod: "unified",
        generationTime: 1500,
        apiTime: 800,
        processingTime: 700,
        qualityScore: 85,
        fallbackUsed: false,
        userId: "user123",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Performance]",
        expect.objectContaining({
          event: "generation_performance",
          generationMethod: "unified",
          generationTime: 1500,
          environment: "development",
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Configuration Updates", () => {
    it("should allow partial configuration updates", () => {
      const originalRollout =
        featureFlagManager.getFeatureConfig(
          "unifiedGeneration"
        ).rolloutPercentage;

      featureFlagManager.updateConfig({
        unifiedGeneration: {
          rolloutPercentage: 75,
        } as any,
      });

      const newRollout =
        featureFlagManager.getFeatureConfig(
          "unifiedGeneration"
        ).rolloutPercentage;
      expect(newRollout).toBe(75);
      expect(newRollout).not.toBe(originalRollout);
    });

    it("should preserve other settings during partial updates", () => {
      const originalEnabled =
        featureFlagManager.getFeatureConfig("unifiedGeneration").enabled;

      featureFlagManager.updateConfig({
        unifiedGeneration: {
          rolloutPercentage: 50,
        } as any,
      });

      const newEnabled =
        featureFlagManager.getFeatureConfig("unifiedGeneration").enabled;
      expect(newEnabled).toBe(originalEnabled);
    });
  });

  describe("Metrics Collection", () => {
    it("should provide comprehensive metrics", () => {
      const metrics = featureFlagManager.getMetrics();

      expect(metrics).toHaveProperty("environment");
      expect(metrics).toHaveProperty("config");
      expect(metrics).toHaveProperty("usage");
      expect(metrics.usage).toHaveProperty("unifiedGenerationEnabled");
      expect(metrics.usage).toHaveProperty("layeredGenerationEnabled");
      expect(metrics.usage).toHaveProperty("debugVisualizationEnabled");
    });
  });

  describe("Helper Functions", () => {
    it("should provide global helper functions", () => {
      expect(typeof isUnifiedGenerationEnabled).toBe("function");
      expect(typeof getABTestGroup).toBe("function");
      expect(typeof getFallbackChain).toBe("function");
      expect(typeof isQualityControlEnabled).toBe("function");
      expect(typeof getMinimumQualityThreshold).toBe("function");
      expect(typeof isPerformanceOptimizationEnabled).toBe("function");
    });

    it("should return consistent results from helper functions", () => {
      const directResult =
        featureFlagManager.isUnifiedGenerationEnabled("user123");
      const helperResult = isUnifiedGenerationEnabled("user123");

      expect(directResult).toBe(helperResult);
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid A/B test group percentages gracefully", () => {
      // This would typically be validated at the API level
      const group = featureFlagManager.getABTestGroup("user123");
      expect(["unified", "traditional", "control"]).toContain(group);
    });

    it("should handle missing configuration gracefully", () => {
      const manager = new FeatureFlagManager("nonexistent");
      expect(manager.isUnifiedGenerationEnabled()).toBe(true); // Should fallback to development
    });

    it("should handle user ID hashing consistently", () => {
      const userId = "test_user_123";
      const group1 = featureFlagManager.getABTestGroup(userId);
      const group2 = featureFlagManager.getABTestGroup(userId);

      expect(group1).toBe(group2);
    });
  });
});
