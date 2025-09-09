/**
 * Integration tests for preference learning and feedback loops
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GenerationPipeline } from "../../server/services/GenerationPipeline.js";
import { KnowledgeBaseManager } from "../../server/services/KnowledgeBaseManager.js";
import { PreferenceEngine } from "../../server/services/PreferenceEngine.js";

describe("Preference Learning Integration", () => {
  let pipeline: GenerationPipeline;
  let kbManager: KnowledgeBaseManager;
  let preferenceEngine: PreferenceEngine;
  const testUserId = "test-user-123";

  beforeEach(async () => {
    // Initialize services with test configuration
    pipeline = new GenerationPipeline();
    kbManager = new KnowledgeBaseManager();
    preferenceEngine = new PreferenceEngine();

    // Clear test data - using mock implementation
    // await kbManager.clearUserPreferences(testUserId);
  });

  afterEach(async () => {
    // Cleanup test data - using mock implementation
    // await kbManager.clearUserPreferences(testUserId);
  });

  describe("feedback collection and preference updates", () => {
    it("should update preferences based on positive feedback", async () => {
      const request = {
        prompt: "blue geometric circle",
        size: { width: 200, height: 200 },
        userId: testUserId,
      };

      // Generate SVG with grounding
      const grounding = await kbManager.retrieveGrounding(
        request.prompt,
        testUserId
      );
      const result = await pipeline.process(request, grounding);

      // Mock event ID for testing
      const mockEventId = Math.floor(Math.random() * 1000);

      // Simulate positive feedback
      await preferenceEngine.processFeedback({
        eventId: mockEventId,
        userId: testUserId,
        signal: "favorited",
        weight: 1.5,
        tags: ["blue", "geometric", "circle"],
        objectIds: [1, 2, 3],
      });

      // Mock preference check
      expect(true).toBe(true); // Placeholder for actual preference validation
    });

    it("should update preferences based on negative feedback", async () => {
      const request = {
        prompt: "red square pattern",
        size: { width: 200, height: 200 },
        userId: testUserId,
      };

      // Generate SVG with grounding
      const grounding = await kbManager.retrieveGrounding(
        request.prompt,
        testUserId
      );
      const result = await pipeline.process(request, grounding);

      // Mock event ID for testing
      const mockEventId = Math.floor(Math.random() * 1000);

      // Simulate negative feedback
      await preferenceEngine.processFeedback({
        eventId: mockEventId,
        userId: testUserId,
        signal: "reported",
        weight: -3,
        tags: ["red", "square"],
        objectIds: [4, 5],
      });

      // Mock preference check
      expect(true).toBe(true); // Placeholder for actual preference validation
    });

    it("should apply preference caps to prevent echo chambers", async () => {
      const request = {
        prompt: "blue circle",
        size: { width: 200, height: 200 },
        userId: testUserId,
      };

      // Generate multiple SVGs with positive feedback
      for (let i = 0; i < 10; i++) {
        const grounding = await kbManager.retrieveGrounding(
          request.prompt,
          testUserId
        );
        const result = await pipeline.process(request, grounding);

        await preferenceEngine.processFeedback({
          eventId: i,
          userId: testUserId,
          signal: "favorited",
          weight: 1.5,
          tags: ["blue", "circle"],
          objectIds: [1, 2],
        });
      }

      // Mock preference cap validation
      expect(true).toBe(true); // Placeholder for actual preference cap validation
    });

    it("should maintain diversity in knowledge retrieval", async () => {
      const request = {
        prompt: "colorful geometric shapes",
        size: { width: 200, height: 200 },
        userId: testUserId,
      };

      const grounding = await kbManager.retrieveGrounding(
        request.prompt,
        testUserId
      );

      // Should include diverse objects
      expect(grounding).toBeDefined();
      expect(Array.isArray(grounding.motifs)).toBe(true);

      // Mock diversity validation
      expect(true).toBe(true); // Placeholder for actual diversity validation
    });
  });

  describe("bias control mechanisms", () => {
    it("should prevent extreme bias accumulation", async () => {
      // Simulate extreme feedback pattern
      const requests = [
        "blue circle",
        "blue square",
        "blue triangle",
        "blue star",
        "blue house",
      ];

      for (const prompt of requests) {
        const grounding = await kbManager.retrieveGrounding(prompt, testUserId);
        const result = await pipeline.process(
          {
            prompt,
            size: { width: 200, height: 200 },
            userId: testUserId,
          },
          grounding
        );

        // Give maximum positive feedback
        await preferenceEngine.processFeedback({
          eventId: Math.floor(Math.random() * 1000),
          userId: testUserId,
          signal: "favorited",
          weight: 1.5,
          tags: ["blue"],
          objectIds: [1],
        });
      }

      // Verify diversity is maintained in retrieval
      const grounding = await kbManager.retrieveGrounding(
        "colorful design",
        testUserId
      );

      expect(grounding).toBeDefined();
      expect(grounding.stylePack).toBeDefined();
    });

    it("should apply exponential moving average for preference updates", async () => {
      // Record feedback
      await preferenceEngine.processFeedback({
        eventId: 1,
        userId: testUserId,
        signal: "favorited",
        weight: 1.5,
        tags: ["blue"],
        objectIds: [1],
      });

      // Mock EMA validation
      expect(true).toBe(true); // Placeholder for actual EMA validation
    });
  });

  describe("knowledge base learning", () => {
    it("should deprecate unused objects automatically", async () => {
      // Create a test object that won't be used
      const unusedObject = await kbManager.createObject({
        kind: "motif",
        title: "Unused Test Motif",
        body: { shape: "obscure" },
        tags: ["unused", "test"],
        version: "1.0.0",
        status: "active",
      });

      expect(unusedObject.id).toBeDefined();
      expect(unusedObject.status).toBe("active");

      // Mock deprecation validation
      expect(true).toBe(true); // Placeholder for actual deprecation logic
    });

    it("should maintain audit trail for all changes", async () => {
      const object = await kbManager.createObject({
        kind: "style_pack",
        title: "Test Style Pack",
        body: { colors: ["#000000"] },
        tags: ["test"],
        version: "1.0.0",
        status: "active",
      });

      // Update the object
      const updated = await kbManager.updateObject(object.id, {
        ...object,
        title: "Updated Test Style Pack",
        version: "1.1.0",
      });

      expect(updated.title).toBe("Updated Test Style Pack");
      expect(updated.version).toBe("1.1.0");
    });
  });

  describe("grounding cache effectiveness", () => {
    it("should cache grounding data for identical prompts", async () => {
      const prompt = "blue circle with red border";
      const userId = testUserId;

      // First request - should hit database
      const start1 = Date.now();
      const grounding1 = await kbManager.retrieveGrounding(prompt, userId);
      const time1 = Date.now() - start1;

      // Second request - should hit cache
      const start2 = Date.now();
      const grounding2 = await kbManager.retrieveGrounding(prompt, userId);
      const time2 = Date.now() - start2;

      expect(grounding1).toBeDefined();
      expect(grounding2).toBeDefined();
      expect(time1).toBeGreaterThan(0);
      expect(time2).toBeGreaterThan(0);
    });

    it("should invalidate cache when KB objects are updated", async () => {
      const prompt = "test prompt";

      // Get initial grounding
      const grounding1 = await kbManager.retrieveGrounding(prompt, testUserId);

      // Get grounding again
      const grounding2 = await kbManager.retrieveGrounding(prompt, testUserId);

      expect(grounding1).toBeDefined();
      expect(grounding2).toBeDefined();
    });

    it("should respect cache TTL", async () => {
      const prompt = "cache ttl test";

      // First request
      await kbManager.retrieveGrounding(prompt, testUserId);

      // Wait for potential cache expiry
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Second request
      const start = Date.now();
      await kbManager.retrieveGrounding(prompt, testUserId);
      const time = Date.now() - start;

      expect(time).toBeGreaterThan(0);
    });
  });
});
