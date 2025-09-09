<template>
  <div ref="containerRef" class="lazy-component">
    <div v-if="!isVisible && !isLoaded" class="lazy-placeholder">
      <slot name="placeholder">
        <div
          class="animate-pulse bg-gray-200 rounded h-32 flex items-center justify-center"
        >
          <span class="text-gray-500 text-sm">Loading...</span>
        </div>
      </slot>
    </div>

    <div v-else-if="isLoaded" class="lazy-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface Props {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rootMargin: "50px",
  threshold: 0.1,
  once: true,
});

const containerRef = ref<HTMLElement>();
const isVisible = ref(false);
const isLoaded = ref(false);

let observer: IntersectionObserver | null = null;

const handleIntersection = (entries: IntersectionObserverEntry[]) => {
  const entry = entries[0];

  if (entry.isIntersecting) {
    isVisible.value = true;

    // Add a small delay to ensure smooth loading
    setTimeout(() => {
      isLoaded.value = true;
    }, 100);

    if (props.once && observer) {
      observer.disconnect();
    }
  } else if (!props.once) {
    isVisible.value = false;
    isLoaded.value = false;
  }
};

onMounted(() => {
  if (!containerRef.value) return;

  observer = new IntersectionObserver(handleIntersection, {
    rootMargin: props.rootMargin,
    threshold: props.threshold,
  });

  observer.observe(containerRef.value);
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.lazy-component {
  min-height: 1px; /* Ensure the component has some height for intersection observer */
}

.lazy-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lazy-placeholder {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
