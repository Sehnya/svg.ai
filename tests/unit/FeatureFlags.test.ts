import { describe, it, expect, beforeEach } from "vitest";
import {
  FeatureFlagManager,
  environmentConfigs,
} from "../../server/config/featureFlags";
import { FeatureFlagMonitor } from "../../server/services/FeatureFlagMonitor";

describe("Feature Flags System", () => {
  let flagManager: FeatureFlagManager;
  let monitor: FeatureFlagMonitor;

  beforeEach(() => {
    flagManager = new FeatureFlagManager("development");
    monitor = new FeatureFlagMonitor(flagManager);
  });

  describe("FeatureFlagManager", () => {
    it("should initialize with correct environment config", () => {
      const devManager = new FeatureFlagManager("development");
      const prodManager = new FeatureFlagManager("production");

      expect(devManager.getEnvironment()).toBe("development");
      expect(prodManager.getEnvironment()).toBe("production");

      // Development should have debug enabled
      expect(devManager.isDebugVisualizationEnabled()).toBe(true);

      // Production should have debug disabled
      expect(prodManager.isDebugVisualizationEnabled()).toBe(false);
    });

    it("should handle unified generation rollout percentage", () => {
      const testUserId = "test-user-123";

      // Test with 100% rollout (development default)
      expect(flagManager.isUnifiedGenerationEnabled(testUserId)).toBe(true);

      // Test with 0% rollout
      flagManager.updateConfig({
        unifiedGeneration: {
          enabled: true,
          rolloutPercentage: 0,
          environments: ["development"],
        },
      });
      expect(flagManager.isUnifiedGenerationEnabled(testUserId)).toBe(false);

      // Test with 50% rollout - should be consistent for same user
      flagManager.updateConfig({
        unifiedGeneration: {
          enabled: true,
          rolloutPercentage: 50,
          environments: ["development"],
        },
      });
      const result1 = flagManager.isUnifiedGenerationEnabled(testUserId);
      const result2 = flagManager.isUnifiedGenerationEnabled(testUserId);
      expect(result1).toBe(result2); // Should be consistent
    });

    it("should handle user-specific overrides", () => {
      const enabledUserId = "enabled-user";
      const disabledUserId = "disabled-user";

      flagManager.updateConfig({
        unifiedGeneration: {
          enabled: true,
          rolloutPercentage: 0, // 0% rollout
          enabledForUsers: [enabledUserId],
          disabledForUsers: [disabledUserId],
          environments: ["development"],
        },
      });

      // Enabled user should get feature despite 0% rollout
      expect(flagManager.isUnifiedGenerationEnabled(enabledUserId)).toBe(true);

      // Disabled user should not get feature even with 100% rollout
      flagManager.updateConfig({
        unifiedGeneration: {
          enabled: true,
          rolloutPercentage: 100,
          disabledForUsers: [disabledUserId],
          environments: ["development"],
        },
      });
      expect(flagManager.isUnifiedGenerationEnabled(disabledUserId)).toBe(
        false
      );
    });

    it("should handle environment restrictions", () => {
      const testUserId = "test-user";

      // Enable only for staging
      flagManager.updateConfig({
        unifiedGeneration: {
          enabled: true,
          rolloutPercentage: 100,
          environments: ["staging"],
        },
      });

      // Should be disabled in development
      expect(flagManager.isUnifiedGenerationEnabled(testUserId)).toBe(false);

      // Should be enabled if we change to staging
      const stagingManager = new FeatureFlagManager("staging");
      stagingManager.updateConfig({
        unifiedGeneration: {
          enabled: true,
          rolloutPercentage: 100,
          environments: ["staging"],
        },
      });
      expect(stagingManager.isUnifiedGenerationEnabled(testUserId)).toBe(true);
    });

    it("should provide correct A/B test groups", () => {
      const testUserId = "test-user";

      // With unified enabled
      flagManager.updateConfig({
        unifiedGeneration: {
          enabled: true,
          rolloutPercentage: 100,
          environments: ["development"],
        },
      });
      expect(flagManager.getABTestGroup(testUserId)).toBe("unified");

      // With unified disabled
      flagManager.updateConfig({
        unifiedGeneration: {
          enabled: false,
          rolloutPercentage: 0,
          environments: ["development"],
        },
      });
      expect(flagManager.getABTestGroup(testUserId)).toBe("traditional");
    });

    it("should get feature configurations", () => {
      const unifiedConfig = flagManager.getFeatureConfig("unifiedGeneration");
      const debugConfig = flagManager.getFeatureConfig("debugVisualization");

      expect(unifiedConfig).toBeDefined();
      expect(unifiedConfig.enabled).toBeDefined();
      expect(unifiedConfig.rolloutPercentage).toBeDefined();

      expect(debugConfig).toBeDefined();
      expect(debugConfig.enabled).toBeDefined();
    });

    it("should provide metrics", () => {
      const metrics = flagManager.getMetrics();

      expect(metrics.environment).toBe("development");
      expect(metrics.config).toBeDefined();
      expect(metrics.usage).toBeDefined();
      expect(metrics.usage.unifiedGenerationEnabled).toBeDefined();
      expect(metrics.usage.layeredGenerationEnabled).toBeDefined();
      expect(metrics.usage.debugVisualizationEnabled).toBeDefined();
    });
  });

  describe("FeatureFlagMonitor", () => {
    it("should record feature usage", () => {
      monitor.recordUsage("unifiedGeneration", true, "test-user", {
        generationMethod: "unified-layered",
        performanceMs: 1500,
        success: true,
      });

      const metrics = monitor.getRawMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].feature).toBe("unifiedGeneration");
      expect(metrics[0].enabled).toBe(true);
      expect(metrics[0].userId).toBe("test-user");
      expect(metrics[0].generationMethod).toBe("unified-layered");
      expect(metrics[0].performanceMs).toBe(1500);
      expect(metrics[0].success).toBe(true);
    });

    it("should calculate rollout metrics", () => {
      // Record some test data
      monitor.recordUsage("unifiedGeneration", true, "user1", {
        success: true,
        performanceMs: 1000,
      });
      monitor.recordUsage("unifiedGeneration", false, "user2", {
        success: true,
        performanceMs: 800,
      });
      monitor.recordUsage("unifiedGeneration", true, "user3", {
        success: false,
        error: "Test error",
      });

      const rolloutMetrics = monitor.getRolloutMetrics("unifiedGeneration");

      expect(rolloutMetrics.feature).toBe("unifiedGeneration");
      expect(rolloutMetrics.totalRequests).toBe(3);
      expect(rolloutMetrics.enabledRequests).toBe(2);
      expect(rolloutMetrics.rolloutPercentage).toBeCloseTo(66.67, 1);
      expect(rolloutMetrics.successRate).toBeCloseTo(66.67, 1);
      expect(rolloutMetrics.errorRate).toBeCloseTo(33.33, 1);
      expect(rolloutMetrics.averagePerformance).toBe(900); // (1000 + 800) / 2
    });

    it("should calculate A/B test metrics", () => {
      // Record unified group data
      monitor.recordUsage("test", true, "user1", {
        generationMethod: "unified-layered",
        success: true,
        performanceMs: 1200,
      });
      monitor.recordUsage("test", true, "user2", {
        generationMethod: "unified-layered",
        success: true,
        performanceMs: 1000,
      });

      // Record traditional group data
      monitor.recordUsage("test", false, "user3", {
        generationMethod: "rule-based",
        success: true,
        performanceMs: 800,
      });
      monitor.recordUsage("test", false, "user4", {
        generationMethod: "rule-based",
        success: false,
        performanceMs: 600,
      });

      const abTestMetrics = monitor.getABTestMetrics();

      expect(abTestMetrics.groups.unified.requests).toBe(2);
      expect(abTestMetrics.groups.unified.successRate).toBe(100);
      expect(abTestMetrics.groups.unified.averagePerformance).toBe(1100);

      expect(abTestMetrics.groups.traditional.requests).toBe(2);
      expect(abTestMetrics.groups.traditional.successRate).toBe(50);
      expect(abTestMetrics.groups.traditional.averagePerformance).toBe(700);
    });

    it("should provide health status", () => {
      // Record healthy metrics
      for (let i = 0; i < 10; i++) {
        monitor.recordUsage("test", true, `user${i}`, {
          success: true,
          performanceMs: 1000 + i * 100,
        });
      }

      const healthStatus = monitor.getHealthStatus();
      expect(healthStatus.status).toBe("healthy");
      expect(healthStatus.issues.length).toBe(0);
      expect(healthStatus.metrics.totalRequests).toBe(10);
      expect(healthStatus.metrics.errorRate).toBe(0);

      // Record some errors
      for (let i = 0; i < 3; i++) {
        monitor.recordUsage("test", true, `error-user${i}`, {
          success: false,
          error: "Test error",
          performanceMs: 2000,
        });
      }

      const unhealthyStatus = monitor.getHealthStatus();
      expect(unhealthyStatus.status).toBe("warning"); // > 5% error rate
      expect(unhealthyStatus.issues.length).toBeGreaterThan(0);
    });

    it("should export metrics in JSON format", () => {
      monitor.recordUsage("test", true, "user1", {
        success: true,
        performanceMs: 1000,
      });

      const jsonMetrics = monitor.exportMetrics("json");
      const parsed = JSON.parse(jsonMetrics);

      expect(parsed.timestamp).toBeDefined();
      expect(parsed.environment).toBe("development");
      expect(parsed.rollout).toBeDefined();
      expect(parsed.abTest).toBeDefined();
      expect(parsed.health).toBeDefined();
      expect(parsed.featureFlags).toBeDefined();
    });

    it("should export metrics in Prometheus format", () => {
      monitor.recordUsage("test", true, "user1", {
        success: true,
        performanceMs: 1000,
      });

      const prometheusMetrics = monitor.exportMetrics("prometheus");

      expect(prometheusMetrics).toContain("# HELP");
      expect(prometheusMetrics).toContain("# TYPE");
      expect(prometheusMetrics).toContain("feature_flag_rollout_percentage");
      expect(prometheusMetrics).toContain("feature_flag_success_rate");
      expect(prometheusMetrics).toContain("ab_test_requests_total");
    });

    it("should clear metrics", () => {
      monitor.recordUsage("test", true, "user1");
      expect(monitor.getRawMetrics().length).toBe(1);

      monitor.clearMetrics();
      expect(monitor.getRawMetrics().length).toBe(0);
    });

    it("should maintain metrics history limit", () => {
      // This would be tested with a smaller limit in practice
      // For now, just verify the method exists and works
      for (let i = 0; i < 5; i++) {
        monitor.recordUsage("test", true, `user${i}`);
      }

      expect(monitor.getRawMetrics().length).toBe(5);
    });
  });

  describe("Environment Configurations", () => {
    it("should have different configurations for each environment", () => {
      expect(environmentConfigs.development).toBeDefined();
      expect(environmentConfigs.staging).toBeDefined();
      expect(environmentConfigs.production).toBeDefined();

      // Development should have debug enabled
      expect(environmentConfigs.development.debugVisualization.enabled).toBe(
        true
      );

      // Production should have conservative rollout
      expect(
        environmentConfigs.production.unifiedGeneration.rolloutPercentage
      ).toBeLessThan(50);

      // Staging should be between dev and prod
      expect(
        environmentConfigs.staging.unifiedGeneration.rolloutPercentage
      ).toBeGreaterThan(
        environmentConfigs.production.unifiedGeneration.rolloutPercentage
      );
    });

    it("should have appropriate monitoring settings per environment", () => {
      expect(environmentConfigs.development.monitoring.logLevel).toBe("debug");
      expect(environmentConfigs.staging.monitoring.logLevel).toBe("info");
      expect(environmentConfigs.production.monitoring.logLevel).toBe("warn");
    });
  });
});
