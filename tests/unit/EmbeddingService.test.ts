/**
 * Unit tests for EmbeddingService
 */
import { describe, it, expect, vi } from "vitest";
import { EmbeddingService } from "../../server/services/EmbeddingService.js";

// Mock fetch for testing
global.fetch = vi.fn();

describe("EmbeddingService", () => {
  const mockConfig = {
    model: "text-embedding-3-small",
    apiKey: "test-api-key",
    batchSize: 2,
    cacheEnabled: true,
  };

  describe("generateEmbedding", () => {
    it("should generate embedding for text", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ embedding: mockEmbedding }],
          usage: { total_tokens: 10 },
        }),
      });

      const service = new EmbeddingService(mockConfig);
      const result = await service.generateEmbedding("test text");

      expect(result.embedding).toEqual(mockEmbedding);
      expect(result.tokens).toBe(10);
      expect(result.model).toBe("text-embedding-3-small");
    });

    it("should use cache when enabled", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ embedding: mockEmbedding }],
          usage: { total_tokens: 5 },
        }),
      });

      const service = new EmbeddingService(mockConfig);

      // First call should hit API
      const result1 = await service.generateEmbedding("cached text");
      expect(result1.embedding).toEqual(mockEmbedding);

      // Second call should use cache (no additional fetch call)
      const result2 = await service.generateEmbedding("cached text");
      expect(result2.embedding).toEqual(mockEmbedding);

      // Verify only one API call was made
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw error when API key is missing", async () => {
      const configWithoutKey = { ...mockConfig, apiKey: undefined };
      const service = new EmbeddingService(configWithoutKey);

      await expect(service.generateEmbedding("test")).rejects.toThrow(
        "OpenAI API key not configured for embeddings"
      );
    });

    it("should handle API errors", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      });

      const service = new EmbeddingService(mockConfig);

      await expect(service.generateEmbedding("test")).rejects.toThrow(
        "OpenAI Embeddings API error: 429 Rate limit exceeded"
      );
    });
  });

  describe("generateBatchEmbeddings", () => {
    it("should generate embeddings for multiple texts", async () => {
      const mockEmbeddings = [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { embedding: mockEmbeddings[0] },
            { embedding: mockEmbeddings[1] },
          ],
          usage: { total_tokens: 20 },
        }),
      });

      const service = new EmbeddingService(mockConfig);
      const result = await service.generateBatchEmbeddings(["text1", "text2"]);

      expect(result.embeddings).toEqual(mockEmbeddings);
      expect(result.totalTokens).toBe(20);
      expect(result.model).toBe("text-embedding-3-small");
    });

    it("should process in batches when input exceeds batch size", async () => {
      const texts = ["text1", "text2", "text3", "text4"];
      const mockEmbeddings = [
        [0.1, 0.2],
        [0.3, 0.4],
        [0.5, 0.6],
        [0.7, 0.8],
      ];

      // Mock two API calls for batch size of 2
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { embedding: mockEmbeddings[0] },
              { embedding: mockEmbeddings[1] },
            ],
            usage: { total_tokens: 10 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [
              { embedding: mockEmbeddings[2] },
              { embedding: mockEmbeddings[3] },
            ],
            usage: { total_tokens: 10 },
          }),
        });

      const service = new EmbeddingService(mockConfig);
      const result = await service.generateBatchEmbeddings(texts);

      expect(result.embeddings).toEqual(mockEmbeddings);
      expect(result.totalTokens).toBe(20);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should use cached embeddings in batch processing", async () => {
      const service = new EmbeddingService(mockConfig);

      // Pre-populate cache
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ embedding: [0.1, 0.2] }],
          usage: { total_tokens: 5 },
        }),
      });
      await service.generateEmbedding("cached text");

      // Now batch process with one cached and one new
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ embedding: [0.3, 0.4] }],
          usage: { total_tokens: 5 },
        }),
      });

      const result = await service.generateBatchEmbeddings([
        "cached text",
        "new text",
      ]);

      expect(result.embeddings).toEqual([
        [0.1, 0.2],
        [0.3, 0.4],
      ]);
      expect(global.fetch).toHaveBeenCalledTimes(2); // One for cache, one for new
    });
  });

  describe("calculateCosineSimilarity", () => {
    it("should calculate cosine similarity correctly", () => {
      const service = new EmbeddingService(mockConfig);

      const embedding1 = [1, 0, 0];
      const embedding2 = [0, 1, 0];
      const embedding3 = [1, 0, 0];

      // Orthogonal vectors should have similarity 0
      expect(
        service.calculateCosineSimilarity(embedding1, embedding2)
      ).toBeCloseTo(0);

      // Identical vectors should have similarity 1
      expect(
        service.calculateCosineSimilarity(embedding1, embedding3)
      ).toBeCloseTo(1);
    });

    it("should handle zero vectors", () => {
      const service = new EmbeddingService(mockConfig);

      const zeroVector = [0, 0, 0];
      const normalVector = [1, 2, 3];

      expect(service.calculateCosineSimilarity(zeroVector, normalVector)).toBe(
        0
      );
    });

    it("should throw error for mismatched dimensions", () => {
      const service = new EmbeddingService(mockConfig);

      const embedding1 = [1, 2, 3];
      const embedding2 = [1, 2];

      expect(() => {
        service.calculateCosineSimilarity(embedding1, embedding2);
      }).toThrow("Embeddings must have the same dimension");
    });
  });

  describe("findMostSimilar", () => {
    it("should find most similar embeddings", () => {
      const service = new EmbeddingService(mockConfig);

      const queryEmbedding = [1, 0, 0];
      const candidates = [
        { id: "a", embedding: [1, 0, 0], metadata: { type: "exact" } },
        { id: "b", embedding: [0, 1, 0], metadata: { type: "orthogonal" } },
        { id: "c", embedding: [0.8, 0.6, 0], metadata: { type: "similar" } },
      ];

      const results = service.findMostSimilar(queryEmbedding, candidates, 2);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe("a"); // Most similar (identical)
      expect(results[0].similarity).toBeCloseTo(1);
      expect(results[1].id).toBe("c"); // Second most similar
      expect(results[1].similarity).toBeGreaterThan(0);
    });
  });

  describe("generateEmbeddingForKBObject", () => {
    it("should extract text from KB object and generate embedding", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ embedding: mockEmbedding }],
          usage: { total_tokens: 10 },
        }),
      });

      const service = new EmbeddingService(mockConfig);
      const kbObject = {
        title: "Test Object",
        tags: ["test", "example"],
        body: {
          description: "This is a test object",
          properties: ["prop1", "prop2"],
        },
      };

      const embedding = await service.generateEmbeddingForKBObject(kbObject);

      expect(embedding).toEqual(mockEmbedding);

      // Verify the API was called with extracted text
      const apiCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(apiCall[1].body);
      expect(requestBody.input).toContain("Test Object");
      expect(requestBody.input).toContain("test example");
      expect(requestBody.input).toContain("This is a test object");
    });

    it("should handle objects with string body", async () => {
      const mockEmbedding = [0.1, 0.2];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ embedding: mockEmbedding }],
          usage: { total_tokens: 5 },
        }),
      });

      const service = new EmbeddingService(mockConfig);
      const kbObject = {
        title: "Simple Object",
        body: "Simple string content",
      };

      const embedding = await service.generateEmbeddingForKBObject(kbObject);
      expect(embedding).toEqual(mockEmbedding);
    });
  });

  describe("tagBasedSimilarity", () => {
    it("should calculate tag-based similarity", () => {
      const query = "blue geometric circle";
      const tags = ["blue", "shape", "geometric"];

      const similarity = EmbeddingService.tagBasedSimilarity(query, tags);

      // Should match 'blue' and 'geometric' out of 3 query words
      expect(similarity).toBeCloseTo(2 / 3);
    });

    it("should handle partial matches", () => {
      const query = "circular shape";
      const tags = ["circle", "geometric"];

      const similarity = EmbeddingService.tagBasedSimilarity(query, tags);

      // 'circular' should partially match 'circle'
      expect(similarity).toBeGreaterThan(0);
    });

    it("should return 0 for no matches", () => {
      const query = "red square";
      const tags = ["blue", "circle"];

      const similarity = EmbeddingService.tagBasedSimilarity(query, tags);
      expect(similarity).toBe(0);
    });
  });

  describe("cache management", () => {
    it("should provide cache stats", () => {
      const service = new EmbeddingService(mockConfig);
      const stats = service.getCacheStats();

      expect(stats).toHaveProperty("size");
      expect(typeof stats.size).toBe("number");
    });

    it("should clear cache", async () => {
      const service = new EmbeddingService(mockConfig);

      // Add something to cache
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ embedding: [0.1, 0.2] }],
          usage: { total_tokens: 5 },
        }),
      });
      await service.generateEmbedding("test");

      expect(service.getCacheStats().size).toBeGreaterThan(0);

      service.clearCache();
      expect(service.getCacheStats().size).toBe(0);
    });
  });
});
