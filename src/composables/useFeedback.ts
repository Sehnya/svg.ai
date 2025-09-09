import { ref } from "vue";

export type FeedbackSignal =
  | "kept"
  | "edited"
  | "regenerated"
  | "exported"
  | "favorited"
  | "reported";

export interface FeedbackRequest {
  eventId: number;
  signal: FeedbackSignal;
  userId?: string;
  notes?: string;
}

export interface ImplicitFeedbackRequest {
  eventId: number;
  signal: "exported" | "regenerated";
  userId?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function useFeedback() {
  const isSubmitting = ref(false);
  const error = ref<string | null>(null);

  const submitFeedback = async (request: FeedbackRequest): Promise<void> => {
    isSubmitting.value = true;
    error.value = null;

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data: FeedbackResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit feedback");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit feedback";
      error.value = errorMessage;
      throw err;
    } finally {
      isSubmitting.value = false;
    }
  };

  const submitImplicitFeedback = async (
    request: ImplicitFeedbackRequest
  ): Promise<void> => {
    try {
      const response = await fetch("/api/feedback/implicit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data: FeedbackResponse = await response.json();

      if (!response.ok || !data.success) {
        console.warn("Failed to submit implicit feedback:", data.error);
      }
    } catch (err) {
      console.warn("Failed to submit implicit feedback:", err);
      // Don't throw for implicit feedback - it should be silent
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    isSubmitting,
    error,
    submitFeedback,
    submitImplicitFeedback,
    clearError,
  };
}
