/**
 * EmbeddingService - Handles text embeddings for semantic search
 */
export interface EmbeddingConfig {
  model: string;
  apiKey?: string;
  batchSize: number;
  cacheEnabled: boolean;
}

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  totalTokens: number;
  model: string;
}

export class EmbeddingService {
  private config: EmbeddingConfig;
  private cache = new Map<string, EmbeddingResult>();

  constructor(config: EmbeddingConfig) {
    this.config = config;
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    // Check cache first
    if (this.config.cacheEnabled && this.cache.has(text)) {
      return this.cache.get(text)!;
    }

    if (!this.config.apiKey) {
      throw new Error("OpenAI API key not configured for embeddings");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          input: text,
          encoding_format: "float",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `OpenAI Embeddings API error: ${response.status} ${error}`
        );
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        throw new Error("No embedding data returned from API");
      }

      const result: EmbeddingResult = {
        embedding: data.data[0].embedding,
        tokens: data.usage.total_tokens,
        model: this.config.model,
      };

      // Cache the result
      if (this.config.cacheEnabled) {
        this.cache.set(text, result);
      }

      return result;
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      throw error;
    }
  }

  async generateBatchEmbeddings(
    texts: string[]
  ): Promise<BatchEmbeddingResult> {
    if (!this.config.apiKey) {
      throw new Error("OpenAI API key not configured for embeddings");
    }

    // Process in batches to avoid API limits
    const batches = this.chunkArray(texts, this.config.batchSize);
    const allEmbeddings: number[][] = [];
    let totalTokens = 0;

    for (const batch of batches) {
      // Check cache for each item in batch
      const cachedResults: (EmbeddingResult | null)[] = [];
      const uncachedTexts: string[] = [];
      const uncachedIndices: number[] = [];

      for (let i = 0; i < batch.length; i++) {
        const text = batch[i];
        if (this.config.cacheEnabled && this.cache.has(text)) {
          cachedResults[i] = this.cache.get(text)!;
        } else {
          cachedResults[i] = null;
          uncachedTexts.push(text);
          uncachedIndices.push(i);
        }
      }

      // Generate embeddings for uncached texts
      let batchResults: EmbeddingResult[] = [];
      if (uncachedTexts.length > 0) {
        try {
          const response = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.config.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: this.config.model,
              input: uncachedTexts,
              encoding_format: "float",
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(
              `OpenAI Embeddings API error: ${response.status} ${error}`
            );
          }

          const data = await response.json();

          if (!data.data || data.data.length !== uncachedTexts.length) {
            throw new Error("Unexpected embedding data from API");
          }

          batchResults = data.data.map((item: any, index: number) => ({
            embedding: item.embedding,
            tokens: data.usage.total_tokens / uncachedTexts.length, // Approximate per-text tokens
            model: this.config.model,
          }));

          totalTokens += data.usage.total_tokens;

          // Cache the results
          if (this.config.cacheEnabled) {
            uncachedTexts.forEach((text, index) => {
              this.cache.set(text, batchResults[index]);
            });
          }
        } catch (error) {
          console.error("Failed to generate batch embeddings:", error);
          throw error;
        }
      }

      // Combine cached and new results
      const batchEmbeddings: number[][] = [];
      let uncachedIndex = 0;

      for (let i = 0; i < batch.length; i++) {
        if (cachedResults[i]) {
          batchEmbeddings.push(cachedResults[i]!.embedding);
          totalTokens += cachedResults[i]!.tokens;
        } else {
          batchEmbeddings.push(batchResults[uncachedIndex].embedding);
          uncachedIndex++;
        }
      }

      allEmbeddings.push(...batchEmbeddings);
    }

    return {
      embeddings: allEmbeddings,
      totalTokens,
      model: this.config.model,
    };
  }

  calculateCosineSimilarity(
    embedding1: number[],
    embedding2: number[]
  ): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error("Embeddings must have the same dimension");
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);

    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  findMostSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: Array<{
      embedding: number[];
      id: string;
      metadata?: any;
    }>,
    topK: number = 10
  ): Array<{ id: string; similarity: number; metadata?: any }> {
    const similarities = candidateEmbeddings.map((candidate) => ({
      id: candidate.id,
      similarity: this.calculateCosineSimilarity(
        queryEmbedding,
        candidate.embedding
      ),
      metadata: candidate.metadata,
    }));

    // Sort by similarity (descending) and return top K
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  async generateEmbeddingForKBObject(object: any): Promise<number[]> {
    // Create a text representation of the KB object for embedding
    const textContent = this.extractTextFromKBObject(object);
    const result = await this.generateEmbedding(textContent);
    return result.embedding;
  }

  private extractTextFromKBObject(object: any): string {
    const parts: string[] = [];

    // Add title
    if (object.title) {
      parts.push(object.title);
    }

    // Add tags
    if (object.tags && object.tags.length > 0) {
      parts.push(object.tags.join(" "));
    }

    // Add body content (simplified extraction)
    if (object.body) {
      if (typeof object.body === "string") {
        parts.push(object.body);
      } else if (typeof object.body === "object") {
        // Extract text from object properties
        const bodyText = this.extractTextFromObject(object.body);
        if (bodyText) {
          parts.push(bodyText);
        }
      }
    }

    return parts.join(" ").trim();
  }

  private extractTextFromObject(obj: any): string {
    const texts: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        texts.push(value);
      } else if (typeof value === "object" && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === "string") {
              texts.push(item);
            }
          });
        } else {
          const nestedText = this.extractTextFromObject(value);
          if (nestedText) {
            texts.push(nestedText);
          }
        }
      }
    }

    return texts.join(" ");
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size,
      // Hit rate would need to be tracked separately
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Utility method for tag-based fallback search
  static tagBasedSimilarity(query: string, tags: string[]): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const tagWords = tags.map((tag) => tag.toLowerCase());

    let matches = 0;
    for (const word of queryWords) {
      if (tagWords.some((tag) => tag.includes(word) || word.includes(tag))) {
        matches++;
      }
    }

    return queryWords.length > 0 ? matches / queryWords.length : 0;
  }
}
