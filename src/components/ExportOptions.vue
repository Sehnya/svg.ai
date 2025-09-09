<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>

      <button
        v-if="collapsible"
        @click="isCollapsed = !isCollapsed"
        class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg
          :class="[
            'w-5 h-5 transition-transform',
            isCollapsed ? '' : 'rotate-180',
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div v-if="!isCollapsed" class="p-4 space-y-4">
      <!-- Format Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Export Format
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label
            v-for="format in exportFormats"
            :key="format.value"
            class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            :class="
              selectedFormat === format.value
                ? 'border-blue-200 bg-blue-50'
                : 'border-gray-200'
            "
          >
            <input
              v-model="selectedFormat"
              type="radio"
              :value="format.value"
              :disabled="format.disabled"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div class="ml-3 flex-1">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900">
                  {{ format.label }}
                </span>
                <span
                  v-if="format.badge"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                >
                  {{ format.badge }}
                </span>
              </div>
              <p v-if="format.description" class="text-xs text-gray-500 mt-1">
                {{ format.description }}
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- Optimization Level -->
      <div v-if="selectedFormat === 'svg'">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Optimization Level
        </label>
        <div class="space-y-2">
          <label
            v-for="level in optimizationLevels"
            :key="level.value"
            class="flex items-center"
          >
            <input
              v-model="selectedOptimization"
              type="radio"
              :value="level.value"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div class="ml-3">
              <span class="text-sm font-medium text-gray-900">
                {{ level.label }}
              </span>
              <p class="text-xs text-gray-500">{{ level.description }}</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Size Options -->
      <div v-if="showSizeOptions">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Export Size
        </label>

        <div class="space-y-3">
          <!-- Size Presets -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="preset in sizePresets"
              :key="preset.name"
              @click="selectSizePreset(preset)"
              :class="[
                'px-3 py-2 text-xs font-medium rounded border transition-colors',
                selectedSizePreset === preset.name
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
              ]"
            >
              <div class="text-center">
                <div class="font-medium">{{ preset.label }}</div>
                <div class="text-xs opacity-75">{{ preset.multiplier }}x</div>
              </div>
            </button>
          </div>

          <!-- Custom Size -->
          <div
            v-if="selectedSizePreset === 'custom'"
            class="grid grid-cols-2 gap-3"
          >
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Width (px)
              </label>
              <input
                v-model.number="customSize.width"
                type="number"
                min="16"
                max="4096"
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Height (px)
              </label>
              <input
                v-model.number="customSize.height"
                type="number"
                min="16"
                max="4096"
                class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Options -->
      <div v-if="showAdvancedOptions">
        <div class="space-y-3">
          <!-- Include Metadata -->
          <label class="flex items-center">
            <input
              v-model="includeMetadata"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">Include metadata</span>
          </label>

          <!-- Embed Fonts -->
          <label class="flex items-center">
            <input
              v-model="embedFonts"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">Embed fonts</span>
          </label>

          <!-- Minify Output -->
          <label class="flex items-center">
            <input
              v-model="minifyOutput"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">Minify output</span>
          </label>

          <!-- Background Color -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <div class="flex items-center space-x-2">
              <input
                v-model="backgroundColor"
                type="color"
                class="h-8 w-16 border border-gray-300 rounded cursor-pointer"
              />
              <input
                v-model="backgroundColor"
                type="text"
                placeholder="#ffffff"
                class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                @click="backgroundColor = 'transparent'"
                class="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                Transparent
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- File Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          File Name
        </label>
        <div class="flex items-center space-x-2">
          <input
            v-model="fileName"
            type="text"
            placeholder="my-svg"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span class="text-sm text-gray-500">.{{ fileExtension }}</span>
        </div>
      </div>

      <!-- Export Preview -->
      <div v-if="showPreview" class="border-t pt-4">
        <h4 class="text-sm font-medium text-gray-900 mb-2">Export Preview</h4>
        <div class="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <div class="space-y-1">
            <div>Format: {{ selectedFormatLabel }}</div>
            <div v-if="selectedFormat === 'svg'">
              Optimization: {{ selectedOptimizationLabel }}
            </div>
            <div v-if="showSizeOptions">
              Size: {{ exportSize.width }}×{{ exportSize.height }}px
            </div>
            <div>File: {{ fileName }}.{{ fileExtension }}</div>
            <div v-if="estimatedFileSize">
              Estimated size: {{ estimatedFileSize }}
            </div>
          </div>
        </div>
      </div>

      <!-- Export Actions -->
      <div class="flex items-center justify-between pt-4 border-t">
        <div class="text-sm text-gray-500">
          <span v-if="isProcessing">Processing export...</span>
          <span v-else-if="lastExportTime">
            Last exported {{ formatTime(lastExportTime) }}
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="copyToClipboard"
            :disabled="!svgContent || isProcessing"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy
          </button>

          <button
            @click="downloadFile"
            :disabled="!svgContent || isProcessing"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              v-if="!isProcessing"
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <svg
              v-else
              class="w-4 h-4 mr-2 animate-spin"
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
            {{ isProcessing ? "Exporting..." : "Download" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { copyToClipboard as copyText } from "../utils/clipboard";

interface ExportFormat {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

interface OptimizationLevel {
  value: string;
  label: string;
  description: string;
}

interface SizePreset {
  name: string;
  label: string;
  multiplier: number;
}

interface Props {
  svgContent?: string;
  originalSize?: { width: number; height: number };
  title?: string;
  collapsible?: boolean;
  showSizeOptions?: boolean;
  showAdvancedOptions?: boolean;
  showPreview?: boolean;
}

interface Emits {
  (e: "export", options: ExportOptions): void;
  (e: "copy", content: string): void;
  (e: "error", error: string): void;
}

interface ExportOptions {
  format: string;
  optimization: string;
  size: { width: number; height: number };
  fileName: string;
  includeMetadata: boolean;
  embedFonts: boolean;
  minifyOutput: boolean;
  backgroundColor: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Export Options",
  collapsible: true,
  showSizeOptions: true,
  showAdvancedOptions: true,
  showPreview: true,
});

const emit = defineEmits<Emits>();

// State
const isCollapsed = ref(false);
const isProcessing = ref(false);
const lastExportTime = ref<Date | null>(null);

// Export settings
const selectedFormat = ref("svg");
const selectedOptimization = ref("standard");
const selectedSizePreset = ref("original");
const customSize = ref({ width: 200, height: 200 });
const fileName = ref("generated-svg");
const includeMetadata = ref(true);
const embedFonts = ref(false);
const minifyOutput = ref(false);
const backgroundColor = ref("transparent");

// Configuration
const exportFormats: ExportFormat[] = [
  {
    value: "svg",
    label: "SVG",
    description: "Scalable vector format, best for web and print",
    badge: "Recommended",
  },
  {
    value: "png",
    label: "PNG",
    description: "Raster format with transparency support",
  },
  {
    value: "jpg",
    label: "JPEG",
    description: "Compressed raster format, smaller file size",
  },
];

const optimizationLevels: OptimizationLevel[] = [
  {
    value: "none",
    label: "None",
    description: "Keep original formatting and structure",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Remove unnecessary whitespace and attributes",
  },
  {
    value: "aggressive",
    label: "Aggressive",
    description: "Maximum compression, may affect readability",
  },
];

const sizePresets: SizePreset[] = [
  { name: "original", label: "Original", multiplier: 1 },
  { name: "2x", label: "2x", multiplier: 2 },
  { name: "4x", label: "4x", multiplier: 4 },
  { name: "custom", label: "Custom", multiplier: 1 },
];

// Computed properties
const selectedFormatLabel = computed(() => {
  const format = exportFormats.find((f) => f.value === selectedFormat.value);
  return format?.label || selectedFormat.value.toUpperCase();
});

const selectedOptimizationLabel = computed(() => {
  const level = optimizationLevels.find(
    (l) => l.value === selectedOptimization.value
  );
  return level?.label || selectedOptimization.value;
});

const fileExtension = computed(() => {
  switch (selectedFormat.value) {
    case "png":
      return "png";
    case "jpg":
      return "jpg";
    default:
      return "svg";
  }
});

const exportSize = computed(() => {
  if (!props.originalSize) return { width: 200, height: 200 };

  if (selectedSizePreset.value === "custom") {
    return customSize.value;
  }

  const preset = sizePresets.find((p) => p.name === selectedSizePreset.value);
  const multiplier = preset?.multiplier || 1;

  return {
    width: Math.round(props.originalSize.width * multiplier),
    height: Math.round(props.originalSize.height * multiplier),
  };
});

const estimatedFileSize = computed(() => {
  if (!props.svgContent) return null;

  let size = props.svgContent.length;

  // Adjust for optimization
  if (selectedOptimization.value === "standard") {
    size *= 0.8;
  } else if (selectedOptimization.value === "aggressive") {
    size *= 0.6;
  }

  // Adjust for format
  if (selectedFormat.value === "png") {
    size *= 3; // Rough estimate for PNG
  } else if (selectedFormat.value === "jpg") {
    size *= 1.5; // Rough estimate for JPEG
  }

  if (size < 1024) return `${Math.round(size)} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
});

// Watch for original size changes
watch(
  () => props.originalSize,
  (newSize) => {
    if (newSize && selectedSizePreset.value === "custom") {
      customSize.value = { ...newSize };
    }
  },
  { immediate: true }
);

// Methods
const selectSizePreset = (preset: SizePreset) => {
  selectedSizePreset.value = preset.name;

  if (preset.name !== "custom" && props.originalSize) {
    customSize.value = {
      width: Math.round(props.originalSize.width * preset.multiplier),
      height: Math.round(props.originalSize.height * preset.multiplier),
    };
  }
};

const copyToClipboard = async () => {
  if (!props.svgContent) return;

  try {
    const processedContent = await processContent();
    await copyText(processedContent);
    emit("copy", processedContent);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Copy failed";
    emit("error", errorMessage);
  }
};

const downloadFile = async () => {
  if (!props.svgContent) return;

  isProcessing.value = true;

  try {
    const processedContent = await processContent();
    const blob = new Blob([processedContent], {
      type: getMimeType(),
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.value}.${fileExtension.value}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    lastExportTime.value = new Date();

    const exportOptions: ExportOptions = {
      format: selectedFormat.value,
      optimization: selectedOptimization.value,
      size: exportSize.value,
      fileName: fileName.value,
      includeMetadata: includeMetadata.value,
      embedFonts: embedFonts.value,
      minifyOutput: minifyOutput.value,
      backgroundColor: backgroundColor.value,
    };

    emit("export", exportOptions);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Export failed";
    emit("error", errorMessage);
  } finally {
    isProcessing.value = false;
  }
};

const processContent = async (): Promise<string> => {
  if (!props.svgContent) throw new Error("No content to process");

  let content = props.svgContent;

  // Apply optimizations for SVG
  if (selectedFormat.value === "svg") {
    if (selectedOptimization.value === "standard") {
      content = optimizeSVG(content);
    } else if (selectedOptimization.value === "aggressive") {
      content = minifySVG(content);
    }

    if (minifyOutput.value) {
      content = minifySVG(content);
    }

    // Add background if specified
    if (backgroundColor.value !== "transparent") {
      content = addBackground(content, backgroundColor.value);
    }

    // Remove metadata if not wanted
    if (!includeMetadata.value) {
      content = removeMetadata(content);
    }
  }

  // For raster formats, we would need to render the SVG to canvas
  // This is a simplified implementation
  if (selectedFormat.value === "png" || selectedFormat.value === "jpg") {
    // In a real implementation, you would:
    // 1. Create a canvas element
    // 2. Draw the SVG to the canvas
    // 3. Export as PNG/JPEG
    // For now, we'll just return the SVG content
    console.warn("Raster export not fully implemented");
  }

  return content;
};

const optimizeSVG = (svg: string): string => {
  return svg
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s*=\s*/g, "=")
    .replace(/"\s+/g, '" ')
    .trim();
};

const minifySVG = (svg: string): string => {
  return svg
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s*=\s*/g, "=")
    .replace(/"\s+/g, '"')
    .replace(/\s*\/>/g, "/>")
    .replace(/;\s*/g, ";")
    .replace(/:\s*/g, ":")
    .replace(/,\s*/g, ",")
    .trim();
};

const addBackground = (svg: string, color: string): string => {
  // Simple background addition - in practice, this would be more sophisticated
  const rectTag = `<rect width="100%" height="100%" fill="${color}"/>`;
  return svg.replace(/<svg([^>]*)>/, `<svg$1>${rectTag}`);
};

const removeMetadata = (svg: string): string => {
  return svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
};

const getMimeType = (): string => {
  switch (selectedFormat.value) {
    case "png":
      return "image/png";
    case "jpg":
      return "image/jpeg";
    default:
      return "image/svg+xml";
  }
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
</script>
