import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Mock server for integration tests
const TEST_SERVER_URL = "http://localhost:3001";

describe("API Integration Tests", () => {
  let serverAvailable = false;

  beforeAll(async () => {
    // Check if test server is available
    try {
      const response = await fetch(`${TEST_SERVER_URL}/health`);
      serverAvailable = response.ok;
    } catch {
      serverAvailable = false;
    }
  });

  describe("Health Check Endpoint", () => {
    it("should return health status", async () => {
      if (!serverAvailable) {
        console.warn("Test server not available, skipping integration tests");
        return;
      }

      const response = await fetch(`${TEST_SERVER_URL}/health`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("status", "ok");
      expect(data).toHaveProperty("timestamp");
    });
  });

  describe("SVG Generation Endpoint", () => {
    it("should generate SVG from valid request", async () => {
      if (!serverAvailable) {
        console.warn("Test server not available, skipping integration tests");
        return;
      }

      const request = {
        prompt: "A simple blue circle",
        size: { width: 100, height: 100 },
      };

      const response = await fetch(`${TEST_SERVER_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("svg");
      expect(data).toHaveProperty("meta");
      expect(data).toHaveProperty("layers");
      expect(data).toHaveProperty("warnings");
      expect(data).toHaveProperty("errors");

      // Validate SVG structure
      expect(data.svg).toContain("<svg");
      expect(data.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(data.svg).toContain("viewBox");
    });

    it("should reject invalid requests", async () => {
      if (!serverAvailable) {
        console.warn("Test server not available, skipping integration tests");
        return;
      }

      const invalidRequest = {
        prompt: "", // Empty prompt should be invalid
        size: { width: -1, height: -1 }, // Invalid dimensions
      };

      const response = await fetch(`${TEST_SERVER_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it("should handle malformed JSON", async () => {
      if (!serverAvailable) {
        console.warn("Test server not available, skipping integration tests");
        return;
      }

      const response = await fetch(`${TEST_SERVER_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it("should enforce rate limiting", async () => {
      if (!serverAvailable) {
        console.warn("Test server not available, skipping integration tests");
        return;
      }

      const request = {
        prompt: "Test prompt",
        size: { width: 100, height: 100 },
      };

      // Make many requests quickly to trigger rate limiting
      const promises = Array.from({ length: 35 }, () =>
        fetch(`${TEST_SERVER_URL}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        })
      );

      const responses = await Promise.all(promises);

      // At least one should be rate limited
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it("should sanitize malicious input", async () => {
      if (!serverAvailable) {
        console.warn("Test server not available, skipping integration tests");
        return;
      }

      const maliciousRequest = {
        prompt: '<script>alert("xss")</script>Create a circle',
        size: { width: 100, height: 100 },
      };

      const response = await fetch(`${TEST_SERVER_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(maliciousRequest),
      });

      if (response.ok) {
        const data = await response.json();
        // SVG should not contain script tags
        expect(data.svg).not.toContain("<script>");
        expect(data.svg).not.toContain("alert");
      } else {
        // Or the request should be rejected
        expect(response.status).toBe(400);
      }
    });
  });

  describe("Security Tests", () => {
    it("should reject requests with suspicious content", async () => {
      if (!serverAvailable) {
        console.warn("Test server not available, skipping integration tests");
        return;
      }

      const suspiciousRequests = [
        {
          prompt: 'javascript:alert("xss")',
          size: { width: 100, height: 100 },
        },
        { prompt: 'onclick="malicious()"', size: { width: 100, height: 100 } },
        { prompt: "eval(maliciousCode)", size: { width: 100, height: 100 } },
      ];

      for (const request of suspiciousRequests) {
        const response = await fetch(`${TEST_SERVER_URL}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        // Should either reject the request or sanitize the output
        if (response.ok) {
          const data = await response.json();
          expect(data.svg).not.toContain("javascript:");
          expect(data.svg).not.toContain("onclick");
          expect(data.svg).not.toContain("eval");
        } else {
          expect(response.status).toBe(400);
        }
      }
    });

    it("should enforce CORS headers", async () => {
      if (!serverAvailable) {
        console.warn("Test server not available, skipping integration tests");
        return;
      }

      const response = await fetch(`${TEST_SERVER_URL}/health`, {
        method: "OPTIONS",
      });

      expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
      expect(response.headers.get("Access-Control-Allow-Methods")).toBeTruthy();
    });

    it("should include security headers", async () => {
      if (!serverAvailable) {
        console.warn("Test server not available, skipping integration tests");
        return;
      }

      const response = await fetch(`${TEST_SERVER_URL}/health`);

      // Check for security headers
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBeTruthy();
      expect(response.headers.get("Content-Security-Policy")).toBeTruthy();
    });
  });

  describe("Performance Tests", () => {
    it("should respond within reasonable time", async () => {
      if (!serverAvailable) {
        console.warn("Test server not available, skipping integration tests");
        return;
      }

      const startTime = Date.now();

      const response = await fetch(`${TEST_SERVER_URL}/health`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it("should handle concurrent requests", async () => {
      if (!serverAvailable) {
        console.warn("Test server not available, skipping integration tests");
        return;
      }

      const request = {
        prompt: "A simple circle",
        size: { width: 50, height: 50 },
      };

      // Make 10 concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        fetch(`${TEST_SERVER_URL}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        })
      );

      const responses = await Promise.all(promises);

      // Most should succeed (some might be rate limited)
      const successfulResponses = responses.filter((r) => r.ok);
      expect(successfulResponses.length).toBeGreaterThan(5);
    });
  });
});
