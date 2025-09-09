<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">
              SVG AI Generator
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-500">
              AI-powered SVG generation with live preview
            </div>
            <div class="flex items-center space-x-2">
              <div
                :class="[
                  'w-2 h-2 rounded-full',
                  isOnline ? 'bg-green-400' : 'bg-red-400',
                ]"
              ></div>
              <span class="text-xs text-gray-500">
                {{ isOnline ? "Online" : "Offline" }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Offline Status -->
      <div v-if="!isOnline" class="mb-6">
        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">Offline</h3>
              <div class="mt-2 text-sm text-yellow-700">
                You're currently offline. SVG generation requires an internet
                connection.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Messages -->
      <div v-if="error || globalError" class="mb-6">
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                {{ error ? "Generation Error" : "Application Error" }}
              </h3>
              <div class="mt-2 text-sm text-red-700">
                {{ error || globalError }}
              </div>
              <div class="mt-4 space-x-2">
                <button
                  v-if="error"
                  @click="clearError"
                  class="bg-red-100 px-2 py-1 text-xs font-medium text-red-800 rounded hover:bg-red-200"
                >
                  Dismiss
                </button>
                <button
                  v-if="globalError"
                  @click="clearGlobalError"
                  class="bg-red-100 px-2 py-1 text-xs font-medium text-red-800 rounded hover:bg-red-200"
                >
                  Dismiss
                </button>
                <button
                  v-if="canRetry"
                  @click="retryGeneration"
                  class="bg-red-100 px-2 py-1 text-xs font-medium text-red-800 rounded hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Application Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Panel - Input Controls -->
        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-lg font-medium text-gray-900 mb-4">Generate SVG</h2>

            <!-- Prompt Input Section -->
            <div class="space-y-4">
              <div>
                <label
                  for="prompt"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Describe your SVG
                </label>
                <textarea
                  id="prompt"
                  v-model="generationParams.prompt"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., A blue circle with a red border, or a simple house icon"
                  :maxlength="500"
                />
                <div class="mt-1 text-xs text-gray-500">
                  {{ generationParams.prompt.length }}/500 characters
                </div>
              </div>

              <!-- Size Controls -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <button
                    v-for="preset in sizePresets"
                    :key="preset.name"
                    @click="setSizePreset(preset)"
                    :class="[
                      'px-3 py-2 text-xs font-medium rounded border',
                      generationParams.size.preset === preset.name
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
                    ]"
                  >
                    {{ preset.label }}
                  </button>
                </div>

                <div
                  v-if="generationParams.size.preset === 'custom'"
                  class="grid grid-cols-2 gap-3"
                >
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1"
                      >Width</label
                    >
                    <input
                      v-model.number="generationParams.size.width"
                      type="number"
                      min="16"
                      max="2048"
                      class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1"
                      >Height</label
                    >
                    <input
                      v-model.number="generationParams.size.height"
                      type="number"
                      min="16"
                      max="2048"
                      class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <!-- Generate Button -->
              <button
                @click="generateSVG"
                :disabled="!canGenerate || isGenerating"
                class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  v-if="isGenerating"
                  class="flex items-center justify-center"
                >
                  <svg
                    class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </span>
                <span v-else>Generate SVG</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Panel - Preview and Output -->
        <div class="space-y-6">
          <!-- SVG Preview -->
          <SVGPreview
            :svg-content="generationResult?.svg || ''"
            :metadata="generationResult?.meta"
            :loading="isGenerating"
            :error="error || undefined"
            @copy="handleCopy"
            @download="handleDownload"
          />

          <!-- Code Output -->
          <CodeOutput
            v-if="generationResult?.svg"
            :svg-code="generationResult.svg"
            title="SVG Code"
            :show-format-selector="true"
            :show-download-button="true"
            :show-footer="true"
            :filename="getFilename()"
            @copy="handleCodeCopy"
            @download="handleCodeDownload"
            @format-change="handleFormatChange"
            @error="handleCodeError"
          />

          <!-- Metadata Display -->
          <MetadataDisplay
            v-if="generationResult?.meta"
            :metadata="generationResult.meta"
            :layers="generationResult.layers"
            :statistics="svgStatistics || undefined"
            title="SVG Information"
            :collapsible="true"
            :show-statistics="true"
          />

          <!-- Layer Inspector -->
          <LayerInspector
            v-if="
              generationResult?.layers && generationResult.layers.length > 0
            "
            :layers="generationResult.layers"
            title="Layer Inspector"
            :show-details="true"
            :default-expanded="false"
            @select-layer="handleLayerSelect"
            @copy-id="handleLayerIdCopy"
          />

          <!-- Feedback Controls -->
          <FeedbackControls
            v-if="generationResult?.eventId"
            :event-id="generationResult.eventId"
            :user-id="undefined"
          />

          <!-- Warnings Display -->
          <div
            v-if="
              generationResult?.warnings && generationResult.warnings.length > 0
            "
            class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">Warnings</h3>
                <div class="mt-2 text-sm text-yellow-700">
                  <ul class="list-disc list-inside space-y-1">
                    <li
                      v-for="warning in generationResult.warnings"
                      :key="warning"
                    >
                      {{ warning }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="!generationResult && !isGenerating"
            class="bg-white rounded-lg shadow p-6"
          >
            <div class="text-center text-gray-500 py-12">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <p class="mt-2">
                Enter a prompt and click "Generate SVG" to see your creation
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p class="text-center text-sm text-gray-500">
          ⚠️ All generated SVGs are automatically sanitized for security. Only
          safe elements and attributes are included.
        </p>
      </div>
    </footer>

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useGeneration } from "./composables/useGeneration";
import { useErrorHandler } from "./composables/useErrorHandler";
import { useFeedback } from "./composables/useFeedback";
import ToastContainer from "./components/ToastContainer.vue";
import SVGPreview from "./components/SVGPreview.vue";
import CodeOutput from "./components/CodeOutput.vue";
import MetadataDisplay from "./components/MetadataDisplay.vue";
import LayerInspector from "./components/LayerInspector.vue";
import FeedbackControls from "./components/FeedbackControls.vue";

