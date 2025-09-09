<template>
  <div
    ref="containerRef"
    class="virtual-scroll-container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <div class="virtual-scroll-spacer" :style="{ height: totalHeight + 'px' }">
      <div
        class="virtual-scroll-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="getItemKey(item.data)"
          class="virtual-scroll-item"
          :style="{ height: itemHeight + 'px' }"
        >
          <slot :item="item.data" :index="item.index" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { throttle } from "../utils/debounce";

interface Props {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  getItemKey?: (item: any) => string | number;
}

const props = withDefaults(defineProps<Props>(), {
  overscan: 5,
  getItemKey: (_item: any) => Math.random(),
});

const containerRef = ref<HTMLElement>();
const scrollTop = ref(0);

// Calculate visible range
const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight);
  return Math.max(0, index - props.overscan);
});

const endIndex = computed(() => {
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight);
  const index = startIndex.value + visibleCount + props.overscan * 2;
  return Math.min(props.items.length - 1, index);
});

// Calculate total height
const totalHeight = computed(() => {
  return props.items.length * props.itemHeight;
});

// Calculate offset for visible items
const offsetY = computed(() => {
  return startIndex.value * props.itemHeight;
});

// Get visible items with their original indices
const visibleItems = computed(() => {
  const items = [];
  for (let i = startIndex.value; i <= endIndex.value; i++) {
    if (props.items[i] !== undefined) {
      items.push({
        data: props.items[i],
        index: i,
      });
    }
  }
  return items;
});

// Throttled scroll handler for better performance
const handleScroll = throttle((event: Event) => {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
}, 16); // ~60fps

// Scroll to specific item
const scrollToItem = (index: number, behavior: ScrollBehavior = "smooth") => {
  if (!containerRef.value) return;

  const targetScrollTop = index * props.itemHeight;
  containerRef.value.scrollTo({
    top: targetScrollTop,
    behavior,
  });
};

// Scroll to top
const scrollToTop = (behavior: ScrollBehavior = "smooth") => {
  scrollToItem(0, behavior);
};

// Scroll to bottom
const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
  scrollToItem(props.items.length - 1, behavior);
};

// Watch for items changes and reset scroll if needed
watch(
  () => props.items.length,
  (newLength, oldLength) => {
    if (newLength < oldLength && scrollTop.value > 0) {
      // If items were removed and we're scrolled down, adjust scroll position
      const maxScrollTop = Math.max(
        0,
        newLength * props.itemHeight - props.containerHeight
      );
      if (scrollTop.value > maxScrollTop) {
        scrollTop.value = maxScrollTop;
        if (containerRef.value) {
          containerRef.value.scrollTop = maxScrollTop;
        }
      }
    }
  }
);

// Expose methods for parent components
defineExpose({
  scrollToItem,
  scrollToTop,
  scrollToBottom,
  getScrollTop: () => scrollTop.value,
  getVisibleRange: () => ({ start: startIndex.value, end: endIndex.value }),
});

onMounted(() => {
  // Initialize scroll position
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop;
  }
});
</script>

<style scoped>
.virtual-scroll-container {
  overflow-y: auto;
  position: relative;
}

.virtual-scroll-spacer {
  position: relative;
}

.virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.virtual-scroll-item {
  display: flex;
  align-items: center;
}

/* Smooth scrolling for webkit browsers */
.virtual-scroll-container {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Custom scrollbar styling */
.virtual-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
