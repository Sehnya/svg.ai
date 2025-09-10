# Migration Guide: Traditional to Unified SVG Generation

## Overview

This guide helps you migrate from the traditional SVG generation system to the new unified layered generation system. The unified system provides better quality, consistency, and structure while maintaining backward compatibility.

## Key Differences

### Traditional System

- Pixel-based coordinate system
- Single-layer SVG output
- Basic template-based generation
- Limited layout control

### Unified System

- Semantic layout language with regions and anchors
- Multi-layer structured output
- AI-powered layered generation
- Advanced quality control and repair
- Layout quality scoring

## Migration Strategies

### 1. Gradual Migration (Recommended)

Enable A/B testing to gradually roll out the unified system:

```javascript
// Before: Direct model specification
const result = await generateSVG("A house", { model: "llm" });

// After: Let A/B testing choose the method
const result = await generateSVG("A house", {
  userId: "user_123",
  model: "pipeline", // System will choose based on A/B test
});

// Check which method was used
console.log("Used method:", result.generationMethod);
console.log("A/B test group:", result.abTestGroup);
```

### 2. Feature Flag Migration

Use feature flags to control rollout:

```javascript
// Check if unified generation is available
const config = await fetch("/api/config/feature-flags");
const { unifiedGeneration } = await config.json();

if (unifiedGeneration.enabled) {
  // Use unified generation
  const result = await generateSVG(prompt, { model: "unified" });
} else {
  // Fallback to traditional
  const result = await generateSVG(prompt, { model: "llm" });
}
```

### 3. Direct Migration

Directly switch to unified generation:

```javascript
// Before
const result = await generateSVG("A modern house", {
  model: "llm",
  size: { width: 400, height: 400 },
});

// After
const result = await generateSVG("A modern house", {
  model: "unified",
  aspectRatio: "1:1",
  debug: true, // Get layout information
});
```

## API Changes

### Request Parameters

#### New Parameters (Unified)

| Parameter     | Type    | Description         | Example  |
| ------------- | ------- | ------------------- | -------- |
| `aspectRatio` | string  | Canvas aspect ratio | `"16:9"` |
| `debug`       | boolean | Include debug info  | `true`   |
| `temperature` | number  | AI creativity (0-2) | `0.7`    |
| `maxRetries`  | number  | Max retry attempts  | `3`      |

#### Updated Parameters

| Parameter | Before                  | After                                              | Notes                          |
| --------- | ----------------------- | -------------------------------------------------- | ------------------------------ |
| `model`   | `"llm"`, `"rule-based"` | `"pipeline"`, `"unified"`, `"llm"`, `"rule-based"` | New options available          |
| `size`    | Required                | Optional                                           | Defaults based on aspect ratio |

### Response Changes

#### New Response Fields

```javascript
// Traditional response
{
  svg: "<svg>...</svg>",
  meta: { width, height, ... },
  layers: [...],
  warnings: [...],
  errors: [...]
}

// Unified response (additional fields)
{
  svg: "<svg>...</svg>",
  metadata: { // Enhanced metadata
    layoutQuality: 87,
    generationMethod: "unified-layered",
    coordinatesRepaired: false,
    fallbackUsed: false,
    performance: {
      generationTime: 1250,
      apiTime: 800,
      processingTime: 450
    }
  },
  layout: { // New layout information
    regionsUsed: ["center", "top_center"],
    anchorsUsed: ["center", "bottom_center"],
    aspectRatio: "1:1",
    canvasDimensions: { width: 512, height: 512 }
  },
  layers: [...], // Enhanced layer information
  abTestGroup: "unified",
  generationMethod: "unified",
  debug: { ... } // Debug information when requested
}
```

#### Enhanced Layer Information

```javascript
// Traditional layer
{
  id: "house_body",
  label: "House Body",
  type: "shape"
}

// Unified layer (enhanced)
{
  id: "structure",
  label: "House Structure",
  type: "layer",
  element: "g",
  attributes: { id: "structure", "data-label": "House Structure" },
  metadata: {
    motif: "building",
    generated: true,
    region: "center",
    anchor: "bottom_center"
  }
}
```

