<template>
  <div v-if="hasMessages" class="space-y-3">
    <!-- Errors -->
    <div v-if="errors.length > 0" class="space-y-2">
      <div
        v-for="(error, index) in errors"
        :key="`error-${index}`"
        class="bg-red-50 border border-red-200 rounded-md p-4"
      >
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
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-red-800">
              {{ getErrorTitle(error) }}
            </h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{{ getErrorMessage(error) }}</p>
            </div>
            <div v-if="getErrorSuggestion(error)" class="mt-3">
              <div class="text-sm">
                <p class="text-red-700 font-medium">Suggestion:</p>
                <p class="text-red-600 mt-1">{{ getErrorSuggestion(error) }}</p>
              </div>
            </div>
            <div
              v-if="showErrorActions && getErrorActions(error).length > 0"
              class="mt-4"
            >
              <div class="flex space-x-2">
                <button
                  v-for="action in getErrorActions(error)"
                  :key="action.label"
                  @click="handleAction(action)"
                  :class="[
                    'text-sm font-medium rounded-md px-3 py-1 transition-colors',
                    action.type === 'primary'
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'text-red-600 hover:text-red-800',
                  ]"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="dismissible" class="ml-auto pl-3">
            <button
              @click="dismissError(index)"
              class="inline-flex text-red-400 hover:text-red-600 transition-colors"
            >
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Warnings -->
    <div v-if="warnings.length > 0" class="space-y-2">
      <div
        v-for="(warning, index) in warnings"
        :key="`warning-${index}`"
        class="bg-yellow-50 border border-yellow-200 rounded-md p-4"
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
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-yellow-800">
              {{ getWarningTitle(warning) }}
            </h3>
            <div class="mt-2 text-sm text-yellow-700">
              <p>{{ getWarningMessage(warning) }}</p>
            </div>
            <div v-if="getWarningSuggestion(warning)" class="mt-3">
              <div class="text-sm">
                <p class="text-yellow-700 font-medium">Recommendation:</p>
                <p class="text-yellow-600 mt-1">
                  {{ getWarningSuggestion(warning) }}
                </p>
              </div>
            </div>
          </div>
          <div v-if="dismissible" class="ml-auto pl-3">
            <button
              @click="dismissWarning(index)"
              class="inline-flex text-yellow-400 hover:text-yellow-600 transition-colors"
            >
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Messages -->
    <div v-if="successMessages.length > 0" class="space-y-2">
      <div
        v-for="(message, index) in successMessages"
        :key="`success-${index}`"
        class="bg-green-50 border border-green-200 rounded-md p-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium text-green-800">{{ message }}</p>
          </div>
          <div v-if="dismissible" class="ml-auto pl-3">
            <button
              @click="dismissSuccess(index)"
              class="inline-flex text-green-400 hover:text-green-600 transition-colors"
            >
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Messages -->
    <div v-if="infoMessages.length > 0" class="space-y-2">
      <div
        v-for="(message, index) in infoMessages"
        :key="`info-${index}`"
        class="bg-blue-50 border border-blue-200 rounded-md p-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm text-blue-700">{{ message }}</p>
          </div>
          <div v-if="dismissible" class="ml-auto pl-3">
            <button
              @click="dismissInfo(index)"
              class="inline-flex text-blue-400 hover:text-blue-600 transition-colors"
            >
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface MessageAction {
  label: string;
  type: "primary" | "secondary";
  action: string;
  data?: any;
}

interface Props {
  errors?: string[];
  warnings?: string[];
  successMessages?: string[];
  infoMessages?: string[];
  dismissible?: boolean;
  showErrorActions?: boolean;
}

interface Emits {
  (e: "dismissError", index: number): void;
  (e: "dismissWarning", index: number): void;
  (e: "dismissSuccess", index: number): void;
  (e: "dismissInfo", index: number): void;
  (e: "action", action: string, data?: any): void;
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => [],
  warnings: () => [],
  successMessages: () => [],
  infoMessages: () => [],
  dismissible: true,
  showErrorActions: true,
});

const emit = defineEmits<Emits>();

// Computed properties
const hasMessages = computed(() => {
  return (
    props.errors.length > 0 ||
    props.warnings.length > 0 ||
    props.successMessages.length > 0 ||
    props.infoMessages.length > 0
  );
});

// Methods
const getErrorTitle = (error: string): string => {
  // Parse error types and provide appropriate titles
  if (error.includes("validation")) return "Validation Error";
  if (error.includes("network") || error.includes("fetch"))
    return "Network Error";
  if (error.includes("timeout")) return "Request Timeout";
  if (error.includes("sanitization")) return "Security Error";
  if (error.includes("generation")) return "Generation Error";
  return "Error";
};

const getErrorMessage = (error: string): string => {
  return error;
};

const getErrorSuggestion = (error: string): string | null => {
  if (error.includes("network") || error.includes("fetch")) {
    return "Check your internet connection and try again.";
  }
  if (error.includes("timeout")) {
    return "The request took too long. Try with a simpler prompt or check your connection.";
  }
  if (error.includes("validation")) {
    return "Please check your input and ensure all required fields are filled correctly.";
  }
  if (error.includes("prompt") && error.includes("length")) {
    return "Try shortening your prompt to under 500 characters.";
  }
  if (error.includes("size")) {
    return "Ensure width and height are between 16 and 2048 pixels.";
  }
  return null;
};

const getErrorActions = (error: string): MessageAction[] => {
  const actions: MessageAction[] = [];

  if (error.includes("network") || error.includes("fetch")) {
    actions.push({
      label: "Retry",
      type: "primary",
      action: "retry",
    });
  }

  if (error.includes("validation")) {
    actions.push({
      label: "Reset Form",
      type: "secondary",
      action: "resetForm",
    });
  }

  return actions;
};

const getWarningTitle = (warning: string): string => {
  if (warning.includes("sanitization")) return "Content Sanitized";
  if (warning.includes("fallback")) return "Fallback Used";
  if (warning.includes("performance")) return "Performance Warning";
  return "Warning";
};

const getWarningMessage = (warning: string): string => {
  return warning;
};

const getWarningSuggestion = (warning: string): string | null => {
  if (warning.includes("sanitization")) {
    return "Some elements or attributes were removed for security. This is normal and expected.";
  }
  if (warning.includes("fallback")) {
    return "The primary generation method failed, so a fallback was used. Results may vary.";
  }
  if (warning.includes("performance")) {
    return "Consider simplifying your prompt or reducing the size for better performance.";
  }
  return null;
};

const dismissError = (index: number) => {
  emit("dismissError", index);
};

const dismissWarning = (index: number) => {
  emit("dismissWarning", index);
};

const dismissSuccess = (index: number) => {
  emit("dismissSuccess", index);
};

const dismissInfo = (index: number) => {
  emit("dismissInfo", index);
};

const handleAction = (action: MessageAction) => {
  emit("action", action.action, action.data);
};
</script>
