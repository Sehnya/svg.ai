/**
 * Feature Flags Configuration for Unified SVG Generation System
 * Enables gradual rollout and A/B testing between generation methods
 */

export interface FeatureFlagConfig {
  unifiedGeneration: {
    enabled: boolean;
    rolloutPercentage: number; // 0-100
    enabledForUsers?: string[]; // Specific user IDs
    disabledForUsers?: string[]; // Specific user IDs to exclude
    environments: string[]; // Environments where this is enabled
    abTestGroups?: {
      unified: number; // Percentage for unified generation
      traditional: number; // Percentage for traditional generation
      control: number; // Percentage for control group (rule-based)
    };
    maxRetries: number;
    timeout: number; // API timeout in milliseconds
    fallbackChain: ("layered" | "rule-based" | "basic")[];
  };
  layeredGeneration: {
    enabled: boolean;
    fallbackEnabled: boolean;
    maxRetries: number;
    enableLayoutLanguage: boolean;
    enableSemanticRegions: boolean;
  };
  debugVisualization: {
    enabled: boolean;
    enabledInProduction: boolean;
    maxOverlayElements: number;
    enableRegionBoundaries: boolean;
    enableAnchorPoints: boolean;
    enableLayerInspection: boolean;
  };
  performanceOptimizations: {
    caching: boolean;
    coordinateOptimization: boolean;
    repetitionOptimization: boolean;
    layoutCaching: boolean;
    layerCaching: boolean;
    batchProcessing: boolean;
  };
  monitoring: {
    enabled: boolean;
    logLevel: "error" | "warn" | "info" | "debug";
    metricsCollection: boolean;
    performanceTracking: boolean;
    abTestTracking: boolean;
    errorReporting: boolean;
    usageAnalytics: boolean;
  };
  qualityControl: {
    enableValidation: boolean;
    enableRepair: boolean;
    coordinateBoundsCheck: boolean;
    pathCommandValidation: boolean;
    layoutQualityScoring: boolean;
    minimumQualityThreshold: number; // 0-100
  };
  apiConfiguration: {
    enableRateLimiting: boolean;
    maxRequestsPerMinute: number;
    enableCaching: boolean;
    cacheMaxSize: number;
    cacheTTLMinutes: number;
    enableCompression: boolean;
  };
}

export interface EnvironmentConfig {
  development: FeatureFlagConfig;
  staging: FeatureFlagConfig;
  production: FeatureFlagConfig;
}

// Default configuration
const defaultConfig: FeatureFlagConfig = {
  unifiedGeneration: {
    enabled: true,
    rolloutPercentage: 100,
    environments: ["development", "staging", "production"],
    abTestGroups: {
      unified: 70,
      traditional: 20,
      control: 10,
    },
    maxRetries: 3,
    timeout: 30000,
    fallbackChain: ["layered", "rule-based", "basic"],
  },
  layeredGeneration: {
    enabled: true,
    fallbackEnabled: true,
    maxRetries: 3,
    enableLayoutLanguage: true,
    enableSemanticRegions: true,
  },
  debugVisualization: {
    enabled: true,
    enabledInProduction: false,
    maxOverlayElements: 100,
    enableRegionBoundaries: true,
    enableAnchorPoints: true,
    enableLayerInspection: true,
  },
  performanceOptimizations: {
    caching: true,
    coordinateOptimization: true,
    repetitionOptimization: true,
    layoutCaching: true,
    layerCaching: true,
    batchProcessing: true,
  },
  monitoring: {
    enabled: true,
    logLevel: "info",
    metricsCollection: true,
    performanceTracking: true,
    abTestTracking: true,
    errorReporting: true,
    usageAnalytics: true,
  },
  qualityControl: {
    enableValidation: true,
    enableRepair: true,
    coordinateBoundsCheck: true,
    pathCommandValidation: true,
    layoutQualityScoring: true,
    minimumQualityThreshold: 70,
  },
  apiConfiguration: {
    enableRateLimiting: true,
    maxRequestsPerMinute: 60,
    enableCaching: true,
    cacheMaxSize: 1000,
    cacheTTLMinutes: 60,
    enableCompression: true,
  },
};

