<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>

      <div class="flex items-center space-x-2">
        <!-- Zoom Controls -->
        <div
          v-if="svgContent && showZoomControls"
          class="flex items-center space-x-1 bg-gray-100 rounded-md p-1"
        >
          <button
            @click="zoomOut"
            :disabled="zoomLevel <= minZoom"
            class="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom out"
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
                d="M20 12H4"
              />
            </svg>
          </button>

          <span class="text-xs text-gray-600 min-w-[3rem] text-center">
            {{ Math.round(zoomLevel * 100) }}%
          </span>

          <button
            @click="zoomIn"
            :disabled="zoomLevel >= maxZoom"
            class="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom in"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          <button
            @click="resetZoom"
            class="p-1 text-gray-600 hover:text-gray-900"
            title="Reset zoom"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <!-- Fullscreen Toggle -->
        <button
          v-if="svgContent && showFullscreenButton"
          @click="toggleFullscreen"
          class="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          title="Toggle fullscreen"
        >
          <svg
            v-if="!isFullscreen"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          <svg
            v-else
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9v-4.5M15 9h4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15v4.5M15 15h4.5m0 0l5.5 5.5"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Preview Content -->
    <div
      ref="previewContainer"
      :class="[
        'relative overflow-hidden',
        isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'min-h-[300px]',
      ]"
    >
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center h-64">
        <div class="text-center">
          <svg
            class="animate-spin mx-auto h-8 w-8 text-blue-600 mb-4"
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
          <p class="text-sm text-gray-600">{{ loadingText }}</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex items-center justify-center h-64">
        <div class="text-center max-w-md mx-auto p-6">
          <svg
            class="mx-auto h-12 w-12 text-red-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Preview Error</h3>
          <p class="text-sm text-gray-600 mb-4">{{ error }}</p>
          <button
            v-if="showRetryButton"
            @click="$emit('retry')"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!svgContent"
        class="flex items-center justify-center h-64"
      >
        <div class="text-center">
          <svg
            class="mx-auto h-12 w-12 text-gray-400 mb-4"
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
          <p class="text-sm text-gray-500">{{ emptyStateText }}</p>
        </div>
      </div>

      <!-- SVG Content -->
      <div
        v-else
        ref="svgContainer"
        :class="[
          'flex items-center justify-center p-4 transition-transform duration-200',
          isFullscreen ? 'h-full' : 'min-h-[300px]',
          enablePanning ? 'cursor-grab active:cursor-grabbing' : '',
        ]"
        :style="containerStyle"
        @mousedown="startPanning"
        @mousemove="handlePanning"
        @mouseup="stopPanning"
        @mouseleave="stopPanning"
        @wheel="handleWheel"
      >
        <div
          ref="svgWrapper"
          :class="[
            'relative transition-transform duration-200 inline-block',
            showBorder ? 'border border-gray-200 rounded' : '',
            backgroundColor === 'transparent' ? 'bg-transparent' : '',
            backgroundColor === 'white' ? 'bg-white' : '',
            backgroundColor === 'gray' ? 'bg-gray-100' : '',
            backgroundColor === 'dark' ? 'bg-gray-900' : '',
          ]"
          :style="svgWrapperStyle"
          v-html="sanitizedSvgContent"
        />
      </div>

      <!-- Overlay Info -->
      <div
        v-if="svgContent && showOverlayInfo"
        class="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded"
      >
        {{ svgDimensions }}
      </div>
    </div>

    <!-- Footer with actions -->
    <div
      v-if="svgContent && showFooter"
      class="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50"
    >
      <div class="text-sm text-gray-600">
        <span v-if="metadata">
          {{ metadata.width }}×{{ metadata.height }}px
        </span>
      </div>

      <div class="flex items-center space-x-2">
        <slot name="footer-actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import type { SVGMetadata } from "../types/api";

