<template>
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="text-sm font-medium text-gray-900 mb-3">Rate this generation</h3>

    <div class="space-y-3">
      <!-- Quick feedback buttons -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="action in quickActions"
          :key="action.signal"
          @click="submitFeedback(action.signal)"
          :disabled="isSubmitting || hasFeedback"
          :class="[
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            action.variant === 'positive'
              ? 'bg-green-100 text-green-800 hover:bg-green-200 disabled:bg-green-50 disabled:text-green-400'
              : action.variant === 'negative'
                ? 'bg-red-100 text-red-800 hover:bg-red-200 disabled:bg-red-50 disabled:text-red-400'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400',
            'disabled:cursor-not-allowed',
          ]"
        >
          <span class="mr-1">{{ action.icon }}</span>
          {{ action.label }}
        </button>
      </div>

      <!-- Detailed feedback form -->
      <div v-if="showDetailedForm" class="border-t pt-3">
        <div class="space-y-2">
          <label class="block text-xs font-medium text-gray-700">
            Additional feedback (optional)
          </label>
          <textarea
            v-model="feedbackNotes"
            rows="2"
            class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="What could be improved?"
            :maxlength="500"
            :disabled="isSubmitting || hasFeedback"
          />
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">
              {{ feedbackNotes.length }}/500 characters
            </span>
            <div class="space-x-2">
              <button
                @click="showDetailedForm = false"
                :disabled="isSubmitting"
                class="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:text-gray-400"
              >
                Cancel
              </button>
              <button
                @click="submitDetailedFeedback"
                :disabled="isSubmitting || !feedbackNotes.trim() || hasFeedback"
                class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Show detailed form button -->
      <button
        v-if="!showDetailedForm && !hasFeedback"
        @click="showDetailedForm = true"
        :disabled="isSubmitting"
        class="text-xs text-blue-600 hover:text-blue-800 disabled:text-blue-300"
      >
        Add detailed feedback
      </button>

      <!-- Feedback status -->
      <div v-if="hasFeedback" class="text-xs text-green-600 flex items-center">
        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
        Thank you for your feedback!
      </div>

      <div v-if="error" class="text-xs text-red-600">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useFeedback } from "../composables/useFeedback";

interface Props {
  eventId?: number;
  userId?: string;
}

const props = defineProps<Props>();

const {
  submitFeedback: submitFeedbackAPI,
  isSubmitting,
  error,
} = useFeedback();

const showDetailedForm = ref(false);
const feedbackNotes = ref("");
const submittedFeedback = ref<string | null>(null);

const hasFeedback = computed(() => submittedFeedback.value !== null);

const quickActions = [
  {
    signal: "favorited" as const,
    label: "Love it",
    icon: "❤️",
    variant: "positive" as const,
  },
  {
    signal: "kept" as const,
    label: "Good",
    icon: "👍",
    variant: "positive" as const,
  },
  {
    signal: "edited" as const,
    label: "Needs work",
    icon: "✏️",
    variant: "neutral" as const,
  },
  {
    signal: "regenerated" as const,
    label: "Try again",
    icon: "🔄",
    variant: "negative" as const,
  },
  {
    signal: "reported" as const,
    label: "Report issue",
    icon: "⚠️",
    variant: "negative" as const,
  },
];

const submitFeedback = async (signal: string) => {
  if (!props.eventId || hasFeedback.value) return;

  try {
    await submitFeedbackAPI({
      eventId: props.eventId,
      signal: signal as any,
      userId: props.userId,
    });
    submittedFeedback.value = signal;
    showDetailedForm.value = false;
    feedbackNotes.value = "";
  } catch (err) {
    console.error("Failed to submit feedback:", err);
  }
};

const submitDetailedFeedback = async () => {
  if (!props.eventId || !feedbackNotes.value.trim() || hasFeedback.value)
    return;

  try {
    await submitFeedbackAPI({
      eventId: props.eventId,
      signal: "edited", // Default signal for detailed feedback
      userId: props.userId,
      notes: feedbackNotes.value.trim(),
    });
    submittedFeedback.value = "detailed";
    showDetailedForm.value = false;
    feedbackNotes.value = "";
  } catch (err) {
    console.error("Failed to submit detailed feedback:", err);
  }
};
</script>
