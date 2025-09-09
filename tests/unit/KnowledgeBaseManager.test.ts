/**
 * Unit tests for KnowledgeBaseManager
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { KnowledgeBaseManager } from "../../server/services/KnowledgeBaseManager.js";

describe("KnowledgeBaseManager", () => {
  let kbManager: KnowledgeBaseManager;
  const testUserId = "test-user-123";

  beforeEach(() => {
    kbManager = new KnowledgeBaseManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("CRUD operations", () => {
    it("should create knowledge base objects with proper validation", async () => {
      const objectData = {
        kind: "style_pack" as const,
        title: "Test Style Pack",
        body: { colors: ["#ff0000", "#00ff00"] },
        tags: ["test", "colors"],
        version: "1.0.0",
        status: "active" as const,
      };

      const result = await kbManager.createObject(objectData);

      expect(result.id).toBeDefined();
      expect(result.title).toBe("Test Style Pack");
      expect(result.kind).toBe("style_pack");
      expect(result.status).toBe("active");
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("should validate object schema before creation", async () => {
      const invalidObject = {
        kind: "invalid_kind" as any,
        title: "",
        body: null,
        tags: [],
        version: "invalid",
        status: "unknown" as any,
      };

      await expect(kbManager.createObject(invalidObject)).rejects.toThrow();
    });

    it("should enforce token budget limits", async () => {
      const largeObject = {
        kind: "motif" as const,
        title: "Large Motif",
        body: { description: "A".repeat(1000) }, // Exceeds 500 token limit
        tags: ["large"],
        version: "1.0.0",
        status: "active" as const,
      };

      await expect(kbManager.createObject(largeObject)).rejects.toThrow(
        /token.*limit/i
      );
    });

    it("should update objects with version increment", async () => {
      const original = await kbManager.createObject({
        kind: "glossary",
        title: "Test Glossary",
        body: { terms: { circle: "round shape" } },
        tags: ["test"],
        version: "1.0.0",
        status: "active",
      });

      const updated = await kbManager.updateObject(original.id, {
        ...original,
        title: "Updated Glossary",
        version: "1.1.0",
      });

      expect(updated.title).toBe("Updated Glossary");
      expect(updated.version).toBe("1.1.0");
      expect(updated.parentId).toBe(original.id);
    });

    it("should retrieve objects by various filters", async () => {
      await kbManager.createObject({
        kind: "motif",
        title: "Circle Motif",
        body: { shape: "circle" },
        tags: ["geometric", "basic"],
        version: "1.0.0",
        status: "active",
      });

      const results = await kbManager.getObject({
        kind: "motif",
        tags: ["geometric"],
      });

      expect(results).toBeDefined();
      expect(results.kind).toBe("motif");
      expect(results.tags).toContain("geometric");
    });

    it("should delete objects and maintain audit trail", async () => {
      const object = await kbManager.createObject({
        kind: "rule",
        title: "Test Rule",
        body: { condition: "test", action: "test" },
        tags: ["test"],
        version: "1.0.0",
        status: "active",
      });

      await kbManager.deleteObject(object.id);

      await expect(kbManager.getObject(object.id)).rejects.toThrow();
    });
  });

  describe("preference scoring algorithm", () => {
    it("should calculate preference scores correctly", () => {
      const similarity = 0.8;
      const preference = 0.6;
      const quality = 0.9;
      const freshness = 0.7;

      const score = kbManager.calculatePreferenceScore({
        similarity,
        preference,
        quality,
        freshness,
      });

      // α=0.6 similarity + β=0.2 preference + γ=0.2 quality - δ=0.1 freshness
      const expected = 0.6 * 0.8 + 0.2 * 0.6 + 0.2 * 0.9 - 0.1 * 0.7;
      expect(score).toBeCloseTo(expected, 3);
    });

    it("should apply preference caps", () => {
      const highPreference = 2.0; // Above cap
      const cappedScore = kbManager.applyPreferenceCap(highPreference);

      expect(cappedScore).toBeLessThanOrEqual(1.5); // Max cap
    });

    it("should handle negative preferences", () => {
      const negativePreference = -0.5;
      const score = kbManager.calculatePreferenceScore({
        similarity: 0.8,
        preference: negativePreference,
        quality: 0.9,
        freshness: 0.7,
      });

      expect(score).toBeLessThan(0.8); // Should be reduced by negative preference
    });
  });

  describe("MMR diversity selection", () => {
    it("should select diverse objects using MMR", async () => {
      // Create similar objects
      const objects = await Promise.all([
        kbManager.createObject({
          kind: "motif",
          title: "Blue Circle",
          body: { shape: "circle", color: "blue" },
          tags: ["blue", "circle"],
          version: "1.0.0",
          status: "active",
        }),
        kbManager.createObject({
          kind: "motif",
          title: "Blue Square",
          body: { shape: "square", color: "blue" },
          tags: ["blue", "square"],
          version: "1.0.0",
          status: "active",
        }),
        kbManager.createObject({
          kind: "motif",
          title: "Red Circle",
          body: { shape: "circle", color: "red" },
          tags: ["red", "circle"],
          version: "1.0.0",
          status: "active",
        }),
      ]);

      const selected = kbManager.selectWithMMR(objects, "blue circle", {
        relevanceWeight: 0.7,
        diversityWeight: 0.3,
        maxResults: 2,
      });

      expect(selected).toHaveLength(2);

      // Should include the most relevant (Blue Circle) and diverse option
      const titles = selected.map((obj) => obj.title);
      expect(titles).toContain("Blue Circle");
      expect(titles).not.toEqual(["Blue Circle", "Blue Square"]); // Should avoid too similar
    });

    it("should balance relevance and diversity", () => {
      const objects = [
        {
          id: 1,
          title: "Blue Circle",
          similarity: 0.9,
          tags: ["blue", "circle"],
        },
        {
          id: 2,
          title: "Blue Square",
          similarity: 0.8,
          tags: ["blue", "square"],
        },
        {
          id: 3,
          title: "Red Triangle",
          similarity: 0.3,
          tags: ["red", "triangle"],
        },
      ];

      const selected = kbManager.selectWithMMR(objects, "blue shapes", {
        relevanceWeight: 0.7,
        diversityWeight: 0.3,
        maxResults: 2,
      });

      expect(selected).toHaveLength(2);

      // Should include high relevance item and diverse item
      const ids = selected.map((obj) => obj.id);
      expect(ids).toContain(1); // Most relevant
      expect(ids).toContain(3); // Most diverse
    });
  });

  describe("governance filtering", () => {
    it("should filter out inappropriate content", async () => {
      const inappropriateObject = {
        kind: "motif" as const,
        title: "Inappropriate Content",
        body: { description: "sensitive content" },
        tags: ["inappropriate"],
        version: "1.0.0",
        status: "active" as const,
      };

      // Should be rejected by governance filter
      await expect(kbManager.createObject(inappropriateObject)).rejects.toThrow(
        /content.*policy/i
      );
    });

    it("should enforce neutrality controls", async () => {
      const biasedObject = {
        kind: "glossary" as const,
        title: "Biased Glossary",
        body: { terms: { good: "only blue things", bad: "everything else" } },
        tags: ["biased"],
        version: "1.0.0",
        status: "active" as const,
      };

      await expect(kbManager.createObject(biasedObject)).rejects.toThrow(
        /bias.*detected/i
      );
    });

    it("should validate content policy compliance", () => {
      const content = "This is appropriate content about geometric shapes";
      const isCompliant = kbManager.validateContentPolicy(content);
      expect(isCompliant).toBe(true);

      const inappropriateContent = "This contains sensitive information";
      const isNotCompliant =
        kbManager.validateContentPolicy(inappropriateContent);
      expect(isNotCompliant).toBe(false);
    });
  });

  describe("compatibility testing", () => {
    it("should test object compatibility with canonical prompts", async () => {
      const object = {
        kind: "style_pack" as const,
        title: "Modern Style",
        body: { colors: ["#000000", "#ffffff"] },
        tags: ["modern", "minimal"],
        version: "1.0.0",
        status: "experimental" as const,
      };

      const canonicalPrompts = [
        "modern design",
        "minimal layout",
        "black and white theme",
      ];

      const compatibilityResults = await kbManager.testCompatibility(
        object,
        canonicalPrompts
      );

      expect(compatibilityResults.passed).toBeGreaterThan(0);
      expect(compatibilityResults.total).toBe(canonicalPrompts.length);
      expect(compatibilityResults.score).toBeGreaterThan(0.5); // Should pass most tests
    });

    it("should prevent activation of incompatible objects", async () => {
      const incompatibleObject = {
        kind: "motif" as const,
        title: "Broken Motif",
        body: { invalid: "structure" },
        tags: ["broken"],
        version: "1.0.0",
        status: "experimental" as const,
      };

      const created = await kbManager.createObject(incompatibleObject);

      // Should fail compatibility test and remain experimental
      await expect(kbManager.activateObject(created.id)).rejects.toThrow(
        /compatibility.*failed/i
      );
    });
  });

  describe("versioning and lineage", () => {
    it("should maintain parent lineage", async () => {
      const v1 = await kbManager.createObject({
        kind: "rule",
        title: "Original Rule",
        body: { condition: "test", action: "original" },
        tags: ["test"],
        version: "1.0.0",
        status: "active",
      });

      const v2 = await kbManager.updateObject(v1.id, {
        ...v1,
        body: { condition: "test", action: "updated" },
        version: "2.0.0",
      });

      expect(v2.parentId).toBe(v1.id);
      expect(v2.version).toBe("2.0.0");

      const lineage = await kbManager.getObjectLineage(v2.id);
      expect(lineage).toHaveLength(2);
      expect(lineage[0].version).toBe("1.0.0");
      expect(lineage[1].version).toBe("2.0.0");
    });

    it("should follow semantic versioning", () => {
      expect(kbManager.isValidVersion("1.0.0")).toBe(true);
      expect(kbManager.isValidVersion("2.1.3")).toBe(true);
      expect(kbManager.isValidVersion("invalid")).toBe(false);
      expect(kbManager.isValidVersion("1.0")).toBe(false);
    });

    it("should increment versions correctly", () => {
      expect(kbManager.incrementVersion("1.0.0", "patch")).toBe("1.0.1");
      expect(kbManager.incrementVersion("1.0.0", "minor")).toBe("1.1.0");
      expect(kbManager.incrementVersion("1.0.0", "major")).toBe("2.0.0");
    });
  });

  describe("automatic deprecation", () => {
    it("should identify stale objects", async () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 5); // 5 months ago

      const staleObject = await kbManager.createObject({
        kind: "motif",
        title: "Stale Motif",
        body: { shape: "old" },
        tags: ["stale"],
        version: "1.0.0",
        status: "active",
      });

      // Mock old creation date
      vi.spyOn(kbManager, "getObjectAge").mockReturnValue(150); // 150 days

      const staleObjects = await kbManager.identifyStaleObjects();
      expect(staleObjects.some((obj) => obj.id === staleObject.id)).toBe(true);
    });

    it("should deprecate unused objects", async () => {
      const unusedObject = await kbManager.createObject({
        kind: "fewshot",
        title: "Unused Example",
        body: { prompt: "test", response: "test" },
        tags: ["unused"],
        version: "1.0.0",
        status: "active",
      });

      // Mock low usage stats
      vi.spyOn(kbManager, "getObjectUsageStats").mockReturnValue({
        usageCount: 0,
        lastUsed: null,
        winRate: 0,
      });

      await kbManager.deprecateUnusedObjects();

      const updated = await kbManager.getObject(unusedObject.id);
      expect(updated.status).toBe("deprecated");
    });
  });
});