## Code Migration Examples

### React Component Migration

#### Before (Traditional)

```jsx
function SVGGenerator() {
  const [svg, setSvg] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (prompt) => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: "llm",
          size: { width: 400, height: 400 },
        }),
      });

      const result = await response.json();
      setSvg(result.svg);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => generate("A house")}>Generate</button>
      {svg && <div dangerouslySetInnerHTML={{ __html: svg }} />}
    </div>
  );
}
```

#### After (Unified)

```jsx
function SVGGenerator() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async (prompt) => {
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: "unified", // or 'pipeline' for A/B testing
          aspectRatio: "1:1",
          userId: "user_123",
          debug: process.env.NODE_ENV === "development",
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => generate("A modern house with garden")}>
        Generate
      </button>

      {result && (
        <div>
          <div dangerouslySetInnerHTML={{ __html: result.svg }} />

          {/* New: Show generation info */}
          <div className="metadata">
            <p>Method: {result.generationMethod}</p>
            <p>Quality: {result.metadata.layoutQuality}/100</p>
            <p>A/B Group: {result.abTestGroup}</p>

            {result.metadata.fallbackUsed && (
              <p className="warning">
                Fallback used: {result.metadata.fallbackReason}
              </p>
            )}
          </div>

          {/* New: Layer inspector */}
          {result.layers && (
            <div className="layers">
              <h4>Layers:</h4>
              <ul>
                {result.layers.map((layer) => (
                  <li key={layer.id}>
                    {layer.label} ({layer.type})
                    {layer.metadata?.region && (
                      <span> - Region: {layer.metadata.region}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Node.js Service Migration

#### Before (Traditional)

```javascript
class SVGService {
  async generateSVG(prompt, options = {}) {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model: "llm",
        size: options.size || { width: 400, height: 400 },
        palette: options.palette,
      }),
    });

    if (!response.ok) {
      throw new Error("Generation failed");
    }

    return response.json();
  }
}
```

#### After (Unified)

```javascript
class SVGService {
  constructor() {
    this.abTestManager = new ABTestManager();
  }

  async generateSVG(prompt, options = {}) {
    // Get A/B test assignment
    const assignment = await this.abTestManager.getAssignment(options.userId);

    // Choose model based on assignment
    const model = this.getModelForGroup(assignment.group);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model,
        aspectRatio: options.aspectRatio || "1:1",
        userId: options.userId,
        palette: options.palette,
        temperature: options.temperature || 0.7,
        maxRetries: 3,
        fallbackEnabled: true,
        debug: options.debug || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new SVGGenerationError(error.error, error.code, error.retryable);
    }

    const result = await response.json();

    // Log metrics for monitoring
    this.logGenerationMetrics(result);

    return result;
  }

  getModelForGroup(group) {
    const modelMap = {
      unified: "unified",
      traditional: "pipeline",
      control: "rule-based",
    };
    return modelMap[group] || "pipeline";
  }

  logGenerationMetrics(result) {
    const metrics = {
      method: result.generationMethod,
      quality: result.metadata?.layoutQuality,
      time: result.metadata?.performance?.generationTime,
      fallbackUsed: result.metadata?.fallbackUsed,
      abTestGroup: result.abTestGroup,
    };

    console.log("Generation metrics:", metrics);
    // Send to your analytics service
  }
}

class SVGGenerationError extends Error {
  constructor(message, code, retryable) {
    super(message);
    this.name = "SVGGenerationError";
    this.code = code;
    this.retryable = retryable;
  }
}
```

## Layout Language Migration

### From Pixel Coordinates

#### Before (Pixel-based positioning)

```javascript
// Manual coordinate calculation
const centerX = 400 / 2; // 200
const centerY = 400 / 2; // 200
const houseWidth = 150;
const houseHeight = 100;

