import { ref, reactive, computed, watch } from "vue";
import type {
  GenerationRequest,
  GenerationResponse,
  SizeConfig,
} from "../types/api";
import { useApi } from "./useApi";
import { useErrorHandler } from "./useErrorHandler";
import { useFormValidation } from "./useFormValidation";
import { InputSanitizer } from "../utils/inputSanitizer";
import { debounce } from "../utils/debounce";
import { performanceMonitor } from "../utils/performance";

export function useGeneration() {
  // Use API composable for network operations
  const api = useApi();
  const errorHandler = useErrorHandler();
  const validation = useFormValidation();

  // Reactive state
  const generationParams = reactive<{
    prompt: string;
    size: SizeConfig;
    palette?: string[];
    seed?: number;
  }>({
    prompt: "",
    size: {
      preset: "icon",
      width: 64,
      height: 64,
    },
  });

  const generationResult = ref<GenerationResponse | null>(null);

  // Size presets
  const sizePresets = [
    { name: "icon", label: "Icon", width: 64, height: 64 },
    { name: "banner", label: "Banner", width: 400, height: 100 },
    { name: "square", label: "Square", width: 200, height: 200 },
    { name: "custom", label: "Custom", width: 100, height: 100 },
  ] as const;

  // Computed properties
  const canGenerate = computed(() => {
    return (
      generationParams.prompt.trim().length > 0 &&
      generationParams.size.width >= 16 &&
      generationParams.size.width <= 2048 &&
      generationParams.size.height >= 16 &&
      generationParams.size.height <= 2048 &&
      !api.isLoading.value &&
      api.isOnline.value
    );
  });

  // Methods
  const setSizePreset = (preset: (typeof sizePresets)[number]) => {
    generationParams.size.preset = preset.name;
    if (preset.name !== "custom") {
      generationParams.size.width = preset.width;
      generationParams.size.height = preset.height;
    }
  };

  // Initialize form validation
  validation.registerField("prompt", {
    isValid: false,
    message: "Prompt is required",
  });
  validation.registerField("width", { isValid: true });
  validation.registerField("height", { isValid: true });

  // Debounced input sanitization to avoid excessive processing
  const debouncedSanitization = debounce((newPrompt: string) => {
    if (newPrompt) {
      performanceMonitor.start("input-sanitization");

      const sanitizationResult = InputSanitizer.sanitizePrompt(newPrompt);

      if (sanitizationResult.wasModified) {
        generationParams.prompt = sanitizationResult.sanitized;

        // Show warnings for sanitization
        sanitizationResult.warnings.forEach((warning) => {
          errorHandler.showWarning("Input Modified", warning);
        });
      }

      // Check for suspicious input
      if (InputSanitizer.isSuspiciousInput(newPrompt)) {
        errorHandler.showWarning(
          "Suspicious Input Detected",
          "Your input contains potentially unsafe content that has been removed."
        );
      }

      performanceMonitor.end("input-sanitization");
    }
  }, 300); // 300ms debounce

  // Watch for prompt changes and sanitize input
  watch(() => generationParams.prompt, debouncedSanitization);

  const validateInput = () => {
    // Sanitize and validate prompt
    const promptResult = InputSanitizer.sanitizePrompt(generationParams.prompt);
    const prompt = promptResult.sanitized;

    // Sanitize and validate dimensions
    const widthResult = InputSanitizer.sanitizeNumber(
      generationParams.size.width,
      16,
      2048,
      64
    );
    const heightResult = InputSanitizer.sanitizeNumber(
      generationParams.size.height,
      16,
      2048,
      64
    );

    // Update values if they were sanitized
    if (widthResult.wasModified) {
      generationParams.size.width = widthResult.value;
      widthResult.warnings.forEach((warning) => {
        errorHandler.showWarning("Width Adjusted", warning);
      });
    }

    if (heightResult.wasModified) {
      generationParams.size.height = heightResult.value;
      heightResult.warnings.forEach((warning) => {
        errorHandler.showWarning("Height Adjusted", warning);
      });
    }

    // Validate prompt
    validation.updateFieldValidation(
      "prompt",
      prompt.length > 0 && prompt.length <= 500,
      prompt.length === 0
        ? "Prompt is required"
        : prompt.length > 500
          ? "Prompt must be 500 characters or less"
          : undefined
    );

    // Validate dimensions
    validation.updateFieldValidation(
      "width",
      widthResult.value >= 16 && widthResult.value <= 2048,
      widthResult.value < 16 || widthResult.value > 2048
        ? "Width must be between 16 and 2048 pixels"
        : undefined
    );

    validation.updateFieldValidation(
      "height",
      heightResult.value >= 16 && heightResult.value <= 2048,
      heightResult.value < 16 || heightResult.value > 2048
        ? "Height must be between 16 and 2048 pixels"
        : undefined
    );

    return validation.isFormValid.value;
  };

  const generateSVG = async () => {
    performanceMonitor.start("svg-generation", {
      promptLength: generationParams.prompt.length,
      size: `${generationParams.size.width}x${generationParams.size.height}`,
    });

    try {
      if (!validateInput()) {
        errorHandler.handleValidationErrors(validation.validationErrors.value, {
          component: "useGeneration",
          action: "generateSVG",
        });
        return;
      }

      if (!canGenerate.value) return;

      const request: GenerationRequest = {
        prompt: generationParams.prompt.trim(),
        size: {
          width: generationParams.size.width,
          height: generationParams.size.height,
        },
        palette: generationParams.palette,
        seed: generationParams.seed,
      };

      const result = await api.generateSVG(request);
      if (result) {
        generationResult.value = result;

        // Log performance metrics in development
        if (process.env.NODE_ENV === "development") {
          const duration = performanceMonitor.end("svg-generation");
          console.log(`SVG generation completed in ${duration?.toFixed(2)}ms`);
        }
      }
    } catch (error) {
      performanceMonitor.end("svg-generation");
      throw error;
    }
  };

  const retryGeneration = async () => {
    if (!generationParams.prompt.trim()) return;

    const request: GenerationRequest = {
      prompt: generationParams.prompt.trim(),
      size: {
        width: generationParams.size.width,
        height: generationParams.size.height,
      },
      palette: generationParams.palette,
      seed: generationParams.seed,
    };

    const result = await api.retry(request);
    if (result) {
      generationResult.value = result;
    }
  };

  const clearError = () => {
    api.clearError();
  };

  const clearResult = () => {
    generationResult.value = null;
  };

  const resetParams = () => {
    generationParams.prompt = "";
    generationParams.size = {
      preset: "icon",
      width: 64,
      height: 64,
    };
    generationParams.palette = undefined;
    generationParams.seed = undefined;
  };

  return {
    // State
    generationParams,
    generationResult,
    sizePresets,

    // API state
    isGenerating: api.isLoading,
    error: api.errorMessage,
    isOnline: api.isOnline,
    canRetry: api.canRetry,

    // Computed
    canGenerate,

    // Methods
    setSizePreset,
    generateSVG,
    retryGeneration,
    clearError,
    clearResult,
    resetParams,
  };
}
