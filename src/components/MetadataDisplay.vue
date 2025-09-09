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
      <!-- Basic Properties -->
      <div v-if="metadata" class="space-y-3">
        <h4 class="text-sm font-medium text-gray-900">Properties</h4>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Width:</span>
              <span class="font-mono text-gray-900"
                >{{ metadata.width }}px</span
              >
            </div>

            <div class="flex justify-between">
              <span class="text-gray-600">Height:</span>
              <span class="font-mono text-gray-900"
                >{{ metadata.height }}px</span
              >
            </div>

            <div class="flex justify-between">
              <span class="text-gray-600">Aspect Ratio:</span>
              <span class="font-mono text-gray-900">{{ aspectRatio }}</span>
            </div>

            <div v-if="metadata.seed" class="flex justify-between">
              <span class="text-gray-600">Seed:</span>
              <span class="font-mono text-gray-900">{{ metadata.seed }}</span>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">ViewBox:</span>
              <span class="font-mono text-gray-900 text-xs">{{
                metadata.viewBox
              }}</span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-600">Background:</span>
              <div class="flex items-center space-x-2">
                <div
                  class="w-4 h-4 rounded border border-gray-300"
                  :style="{ backgroundColor: metadata.backgroundColor }"
                />
                <span class="font-mono text-gray-900 text-xs">{{
                  metadata.backgroundColor
                }}</span>
              </div>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-600">Colors:</span>
              <span class="text-gray-900">{{ metadata.palette.length }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Color Palette -->
      <div
        v-if="metadata?.palette && metadata.palette.length > 0"
        class="space-y-3"
      >
        <h4 class="text-sm font-medium text-gray-900">Color Palette</h4>

        <div class="flex flex-wrap gap-2">
          <div
            v-for="(color, index) in metadata.palette"
            :key="index"
            class="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2"
          >
            <div
              class="w-5 h-5 rounded border border-gray-300"
              :style="{ backgroundColor: color }"
            />
            <span class="font-mono text-xs text-gray-700">{{ color }}</span>
            <button
              @click="copyColor(color)"
              class="text-gray-400 hover:text-gray-600 transition-colors"
              :title="`Copy ${color}`"
            >
              <svg
                class="w-3 h-3"
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
            </button>
          </div>
        </div>
      </div>

      <!-- Layer Information -->
      <div v-if="layers && layers.length > 0" class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-900">
            Layers ({{ layers.length }})
          </h4>

          <button
            @click="showAllLayers = !showAllLayers"
            class="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            {{ showAllLayers ? "Show Less" : "Show All" }}
          </button>
        </div>

        <div class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="layer in displayedLayers"
            :key="layer.id"
            class="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
          >
            <!-- Layer Type Icon -->
            <div class="flex-shrink-0">
              <svg
                v-if="layer.type === 'shape'"
                class="w-4 h-4 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clip-rule="evenodd"
                />
              </svg>

              <svg
                v-else-if="layer.type === 'text'"
                class="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M4 4a1 1 0 011-1h10a1 1 0 110 2H9v10a1 1 0 11-2 0V5H5a1 1 0 01-1-1z"
                  clip-rule="evenodd"
                />
              </svg>

              <svg
                v-else-if="layer.type === 'group'"
                class="w-4 h-4 text-purple-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"
                />
              </svg>

              <svg
                v-else
                class="w-4 h-4 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>

            <!-- Layer Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ layer.label }}
                </p>
                <span class="text-xs text-gray-500 capitalize">{{
                  layer.type
                }}</span>
              </div>
              <p class="text-xs text-gray-500 font-mono">{{ layer.id }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div v-if="showStatistics && statistics" class="space-y-3">
        <h4 class="text-sm font-medium text-gray-900">Statistics</h4>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Elements:</span>
              <span class="text-gray-900">{{ statistics.elementCount }}</span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-600">Has Groups:</span>
              <span class="text-gray-900">{{
                statistics.hasGroups ? "Yes" : "No"
              }}</span>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-600">Has Text:</span>
              <span class="text-gray-900">{{
                statistics.hasText ? "Yes" : "No"
              }}</span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-600">Complexity:</span>
              <span
                :class="[
                  'capitalize px-2 py-0.5 rounded text-xs font-medium',
                  statistics.complexity === 'simple'
                    ? 'bg-green-100 text-green-800'
                    : statistics.complexity === 'moderate'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800',
                ]"
              >
                {{ statistics.complexity }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div v-if="metadata?.description" class="space-y-3">
        <h4 class="text-sm font-medium text-gray-900">Description</h4>
        <p class="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          {{ metadata.description }}
        </p>
      </div>

      <!-- Custom Content Slot -->
      <div v-if="$slots.default">
        <slot />
      </div>
    </div>

    <!-- Copy Notification -->
    <div
      v-if="showCopyNotification"
      class="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300"
    >
      Color copied to clipboard!
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { SVGMetadata, LayerInfo } from "../types/api";
import { copyToClipboard } from "../utils/clipboard";

interface Statistics {
  elementCount: number;
  hasGroups: boolean;
  hasText: boolean;
  colorCount: number;
  complexity: "simple" | "moderate" | "complex";
}

interface Props {
  metadata?: SVGMetadata;
  layers?: LayerInfo[];
  statistics?: Statistics;
  title?: string;
  collapsible?: boolean;
  showStatistics?: boolean;
  maxLayersShown?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: "SVG Information",
  collapsible: true,
  showStatistics: true,
  maxLayersShown: 5,
});

// State
const isCollapsed = ref(false);
const showAllLayers = ref(false);
const showCopyNotification = ref(false);

// Computed properties
const aspectRatio = computed(() => {
  if (!props.metadata) return "1:1";

  const { width, height } = props.metadata;
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

const displayedLayers = computed(() => {
  if (!props.layers) return [];

  if (showAllLayers.value || props.layers.length <= props.maxLayersShown) {
    return props.layers;
  }

  return props.layers.slice(0, props.maxLayersShown);
});

// Methods
const copyColor = async (color: string) => {
  try {
    await copyToClipboard(color);
    showCopyNotification.value = true;

    setTimeout(() => {
      showCopyNotification.value = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy color:", error);
  }
};
</script>
