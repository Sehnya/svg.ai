# Developer Integration Guide

## Quick Start

### 1. Basic Integration

```javascript
// Simple SVG generation
const response = await fetch("https://your-domain.com/api/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "A blue house with a red roof",
    model: "pipeline",
  }),
});

const result = await response.json();
console.log(result.svg); // SVG markup ready to use
```

### 2. Advanced Integration with Error Handling

```javascript
class SVGGenerator {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      model: "pipeline",
      fallbackEnabled: true,
      maxRetries: 3,
      ...options,
    };
  }

  async generate(prompt, options = {}) {
    const requestOptions = {
      ...this.defaultOptions,
      ...options,
      prompt,
    };

    try {
      const response = await this.makeRequest(requestOptions);

      if (!response.ok) {
        const error = await response.json();
        throw new SVGGenerationError(error.error, error.code, error.retryable);
      }

      const result = await response.json();

      // Log A/B test assignment for analytics
      if (result.abTestGroup) {
        this.logABTestAssignment(result.abTestGroup, options.userId);
      }

      return result;
    } catch (error) {
      if (error.retryable && requestOptions.maxRetries > 0) {
        await this.delay(1000); // Wait 1 second before retry
        return this.generate(prompt, {
          ...options,
          maxRetries: requestOptions.maxRetries - 1,
        });
      }
      throw error;
    }
  }

  async makeRequest(options) {
    return fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  logABTestAssignment(group, userId) {
    // Send to your analytics service
    console.log(`User ${userId} assigned to A/B test group: ${group}`);
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

// Usage
const generator = new SVGGenerator("https://your-domain.com", {
  userId: "user_123",
  model: "unified",
});

try {
  const result = await generator.generate("A modern cityscape at sunset");
  document.getElementById("svg-container").innerHTML = result.svg;
} catch (error) {
  console.error("Generation failed:", error.message);
  // Handle error appropriately
}
```

## Framework Integrations

### React Integration

```jsx
import React, { useState, useCallback } from "react";

const SVGGenerator = ({ apiUrl }) => {
  const [svg, setSvg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);

  const generateSVG = useCallback(
    async (prompt, options = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            model: "unified",
            userId: "user_123",
            debug: process.env.NODE_ENV === "development",
            ...options,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }

        const result = await response.json();
        setSvg(result.svg);
        setMetadata(result.metadata);

        // Log successful generation
        console.log("Generated with method:", result.generationMethod);
        console.log("A/B test group:", result.abTestGroup);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  return (
    <div className="svg-generator">
      <div className="controls">
        <input
          type="text"
          placeholder="Describe your SVG..."
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              generateSVG(e.target.value);
            }
          }}
        />
        <button
          onClick={() => generateSVG("A beautiful landscape")}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate SVG"}
        </button>
      </div>

      {error && <div className="error">Error: {error}</div>}

      {svg && (
        <div className="result">
          <div
            className="svg-display"
            dangerouslySetInnerHTML={{ __html: svg }}
          />

          {metadata && (
            <div className="metadata">
              <p>Method: {metadata.generationMethod}</p>
              <p>Quality: {metadata.layoutQuality}/100</p>
              <p>Generation Time: {metadata.performance?.generationTime}ms</p>
              {metadata.fallbackUsed && (
                <p className="warning">
                  Fallback used: {metadata.fallbackReason}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SVGGenerator;
```

### Vue.js Integration

```vue
<template>
  <div class="svg-generator">
    <div class="controls">
      <input
        v-model="prompt"
        @keyup.enter="generateSVG"
        placeholder="Describe your SVG..."
        :disabled="loading"
      />
      <button @click="generateSVG" :disabled="loading || !prompt">
        {{ loading ? "Generating..." : "Generate SVG" }}
      </button>
    </div>

    <div v-if="error" class="error">Error: {{ error }}</div>

    <div v-if="result" class="result">
      <div class="svg-display" v-html="result.svg"></div>

      <div v-if="result.metadata" class="metadata">
        <p>Method: {{ result.metadata.generationMethod }}</p>
        <p>Quality: {{ result.metadata.layoutQuality }}/100</p>
        <p>A/B Group: {{ result.abTestGroup }}</p>

        <div v-if="result.layers" class="layers">
          <h4>Layers:</h4>
          <ul>
            <li v-for="layer in result.layers" :key="layer.id">
              {{ layer.label }} ({{ layer.type }})
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SVGGenerator",
  props: {
    apiUrl: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      prompt: "",
      result: null,
      loading: false,
      error: null,
    };
  },
  methods: {
    async generateSVG() {
      if (!this.prompt.trim()) return;

      this.loading = true;
      this.error = null;

      try {
        const response = await fetch(`${this.apiUrl}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: this.prompt,
            model: "unified",
            userId: this.userId,
            size: { width: 512, height: 512 },
            debug: process.env.NODE_ENV === "development",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }

        this.result = await response.json();

        // Emit event for parent component
        this.$emit("svg-generated", this.result);
      } catch (err) {
        this.error = err.message;
        this.$emit("svg-error", err);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
```

### Node.js/Express Integration

```javascript
const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

class SVGService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.cache = new Map();
  }

  async generate(prompt, options = {}) {
    // Check cache first
    const cacheKey = JSON.stringify({ prompt, ...options });
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await fetch(`${this.apiUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        model: "pipeline",
        fallbackEnabled: true,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`SVG generation failed: ${error.error}`);
    }

    const result = await response.json();

    // Cache successful results for 1 hour
    this.cache.set(cacheKey, result);
    setTimeout(() => this.cache.delete(cacheKey), 3600000);

    return result;
  }

  async getABTestAssignment(userId) {
    const response = await fetch(
      `${this.apiUrl}/api/config/ab-test-assignment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    return response.json();
  }
}

