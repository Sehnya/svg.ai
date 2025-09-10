/**
 * UnifiedErrorHandler - Comprehensive error handling and fallback mechanisms
 * Implements graceful handling of OpenAI API errors, JSON parsing errors, and validation failures
 * Creates fallback chain: layered+layout → layered → rule-based → basic geometric shapes
 * Implements retry logic with exponential backoff for transient failures
 */

import { LayeredSVGGenerator } from "./LayeredSVGGenerator";
import { RuleBasedGenerator } from "./RuleBasedGenerator";
import { SVGSanitizer } from "./SVGSanitizer";
import { AspectRatioManager } from "./AspectRatioManager";
import type {
  GenerationRequest,
  GenerationResponse,
  SVGMetadata,
  LayerInfo,
} from "../types/api";
import type {
  UnifiedLayeredSVGDocument,
  UnifiedGenerationResponse,
  UnifiedValidationResult,
} from "../types/unified-layered";

export interface ErrorHandlingOptions {
  maxRetries: number;
  baseDelay: number; // Base delay for exponential backoff (ms)
  maxDelay: number; // Maximum delay between retries (ms)
  timeoutMs: number; // Request timeout
  enableFallbacks: boolean;
  logErrors: boolean;
  includeErrorDetails: boolean; // Include detailed error info in response
}

export interface RetryConfig {
  attempt: number;
  maxAttempts: number;
  delay: number;
  error: Error;
  context: string;
}

export interface FallbackResult {
  success: boolean;
  response?: GenerationResponse;
  method: "unified-layered" | "layered-only" | "rule-based" | "basic-shapes";
  error?: Error;
  warnings: string[];
}

export enum ErrorType {
  OPENAI_API_ERROR = "openai_api_error",
  OPENAI_TIMEOUT = "openai_timeout",
  OPENAI_RATE_LIMIT = "openai_rate_limit",
  JSON_PARSE_ERROR = "json_parse_error",
  VALIDATION_ERROR = "validation_error",
  COORDINATE_ERROR = "coordinate_error",
  LAYOUT_ERROR = "layout_error",
  NETWORK_ERROR = "network_error",
  UNKNOWN_ERROR = "unknown_error",
}

export interface ErrorContext {
  type: ErrorType;
  message: string;
  originalError: Error;
  request: GenerationRequest;
  attempt: number;
  timestamp: Date;
  recoverable: boolean;
  suggestedAction?: string;
}

export class UnifiedErrorHandler {
  private options: ErrorHandlingOptions;
  private layeredGenerator?: LayeredSVGGenerator;
  private ruleBasedGenerator: RuleBasedGenerator;
  private sanitizer: SVGSanitizer;
  private errorLog: ErrorContext[] = [];

  constructor(options: Partial<ErrorHandlingOptions> = {}) {
    this.options = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      timeoutMs: 30000,
      enableFallbacks: true,
      logErrors: true,
      includeErrorDetails: false,
      ...options,
    };

