import { ref, computed } from "vue";
import {
  apiService,
  APIError,
  NetworkError,
  TimeoutError,
} from "../services/api";
import { useErrorHandler } from "./useErrorHandler";
import type { GenerationRequest, GenerationResponse } from "../types/api";

export interface ApiState {
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  lastResponse: GenerationResponse | null;
}

export function useApi() {
  const errorHandler = useErrorHandler();

  const state = ref<ApiState>({
    loading: false,
    error: null,
    isOnline: navigator.onLine,
    lastResponse: null,
  });

  // Setup online/offline detection
  const updateOnlineStatus = () => {
    state.value.isOnline = navigator.onLine;
  };

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  // Add request interceptor for loading state
  apiService.addRequestInterceptor((request) => {
    state.value.loading = true;
    state.value.error = null;
    return request;
  });

  // Add response interceptor for loading state
  apiService.addResponseInterceptor((response) => {
    state.value.loading = false;
    return response;
  });

  const generateSVG = async (
    request: GenerationRequest
  ): Promise<GenerationResponse | null> => {
    try {
      state.value.loading = true;
      state.value.error = null;

      const response = await apiService.generateSVG(request);
      state.value.lastResponse = response;

      // Show success message
      errorHandler.showSuccess(
        "SVG Generated",
        "Your SVG has been created successfully!"
      );

      return response;
    } catch (error) {
      state.value.loading = false;

      // Use centralized error handling
      if (error instanceof Error) {
        errorHandler.handleGenerationError(error, {
          component: "useApi",
          action: "generateSVG",
          metadata: { request },
        });

        // Set simple error message for UI state
        state.value.error = error.message;
      }

      return null;
    } finally {
      state.value.loading = false;
    }
  };

  const checkHealth = async (): Promise<boolean> => {
    try {
      await apiService.healthCheck();
      return true;
    } catch {
      return false;
    }
  };

  const clearError = () => {
    state.value.error = null;
  };

  const retry = async (
    request: GenerationRequest
  ): Promise<GenerationResponse | null> => {
    // Clear previous error and retry
    clearError();
    return generateSVG(request);
  };

  // Computed properties for easy access
  const isLoading = computed(() => state.value.loading);
  const hasError = computed(() => !!state.value.error);
  const errorMessage = computed(() => state.value.error);
  const isOnline = computed(() => state.value.isOnline);
  const canRetry = computed(
    () =>
      hasError.value &&
      (state.value.error?.includes("network") ||
        state.value.error?.includes("timeout") ||
        state.value.error?.includes("server"))
  );

  return {
    // State
    state: computed(() => state.value),
    isLoading,
    hasError,
    errorMessage,
    isOnline,
    canRetry,
    lastResponse: computed(() => state.value.lastResponse),

    // Methods
    generateSVG,
    checkHealth,
    clearError,
    retry,
  };
}
