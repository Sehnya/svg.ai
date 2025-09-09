<template>
  <div
    :class="[
      'flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer group',
      selected
        ? 'border-blue-200 bg-blue-50 shadow-sm'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm',
    ]"
    @click="$emit('select', layer.id)"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Layer Type Icon -->
    <div class="flex-shrink-0">
      <LayerIcon :type="layer.type" :class="iconClasses" />
    </div>

    <!-- Layer Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-gray-900 truncate">
          {{ layer.label }}
        </p>
        <div class="flex items-center space-x-2">
          <span class="text-xs text-gray-500 capitalize">{{ layer.type }}</span>
          <span
            v-if="showIndex"
            class="text-xs text-gray-400 font-mono bg-gray-100 px-1 rounded"
          >
            #{{ index }}
          </span>
        </div>
      </div>

      <div v-if="showDetails" class="flex items-center justify-between mt-1">
        <p class="text-xs text-gray-500 font-mono truncate">
          {{ layer.id }}
        </p>
        <div
          v-if="layer.metadata"
          class="flex items-center space-x-2 text-xs text-gray-400"
        >
          <span v-if="layer.metadata.width && layer.metadata.height">
            {{ layer.metadata.width }}×{{ layer.metadata.height }}
          </span>
          <span v-if="layer.metadata.fill" class="flex items-center space-x-1">
            <div
              class="w-2 h-2 rounded-full border border-gray-300"
              :style="{ backgroundColor: layer.metadata.fill }"
            />
            <span>{{ layer.metadata.fill }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div
      class="flex-shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <!-- Visibility Toggle -->
      <button
        @click.stop="$emit('toggleVisibility', layer.id)"
        :class="[
          'p-1 rounded transition-colors',
          layer.visible !== false
            ? 'text-gray-600 hover:text-gray-800'
            : 'text-gray-400 hover:text-gray-600',
        ]"
        :title="layer.visible !== false ? 'Hide layer' : 'Show layer'"
      >
        <svg
          v-if="layer.visible !== false"
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
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
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
          />
        </svg>
      </button>

      <!-- Highlight Button -->
      <button
        @click.stop="$emit('highlight', layer.id)"
        class="p-1 text-gray-400 hover:text-yellow-600 transition-colors rounded"
        title="Highlight in preview"
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
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </button>

      <!-- Copy ID Button -->
      <button
        @click.stop="$emit('copyId', layer.id)"
        class="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
        title="Copy layer ID"
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

      <!-- More Actions Menu -->
      <div class="relative">
        <button
          @click.stop="showMenu = !showMenu"
          class="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
          title="More actions"
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
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showMenu"
          class="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10"
          @click.stop
        >
          <div class="py-1">
            <button
              @click="duplicateLayer"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg
                class="w-4 h-4 inline mr-2"
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
              Duplicate Layer
            </button>

            <button
              @click="exportLayer"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg
                class="w-4 h-4 inline mr-2"
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
              Export Layer
            </button>

            <div class="border-t border-gray-100 my-1"></div>

            <button
              @click="deleteLayer"
              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg
                class="w-4 h-4 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Layer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import type { LayerInfo } from "../types/api";
import LayerIcon from "./LayerIcon.vue";

interface ExtendedLayerInfo extends LayerInfo {
  visible?: boolean;
  metadata?: {
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
  };
}

interface Props {
  layer: ExtendedLayerInfo;
  index: number;
  selected?: boolean;
  showDetails?: boolean;
  showIndex?: boolean;
}

interface Emits {
  (e: "select", layerId: string): void;
  (e: "copyId", layerId: string): void;
  (e: "toggleVisibility", layerId: string): void;
  (e: "highlight", layerId: string): void;
  (e: "duplicate", layerId: string): void;
  (e: "export", layerId: string): void;
  (e: "delete", layerId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  showDetails: true,
  showIndex: false,
});

const emit = defineEmits<Emits>();

// State
const showMenu = ref(false);
const isHovered = ref(false);

// Computed properties
const iconClasses = computed(() => [
  "transition-colors duration-200",
  props.selected ? "text-blue-600" : "text-gray-500",
  isHovered.value ? "text-gray-700" : "",
]);

// Methods
const handleMouseEnter = () => {
  isHovered.value = true;
};

const handleMouseLeave = () => {
  isHovered.value = false;
  showMenu.value = false;
};

const duplicateLayer = () => {
  emit("duplicate", props.layer.id);
  showMenu.value = false;
};

const exportLayer = () => {
  emit("export", props.layer.id);
  showMenu.value = false;
};

const deleteLayer = () => {
  if (
    confirm(`Are you sure you want to delete layer "${props.layer.label}"?`)
  ) {
    emit("delete", props.layer.id);
  }
  showMenu.value = false;
};

// Close menu when clicking outside
const handleClickOutside = (event: Event) => {
  if (
    showMenu.value &&
    event.target instanceof Element &&
    !event.target.closest(".relative")
  ) {
    showMenu.value = false;
  }
};

// Add global click listener when menu is open
watch(showMenu, (isOpen) => {
  if (isOpen) {
    document.addEventListener("click", handleClickOutside);
  } else {
    document.removeEventListener("click", handleClickOutside);
  }
});

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