// Environment-specific configurations
export const environmentConfigs: EnvironmentConfig = {
  development: {
    ...defaultConfig,
    unifiedGeneration: {
      ...defaultConfig.unifiedGeneration,
      rolloutPercentage: 100, // Full rollout in development
      abTestGroups: {
        unified: 80,
        traditional: 15,
        control: 5,
      },
    },
    debugVisualization: {
      ...defaultConfig.debugVisualization,
      enabled: true,
      enabledInProduction: false,
    },
    monitoring: {
      ...defaultConfig.monitoring,
      logLevel: "debug",
    },
    apiConfiguration: {
      ...defaultConfig.apiConfiguration,
      maxRequestsPerMinute: 120, // Higher limits for development
    },
  },
  staging: {
    ...defaultConfig,
    unifiedGeneration: {
      ...defaultConfig.unifiedGeneration,
      rolloutPercentage: 75, // 75% rollout in staging
      abTestGroups: {
        unified: 60,
        traditional: 25,
        control: 15,
      },
    },
    debugVisualization: {
      ...defaultConfig.debugVisualization,
      enabled: true,
      enabledInProduction: false,
    },
    monitoring: {
      ...defaultConfig.monitoring,
      logLevel: "info",
    },
    qualityControl: {
      ...defaultConfig.qualityControl,
      minimumQualityThreshold: 75, // Higher quality threshold in staging
    },
  },
  production: {
    ...defaultConfig,
    unifiedGeneration: {
      ...defaultConfig.unifiedGeneration,
      rolloutPercentage: 25, // Conservative 25% rollout in production
      abTestGroups: {
        unified: 50,
        traditional: 30,
        control: 20,
      },
      timeout: 20000, // Shorter timeout in production
    },
    debugVisualization: {
      ...defaultConfig.debugVisualization,
      enabled: false,
      enabledInProduction: false,
    },
    monitoring: {
      ...defaultConfig.monitoring,
      logLevel: "warn",
      errorReporting: true,
    },
    qualityControl: {
      ...defaultConfig.qualityControl,
      minimumQualityThreshold: 80, // Highest quality threshold in production
    },
    apiConfiguration: {
      ...defaultConfig.apiConfiguration,
      maxRequestsPerMinute: 30, // Conservative rate limiting in production
    },
  },
};

export class FeatureFlagManager {
  private config: FeatureFlagConfig;
  private environment: string;

  constructor(environment: string = process.env.NODE_ENV || "development") {
    this.environment = environment;
    this.config = this.getEnvironmentConfig(environment);
  }

  private getEnvironmentConfig(env: string): FeatureFlagConfig {
    const envConfig = environmentConfigs[env as keyof EnvironmentConfig];
    return envConfig || environmentConfigs.development;
  }

  /**
   * Check if unified generation is enabled for a specific user
   */
  isUnifiedGenerationEnabled(userId?: string): boolean {
    const { unifiedGeneration } = this.config;

    if (!unifiedGeneration.enabled) {
      return false;
    }

    // Check environment
    if (!unifiedGeneration.environments.includes(this.environment)) {
      return false;
    }

    // Check user-specific overrides
    if (userId) {
      if (unifiedGeneration.disabledForUsers?.includes(userId)) {
        return false;
      }
      if (unifiedGeneration.enabledForUsers?.includes(userId)) {
        return true;
      }
    }

    // Check rollout percentage
    if (userId) {
      const userHash = this.hashUserId(userId);
      return userHash < unifiedGeneration.rolloutPercentage;
    }

    // For anonymous users, use random rollout
    return Math.random() * 100 < unifiedGeneration.rolloutPercentage;
  }

  /**
   * Check if layered generation is enabled
   */
  isLayeredGenerationEnabled(): boolean {
    return this.config.layeredGeneration.enabled;
  }

