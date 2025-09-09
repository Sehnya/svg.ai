<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>

      <div class="flex items-center space-x-2">
        <!-- Format Selection -->
        <select
          v-if="showFormatSelector"
          v-model="selectedFormat"
          class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="svg">SVG</option>
          <option value="optimized">Optimized SVG</option>
          <option value="minified">Minified SVG</option>
        </select>

        <!-- Copy Button -->
        <button
          @click="copyCode"
          :disabled="!svgCode || isCopying"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            v-if="!isCopying && !copySuccess"
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

          <svg
            v-else-if="copySuccess"
            class="w-4 h-4 mr-2 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
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

          {{ copyButtonText }}
        </button>

        <!-- Download Button -->
        <button
          v-if="showDownloadButton"
          @click="downloadSVG"
          :disabled="!svgCode"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download
        </button>
      </div>
    </div>

    <!-- Code Display -->
    <div class="relative">
      <!-- Empty State -->
      <div
        v-if="!svgCode"
        class="flex items-center justify-center h-48 text-gray-500"
      >
        <div class="text-center">
          <svg
            class="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          <p class="text-sm">{{ emptyStateText }}</p>
        </div>
      </div>

      <!-- Code Content -->
      <div v-else class="relative">
        <!-- Line Numbers -->
        <div
          v-if="showLineNumbers"
          class="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 border-r border-gray-200 text-xs text-gray-500 font-mono select-none"
        >
          <div class="p-4 space-y-0 leading-6">
            <div v-for="n in lineCount" :key="n" class="text-right pr-2">
              {{ n }}
            </div>
          </div>
        </div>

        <!-- Code -->
        <div
          :class="[
            'overflow-auto max-h-96 bg-gray-900 text-gray-100',
            showLineNumbers ? 'pl-12' : '',
          ]"
        >
          <pre
            class="p-4 text-sm font-mono leading-6"
          ><code v-html="highlightedCode"></code></pre>
        </div>

        <!-- Copy Overlay -->
        <div
          v-if="copySuccess"
          class="absolute inset-0 bg-green-500 bg-opacity-10 flex items-center justify-center transition-opacity duration-300"
        >
          <div class="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div class="flex items-center">
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied to clipboard!
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer with Stats -->
    <div
      v-if="svgCode && showFooter"
      class="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600"
    >
      <div class="flex items-center space-x-4">
        <span>{{ lineCount }} lines</span>
        <span>{{ characterCount }} characters</span>
        <span v-if="fileSize">{{ fileSize }}</span>
      </div>

      <div v-if="optimizationInfo" class="text-xs">
        <span
          v-if="optimizationInfo.originalSize && optimizationInfo.optimizedSize"
          class="text-green-600"
        >
          {{ optimizationInfo.savings }}% smaller
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { copyToClipboard, ClipboardError } from "../utils/clipboard";

interface OptimizationInfo {
  originalSize: number;
  optimizedSize: number;
  savings: number;
}

interface Props {
  svgCode?: string;
  title?: string;
  emptyStateText?: string;
  showLineNumbers?: boolean;
  showFormatSelector?: boolean;
  showDownloadButton?: boolean;
  showFooter?: boolean;
  filename?: string;
  optimizationInfo?: OptimizationInfo;
}

interface Emits {
  (e: "copy", code: string, format: string): void;
  (e: "download", code: string, format: string, filename: string): void;
  (e: "formatChange", format: string): void;
  (e: "error", error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "SVG Code",
  emptyStateText: "No SVG code to display",
  showLineNumbers: true,
  showFormatSelector: true,
  showDownloadButton: true,
  showFooter: true,
  filename: "generated.svg",
});

const emit = defineEmits<Emits>();

// State
const selectedFormat = ref<"svg" | "optimized" | "minified">("svg");
const isCopying = ref(false);
const copySuccess = ref(false);

// Computed properties
const processedCode = computed(() => {
  if (!props.svgCode) return "";

  switch (selectedFormat.value) {
    case "optimized":
      return optimizeSVG(props.svgCode);
    case "minified":
      return minifySVG(props.svgCode);
    default:
      return props.svgCode;
  }
});

const highlightedCode = computed(() => {
  if (!processedCode.value) return "";
  return highlightSVG(processedCode.value);
});

const lineCount = computed(() => {
  if (!processedCode.value) return 0;
  return processedCode.value.split("\n").length;
});

const characterCount = computed(() => {
  return processedCode.value.length;
});

const fileSize = computed(() => {
  if (!processedCode.value) return null;
  const bytes = new Blob([processedCode.value]).size;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
});

const copyButtonText = computed(() => {
  if (copySuccess.value) return "Copied!";
  if (isCopying.value) return "Copying...";
  return "Copy Code";
});

// Watch for format changes
watch(selectedFormat, (newFormat) => {
  emit("formatChange", newFormat);
});

// Methods
const copyCode = async () => {
  if (!processedCode.value || isCopying.value) return;

  isCopying.value = true;

  try {
    await copyToClipboard(processedCode.value);
    copySuccess.value = true;
    emit("copy", processedCode.value, selectedFormat.value);

    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (error) {
    console.error("Copy failed:", error);
    const errorMessage =
      error instanceof ClipboardError
        ? error.message
        : "Failed to copy to clipboard";
    emit("error", errorMessage);
  } finally {
    isCopying.value = false;
  }
};

const downloadSVG = () => {
  if (!processedCode.value) return;

  try {
    const blob = new Blob([processedCode.value], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = getFilename();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    emit("download", processedCode.value, selectedFormat.value, getFilename());
  } catch (error) {
    console.error("Download failed:", error);
    emit("error", "Failed to download file");
  }
};

const getFilename = (): string => {
  const base = props.filename.replace(/\.svg$/, "");
  const suffix =
    selectedFormat.value === "svg" ? "" : `-${selectedFormat.value}`;
  return `${base}${suffix}.svg`;
};

// SVG Processing Functions
const optimizeSVG = (svg: string): string => {
  // Basic SVG optimization
  return svg
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/>\s+</g, "><") // Remove whitespace between tags
    .replace(/\s*=\s*/g, "=") // Remove whitespace around equals
    .replace(/"\s+/g, '" ') // Normalize attribute spacing
    .trim();
};

const minifySVG = (svg: string): string => {
  // Aggressive minification
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

const highlightSVG = (svg: string): string => {
  // Basic syntax highlighting for SVG
  return svg
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/(".*?")/g, '<span class="text-green-400">$1</span>') // Attribute values
    .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="text-blue-400">$2</span>') // Tag names
    .replace(/([\w-]+)(?==)/g, '<span class="text-yellow-400">$1</span>') // Attribute names
    .replace(/(&lt;!--.*?--&gt;)/g, '<span class="text-gray-500">$1</span>'); // Comments
};
</script>

<style scoped>
/* Custom scrollbar for code area */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #374151;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
