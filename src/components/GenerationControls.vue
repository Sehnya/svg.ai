<template>
  <div class="space-y-4">
    <!-- Size Controls -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Size
        <span v-if="required" class="text-red-500">*</span>
      </label>

      <!-- Size Presets -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <button
          v-for="preset in sizePresets"
          :key="preset.name"
          type="button"
          @click="selectPreset(preset)"
          :class="[
            'px-3 py-2 text-xs font-medium rounded border transition-colors',
            selectedPreset === preset.name
              ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500 ring-opacity-20'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400',
          ]"
          :disabled="disabled"
        >
          <div class="text-center">
            <div class="font-medium">{{ preset.label }}</div>
            <div class="text-xs opacity-75">
              {{ preset.width }}×{{ preset.height }}
            </div>
          </div>
        </button>
      </div>

      <!-- Custom Size Inputs -->
      <div v-if="selectedPreset === 'custom'" class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Width (px)
          </label>
          <input
            v-model.number="customSize.width"
            type="number"
            :min="minSize"
            :max="maxSize"
            :disabled="disabled"
            :class="[
              'w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              hasWidthError ? 'border-red-300' : 'border-gray-300',
            ]"
            @input="handleCustomSizeChange"
          />
          <p v-if="hasWidthError" class="mt-1 text-xs text-red-600">
            Width must be between {{ minSize }} and {{ maxSize }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Height (px)
          </label>
          <input
            v-model.number="customSize.height"
            type="number"
            :min="minSize"
            :max="maxSize"
            :disabled="disabled"
            :class="[
              'w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              hasHeightError ? 'border-red-300' : 'border-gray-300',
            ]"
            @input="handleCustomSizeChange"
          />
          <p v-if="hasHeightError" class="mt-1 text-xs text-red-600">
            Height must be between {{ minSize }} and {{ maxSize }}
          </p>
        </div>
      </div>

      <!-- Size Info -->
      <div class="mt-2 text-xs text-gray-500">
        Current size: {{ currentSize.width }}×{{ currentSize.height }} pixels
        <span v-if="aspectRatio" class="ml-2">
          ({{ aspectRatio }} aspect ratio)
        </span>
      </div>
    </div>

    <!-- Model Selection -->
    <div v-if="showModelSelection">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Generation Model
      </label>

      <div class="space-y-2">
        <label
          v-for="model in availableModels"
          :key="model.value"
          class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          :class="
            selectedModel === model.value
              ? 'border-blue-200 bg-blue-50'
              : 'border-gray-200'
          "
        >
          <input
            v-model="selectedModel"
            type="radio"
            :value="model.value"
            :disabled="disabled || model.disabled"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            @change="handleModelChange"
          />
          <div class="ml-3 flex-1">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900">
                {{ model.label }}
              </span>
              <span
                v-if="model.badge"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
              >
                {{ model.badge }}
              </span>
            </div>
            <p v-if="model.description" class="text-xs text-gray-500 mt-1">
              {{ model.description }}
            </p>
          </div>
        </label>
      </div>
    </div>

    <!-- Advanced Options Toggle -->
    <div v-if="showAdvancedOptions">
      <button
        type="button"
        @click="showAdvanced = !showAdvanced"
        class="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg
          :class="[
            'w-4 h-4 mr-1 transition-transform',
            showAdvanced ? 'rotate-90' : '',
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
        Advanced Options
      </button>

      <div
        v-if="showAdvanced"
        class="mt-3 pl-5 space-y-3 border-l-2 border-gray-200"
      >
        <slot name="advanced-options" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { SizeConfig } from "../types/api";

interface SizePreset {
  name: "icon" | "banner" | "square" | "custom";
  label: string;
  width: number;
  height: number;
}

interface ModelOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

interface Props {
  modelValue: SizeConfig;
  selectedModel?: string;
  required?: boolean;
  disabled?: boolean;
  minSize?: number;
  maxSize?: number;
  showModelSelection?: boolean;
  showAdvancedOptions?: boolean;
  availableModels?: ModelOption[];
}

