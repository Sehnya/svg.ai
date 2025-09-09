<template>
  <div
    ref="containerRef"
    :style="{ height: `${containerHeight}px` }"
    class="overflow-auto"
    @scroll="handleScroll"
  >
    <!-- Spacer for items before visible range -->
    <div :style="{ height: `${offsetY}px` }" />

    <!-- Visible items -->
    <div
      v-for="item in visibleItems"
      :key="getItemKey(item.data)"
      :style="{ height: `${itemHeight}px` }"
      class="flex-shrink-0"
    >
      <slot :item="item.data" :index="item.index" />
    </div>

    <!-- Spacer for items after visible range -->
    <div :style="{ height: `${totalHeight - offsetY - visibleHeight}px` }" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

interface Props {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  keyField?: string;
}

interface Emits {
  (e: "scroll", scrollTop: number): void;
  (e: "visibleRangeChange", startIndex: number, endIndex: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  overscan: 5,
  keyField: "id",
});

const emit = defineEmits<Emits>();

// Refs
const containerRef = ref<HTMLElement>();
const scrollTop = ref(0);

// Computed properties
const totalHeight = computed(() => props.items.length * props.itemHeight);

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight);
  return Math.max(0, index - props.overscan);
});

const endIndex = computed(() => {
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight);
  const index = startIndex.value + visibleCount + props.overscan * 2;
  return Math.min(props.items.length - 1, index);
});

const visibleItems = computed(() => {
  const items = [];
  for (let i = startIndex.value; i <= endIndex.value; i++) {
    if (props.items[i]) {
      items.push({
        index: i,
        data: props.items[i],
      });
    }
  }
  return items;
});

const offsetY = computed(() => startIndex.value * props.itemHeight);

const visibleHeight = computed(() => {
  return (endIndex.value - startIndex.value + 1) * props.itemHeight;
});

// Methods
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
  emit("scroll", scrollTop.value);
};

const getItemKey = (item: any): string | number => {
  if (typeof item === "object" && item !== null) {
    return item[props.keyField] || item.id || JSON.stringify(item);
  }
  return item;
};

const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
  if (!containerRef.value) return;

  const targetScrollTop = index * props.itemHeight;
  containerRef.value.scrollTo({
    top: targetScrollTop,
    behavior,
  });
};

const scrollToTop = (behavior: ScrollBehavior = "smooth") => {
  scrollToIndex(0, behavior);
};

const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
  scrollToIndex(props.items.length - 1, behavior);
};

// Watch for visible range changes
watch(
  [startIndex, endIndex],
  ([newStart, newEnd]) => {
    emit("visibleRangeChange", newStart, newEnd);
  },
  { immediate: true }
);

// Expose methods for parent component
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
});

// Lifecycle
onMounted(() => {
  // Initial scroll position handling
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop;
  }
});

onUnmounted(() => {
  // Cleanup if needed
});
</script>