  /**
   * Check if debug visualization is enabled
   */
  isDebugVisualizationEnabled(): boolean {
    const { debugVisualization } = this.config;

    if (!debugVisualization.enabled) {
      return false;
    }

    if (
      this.environment === "production" &&
      !debugVisualization.enabledInProduction
    ) {
      return false;
    }

    return true;
  }

  /**
   * Get A/B test group for a user based on configured percentages
   */
  getABTestGroup(userId?: string): "unified" | "traditional" | "control" {
    const { unifiedGeneration } = this.config;

    if (!unifiedGeneration.enabled || !unifiedGeneration.abTestGroups) {
      return "traditional";
    }

    // Check environment
    if (!unifiedGeneration.environments.includes(this.environment)) {
      return "traditional";
    }

    // Check user-specific overrides
    if (userId) {
      if (unifiedGeneration.disabledForUsers?.includes(userId)) {
        return "traditional";
      }
      if (unifiedGeneration.enabledForUsers?.includes(userId)) {
        return "unified";
      }
    }

    // Determine group based on hash
    const hash = userId ? this.hashUserId(userId) : Math.random() * 100;
    const { unified, traditional, control } = unifiedGeneration.abTestGroups;

    if (hash < unified) {
      return "unified";
    } else if (hash < unified + traditional) {
      return "traditional";
    } else {
      return "control";
    }
  }

  /**
   * Check if a specific generation method is enabled
   */
  isGenerationMethodEnabled(
    method: "unified" | "layered" | "rule-based"
  ): boolean {
    switch (method) {
      case "unified":
        return this.config.unifiedGeneration.enabled;
      case "layered":
        return this.config.layeredGeneration.enabled;
      case "rule-based":
        return true; // Always available as fallback
      default:
        return false;
    }
  }

  /**
   * Get fallback chain configuration
   */
  getFallbackChain(): ("layered" | "rule-based" | "basic")[] {
    return (
      this.config.unifiedGeneration.fallbackChain || [
        "layered",
        "rule-based",
        "basic",
      ]
    );
  }

  /**
   * Check if quality control is enabled
   */
  isQualityControlEnabled(): boolean {
    return this.config.qualityControl.enableValidation;
  }

  /**
   * Get minimum quality threshold
   */
  getMinimumQualityThreshold(): number {
    return this.config.qualityControl.minimumQualityThreshold;
  }

  /**
   * Check if performance optimization is enabled
   */
  isPerformanceOptimizationEnabled(
    optimization: keyof FeatureFlagConfig["performanceOptimizations"]
  ): boolean {
    return this.config.performanceOptimizations[optimization];
  }

  /**
   * Get configuration for a specific feature
   */
  getFeatureConfig<K extends keyof FeatureFlagConfig>(
    feature: K
  ): FeatureFlagConfig[K] {
    return this.config[feature];
  }

