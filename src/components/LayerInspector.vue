<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>

      <div class="flex items-center space-x-2">
        <!-- View Toggle -->
        <div class="flex bg-gray-100 rounded-md p-1">
          <button
            @click="viewMode = 'tree'"
            :class="[
              'px-3 py-1 text-sm font-medium rounded transition-colors',
              viewMode === 'tree'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900',
            ]"
          >
            Tree
          </button>
          <button
            @click="viewMode = 'list'"
            :class="[
              'px-3 py-1 text-sm font-medium rounded transition-colors',
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900',
            ]"
          >
            List
          </button>
        </div>

        <!-- Expand/Collapse All -->
        <button
          v-if="viewMode === 'tree' && hasNestedLayers"
          @click="toggleAllExpanded"
          class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          {{ allExpanded ? "Collapse All" : "Expand All" }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Empty State -->
      <div v-if="!layers || layers.length === 0" class="text-center py-8">
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <p class="text-sm text-gray-500">{{ emptyStateText }}</p>
      </div>

      <!-- Tree View -->
      <div v-else-if="viewMode === 'tree'" class="space-y-1">
        <LayerTreeNode
          v-for="layer in rootLayers"
          :key="layer.id"
          :layer="layer"
          :all-layers="layers"
          :expanded-layers="expandedLayers"
          :selected-layer="selectedLayer"
          :show-details="showDetails"
          @toggle-expand="toggleExpand"
          @select-layer="selectLayer"
          @copy-id="copyLayerId"
        />
      </div>

      <!-- List View -->
      <div v-else class="space-y-2">
        <div
          v-for="layer in layers"
          :key="layer.id"
          :class="[
            'flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer',
            selectedLayer === layer.id
              ? 'border-blue-200 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
          ]"
          @click="selectLayer(layer.id)"
        >
          <!-- Layer Type Icon -->
          <div class="flex-shrink-0">
            <LayerIcon :type="layer.type" />
          </div>

          <!-- Layer Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ layer.label }}
              </p>
              <span class="text-xs text-gray-500 capitalize ml-2">{{
                layer.type
              }}</span>
            </div>
            <p
              v-if="showDetails"
              class="text-xs text-gray-500 font-mono truncate"
            >
              {{ layer.id }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex-shrink-0 flex items-center space-x-1">
            <button
              @click.stop="copyLayerId(layer.id)"
              class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Copy ID"
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer with Layer Count -->
    <div
      v-if="layers && layers.length > 0"
      class="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600"
    >
      <div>
        {{ layers.length }} layer{{ layers.length !== 1 ? "s" : "" }} total
      </div>

      <div class="flex items-center space-x-4">
        <span v-if="layerStats.shapes > 0">{{ layerStats.shapes }} shapes</span>
        <span v-if="layerStats.groups > 0">{{ layerStats.groups }} groups</span>
        <span v-if="layerStats.text > 0">{{ layerStats.text }} text</span>
        <span v-if="layerStats.paths > 0">{{ layerStats.paths }} paths</span>
      </div>
    </div>

    <!-- Copy Notification -->
    <div
      v-if="showCopyNotification"
      class="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300"
    >
      Layer ID copied to clipboard!
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { LayerInfo } from "../types/api";
import { copyToClipboard } from "../utils/clipboard";
import LayerTreeNode from "./LayerTreeNode.vue";
import LayerIcon from "./LayerIcon.vue";

interface Props {
  layers?: LayerInfo[];
  title?: string;
  emptyStateText?: string;
  showDetails?: boolean;
  defaultExpanded?: boolean;
}

interface Emits {
  (e: "selectLayer", layerId: string): void;
  (e: "copyId", layerId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Layer Inspector",
  emptyStateText: "No layers to inspect",
  showDetails: true,
  defaultExpanded: false,
});

const emit = defineEmits<Emits>();

// State
const viewMode = ref<"tree" | "list">("tree");
const expandedLayers = ref<Set<string>>(new Set());
const selectedLayer = ref<string | null>(null);
const allExpanded = ref(props.defaultExpanded);
const showCopyNotification = ref(false);

// Computed properties
const rootLayers = computed(() => {
  if (!props.layers) return [];

  // For now, treat all layers as root layers
  // In a more complex implementation, you might parse parent-child relationships
  return props.layers;
});

const hasNestedLayers = computed(() => {
  // Check if any layers have children (for tree view)
  return props.layers?.some((layer) => layer.type === "group") || false;
});

const layerStats = computed(() => {
  if (!props.layers) return { shapes: 0, groups: 0, text: 0, paths: 0 };

  return props.layers.reduce(
    (stats, layer) => {
      switch (layer.type) {
        case "shape":
          stats.shapes++;
          break;
        case "group":
          stats.groups++;
          break;
        case "text":
          stats.text++;
          break;
        case "path":
          stats.paths++;
          break;
      }
      return stats;
    },
    { shapes: 0, groups: 0, text: 0, paths: 0 }
  );
});

// Methods
const toggleExpand = (layerId: string) => {
  if (expandedLayers.value.has(layerId)) {
    expandedLayers.value.delete(layerId);
  } else {
    expandedLayers.value.add(layerId);
  }
};

const toggleAllExpanded = () => {
  if (allExpanded.value) {
    expandedLayers.value.clear();
  } else {
    props.layers?.forEach((layer) => {
      if (layer.type === "group") {
        expandedLayers.value.add(layer.id);
      }
    });
  }
  allExpanded.value = !allExpanded.value;
};

const selectLayer = (layerId: string) => {
  selectedLayer.value = layerId;
  emit("selectLayer", layerId);
};

const copyLayerId = async (layerId: string) => {
  try {
    await copyToClipboard(layerId);
    showCopyNotification.value = true;
    emit("copyId", layerId);

    setTimeout(() => {
      showCopyNotification.value = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy layer ID:", error);
  }
};
</script>
