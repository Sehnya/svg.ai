import { ref, reactive, computed } from "vue";
import type {
  GenerationRequest,
  GenerationResponse,
  SizeConfig,
} from "../types/api";
import { useApi } from "./useApi";

export function useGeneration() {
  // Use API composable for network operations
  const api = useApi();

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

  const generateSVG = async () => {
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
