import type { GenerationRequest, GenerationResponse } from "../types/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:3001");

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class NetworkError extends APIError {
  constructor(message: string = "Network connection failed") {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends APIError {
  constructor(message: string = "Request timeout") {
    super(message);
    this.name = "TimeoutError";
  }
}

interface RequestInterceptor {
  (request: RequestInit): RequestInit | Promise<RequestInit>;
}

interface ResponseInterceptor {
  (response: Response): Response | Promise<Response>;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition?: (error: Error) => boolean;
}

export class APIService {
  private baseURL: string;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryCondition: (error) => {
      return (
        error instanceof NetworkError ||
        (error instanceof APIError &&
          error.statusCode !== undefined &&
          error.statusCode >= 500)
      );
    },
  };
  private isOnline: boolean = navigator.onLine;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.setupOnlineDetection();
  }

  private setupOnlineDetection(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  private async applyRequestInterceptors(
    request: RequestInit
  ): Promise<RequestInit> {
    let processedRequest = request;
    for (const interceptor of this.requestInterceptors) {
      processedRequest = await interceptor(processedRequest);
    }
    return processedRequest;
  }

  private async applyResponseInterceptors(
    response: Response
  ): Promise<Response> {
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    return processedResponse;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new TimeoutError();
      }
      throw error;
    }
  }

  private async makeRequest(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    // Check online status
    if (!this.isOnline) {
      throw new NetworkError(
        "Application is offline. Please check your internet connection."
      );
    }

    // Apply request interceptors
    const processedOptions = await this.applyRequestInterceptors(options);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, processedOptions);

        // Apply response interceptors
        const processedResponse =
          await this.applyResponseInterceptors(response);

        return processedResponse;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on the last attempt
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        // Check if we should retry this error
        if (!this.retryConfig.retryCondition?.(lastError)) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }

    // Convert fetch errors to our custom error types
    if (
      lastError &&
      lastError instanceof TypeError &&
      lastError.message.includes("fetch")
    ) {
      throw new NetworkError("Network error: Unable to connect to the server");
    }

    throw lastError || new Error("Unknown error occurred");
  }

  async generateSVG(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const response = await this.makeRequest(`${this.baseURL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (
        error instanceof APIError ||
        error instanceof NetworkError ||
        error instanceof TimeoutError
      ) {
        throw error;
      }

      throw new APIError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.makeRequest(`${this.baseURL}/health`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new APIError(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (
        error instanceof APIError ||
        error instanceof NetworkError ||
        error instanceof TimeoutError
      ) {
        throw error;
      }

      throw new APIError("Health check failed: Unable to connect to server");
    }
  }

  // Utility methods for checking connection status
  isOffline(): boolean {
    return !this.isOnline;
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }
}

// Export a default instance
export const apiService = new APIService();