interface Props {
  svgContent?: string;
  metadata?: SVGMetadata;
  isLoading?: boolean;
  error?: string;
  title?: string;
  loadingText?: string;
  emptyStateText?: string;
  showZoomControls?: boolean;
  showFullscreenButton?: boolean;
  showOverlayInfo?: boolean;
  showFooter?: boolean;
  showRetryButton?: boolean;
  showBorder?: boolean;
  enablePanning?: boolean;
  enableWheelZoom?: boolean;
  backgroundColor?: "transparent" | "white" | "gray" | "dark";
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

interface Emits {
  (e: "retry"): void;
  (e: "fullscreenChange", isFullscreen: boolean): void;
  (e: "zoomChange", zoomLevel: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "SVG Preview",
  loadingText: "Generating SVG...",
  emptyStateText: "No SVG to preview",
  showZoomControls: true,
  showFullscreenButton: true,
  showOverlayInfo: false,
  showFooter: true,
  showRetryButton: true,
  showBorder: true,
  enablePanning: true,
  enableWheelZoom: true,
  backgroundColor: "white",
  minZoom: 0.1,
  maxZoom: 5,
  zoomStep: 0.1,
});

const emit = defineEmits<Emits>();

// Refs
const previewContainer = ref<HTMLElement>();
const svgContainer = ref<HTMLElement>();
const svgWrapper = ref<HTMLElement>();

// State
const zoomLevel = ref(1);
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const panStartX = ref(0);
const panStartY = ref(0);
const isFullscreen = ref(false);

// Computed properties
const sanitizedSvgContent = computed(() => {
  if (!props.svgContent) return "";

  // Basic SVG sanitization - in production, use a proper sanitization library
  let cleanSvg = props.svgContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "");

  // Ensure SVG has proper display properties to prevent clipping
  if (cleanSvg.includes("<svg")) {
    // Add CSS to prevent SVG from being constrained
    cleanSvg = cleanSvg.replace(
      /<svg([^>]*)>/,
      '<svg$1 style="display: block; max-width: none; max-height: none;">'
    );
  }

  return cleanSvg;
});

const svgDimensions = computed(() => {
  if (!props.metadata) return "";
  return `${props.metadata.width}×${props.metadata.height}`;
});

const containerStyle = computed(() => ({
  transform: `scale(${zoomLevel.value}) translate(${panX.value}px, ${panY.value}px)`,
}));

const svgWrapperStyle = computed(() => ({
  // Remove max constraints that could clip the SVG
  // Let the SVG use its natural viewBox dimensions
  width: "auto",
  height: "auto",
}));

// Methods
const zoomIn = () => {
  if (zoomLevel.value < props.maxZoom) {
    zoomLevel.value = Math.min(props.maxZoom, zoomLevel.value + props.zoomStep);
    emit("zoomChange", zoomLevel.value);
  }
};

const zoomOut = () => {
  if (zoomLevel.value > props.minZoom) {
    zoomLevel.value = Math.max(props.minZoom, zoomLevel.value - props.zoomStep);
    emit("zoomChange", zoomLevel.value);
  }
};

const resetZoom = () => {
  zoomLevel.value = 1;
  panX.value = 0;
  panY.value = 0;
  emit("zoomChange", zoomLevel.value);
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  emit("fullscreenChange", isFullscreen.value);

  if (isFullscreen.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

const startPanning = (event: MouseEvent) => {
  if (!props.enablePanning) return;

  isPanning.value = true;
  panStartX.value = event.clientX - panX.value;
  panStartY.value = event.clientY - panY.value;
  event.preventDefault();
};

const handlePanning = (event: MouseEvent) => {
  if (!isPanning.value || !props.enablePanning) return;

  panX.value = event.clientX - panStartX.value;
  panY.value = event.clientY - panStartY.value;
  event.preventDefault();
};

const stopPanning = () => {
  isPanning.value = false;
};

const handleWheel = (event: WheelEvent) => {
  if (!props.enableWheelZoom) return;

  event.preventDefault();

  const delta = event.deltaY > 0 ? -props.zoomStep : props.zoomStep;
  const newZoom = Math.max(
    props.minZoom,
    Math.min(props.maxZoom, zoomLevel.value + delta)
  );

  if (newZoom !== zoomLevel.value) {
    zoomLevel.value = newZoom;
    emit("zoomChange", zoomLevel.value);
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (isFullscreen.value && event.key === "Escape") {
    toggleFullscreen();
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
  if (isFullscreen.value) {
    document.body.style.overflow = "";
  }
});

// Watch for content changes to reset zoom/pan
watch(
  () => props.svgContent,
  () => {
    resetZoom();
  }
);
</script>
