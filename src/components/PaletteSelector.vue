<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <label class="block text-sm font-medium text-gray-700">
        Color Palette
        <span v-if="required" class="text-red-500">*</span>
      </label>

      <button
        v-if="selectedColors.length > 0"
        type="button"
        @click="clearSelection"
        class="text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        Clear all
      </button>
    </div>

    <!-- Palette Type Selection -->
    <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      <button
        v-for="type in paletteTypes"
        :key="type.value"
        type="button"
        @click="paletteType = type.value"
        :class="[
          'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
          paletteType === type.value
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
        ]"
        :disabled="disabled"
      >
        {{ type.label }}
      </button>
    </div>

    <!-- Preset Palettes -->
    <div v-if="paletteType === 'preset'" class="space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          v-for="preset in presetPalettes"
          :key="preset.name"
          type="button"
          @click="selectPresetPalette(preset)"
          :class="[
            'p-3 border rounded-lg text-left transition-colors',
            selectedPreset === preset.name
              ? 'border-blue-200 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
          ]"
          :disabled="disabled"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-900">{{
              preset.name
            }}</span>
            <div class="flex space-x-1">
              <div
                v-for="color in preset.colors.slice(0, 4)"
                :key="color"
                class="w-4 h-4 rounded-full border border-gray-200"
                :style="{ backgroundColor: color }"
              />
              <span
                v-if="preset.colors.length > 4"
                class="text-xs text-gray-500"
              >
                +{{ preset.colors.length - 4 }}
              </span>
            </div>
          </div>
          <p class="text-xs text-gray-500">{{ preset.description }}</p>
        </button>
      </div>
    </div>

    <!-- Custom Color Selection -->
    <div v-if="paletteType === 'custom'" class="space-y-3">
      <!-- Color Input -->
      <div class="flex space-x-2">
        <div class="flex-1">
          <input
            v-model="newColor"
            type="color"
            class="w-full h-10 border border-gray-300 rounded-md cursor-pointer disabled:cursor-not-allowed"
            :disabled="disabled"
            @change="handleColorInput"
          />
        </div>
        <div class="flex-1">
          <input
            v-model="newColor"
            type="text"
            placeholder="#FF0000"
            pattern="^#[0-9A-Fa-f]{6}$"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :disabled="disabled"
            @keyup.enter="addColor"
            @input="validateColorInput"
          />
        </div>
        <button
          type="button"
          @click="addColor"
          :disabled="
            disabled ||
            !isValidColor ||
            selectedColors.includes(newColor.toUpperCase())
          "
          class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      <p v-if="colorInputError" class="text-sm text-red-600">
        {{ colorInputError }}
      </p>
    </div>

    <!-- Selected Colors Display -->
    <div v-if="selectedColors.length > 0" class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">
          Selected Colors ({{ selectedColors.length }})
        </span>
        <span v-if="maxColors" class="text-xs text-gray-500">
          Max: {{ maxColors }}
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        <div
          v-for="(color, index) in selectedColors"
          :key="color"
          class="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2"
        >
          <div
            class="w-5 h-5 rounded-full border border-gray-300"
            :style="{ backgroundColor: color }"
          />
          <span class="text-sm font-mono text-gray-700">{{ color }}</span>
          <button
            type="button"
            @click="removeColor(index)"
            :disabled="disabled"
            class="text-gray-400 hover:text-red-500 transition-colors disabled:cursor-not-allowed"
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
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="selectedColors.length === 0"
      class="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg"
    >
      <svg
        class="mx-auto h-8 w-8 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z"
        />
      </svg>
      <p class="mt-2 text-sm text-gray-500">
        {{
          paletteType === "preset"
            ? "Select a preset palette"
            : "Add colors to create your palette"
        }}
      </p>
    </div>

    <!-- Help Text -->
    <p v-if="helpText" class="text-xs text-gray-500">
      {{ helpText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { PaletteConfig } from "../types/api";

interface PresetPalette {
  name: string;
  description: string;
  colors: string[];
}

interface Props {
  modelValue: string[];
  paletteConfig?: PaletteConfig;
  required?: boolean;
  disabled?: boolean;
  maxColors?: number;
  helpText?: string;
}

interface Emits {
  (e: "update:modelValue", value: string[]): void;
  (e: "update:paletteConfig", value: PaletteConfig): void;
  (e: "validation", isValid: boolean, message?: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  maxColors: 8,
  helpText:
    "Colors will influence the generated SVG. Leave empty for automatic color selection.",
});

const emit = defineEmits<Emits>();

// Internal state
const paletteType = ref<"preset" | "custom">(
  props.paletteConfig?.type || "preset"
);
const selectedColors = ref<string[]>([...props.modelValue]);
const selectedPreset = ref<string | null>(props.paletteConfig?.name || null);
const newColor = ref("#FF0000");
const colorInputError = ref<string | null>(null);

// Palette types
const paletteTypes = [
  { value: "preset", label: "Presets" },
  { value: "custom", label: "Custom" },
] as const;

// Preset palettes
const presetPalettes: PresetPalette[] = [
  {
    name: "Modern Blues",
    description: "Cool, professional blue tones",
    colors: ["#1E40AF", "#3B82F6", "#60A5FA", "#93C5FD"],
  },
  {
    name: "Warm Sunset",
    description: "Warm oranges and reds",
    colors: ["#DC2626", "#EA580C", "#F59E0B", "#FCD34D"],
  },
  {
    name: "Nature Green",
    description: "Fresh, natural greens",
    colors: ["#065F46", "#059669", "#10B981", "#6EE7B7"],
  },
  {
    name: "Purple Gradient",
    description: "Rich purple and violet shades",
    colors: ["#581C87", "#7C3AED", "#A855F7", "#C084FC"],
  },
  {
    name: "Monochrome",
    description: "Classic black, white, and grays",
    colors: ["#000000", "#374151", "#9CA3AF", "#FFFFFF"],
  },
  {
    name: "Pastel Dreams",
    description: "Soft, dreamy pastel colors",
    colors: ["#FEE2E2", "#DBEAFE", "#D1FAE5", "#FEF3C7"],
  },
  {
    name: "Ocean Depths",
    description: "Deep blues and teals",
    colors: ["#0F172A", "#1E293B", "#0891B2", "#06B6D4"],
  },
  {
    name: "Autumn Leaves",
    description: "Warm autumn colors",
    colors: ["#92400E", "#D97706", "#F59E0B", "#FCD34D"],
  },
];

// Computed properties
const isValidColor = computed(() => {
  return /^#[0-9A-Fa-f]{6}$/.test(newColor.value);
});

const canAddMoreColors = computed(() => {
  return !props.maxColors || selectedColors.value.length < props.maxColors;
});

const isValid = computed(() => {
  if (props.required && selectedColors.value.length === 0) {
    return false;
  }
  return true;
});

const validationMessage = computed(() => {
  if (props.required && selectedColors.value.length === 0) {
    return "At least one color is required";
  }
  return undefined;
});

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    selectedColors.value = [...newValue];
  },
  { deep: true }
);