const svgService = new SVGService("https://your-svg-api.com");

// Generate SVG endpoint
app.post("/generate-svg", async (req, res) => {
  try {
    const { prompt, userId, ...options } = req.body;

    // Get A/B test assignment
    const assignment = await svgService.getABTestAssignment(userId);

    // Generate SVG with appropriate model
    const result = await svgService.generate(prompt, {
      userId,
      model: assignment.group === "unified" ? "unified" : "pipeline",
      ...options,
    });

    res.json({
      ...result,
      abTestGroup: assignment.group,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      retryable: true,
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## Best Practices

### 1. Error Handling

```javascript
async function robustSVGGeneration(prompt, options = {}) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateSVG(prompt, {
        ...options,
        maxRetries: 0, // Handle retries manually
      });

      // Validate result
      if (!result.svg || result.svg.length < 50) {
        throw new Error("Invalid SVG response");
      }

      return result;
    } catch (error) {
      lastError = error;

      // Don't retry on client errors
      if (error.code === "INVALID_PROMPT" || error.code === "INVALID_SIZE") {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError;
}
```

### 2. Caching Strategy

```javascript
class SVGCache {
  constructor(maxSize = 1000, ttl = 3600000) {
    // 1 hour TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  generateKey(prompt, options) {
    // Create deterministic cache key
    const normalized = {
      prompt: prompt.toLowerCase().trim(),
      model: options.model || "pipeline",
      size: options.size || { width: 400, height: 400 },
      palette: options.palette || [],
      seed: options.seed,
    };
    return JSON.stringify(normalized);
  }

  get(prompt, options) {
    const key = this.generateKey(prompt, options);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(prompt, options, data) {
    const key = this.generateKey(prompt, options);

    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

const cache = new SVGCache();

async function cachedGenerate(prompt, options = {}) {
  // Check cache first
  const cached = cache.get(prompt, options);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // Generate new SVG
  const result = await generateSVG(prompt, options);

  // Cache successful results
  if (result.svg && !result.errors?.length) {
    cache.set(prompt, options, result);
  }

  return result;
}
```

### 3. A/B Testing Integration

```javascript
class ABTestManager {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.assignments = new Map();
  }

  async getAssignment(userId) {
    // Use cached assignment if available
    if (this.assignments.has(userId)) {
      return this.assignments.get(userId);
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/api/config/ab-test-assignment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      const assignment = await response.json();
      this.assignments.set(userId, assignment);

      return assignment;
    } catch (error) {
      // Fallback to traditional if assignment fails
      return { group: "traditional" };
    }
  }

  async generateWithABTest(prompt, userId, options = {}) {
    const assignment = await this.getAssignment(userId);

    // Choose model based on A/B test group
    const modelMap = {
      unified: "unified",
      traditional: "pipeline",
      control: "rule-based",
    };

    const model = modelMap[assignment.group] || "pipeline";

    const result = await generateSVG(prompt, {
      ...options,
      userId,
      model,
    });

    // Track the assignment for analytics
    this.trackAssignment(userId, assignment.group, result);

    return {
      ...result,
      abTestGroup: assignment.group,
    };
  }

  trackAssignment(userId, group, result) {
    // Send to your analytics service
    const event = {
      userId,
      abTestGroup: group,
      generationMethod: result.metadata?.generationMethod,
      success: !result.errors?.length,
      timestamp: new Date().toISOString(),
    };

    // Example: send to analytics
    // analytics.track('svg_generation', event);
    console.log("A/B Test Event:", event);
  }
}
```

### 4. Performance Monitoring

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      successes: 0,
      failures: 0,
      totalTime: 0,
      abTestGroups: {
        unified: 0,
        traditional: 0,
        control: 0,
      },
    };
  }

  async monitoredGenerate(prompt, options = {}) {
    const startTime = performance.now();
    this.metrics.requests++;

    try {
      const result = await generateSVG(prompt, options);

      const endTime = performance.now();
      const duration = endTime - startTime;

      this.metrics.successes++;
      this.metrics.totalTime += duration;

      if (result.abTestGroup) {
        this.metrics.abTestGroups[result.abTestGroup]++;
      }

      // Log performance metrics
      console.log(`Generation completed in ${duration.toFixed(2)}ms`);

      return result;
    } catch (error) {
      this.metrics.failures++;
      throw error;
    }
  }

  getStats() {
    const avgTime = this.metrics.totalTime / this.metrics.successes || 0;
    const successRate = this.metrics.successes / this.metrics.requests || 0;

    return {
      totalRequests: this.metrics.requests,
      successRate: (successRate * 100).toFixed(2) + "%",
      averageTime: avgTime.toFixed(2) + "ms",
      abTestDistribution: this.metrics.abTestGroups,
    };
  }
}

const monitor = new PerformanceMonitor();

// Usage
const result = await monitor.monitoredGenerate("A sunset landscape");
console.log("Performance stats:", monitor.getStats());
```

## Testing

### Unit Tests

```javascript
// Jest example
describe("SVG Generator", () => {
  let generator;

  beforeEach(() => {
    generator = new SVGGenerator("https://test-api.com");
  });

  test("should generate SVG from prompt", async () => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          svg: "<svg>...</svg>",
          metadata: { generationMethod: "unified" },
        }),
    });

    const result = await generator.generate("A test prompt");

    expect(result.svg).toBeDefined();
    expect(result.metadata.generationMethod).toBe("unified");
  });

  test("should handle errors gracefully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          error: "Invalid prompt",
          code: "INVALID_PROMPT",
          retryable: false,
        }),
    });

    await expect(generator.generate("")).rejects.toThrow("Invalid prompt");
  });

  test("should retry on retryable errors", async () => {
    let callCount = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              error: "Server error",
              code: "INTERNAL_ERROR",
              retryable: true,
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            svg: "<svg>...</svg>",
            metadata: { generationMethod: "unified" },
          }),
      });
    });

    const result = await generator.generate("Test prompt", { maxRetries: 3 });
    expect(callCount).toBe(3);
    expect(result.svg).toBeDefined();
  });
});
```

### Integration Tests

```javascript
describe("SVG API Integration", () => {
  const apiUrl = process.env.TEST_API_URL || "http://localhost:3000";

  test("should generate simple SVG", async () => {
    const response = await fetch(`${apiUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "A red circle",
        model: "rule-based",
      }),
    });

    expect(response.ok).toBe(true);

    const result = await response.json();
    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("</svg>");
    expect(result.metadata).toBeDefined();
  });

  test("should handle A/B test assignment", async () => {
    const userId = "test_user_" + Date.now();

    const assignmentResponse = await fetch(
      `${apiUrl}/api/config/ab-test-assignment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }
    );

    const assignment = await assignmentResponse.json();
    expect(["unified", "traditional", "control"]).toContain(assignment.group);

    // Generate SVG with assigned group
    const genResponse = await fetch(`${apiUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "A test image",
        userId,
      }),
    });

    const result = await genResponse.json();
    expect(result.abTestGroup).toBe(assignment.group);
  });
});
```

## Deployment Considerations

### Environment Variables

```bash
# API Configuration
API_BASE_URL=https://your-domain.com
ADMIN_API_KEY=your-secret-admin-key

# Feature Flags
UNIFIED_GENERATION_ENABLED=true
UNIFIED_ROLLOUT_PERCENTAGE=25
DEBUG_VISUALIZATION_ENABLED=false

# Performance
CACHE_MAX_SIZE=1000
CACHE_TTL_MINUTES=60
RATE_LIMIT_PER_MINUTE=60

# Monitoring
ENABLE_PERFORMANCE_TRACKING=true
ENABLE_AB_TEST_TRACKING=true
LOG_LEVEL=info
```

### Docker Integration

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV API_BASE_URL=https://svg-api.example.com

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: svg-client
spec:
  replicas: 3
  selector:
    matchLabels:
      app: svg-client
  template:
    metadata:
      labels:
        app: svg-client
    spec:
      containers:
        - name: svg-client
          image: your-registry/svg-client:latest
          ports:
            - containerPort: 3000
          env:
            - name: API_BASE_URL
              value: "https://svg-api.example.com"
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

This comprehensive integration guide provides everything developers need to successfully integrate with the SVG AI API, from basic usage to advanced patterns and deployment considerations.
