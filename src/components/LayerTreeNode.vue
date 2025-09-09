<template>
  <div class="layer-tree-node">
    <div
      :class="[
        'flex items-center space-x-2 p-2 rounded-lg transition-colors cursor-pointer',
        selectedLayer === layer.id
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50',
      ]"
      :style="{ paddingLeft: `${depth * 20 + 8}px` }"
      @click="selectLayer(layer.id)"
    >
      <!-- Expand/Collapse Button -->
      <button
        v-if="hasChildren"
        @click.stop="toggleExpand(layer.id)"
        class="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg
          :class="[
            'w-4 h-4 transition-transform',
            isExpanded ? 'rotate-90' : '',
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
      </button>

      <!-- Spacer for non-expandable items -->
      <div v-else class="w-5 flex-shrink-0"></div>

      <!-- Layer Icon -->
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
        <p v-if="showDetails" class="text-xs text-gray-500 font-mono truncate">
          {{ layer.id }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex-shrink-0 flex items-center space-x-1">
        <button
          @click.stop="copyId(layer.id)"
          class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Copy ID"
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

    <!-- Children -->
    <div v-if="hasChildren && isExpanded" class="mt-1">
      <LayerTreeNode
        v-for="child in children"
        :key="child.id"
        :layer="child"
        :all-layers="allLayers"
        :expanded-layers="expandedLayers"
        :selected-layer="selectedLayer"
        :show-details="showDetails"
        :depth="depth + 1"
        @toggle-expand="$emit('toggleExpand', $event)"
        @select-layer="$emit('selectLayer', $event)"
        @copy-id="$emit('copyId', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LayerInfo } from "../types/api";
import LayerIcon from "./LayerIcon.vue";

interface Props {
  layer: LayerInfo;
  allLayers: LayerInfo[];
  expandedLayers: Set<string>;
  selectedLayer: string | null;
  showDetails?: boolean;
  depth?: number;
}

interface Emits {
  (e: "toggleExpand", layerId: string): void;
  (e: "selectLayer", layerId: string): void;
  (e: "copyId", layerId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  depth: 0,
});

const emit = defineEmits<Emits>();

// Computed properties
const children = computed(() => {
  // In a real implementation, you would parse the SVG structure to determine parent-child relationships
  // For now, we'll assume groups might have children based on naming conventions or other heuristics
  if (props.layer.type !== "group") return [];

  // This is a simplified example - in practice you'd need to parse the actual SVG structure
  return props.allLayers.filter(
    (l) =>
      l.id !== props.layer.id &&
      l.id.startsWith(props.layer.id.replace("-group", "")) &&
      l.id !== props.layer.id
  );
});

const hasChildren = computed(() => children.value.length > 0);

const isExpanded = computed(() => props.expandedLayers.has(props.layer.id));

// Methods
const toggleExpand = (layerId: string) => {
  emit("toggleExpand", layerId);
};

const selectLayer = (layerId: string) => {
  emit("selectLayer", layerId);
};

const copyId = (layerId: string) => {
  emit("copyId", layerId);
};
</script>