watch(
  () => props.paletteConfig,
  (newValue) => {
    if (newValue) {
      paletteType.value = newValue.type;
      selectedPreset.value = newValue.name || null;
    }
  }
);

// Emit changes
watch(
  selectedColors,
  (newValue) => {
    emit("update:modelValue", [...newValue]);
  },
  { deep: true }
);

watch([paletteType, selectedPreset], () => {
  const config: PaletteConfig = {
    type: paletteType.value,
    colors: [...selectedColors.value],
    name: selectedPreset.value || undefined,
  };
  emit("update:paletteConfig", config);
});

watch(
  [isValid, validationMessage],
  () => {
    emit("validation", isValid.value, validationMessage.value);
  },
  { immediate: true }
);

// Methods
const selectPresetPalette = (preset: PresetPalette) => {
  selectedPreset.value = preset.name;
  selectedColors.value = [...preset.colors];
};

const addColor = () => {
  if (!isValidColor.value || !canAddMoreColors.value) return;

  const color = newColor.value.toUpperCase();
  if (!selectedColors.value.includes(color)) {
    selectedColors.value.push(color);
    newColor.value = "#FF0000";
    colorInputError.value = null;
  }
};

const removeColor = (index: number) => {
  selectedColors.value.splice(index, 1);

  // Clear preset selection if colors were modified
  if (paletteType.value === "preset") {
    selectedPreset.value = null;
  }
};

const clearSelection = () => {
  selectedColors.value = [];
  selectedPreset.value = null;
};

const handleColorInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  newColor.value = target.value;
  validateColorInput();
};

const validateColorInput = () => {
  if (!newColor.value) {
    colorInputError.value = null;
    return;
  }

  if (!isValidColor.value) {
    colorInputError.value = "Please enter a valid hex color (e.g., #FF0000)";
    return;
  }

  if (selectedColors.value.includes(newColor.value.toUpperCase())) {
    colorInputError.value = "This color is already selected";
    return;
  }

  if (!canAddMoreColors.value) {
    colorInputError.value = `Maximum of ${props.maxColors} colors allowed`;
    return;
  }

  colorInputError.value = null;
};
</script>
