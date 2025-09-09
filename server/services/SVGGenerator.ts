import type {
  GenerationRequest,
  GenerationResponse,
  ValidationResult,
} from "../types";
import { GenerationRequestSchema } from "../types";

export abstract class SVGGenerator {
  abstract generate(request: GenerationRequest): Promise<GenerationResponse>;

  protected validateRequest(request: GenerationRequest): ValidationResult {
    try {
      const result = GenerationRequestSchema.safeParse(request);

      if (!result.success) {
        return {
          success: false,
          errors: result.error.errors.map(
            (err) => `${err.path.join(".")}: ${err.message}`
          ),
        };
      }

      return {
        success: true,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      };
    }
  }

  protected generateSeed(): number {
    return Math.floor(Math.random() * 1000000);
  }

  protected limitPrecision(value: number, precision: number = 2): number {
    return (
      Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision)
    );
  }
}
