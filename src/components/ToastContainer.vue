<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
    <TransitionGroup name="toast" tag="div" class="space-y-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'rounded-lg shadow-lg p-4 border-l-4',
          toastClasses[toast.type],
        ]"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <component :is="toastIcons[toast.type]" class="h-5 w-5" />
          </div>
          <div class="ml-3 flex-1">
            <h4 class="text-sm font-medium">
              {{ toast.title }}
            </h4>
            <p v-if="toast.message" class="mt-1 text-sm opacity-90">
              {{ toast.message }}
            </p>
            <div
              v-if="toast.actions && toast.actions.length > 0"
              class="mt-3 flex space-x-2"
            >
              <button
                v-for="action in toast.actions"
                :key="action.label"
                @click="action.action"
                :class="[
                  'text-xs font-medium px-2 py-1 rounded',
                  action.style === 'primary'
                    ? 'bg-white bg-opacity-20 hover:bg-opacity-30'
                    : 'bg-black bg-opacity-10 hover:bg-opacity-20',
                ]"
              >
                {{ action.label }}
              </button>
            </div>
          </div>
          <div class="ml-4 flex-shrink-0">
            <button
              @click="removeToast(toast.id)"
              class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <span class="sr-only">Close</span>
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "../composables/useToast";

// Icons (using simple SVG components)
const CheckCircleIcon = {
  template: `
    <svg class="text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
    </svg>
  `,
};

const ExclamationCircleIcon = {
  template: `
    <svg class="text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  `,
};

const ExclamationTriangleIcon = {
  template: `
    <svg class="text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  `,
};

const InformationCircleIcon = {
  template: `
    <svg class="text-blue-500" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
    </svg>
  `,
};

const XMarkIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  `,
};

const { toasts, removeToast } = useToast();

const toastClasses = {
  success: "bg-green-50 border-green-400 text-green-800",
  error: "bg-red-50 border-red-400 text-red-800",
  warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
  info: "bg-blue-50 border-blue-400 text-blue-800",
};

const toastIcons = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
