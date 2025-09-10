/**
 * SVGGenerator - Base class for SVG generators
 */

import { GenerationRequest, GenerationResponse } from "../types/api";

export abstract class SVGGenerator {
  /**
   * Generate SVG from request
   */
  abstract generate(request: GenerationRequest): Promise<GenerationResponse>;

  /**
   * Validate generation request
   */
  protected validateRequest(request: GenerationRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.prompt || request.prompt.trim().length === 0) {
      errors.push("Prompt is required");
    }

    if (request.prompt && request.prompt.length > 500) {
      errors.push("Prompt must be 500 characters or less");
    }

    if (!request.size || !request.size.width || !request.size.height) {
      errors.push("Size with width and height is required");
    }

    if (!request.model) {
      errors.push("Model is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create error response
   */
  protected createErrorResponse(error: string): GenerationResponse {
    return {
      success: false,
      svg: "",
      error,
      metadata: {
        generationMethod: "error",
        fallbackUsed: false,
        errors: [error],
        performance: {
          generationTime: 0,
        },
      },
    };
  }
}