interface Emits {
  (e: "update:modelValue", value: SizeConfig): void;
  (e: "update:selectedModel", value: string): void;
  (e: "validation", isValid: boolean, errors: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  selectedModel: "rule-based",
  required: false,
  disabled: false,
  minSize: 16,
  maxSize: 2048,
  showModelSelection: false,
  showAdvancedOptions: false,
  availableModels: () => [
    {
      value: "rule-based",
      label: "Rule-based Generator",
      description: "Fast, deterministic generation using predefined patterns",
      badge: "Offline",
    },
    {
      value: "llm",
      label: "AI Generator",
      description:
        "Advanced AI-powered generation with natural language understanding",
      disabled: false,
    },
  ],
});

const emit = defineEmits<Emits>();

// Internal state
const selectedPreset = ref<SizePreset["name"]>(props.modelValue.preset);
const customSize = ref({
  width: props.modelValue.width,
  height: props.modelValue.height,
});
const selectedModel = ref(props.selectedModel);
const showAdvanced = ref(false);

// Size presets
const sizePresets: SizePreset[] = [
  { name: "icon", label: "Icon", width: 64, height: 64 },
  { name: "banner", label: "Banner", width: 400, height: 100 },
  { name: "square", label: "Square", width: 200, height: 200 },
  { name: "custom", label: "Custom", width: 100, height: 100 },
];

// Computed properties
const currentSize = computed(() => {
  if (selectedPreset.value === "custom") {
    return customSize.value;
  }

  const preset = sizePresets.find((p) => p.name === selectedPreset.value);
  return preset
    ? { width: preset.width, height: preset.height }
    : customSize.value;
});

const aspectRatio = computed(() => {
  const { width, height } = currentSize.value;
  if (width === height) return "1:1";

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;

  // Simplify common ratios
  if (ratioW === 16 && ratioH === 9) return "16:9";
  if (ratioW === 4 && ratioH === 3) return "4:3";
  if (ratioW === 3 && ratioH === 2) return "3:2";

  return `${ratioW}:${ratioH}`;
});

const hasWidthError = computed(() => {
  return (
    customSize.value.width < props.minSize ||
    customSize.value.width > props.maxSize
  );
});

const hasHeightError = computed(() => {
  return (
    customSize.value.height < props.minSize ||
    customSize.value.height > props.maxSize
  );
});

const isValid = computed(() => {
  return !hasWidthError.value && !hasHeightError.value;
});

const validationErrors = computed(() => {
  const errors: string[] = [];

  if (hasWidthError.value) {
    errors.push(`Width must be between ${props.minSize} and ${props.maxSize}`);
  }

  if (hasHeightError.value) {
    errors.push(`Height must be between ${props.minSize} and ${props.maxSize}`);
  }

  return errors;
});

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    selectedPreset.value = newValue.preset;
    customSize.value = {
      width: newValue.width,
      height: newValue.height,
    };
  },
  { deep: true }
);

watch(
  () => props.selectedModel,
  (newValue) => {
    selectedModel.value = newValue;
  }
);

// Emit changes
watch(
  [selectedPreset, customSize],
  () => {
    const sizeConfig: SizeConfig = {
      preset: selectedPreset.value,
      width: currentSize.value.width,
      height: currentSize.value.height,
    };

    emit("update:modelValue", sizeConfig);
  },
  { deep: true }
);

watch(selectedModel, (newValue) => {
  emit("update:selectedModel", newValue);
});

watch(
  [isValid, validationErrors],
  () => {
    emit("validation", isValid.value, validationErrors.value);
  },
  { immediate: true }
);

// Methods
const selectPreset = (preset: SizePreset) => {
  selectedPreset.value = preset.name;

  if (preset.name !== "custom") {
    customSize.value = {
      width: preset.width,
      height: preset.height,
    };
  }
};

const handleCustomSizeChange = () => {
  // Ensure values are within bounds
  customSize.value.width = Math.max(
    props.minSize,
    Math.min(props.maxSize, customSize.value.width || props.minSize)
  );
  customSize.value.height = Math.max(
    props.minSize,
    Math.min(props.maxSize, customSize.value.height || props.minSize)
  );
};

const handleModelChange = () => {
  // Model change is handled by the watch
};
</script>