const request = {
  prompt: `A house at coordinates ${centerX},${centerY} with size ${houseWidth}x${houseHeight}`,
  size: { width: 400, height: 400 },
};
```

#### After (Semantic positioning)

```javascript
// Semantic layout language
const request = {
  prompt: "A house in the center with medium size",
  aspectRatio: "1:1",
  model: "unified",
};

// The system automatically handles:
// - Region: "center"
// - Anchor: "center"
// - Size: relative to canvas
// - Coordinates: calculated automatically
```

### Layout Specifications

The unified system uses semantic layout specifications:

```javascript
// Example of layout information in response
{
  layout: {
    regionsUsed: ["center", "top_center", "bottom_left"],
    anchorsUsed: ["center", "bottom_center", "top_left"],
    aspectRatio: "1:1",
    canvasDimensions: { width: 512, height: 512 }
  }
}
```

## Quality Control Migration

### Before (Manual validation)

```javascript
function validateSVG(svg) {
  // Manual checks
  if (!svg.includes("<svg")) return false;
  if (!svg.includes("</svg>")) return false;
  if (svg.length < 50) return false;
  return true;
}

const result = await generateSVG(prompt);
if (!validateSVG(result.svg)) {
  throw new Error("Invalid SVG generated");
}
```

### After (Automatic quality control)

```javascript
const result = await generateSVG(prompt, { model: "unified" });

// Automatic quality control included
console.log("Quality score:", result.metadata.layoutQuality);
console.log("Coordinates repaired:", result.metadata.coordinatesRepaired);

// Quality threshold checking
if (result.metadata.layoutQuality < 70) {
  console.warn("Low quality generation, consider regenerating");
}

// Fallback information
if (result.metadata.fallbackUsed) {
  console.log("Fallback reason:", result.metadata.fallbackReason);
}
```

## Error Handling Migration

### Enhanced Error Information

#### Before

```javascript
try {
  const result = await generateSVG(prompt);
} catch (error) {
  console.error("Generation failed:", error.message);
  // Limited error information
}
```

#### After

```javascript
try {
  const result = await generateSVG(prompt, { model: "unified" });
} catch (error) {
  console.error("Generation failed:", error.message);

  // Enhanced error handling
  if (error.code === "RATE_LIMITED") {
    // Implement backoff strategy
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return generateSVG(prompt, { model: "rule-based" }); // Fallback
  }

  if (error.retryable) {
    // Retry with different parameters
    return generateSVG(prompt, {
      model: "pipeline",
      fallbackEnabled: true,
    });
  }

  throw error;
}
```

## Performance Migration

### Caching Strategy

#### Before (Simple caching)

```javascript
const cache = new Map();

async function cachedGenerate(prompt) {
  if (cache.has(prompt)) {
    return cache.get(prompt);
  }

  const result = await generateSVG(prompt);
  cache.set(prompt, result);
  return result;
}
```

#### After (Enhanced caching with metadata)

```javascript
class EnhancedCache {
  constructor() {
    this.cache = new Map();
    this.metrics = { hits: 0, misses: 0 };
  }

  generateKey(prompt, options) {
    // Include relevant options in cache key
    return JSON.stringify({
      prompt: prompt.toLowerCase().trim(),
      model: options.model,
      aspectRatio: options.aspectRatio,
      userId: options.userId, // For personalized results
    });
  }

  async get(prompt, options) {
    const key = this.generateKey(prompt, options);

    if (this.cache.has(key)) {
      this.metrics.hits++;
      const cached = this.cache.get(key);

      // Add cache indicator
      return {
        ...cached,
        fromCache: true,
        cacheTimestamp: cached.timestamp,
      };
    }

    this.metrics.misses++;
    return null;
  }

  set(prompt, options, result) {
    const key = this.generateKey(prompt, options);

    // Only cache high-quality results
    if (result.metadata?.layoutQuality >= 70) {
      this.cache.set(key, {
        ...result,
        timestamp: Date.now(),
      });
    }
  }