// Use generation composable
const {
  generationParams,
  generationResult,
  sizePresets,
  isGenerating,
  error,
  isOnline,
  canRetry,
  canGenerate,
  setSizePreset,
  generateSVG,
  retryGeneration,
  clearError,
} = useGeneration();

const errorHandler = useErrorHandler();
const { submitImplicitFeedback } = useFeedback();
const globalError = ref<string | null>(null);
const selectedLayer = ref<string | null>(null);
const currentFormat = ref<string>("svg");

// Computed properties
const svgStatistics = computed(() => {
  if (!generationResult.value?.layers) return null;

  const layers = generationResult.value.layers;
  const elementCount = layers.length;
  const hasGroups = layers.some((layer) => layer.type === "group");
  const hasText = layers.some((layer) => layer.type === "text");
  const colorCount = generationResult.value.meta?.palette?.length || 0;

  let complexity: "simple" | "moderate" | "complex" = "simple";
  if (elementCount > 10 || hasGroups) complexity = "moderate";
  if (elementCount > 20 || (hasGroups && hasText)) complexity = "complex";

  return {
    elementCount,
    hasGroups,
    hasText,
    colorCount,
    complexity,
  };
});

// Methods
const getFilename = (): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
  return `svg-ai-${timestamp}`;
};

const handleCopy = () => {
  errorHandler.showSuccess("Copied!", "SVG copied to clipboard");
};

const handleDownload = async () => {
  // Record implicit feedback for export
  if (generationResult.value?.eventId) {
    try {
      await submitImplicitFeedback({
        eventId: generationResult.value.eventId,
        signal: "exported",
      });
    } catch (error) {
      console.warn("Failed to record export feedback:", error);
    }
  }

  errorHandler.showSuccess("Downloaded!", "SVG file downloaded successfully");
};

const handleCodeCopy = (_code: string, format: string) => {
  errorHandler.showSuccess(
    "Copied!",
    `${format.toUpperCase()} code copied to clipboard`
  );
};

const handleCodeDownload = async (
  _code: string,
  _format: string,
  filename: string
) => {
  // Record implicit feedback for export
  if (generationResult.value?.eventId) {
    try {
      await submitImplicitFeedback({
        eventId: generationResult.value.eventId,
        signal: "exported",
      });
    } catch (error) {
      console.warn("Failed to record export feedback:", error);
    }
  }

  errorHandler.showSuccess(
    "Downloaded!",
    `${filename} downloaded successfully`
  );
};

const handleFormatChange = (format: string) => {
  currentFormat.value = format;
};

const handleCodeError = (error: string) => {
  errorHandler.showError("Error", error);
};

const handleLayerSelect = (layerId: string) => {
  selectedLayer.value = layerId;
  // Could highlight the layer in the preview here
};

const handleLayerIdCopy = (layerId: string) => {
  errorHandler.showSuccess(
    "Copied!",
    `Layer ID "${layerId}" copied to clipboard`
  );
};

const clearGlobalError = () => {
  globalError.value = null;
};

// Global error handler
window.addEventListener("error", (event) => {
  const error = event.error || new Error("Unknown error");
  errorHandler.handleUnexpectedError(error, {
    component: "App",
    action: "global_error_handler",
  });
});

window.addEventListener("unhandledrejection", (event) => {
  const error =
    event.reason instanceof Error
      ? event.reason
      : new Error(event.reason?.message || "Unknown error");
  errorHandler.handleUnexpectedError(error, {
    component: "App",
    action: "unhandled_rejection",
  });
});
</script>
