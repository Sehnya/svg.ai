<template>
  <div v-if="errors.length > 0" class="space-y-2">
    <div
      v-for="error in errors"
      :key="error.field"
      class="bg-red-50 border border-red-200 rounded-md p-3"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <ExclamationCircleIcon class="h-4 w-4 text-red-400" />
        </div>
        <div class="ml-2">
          <h4 class="text-sm font-medium text-red-800">
            {{ getFieldLabel(error.field) }}
          </h4>
          <p class="text-sm text-red-700">
            {{ error.message }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ValidationError } from "../composables/useErrorHandler";

interface Props {
  errors: ValidationError[];
  fieldLabels?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  fieldLabels: () => ({}),
});

const ExclamationCircleIcon = {
  template: `
    <svg fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  `,
};

const getFieldLabel = (field: string): string => {
  return (
    props.fieldLabels[field] || field.charAt(0).toUpperCase() + field.slice(1)
  );
};
</script>
