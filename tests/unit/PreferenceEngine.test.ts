/**
 * Unit tests for PreferenceEngine
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PreferenceEngine } from "../../server/services/PreferenceEngine.js";

describe("PreferenceEngine", () => {
  let preferenceEngine: PreferenceEngine;
  const testUserId = "test-user-123";

  beforeEach(() => {
    preferenceEngine = new PreferenceEngine();
  });

  describe("feedback signal processing", () => {
    it("should process positive feedback signals correctly", async () => {
      const feedback = {
        eventId: 1,
        userId: testUserId,
        signal: "favorited" as const,
        weight: 1.5,
        tags: ["blue", "circle"],
        objectIds: [1, 2, 3],
      };

      const result = await preferenceEngine.processFeedback(feedback);

      expect(result.preferencesUpdated).toBe(true);
      expect(result.tagsAffected).toEqual(["blue", "circle"]);
      expect(result.objectsAffected).toEqual([1, 2, 3]);
    });

    it("should process negative feedback signals correctly", async () => {
      const feedback = {
        eventId: 2,
        userId: testUserId,
        signal: "reported" as const,
        weight: -3,
        tags: ["inappropriate", "bad"],
        objectIds: [4, 5],
      };

      const result = await preferenceEngine.processFeedback(feedback);

      expect(result.preferencesUpdated).toBe(true);
      expect(result.tagsAffected).toEqual(["inappropriate", "bad"]);
      expect(result.objectsAffected).toEqual([4, 5]);
    });

    it("should handle implicit feedback signals", async () => {
      const implicitSignals = [
        { signal: "exported" as const, expectedWeight: 2 },
        { signal: "kept" as const, expectedWeight: 1 },
        { signal: "edited" as const, expectedWeight: 0.5 },
        { signal: "regenerated" as const, expectedWeight: -0.5 },
      ];

      for (const { signal, expectedWeight } of implicitSignals) {
        const feedback = {
          eventId: Math.random(),
          userId: testUserId,
          signal,
          tags: ["test"],
          objectIds: [1],
        };

        const result = await preferenceEngine.processFeedback(feedback);
        expect(result.weightApplied).toBe(expectedWeight);
      }
    });

    it("should validate feedback data", async () => {
      const invalidFeedback = {
        eventId: null as any,
        userId: "",
        signal: "invalid" as any,
        tags: [],
        objectIds: [],
      };

      await expect(
        preferenceEngine.processFeedback(invalidFeedback)
      ).rejects.toThrow(/invalid.*feedback/i);
    });
  });

  describe("preference aggregation", () => {
    it("should use exponential moving average for preference updates", async () => {
      const initialPreference = 0.5;
      const newSignal = 1.0;
      const alpha = 0.3; // EMA smoothing factor

      // Set initial preference
      await preferenceEngine.setUserPreference(
        testUserId,
        "blue",
        initialPreference
      );

      // Apply new feedback
      await preferenceEngine.processFeedback({
        eventId: 1,
        userId: testUserId,
        signal: "favorited",
        weight: 1.5,
        tags: ["blue"],
        objectIds: [1],
      });

      const updatedPreference = await preferenceEngine.getUserPreference(
        testUserId,
        "blue"
      );

      // Should be between initial and new value
      expect(updatedPreference).toBeGreaterThan(initialPreference);
      expect(updatedPreference).toBeLessThan(newSignal);
    });

    it("should aggregate multiple feedback signals", async () => {
      const feedbacks = [
        { signal: "favorited" as const, weight: 1.5 },
        { signal: "exported" as const, weight: 2.0 },
        { signal: "kept" as const, weight: 1.0 },
      ];

      for (const feedback of feedbacks) {
        await preferenceEngine.processFeedback({
          eventId: Math.random(),
          userId: testUserId,
          signal: feedback.signal,
          weight: feedback.weight,
          tags: ["aggregate"],
          objectIds: [1],
        });
      }

      const finalPreference = await preferenceEngine.getUserPreference(
        testUserId,
        "aggregate"
      );
      expect(finalPreference).toBeGreaterThan(0);
    });

    it("should handle conflicting feedback signals", async () => {
      // Positive feedback
      await preferenceEngine.processFeedback({
        eventId: 1,
        userId: testUserId,
        signal: "favorited",
        weight: 1.5,
        tags: ["conflict"],
        objectIds: [1],
      });

      // Negative feedback
      await preferenceEngine.processFeedback({
        eventId: 2,
        userId: testUserId,
        signal: "reported",
        weight: -3,
        tags: ["conflict"],
        objectIds: [1],
      });

      const finalPreference = await preferenceEngine.getUserPreference(
        testUserId,
        "conflict"
      );

      // Should reflect the net effect of conflicting signals
      expect(typeof finalPreference).toBe("number");
    });
  });

  describe("bias control mechanisms", () => {
    it("should apply preference caps", async () => {
      // Apply many positive signals to try to exceed cap
      for (let i = 0; i < 10; i++) {
        await preferenceEngine.processFeedback({
          eventId: i,
          userId: testUserId,
          signal: "favorited",
          weight: 1.5,
          tags: ["capped"],
          objectIds: [1],
        });
      }

      const preference = await preferenceEngine.getUserPreference(
        testUserId,
        "capped"
      );
      expect(preference).toBeLessThanOrEqual(1.5); // Max preference cap
    });

    it("should prevent echo chamber formation", async () => {
      // Set strong preference for one tag
      await preferenceEngine.setUserPreference(testUserId, "blue", 1.4);

      // Request diverse content
      const diversePrompt = "colorful geometric shapes";
      const recommendations = await preferenceEngine.getRecommendations(
        testUserId,
        diversePrompt,
        { ensureDiversity: true }
      );

      // Should include non-blue options despite strong blue preference
      const hasNonBlue = recommendations.some(
        (rec) => !rec.tags.includes("blue")
      );
      expect(hasNonBlue).toBe(true);
    });

    it("should detect and flag extreme bias", async () => {
      // Create extreme bias scenario
      await preferenceEngine.setUserPreference(testUserId, "extreme", 1.5);
      await preferenceEngine.setUserPreference(testUserId, "other", -1.0);

      const biasReport = await preferenceEngine.analyzeBias(testUserId);

      expect(biasReport.hasExtremeBias).toBe(true);
      expect(biasReport.biasedTags).toContain("extreme");
      expect(biasReport.recommendedActions).toContain("diversify");
    });

    it("should maintain preference diversity", () => {
      const preferences = {
        blue: 1.2,
        red: 0.8,
        green: 0.3,
        yellow: -0.2,
      };

      const diversityScore =
        preferenceEngine.calculateDiversityScore(preferences);
      expect(diversityScore).toBeGreaterThan(0);
      expect(diversityScore).toBeLessThanOrEqual(1);
    });
  });

  describe("global preference learning", () => {
    it("should aggregate user preferences into global preferences", async () => {
      const users = ["user1", "user2", "user3"];

      // Set preferences for multiple users
      for (const userId of users) {
        await preferenceEngine.setUserPreference(userId, "popular", 1.0);
        await preferenceEngine.setUserPreference(userId, "unpopular", -0.5);
      }

      await preferenceEngine.updateGlobalPreferences();

      const globalPrefs = await preferenceEngine.getGlobalPreferences();
      expect(globalPrefs.popular).toBeGreaterThan(0);
      expect(globalPrefs.unpopular).toBeLessThan(0);
    });

    it("should weight global preferences by user activity", async () => {
      const activeUser = "active-user";
      const inactiveUser = "inactive-user";

      // Active user with many interactions
      for (let i = 0; i < 10; i++) {
        await preferenceEngine.processFeedback({
          eventId: i,
          userId: activeUser,
          signal: "favorited",
          weight: 1.5,
          tags: ["weighted"],
          objectIds: [1],
        });
      }

      // Inactive user with few interactions
      await preferenceEngine.processFeedback({
        eventId: 100,
        userId: inactiveUser,
        signal: "reported",
        weight: -3,
        tags: ["weighted"],
        objectIds: [1],
      });

      await preferenceEngine.updateGlobalPreferences();

      const globalPref = await preferenceEngine.getGlobalPreference("weighted");

      // Should be positive due to active user's weight
      expect(globalPref).toBeGreaterThan(0);
    });

    it("should handle cold start scenarios", async () => {
      const newUser = "new-user";

      // New user with no preferences
      const recommendations = await preferenceEngine.getRecommendations(
        newUser,
        "geometric shapes"
      );

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);

      // Should use global preferences for cold start
      const usedGlobalPrefs = recommendations.some(
        (rec) => rec.source === "global"
      );
      expect(usedGlobalPrefs).toBe(true);
    });
  });

  describe("preference decay and freshness", () => {
    it("should decay old preferences over time", async () => {
      const oldPreference = 1.0;
      await preferenceEngine.setUserPreference(
        testUserId,
        "decay",
        oldPreference
      );

      // Mock time passage
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 6);
      vi.spyOn(preferenceEngine, "getPreferenceAge").mockReturnValue(180); // 180 days

      await preferenceEngine.applyPreferenceDecay(testUserId);

      const decayedPreference = await preferenceEngine.getUserPreference(
        testUserId,
        "decay"
      );
      expect(decayedPreference).toBeLessThan(oldPreference);
    });

    it("should maintain recent preferences", async () => {
      const recentPreference = 1.0;
      await preferenceEngine.setUserPreference(
        testUserId,
        "recent",
        recentPreference
      );

      // Mock recent activity
      vi.spyOn(preferenceEngine, "getPreferenceAge").mockReturnValue(7); // 7 days

      await preferenceEngine.applyPreferenceDecay(testUserId);

      const maintainedPreference = await preferenceEngine.getUserPreference(
        testUserId,
        "recent"
      );
      expect(maintainedPreference).toBeCloseTo(recentPreference, 2);
    });

    it("should calculate freshness scores correctly", () => {
      const ages = [1, 7, 30, 90, 180]; // days
      const freshnessScores = ages.map((age) =>
        preferenceEngine.calculateFreshnessScore(age)
      );

      // Freshness should decrease with age
      for (let i = 1; i < freshnessScores.length; i++) {
        expect(freshnessScores[i]).toBeLessThan(freshnessScores[i - 1]);
      }
    });
  });

  describe("performance and optimization", () => {
    it("should batch preference updates efficiently", async () => {
      const batchSize = 100;
      const feedbacks = Array.from({ length: batchSize }, (_, i) => ({
        eventId: i,
        userId: testUserId,
        signal: "kept" as const,
        weight: 1.0,
        tags: [`tag${i % 10}`],
        objectIds: [i],
      }));

      const startTime = Date.now();
      await preferenceEngine.processFeedbackBatch(feedbacks);
      const endTime = Date.now();

      // Should complete batch processing quickly
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    });

    it("should cache frequently accessed preferences", async () => {
      const tag = "cached";

      // First access - should hit database
      const start1 = Date.now();
      await preferenceEngine.getUserPreference(testUserId, tag);
      const time1 = Date.now() - start1;

      // Second access - should hit cache
      const start2 = Date.now();
      await preferenceEngine.getUserPreference(testUserId, tag);
      const time2 = Date.now() - start2;

      expect(time2).toBeLessThan(time1 * 0.5); // Cache should be faster
    });

    it("should handle concurrent preference updates", async () => {
      const concurrentUpdates = Array.from({ length: 10 }, (_, i) =>
        preferenceEngine.processFeedback({
          eventId: i,
          userId: testUserId,
          signal: "favorited",
          weight: 1.0,
          tags: ["concurrent"],
          objectIds: [i],
        })
      );

      // Should handle all updates without errors
      await expect(Promise.all(concurrentUpdates)).resolves.toBeDefined();

      const finalPreference = await preferenceEngine.getUserPreference(
        testUserId,
        "concurrent"
      );
      expect(finalPreference).toBeGreaterThan(0);
    });
  });
});
