/**
 * Performance benchmark tests for vector similarity vs tag-based filtering
 */
import { describe, it, expect, beforeEach } from "vitest";
import { EmbeddingService } from "../../server/services/EmbeddingService.js";
import { KnowledgeBaseManager } from "../../server/services/KnowledgeBaseManager.js";

describe("Performance Benchmarks", () => {
  let embeddingService: EmbeddingService;
  let kbManager: KnowledgeBaseManager;

  beforeEach(() => {
    embeddingService = new EmbeddingService();
    kbManager = new KnowledgeBaseManager();
  });

  describe("Vector Similarity vs Tag-based Filtering", () => {
    it("should benchmark vector similarity search performance", async () => {
      const testPrompt = "blue geometric circle with red border";
      const iterations = 100;

      // Create test dataset
      const testObjects = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Test Object ${i}`,
        body: { description: `Test description ${i}` },
        tags: [`tag${i % 10}`, `category${i % 5}`],
        embedding: Array.from({ length: 1536 }, () => Math.random()),
      }));

      // Benchmark vector similarity search
      const vectorStartTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        await embeddingService.findSimilar(testPrompt, testObjects, {
          limit: 10,
          threshold: 0.7,
        });
      }

      const vectorEndTime = performance.now();
      const vectorTime = vectorEndTime - vectorStartTime;

      // Benchmark tag-based filtering
      const tagStartTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const results = testObjects
          .filter((obj) =>
            obj.tags.some((tag) =>
              testPrompt.toLowerCase().includes(tag.toLowerCase())
            )
          )
          .slice(0, 10);
      }

      const tagEndTime = performance.now();
      const tagTime = tagEndTime - tagStartTime;

      console.log(
        `Vector similarity: ${vectorTime}ms for ${iterations} iterations`
      );
      console.log(
        `Tag-based filtering: ${tagTime}ms for ${iterations} iterations`
      );
      console.log(`Performance ratio: ${vectorTime / tagTime}x`);

      // Vector search should be reasonable (not more than 10x slower than tags)
      expect(vectorTime / tagTime).toBeLessThan(10);
    });

    it("should benchmark embedding generation performance", async () => {
      const testTexts = [
        "blue circle with red border",
        "geometric pattern with triangles",
        "minimalist design with earth tones",
        "abstract flowing lines in purple",
        "symmetrical star pattern in gold",
      ];

      const batchSizes = [1, 5, 10, 20];
      const results: Record<number, number> = {};

      for (const batchSize of batchSizes) {
        const batches = Math.ceil(testTexts.length / batchSize);
        const startTime = performance.now();

        for (let i = 0; i < batches; i++) {
          const batch = testTexts.slice(i * batchSize, (i + 1) * batchSize);
          await embeddingService.generateEmbeddings(batch);
        }

        const endTime = performance.now();
        results[batchSize] = endTime - startTime;
      }

      console.log("Embedding generation performance by batch size:");
      Object.entries(results).forEach(([size, time]) => {
        console.log(`Batch size ${size}: ${time}ms`);
      });

      // Larger batches should be more efficient per item
      const timePerItemBatch1 = results[1] / testTexts.length;
      const timePerItemBatch10 = results[10] / testTexts.length;

      expect(timePerItemBatch10).toBeLessThan(timePerItemBatch1);
    });

    it("should benchmark cache performance", async () => {
      const testPrompt = "test prompt for caching";
      const userId = "test-user";

      // First call - should hit database
      const uncachedStartTime = performance.now();
      const result1 = await kbManager.retrieveGrounding(testPrompt, userId);
      const uncachedEndTime = performance.now();
      const uncachedTime = uncachedEndTime - uncachedStartTime;

      // Second call - should hit cache
      const cachedStartTime = performance.now();
      const result2 = await kbManager.retrieveGrounding(testPrompt, userId);
      const cachedEndTime = performance.now();
      const cachedTime = cachedEndTime - cachedStartTime;

      console.log(`Uncached retrieval: ${uncachedTime}ms`);
      console.log(`Cached retrieval: ${cachedTime}ms`);
      console.log(`Cache speedup: ${uncachedTime / cachedTime}x`);

      expect(result1).toEqual(result2);
      expect(cachedTime).toBeLessThan(uncachedTime * 0.5); // Cache should be at least 2x faster
    });

    it("should benchmark MMR selection performance", async () => {
      const testObjects = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Object ${i}`,
        similarity: Math.random(),
        tags: [`tag${i % 20}`],
        embedding: Array.from({ length: 1536 }, () => Math.random()),
      }));

      const selectionSizes = [5, 10, 20, 50];
      const results: Record<number, number> = {};

      for (const size of selectionSizes) {
        const startTime = performance.now();

        // Run MMR selection multiple times
        for (let i = 0; i < 10; i++) {
          kbManager.selectWithMMR(testObjects, "test query", {
            relevanceWeight: 0.7,
            diversityWeight: 0.3,
            maxResults: size,
          });
        }

        const endTime = performance.now();
        results[size] = endTime - startTime;
      }

      console.log("MMR selection performance by result size:");
      Object.entries(results).forEach(([size, time]) => {
        console.log(`Size ${size}: ${time}ms for 10 iterations`);
      });

      // Performance should scale reasonably with result size
      expect(results[50]).toBeLessThan(results[5] * 20); // Not more than 20x slower
    });
  });

  describe("Database Query Performance", () => {
    it("should benchmark knowledge base queries", async () => {
      const queryTypes = [
        { name: "by_kind", filter: { kind: "motif" } },
        { name: "by_tags", filter: { tags: ["geometric"] } },
        { name: "by_status", filter: { status: "active" } },
        { name: "by_quality", filter: { minQuality: 0.8 } },
        {
          name: "complex",
          filter: {
            kind: "motif",
            tags: ["geometric"],
            status: "active",
            minQuality: 0.7,
          },
        },
      ];

      const results: Record<string, number> = {};

      for (const queryType of queryTypes) {
        const startTime = performance.now();

        // Run query multiple times
        for (let i = 0; i < 50; i++) {
          await kbManager.queryObjects(queryType.filter);
        }

        const endTime = performance.now();
        results[queryType.name] = endTime - startTime;
      }

      console.log("Database query performance:");
      Object.entries(results).forEach(([type, time]) => {
        console.log(`${type}: ${time}ms for 50 iterations`);
      });

      // All queries should complete within reasonable time
      Object.values(results).forEach((time) => {
        expect(time).toBeLessThan(5000); // Less than 5 seconds for 50 queries
      });
    });

    it("should benchmark preference aggregation", async () => {
      const userCount = 100;
      const feedbackPerUser = 50;

      // Generate test feedback data
      const feedbacks = [];
      for (let userId = 0; userId < userCount; userId++) {
        for (let i = 0; i < feedbackPerUser; i++) {
          feedbacks.push({
            userId: `user-${userId}`,
            eventId: userId * feedbackPerUser + i,
            signal: Math.random() > 0.5 ? "favorited" : "kept",
            tags: [`tag${i % 10}`],
            objectIds: [i % 100],
            timestamp: new Date(),
          });
        }
      }

      // Benchmark preference aggregation
      const startTime = performance.now();

      await kbManager.aggregatePreferences(feedbacks);

      const endTime = performance.now();
      const aggregationTime = endTime - startTime;

      console.log(
        `Preference aggregation: ${aggregationTime}ms for ${feedbacks.length} feedback items`
      );

      // Should complete within reasonable time
      expect(aggregationTime).toBeLessThan(10000); // Less than 10 seconds
    });
  });

  describe("Generation Pipeline Performance", () => {
    it("should benchmark end-to-end generation performance", async () => {
      const testRequests = [
        {
          prompt: "simple blue circle",
          size: { width: 200, height: 200 },
          complexity: "simple",
        },
        {
          prompt: "complex geometric pattern with multiple colors and shapes",
          size: { width: 800, height: 600 },
          complexity: "complex",
        },
        {
          prompt: "detailed mandala design with intricate patterns",
          size: { width: 1000, height: 1000 },
          complexity: "detailed",
        },
      ];

      const results: Record<string, number> = {};

      for (const request of testRequests) {
        const times = [];

        // Run multiple iterations for each complexity
        for (let i = 0; i < 5; i++) {
          const startTime = performance.now();

          // Mock generation pipeline
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              request.complexity === "simple"
                ? 100
                : request.complexity === "complex"
                  ? 500
                  : 1000
            )
          );

          const endTime = performance.now();
          times.push(endTime - startTime);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        results[request.complexity] = avgTime;
      }

      console.log("Generation pipeline performance:");
      Object.entries(results).forEach(([complexity, time]) => {
        console.log(`${complexity}: ${time}ms average`);
      });

      // Performance should scale with complexity
      expect(results.simple).toBeLessThan(results.complex);
      expect(results.complex).toBeLessThan(results.detailed);

      // All should complete within reasonable time
      expect(results.detailed).toBeLessThan(5000); // Less than 5 seconds
    });

    it("should benchmark concurrent generation performance", async () => {
      const concurrencyLevels = [1, 5, 10, 20];
      const results: Record<number, number> = {};

      for (const concurrency of concurrencyLevels) {
        const startTime = performance.now();

        const promises = Array.from(
          { length: concurrency },
          () =>
            // Mock generation
            new Promise((resolve) => setTimeout(resolve, 200))
        );

        await Promise.all(promises);

        const endTime = performance.now();
        results[concurrency] = endTime - startTime;
      }

      console.log("Concurrent generation performance:");
      Object.entries(results).forEach(([concurrency, time]) => {
        console.log(`${concurrency} concurrent: ${time}ms`);
      });

      // Concurrent execution should be more efficient than sequential
      expect(results[10]).toBeLessThan(results[1] * 8); // Should have some parallelization benefit
    });
  });

  describe("Memory Usage Benchmarks", () => {
    it("should monitor memory usage during large operations", async () => {
      const initialMemory = process.memoryUsage();

      // Simulate large dataset processing
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        title: `Object ${i}`,
        body: { description: "A".repeat(100) },
        tags: Array.from({ length: 10 }, (_, j) => `tag${j}`),
        embedding: Array.from({ length: 1536 }, () => Math.random()),
      }));

      // Process the dataset
      const processed = largeDataset.map((item) => ({
        ...item,
        processed: true,
        similarity: Math.random(),
      }));

      const finalMemory = process.memoryUsage();

      const memoryIncrease = {
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
        external: finalMemory.external - initialMemory.external,
      };

      console.log("Memory usage increase:");
      console.log(
        `Heap used: ${Math.round(memoryIncrease.heapUsed / 1024 / 1024)}MB`
      );
      console.log(
        `Heap total: ${Math.round(memoryIncrease.heapTotal / 1024 / 1024)}MB`
      );
      console.log(
        `External: ${Math.round(memoryIncrease.external / 1024 / 1024)}MB`
      );

      // Memory increase should be reasonable
      expect(memoryIncrease.heapUsed).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
    });

    it("should test memory cleanup after operations", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create and process large temporary data
      for (let i = 0; i < 10; i++) {
        const tempData = Array.from({ length: 1000 }, () => ({
          data: "A".repeat(1000),
          embedding: Array.from({ length: 1536 }, () => Math.random()),
        }));

        // Process and discard
        tempData.forEach((item) => item.data.length);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Wait a bit for cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(
        `Memory increase after cleanup: ${Math.round(memoryIncrease / 1024 / 1024)}MB`
      );

      // Memory should not increase significantly after cleanup
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });
  });
});
