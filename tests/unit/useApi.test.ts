import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useApi } from "../../src/composables/useApi";
import { APIError, NetworkError, TimeoutError } from "../../src/services/api";

// Mock the error handler
vi.mock("../../src/composables/useErrorHandler", () => ({
  useErrorHandler: () => ({
    handleGenerationError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}));

// Mock the API service
vi.mock("../../src/services/api", async () => {
  const actual = await vi.importActual("../../src/services/api");
  return {
    ...actual,
    apiService: {
      generateSVG: vi.fn(),
      healthCheck: vi.fn(),
      addRequestInterceptor: vi.fn(),
      addResponseInterceptor: vi.fn(),
    },
  };
});

describe("useApi", () => {
  let api: ReturnType<typeof useApi>;

  beforeEach(() => {
    api = useApi();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with correct default state", () => {
      expect(api.isLoading.value).toBe(false);
      expect(api.hasError.value).toBe(false);
      expect(api.errorMessage.value).toBeNull();
      expect(api.lastResponse.value).toBeNull();
    });

    it("should detect online status", () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });

      const onlineApi = useApi();
      expect(onlineApi.isOnline.value).toBe(true);
    });
  });

  describe("generateSVG", () => {
    it("should handle successful generation", async () => {
      const mockResponse = {
        svg: "<svg></svg>",
        meta: { width: 100, height: 100, seed: 123 },
        layers: [],
        warnings: [],
        errors: [],
      };

      const { apiService } = await import("../../src/services/api");
      vi.mocked(apiService.generateSVG).mockResolvedValue(mockResponse);

      const request = {
        prompt: "test prompt",
        size: { width: 100, height: 100 },
      };

      const result = await api.generateSVG(request);

      expect(result).toEqual(mockResponse);
      expect(api.lastResponse.value).toEqual(mockResponse);
      expect(api.isLoading.value).toBe(false);
      expect(api.hasError.value).toBe(false);
    });

    it("should handle API errors", async () => {
      const error = new APIError("Generation failed", 400);
      const { apiService } = await import("../../src/services/api");
      vi.mocked(apiService.generateSVG).mockRejectedValue(error);

      const request = {
        prompt: "test prompt",
        size: { width: 100, height: 100 },
      };

      const result = await api.generateSVG(request);

      expect(result).toBeNull();
      expect(api.isLoading.value).toBe(false);
      expect(api.hasError.value).toBe(true);
      expect(api.errorMessage.value).toBe("Generation failed");
    });

    it("should handle network errors", async () => {
      const error = new NetworkError("Connection failed");
      const { apiService } = await import("../../src/services/api");
      vi.mocked(apiService.generateSVG).mockRejectedValue(error);

      const request = {
        prompt: "test prompt",
        size: { width: 100, height: 100 },
      };

      const result = await api.generateSVG(request);

      expect(result).toBeNull();
      expect(api.isLoading.value).toBe(false);
      expect(api.hasError.value).toBe(true);
      expect(api.errorMessage.value).toBe("Connection failed");
    });

    it("should handle timeout errors", async () => {
      const error = new TimeoutError("Request timeout");
      const { apiService } = await import("../../src/services/api");
      vi.mocked(apiService.generateSVG).mockRejectedValue(error);

      const request = {
        prompt: "test prompt",
        size: { width: 100, height: 100 },
      };

      const result = await api.generateSVG(request);

      expect(result).toBeNull();
      expect(api.isLoading.value).toBe(false);
      expect(api.hasError.value).toBe(true);
      expect(api.errorMessage.value).toBe("Request timeout");
    });

    it("should handle generic errors", async () => {
      const error = new Error("Unknown error");
      const { apiService } = await import("../../src/services/api");
      vi.mocked(apiService.generateSVG).mockRejectedValue(error);

      const request = {
        prompt: "test prompt",
        size: { width: 100, height: 100 },
      };

      const result = await api.generateSVG(request);

      expect(result).toBeNull();
      expect(api.isLoading.value).toBe(false);
      expect(api.hasError.value).toBe(true);
      expect(api.errorMessage.value).toBe("Unknown error");
    });
  });

  describe("healthCheck", () => {
    it("should return true for successful health check", async () => {
      const { apiService } = await import("../../src/services/api");
      vi.mocked(apiService.healthCheck).mockResolvedValue({
        status: "ok",
        timestamp: new Date().toISOString(),
      });

      const result = await api.checkHealth();
      expect(result).toBe(true);
    });

    it("should return false for failed health check", async () => {
      const { apiService } = await import("../../src/services/api");
      vi.mocked(apiService.healthCheck).mockRejectedValue(
        new Error("Health check failed")
      );

      const result = await api.checkHealth();
      expect(result).toBe(false);
    });
  });

  describe("retry functionality", () => {
    it("should clear error and retry generation", async () => {
      const mockResponse = {
        svg: "<svg></svg>",
        meta: { width: 100, height: 100, seed: 123 },
        layers: [],
        warnings: [],
        errors: [],
      };

      const { apiService } = await import("../../src/services/api");
      vi.mocked(apiService.generateSVG).mockResolvedValue(mockResponse);

      const request = {
        prompt: "test prompt",
        size: { width: 100, height: 100 },
      };

      const result = await api.retry(request);

      expect(result).toEqual(mockResponse);
      expect(api.hasError.value).toBe(false);
    });
  });

  describe("error clearing", () => {
    it("should clear error state", async () => {
      // First, create an error
      const error = new APIError("Test error");
      const { apiService } = await import("../../src/services/api");
      vi.mocked(apiService.generateSVG).mockRejectedValue(error);

      await api.generateSVG({
        prompt: "test",
        size: { width: 100, height: 100 },
      });

      expect(api.hasError.value).toBe(true);

      // Then clear it
      api.clearError();
      expect(api.hasError.value).toBe(false);
      expect(api.errorMessage.value).toBeNull();
    });
  });

  describe("computed properties", () => {
    it("should correctly compute canRetry", async () => {
      // Initially should not be able to retry
      expect(api.canRetry.value).toBe(false);

      // After a network error, should be able to retry
      const error = new NetworkError("Connection failed");
      const { apiService } = await import("../../src/services/api");
      vi.mocked(apiService.generateSVG).mockRejectedValue(error);

      await api.generateSVG({
        prompt: "test",
        size: { width: 100, height: 100 },
      });

      expect(api.canRetry.value).toBe(true);
    });
  });

  describe("offline detection", () => {
    it("should detect offline status", () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      const offlineApi = useApi();
      expect(offlineApi.isOffline()).toBe(true);
    });
  });
});