  /**
   * Update configuration (for testing or runtime updates)
   */
  updateConfig(updates: Partial<FeatureFlagConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current environment
   */
  getEnvironment(): string {
    return this.environment;
  }

  /**
   * Hash user ID for consistent rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Log feature flag usage for monitoring
   */
  logFeatureUsage(
    feature: string,
    enabled: boolean,
    userId?: string,
    metadata?: any
  ): void {
    if (this.config.monitoring.enabled) {
      const logData = {
        feature,
        enabled,
        userId: userId ? this.hashUserId(userId) : null, // Hash for privacy
        environment: this.environment,
        timestamp: new Date().toISOString(),
        metadata,
      };

      if (
        this.config.monitoring.logLevel === "debug" ||
        this.config.monitoring.logLevel === "info"
      ) {
        console.log("[FeatureFlag]", logData);
      }
    }
  }

  /**
   * Log A/B test assignment for tracking
   */
  logABTestAssignment(
    userId: string | undefined,
    group: "unified" | "traditional" | "control",
    metadata?: any
  ): void {
    if (
      this.config.monitoring.enabled &&
      this.config.monitoring.abTestTracking
    ) {
      const logData = {
        event: "ab_test_assignment",
        userId: userId ? this.hashUserId(userId) : null,
        group,
        environment: this.environment,
        timestamp: new Date().toISOString(),
        metadata,
      };

      console.log("[ABTest]", logData);
    }
  }

  /**
   * Log generation performance metrics
   */
  logPerformanceMetrics(metrics: {
    generationMethod: string;
    generationTime: number;
    apiTime?: number;
    processingTime?: number;
    qualityScore?: number;
    fallbackUsed?: boolean;
    userId?: string;
  }): void {
    if (
      this.config.monitoring.enabled &&
      this.config.monitoring.performanceTracking
    ) {
      const logData = {
        event: "generation_performance",
        userId: metrics.userId ? this.hashUserId(metrics.userId) : null,
        environment: this.environment,
        timestamp: new Date().toISOString(),
        ...metrics,
      };

      console.log("[Performance]", logData);
    }
  }

  /**
   * Get feature flag metrics for monitoring
   */
  getMetrics(): {
    environment: string;
    config: FeatureFlagConfig;
    usage: {
      unifiedGenerationEnabled: boolean;
      layeredGenerationEnabled: boolean;
      debugVisualizationEnabled: boolean;
    };
  } {
    return {
      environment: this.environment,
      config: this.config,
      usage: {
        unifiedGenerationEnabled: this.config.unifiedGeneration.enabled,
        layeredGenerationEnabled: this.config.layeredGeneration.enabled,
        debugVisualizationEnabled: this.config.debugVisualization.enabled,
      },
    };
  }
}

// Global instance
export const featureFlagManager = new FeatureFlagManager();

// Helper functions for common checks
export const isUnifiedGenerationEnabled = (userId?: string): boolean => {
  return featureFlagManager.isUnifiedGenerationEnabled(userId);
};

export const isLayeredGenerationEnabled = (): boolean => {
  return featureFlagManager.isLayeredGenerationEnabled();
};

export const isDebugVisualizationEnabled = (): boolean => {
  return featureFlagManager.isDebugVisualizationEnabled();
};

export const getABTestGroup = (
  userId?: string
): "unified" | "traditional" | "control" => {
  return featureFlagManager.getABTestGroup(userId);
};

export const isGenerationMethodEnabled = (
  method: "unified" | "layered" | "rule-based"
): boolean => {
  return featureFlagManager.isGenerationMethodEnabled(method);
};

export const getFallbackChain = (): ("layered" | "rule-based" | "basic")[] => {
  return featureFlagManager.getFallbackChain();
};

export const isQualityControlEnabled = (): boolean => {
  return featureFlagManager.isQualityControlEnabled();
};

export const getMinimumQualityThreshold = (): number => {
  return featureFlagManager.getMinimumQualityThreshold();
};

export const isPerformanceOptimizationEnabled = (
  optimization: keyof FeatureFlagConfig["performanceOptimizations"]
): boolean => {
  return featureFlagManager.isPerformanceOptimizationEnabled(optimization);
};

// Configuration management functions
export const updateFeatureFlags = (
  updates: Partial<FeatureFlagConfig>
): void => {
  featureFlagManager.updateConfig(updates);
};

export const getFeatureFlagMetrics = () => {
  return featureFlagManager.getMetrics();
};

export const logFeatureUsage = (
  feature: string,
  enabled: boolean,
  userId?: string,
  metadata?: any
): void => {
  featureFlagManager.logFeatureUsage(feature, enabled, userId, metadata);
};

export const logABTestAssignment = (
  userId: string | undefined,
  group: "unified" | "traditional" | "control",
  metadata?: any
): void => {
  featureFlagManager.logABTestAssignment(userId, group, metadata);
};

export const logPerformanceMetrics = (metrics: {
  generationMethod: string;
  generationTime: number;
  apiTime?: number;
  processingTime?: number;
  qualityScore?: number;
  fallbackUsed?: boolean;
  userId?: string;
}): void => {
  featureFlagManager.logPerformanceMetrics(metrics);
};