  getStats() {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      hitRate:
        total > 0 ? ((this.metrics.hits / total) * 100).toFixed(2) + "%" : "0%",
      totalRequests: total,
    };
  }
}
```

## Testing Migration

### Unit Test Updates

#### Before

```javascript
describe("SVG Generation", () => {
  test("should generate SVG", async () => {
    const result = await generateSVG("A house");

    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("</svg>");
    expect(result.meta.width).toBe(400);
    expect(result.meta.height).toBe(400);
  });
});
```

#### After

```javascript
describe("SVG Generation", () => {
  test("should generate unified SVG", async () => {
    const result = await generateSVG("A house", {
      model: "unified",
      aspectRatio: "1:1",
    });

    // Traditional checks
    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("</svg>");

    // New unified checks
    expect(result.metadata.generationMethod).toBe("unified-layered");
    expect(result.metadata.layoutQuality).toBeGreaterThan(0);
    expect(result.layout).toBeDefined();
    expect(result.layout.aspectRatio).toBe("1:1");
    expect(result.abTestGroup).toBeDefined();

    // Layer structure validation
    expect(result.layers).toBeInstanceOf(Array);
    expect(result.layers.length).toBeGreaterThan(0);

    result.layers.forEach((layer) => {
      expect(layer.id).toBeDefined();
      expect(layer.label).toBeDefined();
      expect(layer.type).toBeDefined();
    });
  });

  test("should handle fallback gracefully", async () => {
    // Mock API failure
    jest.spyOn(global, "fetch").mockRejectedValueOnce(new Error("API Error"));

    const result = await generateSVG("A house", {
      model: "unified",
      fallbackEnabled: true,
    });

    expect(result.metadata.fallbackUsed).toBe(true);
    expect(result.metadata.fallbackReason).toContain("API Error");
    expect(result.svg).toBeDefined(); // Should still have SVG from fallback
  });
});
```

## Rollback Strategy

If you need to rollback to the traditional system:

### 1. Feature Flag Rollback

```javascript
// Disable unified generation
await updateFeatureFlags({
  unifiedGeneration: {
    enabled: false,
    rolloutPercentage: 0,
  },
});
```

### 2. Code Rollback

```javascript
// Temporary rollback wrapper
function generateSVGWithRollback(prompt, options = {}) {
  // Force traditional method
  return generateSVG(prompt, {
    ...options,
    model: "llm", // Force traditional LLM method
  });
}
```

### 3. A/B Test Adjustment

```javascript
// Redirect all traffic to traditional
await updateFeatureFlags({
  unifiedGeneration: {
    abTestGroups: {
      unified: 0,
      traditional: 100,
      control: 0,
    },
  },
});
```

## Migration Checklist

### Pre-Migration

- [ ] Review current API usage patterns
- [ ] Identify integration points
- [ ] Set up monitoring and logging
- [ ] Create rollback plan
- [ ] Test unified generation in development

### During Migration

- [ ] Enable A/B testing with small percentage
- [ ] Monitor error rates and performance
- [ ] Collect user feedback
- [ ] Gradually increase unified traffic
- [ ] Update client code to handle new response format

### Post-Migration

- [ ] Monitor quality metrics
- [ ] Analyze A/B test results
- [ ] Update documentation
- [ ] Train team on new features
- [ ] Plan for advanced features (layout language, etc.)

## Support and Resources

### Migration Support

- **Documentation**: Complete API documentation with examples
- **Testing**: Sandbox environment for testing unified generation
- **Monitoring**: Real-time metrics and health checks
- **Support**: Technical support during migration period

### Best Practices

1. **Gradual Rollout**: Use A/B testing for safe migration
2. **Monitoring**: Track quality metrics and performance
3. **Fallback**: Always enable fallback mechanisms
4. **Testing**: Comprehensive testing of new features
5. **Documentation**: Update internal documentation

This migration guide provides a comprehensive path from traditional to unified SVG generation while maintaining system reliability and user experience.
