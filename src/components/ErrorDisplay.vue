<template>
  <div v-if="hasErrors || hasWarnings" class="space-y-3">
    <!-- Critical Errors (Always Shown) -->
    <div
      v-if="criticalErrors.length > 0"
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
            {{
              criticalErrors.length === 1 ? "Critical Error" : "Critical Errors"
            }}
          </h3>
          <div class="mt-2 text-sm text-red-700">
            <ul class="list-disc list-inside space-y-1">
              <li v-for="error in criticalErrors" :key="error.id">
                {{ error.message }}
                <button
                  v-if="error.action"
                  @click="handleErrorAction(error)"
                  class="ml-2 text-red-800 underline hover:text-red-900"
                >
                  {{ error.action.label }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- High Priority Errors -->
    <div
      v-if="highPriorityErrors.length > 0"
      class="bg-orange-50 border border-orange-200 rounded-md p-4"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-orange-400"
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
          <h3 class="text-sm font-medium text-orange-800">
            {{ highPriorityErrors.length === 1 ? "Error" : "Errors" }}
          </h3>
          <div class="mt-2 text-sm text-orange-700">
            <ul class="list-disc list-inside space-y-1">
              <li v-for="error in highPriorityErrors" :key="error.id">
                {{ error.message }}
                <button
                  v-if="error.action"
                  @click="handleErrorAction(error)"
                  class="ml-2 text-orange-800 underline hover:text-orange-900"
                >
                  {{ error.action.label }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Warnings -->
    <div
      v-if="warnings.length > 0"
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
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-yellow-800">
              {{ warnings.length === 1 ? "Warning" : "Warnings" }}
            </h3>
            <button
              v-if="warnings.length > maxWarningsShown && !showAllWarnings"
              @click="showAllWarnings = true"
              class="text-xs text-yellow-700 hover:text-yellow-800 underline"
            >
              Show all {{ warnings.length }}
            </button>
          </div>
          <div class="mt-2 text-sm text-yellow-700">
            <ul class="list-disc list-inside space-y-1">
              <li v-for="warning in displayedWarnings" :key="warning.id">
                {{ warning.message }}
                <button
                  v-if="warning.action"
                  @click="handleErrorAction(warning)"
                  class="ml-2 text-yellow-800 underline hover:text-yellow-900"
                >
                  {{ warning.action.label }}
                </button>
              </li>
            </ul>
            <button
              v-if="showAllWarnings && warnings.length > maxWarningsShown"
              @click="showAllWarnings = false"
              class="mt-2 text-xs text-yellow-700 hover:text-yellow-800 underline"
            >
              Show less
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Low Priority Errors (Collapsible) -->
    <div v-if="lowPriorityErrors.length > 0">
      <button
        @click="showLowPriorityErrors = !showLowPriorityErrors"
        class="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <svg
          :class="[
            'w-4 h-4 mr-1 transition-transform',
            showLowPriorityErrors ? 'rotate-90' : '',
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
        {{ lowPriorityErrors.length }} additional issue{{
          lowPriorityErrors.length !== 1 ? "s" : ""
        }}
      </button>

      <div
        v-if="showLowPriorityErrors"
        class="mt-2 bg-gray-50 border border-gray-200 rounded-md p-4"
      >
        <div class="text-sm text-gray-700">
          <ul class="list-disc list-inside space-y-1">
            <li v-for="error in lowPriorityErrors" :key="error.id">
              {{ error.message }}
              <button
                v-if="error.action"
                @click="handleErrorAction(error)"
                class="ml-2 text-gray-800 underline hover:text-gray-900"
              >
                {{ error.action.label }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Validation Errors (Field-specific) -->
    <div v-if="validationErrors.length > 0" class="space-y-2">
      <h4 class="text-sm font-medium text-gray-900">Validation Issues</h4>
      <div
        v-for="error in validationErrors"
        :key="error.id"
        class="flex items-start space-x-2 p-2 bg-red-50 border border-red-200 rounded"
      >
        <svg
          class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        <div class="flex-1">
          <p class="text-sm text-red-800">
            <span v-if="error.field" class="font-medium"
              >{{ error.field }}:</span
            >
            {{ error.message }}
          </p>
          <button
            v-if="error.action"
            @click="handleErrorAction(error)"
            class="mt-1 text-xs text-red-700 underline hover:text-red-800"
          >
            {{ error.action.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Global Actions -->
    <div
      v-if="showGlobalActions && (hasErrors || hasWarnings)"
      class="flex items-center justify-between pt-3 border-t border-gray-200"
    >
      <div class="text-sm text-gray-500">
        {{ totalErrorCount }} issue{{ totalErrorCount !== 1 ? "s" : "" }} found
      </div>

      <div class="flex items-center space-x-2">
        <button
          v-if="allowDismiss"
          @click="dismissAll"
          class="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Dismiss All
        </button>

        <button
          v-if="allowRetry"
          @click="$emit('retry')"
          class="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            class="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Retry
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface ErrorAction {
  label: string;
  handler: () => void;
}

interface ErrorItem {
  id: string;
  message: string;
  priority: "critical" | "high" | "medium" | "low";
  type: "error" | "warning" | "validation";
  field?: string;
  action?: ErrorAction;
  dismissible?: boolean;
}

interface Props {
  errors?: ErrorItem[];
  maxWarningsShown?: number;
  showGlobalActions?: boolean;
  allowDismiss?: boolean;
  allowRetry?: boolean;
  autoCollapse?: boolean;
}

interface Emits {
  (e: "dismiss", errorId: string): void;
  (e: "dismissAll"): void;
  (e: "retry"): void;
  (e: "action", error: ErrorItem): void;
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => [],
  maxWarningsShown: 3,
  showGlobalActions: true,
  allowDismiss: true,
  allowRetry: true,
  autoCollapse: true,
});

const emit = defineEmits<Emits>();

// State
const showAllWarnings = ref(false);
const showLowPriorityErrors = ref(!props.autoCollapse);

// Computed properties
const criticalErrors = computed(() =>
  props.errors.filter(
    (error) => error.type === "error" && error.priority === "critical"
  )
);

const highPriorityErrors = computed(() =>
  props.errors.filter(
    (error) => error.type === "error" && error.priority === "high"
  )
);

const lowPriorityErrors = computed(() =>
  props.errors.filter(
    (error) =>
      error.type === "error" &&
      (error.priority === "medium" || error.priority === "low")
  )
);

const warnings = computed(() =>
  props.errors.filter((error) => error.type === "warning")
);

const validationErrors = computed(() =>
  props.errors.filter((error) => error.type === "validation")
);

const displayedWarnings = computed(() => {
  if (
    showAllWarnings.value ||
    warnings.value.length <= props.maxWarningsShown
  ) {
    return warnings.value;
  }
  return warnings.value.slice(0, props.maxWarningsShown);
});

const hasErrors = computed(() =>
  props.errors.some(
    (error) => error.type === "error" || error.type === "validation"
  )
);

const hasWarnings = computed(() =>
  props.errors.some((error) => error.type === "warning")
);

const totalErrorCount = computed(() => props.errors.length);

// Methods
const handleErrorAction = (error: ErrorItem) => {
  if (error.action) {
    error.action.handler();
  }
  emit("action", error);
};

const dismissAll = () => {
  emit("dismissAll");
};

// Helper function to create error items
const createError = (
  message: string,
  options: Partial<ErrorItem> = {}
): ErrorItem => ({
  id: Math.random().toString(36).substr(2, 9),
  message,
  priority: "medium",
  type: "error",
  dismissible: true,
  ...options,
});

const createWarning = (
  message: string,
  options: Partial<ErrorItem> = {}
): ErrorItem => ({
  id: Math.random().toString(36).substr(2, 9),
  message,
  priority: "medium",
  type: "warning",
  dismissible: true,
  ...options,
});

const createValidationError = (
  field: string,
  message: string,
  options: Partial<ErrorItem> = {}
): ErrorItem => ({
  id: Math.random().toString(36).substr(2, 9),
  message,
  field,
  priority: "high",
  type: "validation",
  dismissible: false,
  ...options,
});

// Expose helper functions for parent components
defineExpose({
  createError,
  createWarning,
  createValidationError,
});
</script>
