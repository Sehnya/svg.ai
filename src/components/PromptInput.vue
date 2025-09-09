<template>
  <div class="space-y-2">
    <label :for="inputId" class="block text-sm font-medium text-gray-700">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <textarea
        :id="inputId"
        v-model="internalValue"
        :rows="rows"
        :maxlength="maxLength"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[
          'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white',
        ]"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- Character count -->
      <div
        class="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1 rounded"
      >
        {{ characterCount }}/{{ maxLength }}
      </div>
    </div>

    <!-- Validation messages -->
    <div v-if="hasError || hasWarning" class="space-y-1">
      <p v-if="hasError" class="text-sm text-red-600 flex items-center">
        <svg
          class="w-4 h-4 mr-1 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        {{ errorMessage }}
      </p>

      <p v-if="hasWarning" class="text-sm text-yellow-600 flex items-center">
        <svg
          class="w-4 h-4 mr-1 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        {{ warningMessage }}
      </p>
    </div>

    <!-- Help text -->
    <p
      v-if="helpText && !hasError && !hasWarning"
      class="text-sm text-gray-500"
    >
      {{ helpText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

interface Props {
  modelValue: string;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  validateOnBlur?: boolean;
  customValidation?: (value: string) => string | null;
}

interface Emits {
  (e: "update:modelValue", value: string): void;
  (e: "input", value: string): void;
  (e: "blur", event: FocusEvent): void;
  (e: "focus", event: FocusEvent): void;
  (e: "validation", isValid: boolean, message?: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  label: "Prompt",
  placeholder: "Describe your SVG...",
  maxLength: 500,
  rows: 3,
  required: false,
  disabled: false,
  helpText: "",
  validateOnBlur: true,
});

const emit = defineEmits<Emits>();

// Generate unique ID for accessibility
const inputId = `prompt-input-${Math.random().toString(36).substr(2, 9)}`;

// Internal state
const internalValue = ref(props.modelValue);
const isFocused = ref(false);
const hasBeenBlurred = ref(false);

// Computed properties
const characterCount = computed(() => internalValue.value.length);

const isOverLimit = computed(() => characterCount.value > props.maxLength);

const isEmpty = computed(() => internalValue.value.trim().length === 0);

const validationMessage = computed(() => {
  if (props.customValidation) {
    return props.customValidation(internalValue.value);
  }

  if (props.required && isEmpty.value) {
    return "This field is required";
  }

  if (isOverLimit.value) {
    return `Text exceeds maximum length of ${props.maxLength} characters`;
  }

  return null;
});

const warningMessage = computed(() => {
  const remaining = props.maxLength - characterCount.value;
  if (remaining <= 50 && remaining > 0) {
    return `${remaining} characters remaining`;
  }
  return null;
});

const hasError = computed(() => {
  return (
    validationMessage.value !== null &&
    (hasBeenBlurred.value || !props.validateOnBlur)
  );
});

const hasWarning = computed(() => {
  return warningMessage.value !== null && !hasError.value;
});

const errorMessage = computed(() => validationMessage.value || "");

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    internalValue.value = newValue;
  }
);

// Watch internal value and emit changes
watch(internalValue, (newValue) => {
  emit("update:modelValue", newValue);
  emit("input", newValue);

  // Emit validation status
  const isValid = validationMessage.value === null;
  emit("validation", isValid, validationMessage.value || undefined);
});

// Event handlers
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  internalValue.value = target.value;
};

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false;
  hasBeenBlurred.value = true;
  emit("blur", event);
};

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true;
  emit("focus", event);
};
</script>
