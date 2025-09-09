<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <label :for="inputId" class="block text-sm font-medium text-gray-700">
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
      </label>

      <button
        v-if="showRandomButton"
        type="button"
        @click="generateRandomSeed"
        :disabled="disabled"
        class="text-xs text-blue-600 hover:text-blue-800 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        <svg
          class="w-3 h-3 inline mr-1"
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
        Random
      </button>
    </div>

    <div class="relative">
      <input
        :id="inputId"
        v-model="internalValue"
        type="number"
        :min="minValue"
        :max="maxValue"
        :step="step"
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

      <!-- Clear button -->
      <button
        v-if="
          internalValue !== null && internalValue !== undefined && !disabled
        "
        type="button"
        @click="clearValue"
        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
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
    <div v-if="!hasError && !hasWarning" class="space-y-1">
      <p v-if="helpText" class="text-sm text-gray-500">
        {{ helpText }}
      </p>

      <div
        v-if="showSeedInfo && internalValue"
        class="text-xs text-gray-400 bg-gray-50 rounded px-2 py-1"
      >
        <div class="flex items-center justify-between">
          <span>Seed: {{ internalValue }}</span>
          <span class="text-green-600">✓ Deterministic</span>
        </div>
      </div>
    </div>

    <!-- Seed presets -->
    <div v-if="showPresets && seedPresets.length > 0" class="space-y-2">
      <p class="text-xs font-medium text-gray-700">Quick presets:</p>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="preset in seedPresets"
          :key="preset.value"
          type="button"
          @click="selectPreset(preset.value)"
          :disabled="disabled"
          class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

interface SeedPreset {
  label: string;
  value: number;
}

interface Props {
  modelValue: number | null;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minValue?: number;
  maxValue?: number;
  step?: number;
  helpText?: string;
  showRandomButton?: boolean;
  showSeedInfo?: boolean;
  showPresets?: boolean;
  seedPresets?: SeedPreset[];
  validateOnBlur?: boolean;
  customValidation?: (value: number | null) => string | null;
}

interface Emits {
  (e: "update:modelValue", value: number | null): void;
  (e: "input", value: number | null): void;
  (e: "blur", event: FocusEvent): void;
  (e: "focus", event: FocusEvent): void;
  (e: "validation", isValid: boolean, message?: string): void;
  (e: "seedGenerated", value: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  label: "Seed",
  placeholder: "Enter seed for deterministic generation",
  required: false,
  disabled: false,
  minValue: 0,
  maxValue: 999999999,
  step: 1,
  helpText:
    "Use the same seed to reproduce identical results. Leave empty for random generation.",
  showRandomButton: true,
  showSeedInfo: true,
  showPresets: false,
  seedPresets: () => [
    { label: "42", value: 42 },
    { label: "123", value: 123 },
    { label: "2024", value: 2024 },
    { label: "12345", value: 12345 },
  ],
  validateOnBlur: true,
});

const emit = defineEmits<Emits>();

// Generate unique ID for accessibility
const inputId = `seed-input-${Math.random().toString(36).substr(2, 9)}`;

// Internal state
const internalValue = ref<number | null>(props.modelValue);
const isFocused = ref(false);
const hasBeenBlurred = ref(false);

// Computed properties
const validationMessage = computed(() => {
  if (props.customValidation) {
    return props.customValidation(internalValue.value);
  }

  if (
    props.required &&
    (internalValue.value === null || internalValue.value === undefined)
  ) {
    return "Seed is required";
  }

  if (internalValue.value !== null) {
    if (internalValue.value < props.minValue) {
      return `Seed must be at least ${props.minValue}`;
    }

    if (internalValue.value > props.maxValue) {
      return `Seed must be no more than ${props.maxValue}`;
    }

    if (!Number.isInteger(internalValue.value)) {
      return "Seed must be a whole number";
    }
  }

  return null;
});

const warningMessage = computed(() => {
  if (internalValue.value === null) {
    return "Random generation - results will vary each time";
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
  return warningMessage.value !== null && !hasError.value && !isFocused.value;
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
  const target = event.target as HTMLInputElement;
  const value = target.value;

  if (value === "" || value === null) {
    internalValue.value = null;
  } else {
    const numValue = parseInt(value, 10);
    internalValue.value = isNaN(numValue) ? null : numValue;
  }
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

const generateRandomSeed = () => {
  const randomSeed =
    Math.floor(Math.random() * (props.maxValue - props.minValue + 1)) +
    props.minValue;
  internalValue.value = randomSeed;
  emit("seedGenerated", randomSeed);
};

const clearValue = () => {
  internalValue.value = null;
};

const selectPreset = (value: number) => {
  internalValue.value = value;
};
</script>