    this.ruleBasedGenerator = new RuleBasedGenerator(true); // Enable unified mode
    this.sanitizer = new SVGSanitizer();
  }

  /**
   * Set the layered generator (injected to avoid circular dependencies)
   */
  setLayeredGenerator(generator: LayeredSVGGenerator): void {
    this.layeredGenerator = generator;
  }

  /**
   * Main error handling method with comprehensive fallback chain
   */
  async handleGenerationWithFallbacks(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    const warnings: string[] = [];

    // Attempt 1: Unified layered generation
    if (this.layeredGenerator && this.options.enableFallbacks) {
      try {
        const result = await this.attemptUnifiedLayeredGeneration(request);
        if (result.success && result.response) {
          return {
            ...result.response,
            warnings: [...result.response.warnings, ...result.warnings],
          };
        }
        lastError =
          result.error || new Error("Unified layered generation failed");
        warnings.push(
          `Unified layered generation failed: ${lastError.message}`
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        warnings.push(`Unified layered generation error: ${lastError.message}`);
        this.logError(ErrorType.UNKNOWN_ERROR, lastError, request, 1);
      }
    }

    // Attempt 2: Layered-only generation (without layout language)
    if (this.layeredGenerator && this.options.enableFallbacks) {
      try {
        const result = await this.attemptLayeredOnlyGeneration(request);
        if (result.success && result.response) {
          return {
            ...result.response,
            warnings: [
              ...result.response.warnings,
              ...result.warnings,
              ...warnings,
            ],
          };
        }
        lastError = result.error || new Error("Layered-only generation failed");
        warnings.push(`Layered-only generation failed: ${lastError.message}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        warnings.push(`Layered-only generation error: ${lastError.message}`);
        this.logError(ErrorType.UNKNOWN_ERROR, lastError, request, 2);
      }
    }

    // Attempt 3: Rule-based generation with unified language
    if (this.options.enableFallbacks) {
      try {
        const result = await this.attemptRuleBasedGeneration(request);
        if (result.success && result.response) {
          return {
            ...result.response,
            warnings: [
              ...result.response.warnings,
              ...result.warnings,
              ...warnings,
            ],
          };
        }
        lastError = result.error || new Error("Rule-based generation failed");
        warnings.push(`Rule-based generation failed: ${lastError.message}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        warnings.push(`Rule-based generation error: ${lastError.message}`);
        this.logError(ErrorType.UNKNOWN_ERROR, lastError, request, 3);
      }
    }

    // Attempt 4: Basic geometric shapes (last resort)
    try {
      const result = await this.generateBasicShapes(request);
      return {
        ...result,
        warnings: [...result.warnings, ...warnings],
        errors: [
          ...result.errors,
          `All advanced generation methods failed. Using basic shapes fallback.`,
        ],
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      this.logError(ErrorType.UNKNOWN_ERROR, lastError, request, 4);
    }

    // Complete failure - return error response
    return this.createCompleteFailureResponse(
      request,
      lastError || new Error("All generation methods failed"),
      warnings
    );
  }

  /**
   * Attempt unified layered generation with retry logic
   */
  private async attemptUnifiedLayeredGeneration(
    request: GenerationRequest
  ): Promise<FallbackResult> {
    if (!this.layeredGenerator) {
      return {
        success: false,
        method: "unified-layered",
        error: new Error("Layered generator not available"),
        warnings: [],
      };
    }

    return await this.executeWithRetry(
      async () => {
        const response = await this.layeredGenerator!.generate({
          ...request,
          model: "unified",
        });

        if (response.errors.length > 0) {
          throw new Error(`Generation errors: ${response.errors.join(", ")}`);
        }

        return response;
      },
      "unified-layered",
      request
    );
  }

  /**
   * Attempt layered-only generation (without layout language)
   */
  private async attemptLayeredOnlyGeneration(
    request: GenerationRequest
  ): Promise<FallbackResult> {
    if (!this.layeredGenerator) {
      return {
        success: false,
        method: "layered-only",
        error: new Error("Layered generator not available"),
        warnings: [],
      };
    }

    return await this.executeWithRetry(
      async () => {
        const response = await this.layeredGenerator!.generate({
          ...request,
          model: "llm", // Use standard layered generation
        });

        if (response.errors.length > 0) {
          throw new Error(`Generation errors: ${response.errors.join(", ")}`);
        }

        return response;
      },
      "layered-only",
      request
    );
  }

  /**
   * Attempt rule-based generation with unified language
   */
  private async attemptRuleBasedGeneration(
    request: GenerationRequest
  ): Promise<FallbackResult> {
    return await this.executeWithRetry(
      async () => {
        const response = await this.ruleBasedGenerator.generate({
          ...request,
          model: "rule-based-unified",
        });

        if (response.errors.length > 0) {
          throw new Error(`Generation errors: ${response.errors.join(", ")}`);
        }

        return response;
      },
      "rule-based",
      request
    );
  }

  /**
   * Generate basic geometric shapes as last resort
   */
  private async generateBasicShapes(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    const { width, height } = request.size;
    const colors = request.palette || ["#3B82F6", "#1E40AF", "#1D4ED8"];
    const seed = request.seed || Math.floor(Math.random() * 1000000);

    // Create a simple geometric shape based on prompt keywords
    const prompt = request.prompt.toLowerCase();
    let shape: string;

    if (prompt.includes("circle") || prompt.includes("round")) {
      shape = this.createBasicCircle(width, height, colors[0]);
    } else if (prompt.includes("square") || prompt.includes("rectangle")) {
      shape = this.createBasicRectangle(width, height, colors[0]);
    } else if (prompt.includes("triangle")) {
      shape = this.createBasicTriangle(width, height, colors[0]);
    } else {
      // Default to circle
      shape = this.createBasicCircle(width, height, colors[0]);
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${shape}
</svg>`;

    const metadata: SVGMetadata = {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      backgroundColor: "transparent",
      palette: colors,
      description: `Basic shape fallback for: "${request.prompt}"`,
      seed,
    };

    const layers: LayerInfo[] = [
      {
        id: "basic_shape",
        label: "Basic Shape",
        type: "shape",
      },
    ];

    return {
      svg,
      meta: metadata,
      layers,
      warnings: ["Used basic shapes fallback due to generation failures"],
      errors: [],
    };
  }

  /**
   * Execute a generation function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    method: FallbackResult["method"],
    request: GenerationRequest
  ): Promise<FallbackResult> {
    let lastError: Error | null = null;
    const warnings: string[] = [];

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        // Apply timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Timeout after ${this.options.timeoutMs}ms`));
          }, this.options.timeoutMs);
        });

        const result = await Promise.race([fn(), timeoutPromise]);

        return {
          success: true,
          response: result as GenerationResponse,
          method,
          warnings,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const errorType = this.classifyError(lastError);
        const errorContext = this.createErrorContext(
          errorType,
          lastError,
          request,
          attempt
        );

        if (this.options.logErrors) {
          this.errorLog.push(errorContext);
        }

        warnings.push(
          `${method} attempt ${attempt} failed: ${lastError.message}`
        );

        // Check if error is recoverable
        if (!errorContext.recoverable || attempt === this.options.maxRetries) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = Math.min(
          this.options.baseDelay * Math.pow(2, attempt - 1),
          this.options.maxDelay
        );

        await this.sleep(delay);
      }
    }

    return {
      success: false,
      method,
      error: lastError || new Error("Unknown error"),
      warnings,
    };
  }

  /**
   * Classify error type for appropriate handling
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes("timeout")) {
      return ErrorType.OPENAI_TIMEOUT;
    }
    if (message.includes("rate limit") || message.includes("429")) {
      return ErrorType.OPENAI_RATE_LIMIT;
    }
    if (message.includes("api") || message.includes("openai")) {
      return ErrorType.OPENAI_API_ERROR;
    }
    if (message.includes("json") || message.includes("parse")) {
      return ErrorType.JSON_PARSE_ERROR;
    }
    if (message.includes("validation") || message.includes("schema")) {
      return ErrorType.VALIDATION_ERROR;
    }
    if (message.includes("coordinate") || message.includes("bounds")) {
      return ErrorType.COORDINATE_ERROR;
    }
    if (message.includes("layout") || message.includes("region")) {
      return ErrorType.LAYOUT_ERROR;
    }
    if (message.includes("network") || message.includes("connection")) {
      return ErrorType.NETWORK_ERROR;
    }

    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * Create error context for logging and analysis
   */
  private createErrorContext(
    type: ErrorType,
    error: Error,
    request: GenerationRequest,
    attempt: number
  ): ErrorContext {
    const recoverable = this.isRecoverableError(type);
    const suggestedAction = this.getSuggestedAction(type);

    return {
      type,
      message: error.message,
      originalError: error,
      request,
      attempt,
      timestamp: new Date(),
      recoverable,
      suggestedAction,
    };
  }

  /**
   * Determine if an error type is recoverable with retry
   */
  private isRecoverableError(type: ErrorType): boolean {
    switch (type) {
      case ErrorType.OPENAI_TIMEOUT:
      case ErrorType.OPENAI_RATE_LIMIT:
      case ErrorType.NETWORK_ERROR:
        return true;
      case ErrorType.OPENAI_API_ERROR:
      case ErrorType.JSON_PARSE_ERROR:
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.COORDINATE_ERROR:
      case ErrorType.LAYOUT_ERROR:
        return false;
      case ErrorType.UNKNOWN_ERROR:
        return true; // Give unknown errors a chance
      default:
        return false;
    }
  }

  /**
   * Get suggested action for error type
   */
  private getSuggestedAction(type: ErrorType): string {
    switch (type) {
      case ErrorType.OPENAI_TIMEOUT:
        return "Increase timeout or simplify prompt";
      case ErrorType.OPENAI_RATE_LIMIT:
        return "Wait and retry, or upgrade API plan";
      case ErrorType.OPENAI_API_ERROR:
        return "Check API key and service status";
      case ErrorType.JSON_PARSE_ERROR:
        return "Improve prompt clarity or use fallback";
      case ErrorType.VALIDATION_ERROR:
        return "Check schema compatibility";
      case ErrorType.COORDINATE_ERROR:
        return "Validate coordinate bounds";
      case ErrorType.LAYOUT_ERROR:
        return "Check region and anchor specifications";
      case ErrorType.NETWORK_ERROR:
        return "Check network connectivity";
      default:
        return "Try fallback generation method";
    }
  }

  /**
   * Log error for monitoring and debugging
   */
  private logError(
    type: ErrorType,
    error: Error,
    request: GenerationRequest,
    attempt: number
  ): void {
    if (!this.options.logErrors) return;

    const context = this.createErrorContext(type, error, request, attempt);
    this.errorLog.push(context);

    // In production, you might want to send this to a logging service
    console.error(`[UnifiedErrorHandler] ${type}:`, {
      message: error.message,
      prompt: request.prompt,
      attempt,
      timestamp: context.timestamp,
      recoverable: context.recoverable,
    });
  }

  /**
   * Create complete failure response when all methods fail
   */
  private createCompleteFailureResponse(
    request: GenerationRequest,
    error: Error,
    warnings: string[]
  ): GenerationResponse {
    const { width, height } = request.size;

    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>
  <text x="${width / 2}" y="${height / 2 - 10}" text-anchor="middle" dominant-baseline="middle" fill="#DC2626" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    Generation Failed
  </text>
  <text x="${width / 2}" y="${height / 2 + 15}" text-anchor="middle" dominant-baseline="middle" fill="#7F1D1D" font-family="Arial, sans-serif" font-size="12">
    All generation methods failed
  </text>
</svg>`;

    const metadata: SVGMetadata = {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      backgroundColor: "#FEF2F2",
      palette: ["#DC2626", "#7F1D1D"],
      description: `Complete generation failure for: "${request.prompt}"`,
      seed: request.seed || 0,
    };

    return {
      svg: errorSvg,
      meta: metadata,
      layers: [],
      warnings,
      errors: [
        "All generation methods failed",
        error.message,
        ...(this.options.includeErrorDetails
          ? this.getRecentErrorSummary()
          : []),
      ],
    };
  }

  /**
   * Create basic geometric shapes
   */
  private createBasicCircle(
    width: number,
    height: number,
    color: string
  ): string {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    return `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${color}" stroke="none"/>`;
  }

  private createBasicRectangle(
    width: number,
    height: number,
    color: string
  ): string {
    const rectWidth = width * 0.6;
    const rectHeight = height * 0.6;
    const x = (width - rectWidth) / 2;
    const y = (height - rectHeight) / 2;

    return `<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" fill="${color}" stroke="none"/>`;
  }

  private createBasicTriangle(
    width: number,
    height: number,
    color: string
  ): string {
    const centerX = width / 2;
    const topY = height * 0.2;
    const bottomY = height * 0.8;
    const leftX = width * 0.2;
    const rightX = width * 0.8;

    return `<polygon points="${centerX},${topY} ${leftX},${bottomY} ${rightX},${bottomY}" fill="${color}" stroke="none"/>`;
  }

  /**
   * Utility methods
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get recent error summary for debugging
   */
  private getRecentErrorSummary(): string[] {
    const recentErrors = this.errorLog.slice(-5); // Last 5 errors
    return recentErrors.map(
      (error) => `${error.type}: ${error.message} (attempt ${error.attempt})`
    );
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    recentErrors: ErrorContext[];
    averageRetries: number;
  } {
    const errorsByType = {} as Record<ErrorType, number>;
    let totalRetries = 0;

    for (const error of this.errorLog) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      totalRetries += error.attempt;
    }

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      recentErrors: this.errorLog.slice(-10),
      averageRetries:
        this.errorLog.length > 0 ? totalRetries / this.errorLog.length : 0,
    };
  }

  /**
   * Clear error log (useful for testing or periodic cleanup)
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Update error handling options
   */
  updateOptions(newOptions: Partial<ErrorHandlingOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}
