<template>
  <div :class="iconClasses">
    <!-- Shape Icon -->
    <svg
      v-if="type === 'shape'"
      class="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fill-rule="evenodd"
        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
        clip-rule="evenodd"
      />
    </svg>

    <!-- Text Icon -->
    <svg
      v-else-if="type === 'text'"
      class="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fill-rule="evenodd"
        d="M4 4a1 1 0 011-1h10a1 1 0 110 2H9v10a1 1 0 11-2 0V5H5a1 1 0 01-1-1z"
        clip-rule="evenodd"
      />
    </svg>

    <!-- Group Icon -->
    <svg
      v-else-if="type === 'group'"
      class="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"
      />
    </svg>

    <!-- Path Icon -->
    <svg
      v-else-if="type === 'path'"
      class="w-4 h-4"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fill-rule="evenodd"
        d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
        clip-rule="evenodd"
      />
    </svg>

    <!-- Default/Unknown Icon -->
    <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fill-rule="evenodd"
        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
        clip-rule="evenodd"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LayerInfo } from "../types/api";

interface Props {
  type: LayerInfo["type"];
  size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
});

const iconClasses = computed(() => {
  const baseClasses = "flex-shrink-0 rounded";

  const sizeClasses = {
    sm: "w-6 h-6 p-1",
    md: "w-8 h-8 p-1.5",
    lg: "w-10 h-10 p-2",
  };

  const colorClasses = {
    shape: "text-blue-500 bg-blue-50",
    text: "text-green-500 bg-green-50",
    group: "text-purple-500 bg-purple-50",
    path: "text-orange-500 bg-orange-50",
  };

  return [
    baseClasses,
    sizeClasses[props.size],
    colorClasses[props.type] || "text-gray-500 bg-gray-50",
  ].join(" ");
});
</script>
