import { useToast } from "./useToast";
import { APIError, NetworkError, TimeoutError } from "../services/api";

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export function useErrorHandler() {
  const toast = useToast();

  const logError = (error: Error, context?: ErrorContext) => {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      context,
    };

    // In production, send to error monitoring service
    console.error("Error logged:", errorLog);

    // Could integrate with services like Sentry, LogRocket, etc.
    // Sentry.captureException(error, { contexts: { custom: context } });
  };

  const handleAPIError = (error: Error, context?: ErrorContext) => {
    logError(error, context);

    if (error instanceof NetworkError) {
      toast.error(
        "Connection Failed",
        "Unable to connect to the server. Please check your internet connection.",
        {
          actions: [
            {
              label: "Retry",
              action: () => {
                // Retry logic would be handled by the calling component
                console.log("Retry requested");
              },
              style: "primary",
            },
          ],
        }
      );
    } else if (error instanceof TimeoutError) {
      toast.error(
        "Request Timeout",
        "The request took too long to complete. The server may be busy.",
        {
          actions: [
            {
              label: "Try Again",
              action: () => {
                console.log("Retry requested");
              },
              style: "primary",
            },
          ],
        }
      );
    } else if (error instanceof APIError) {
      const statusCode = error.statusCode;

      if (statusCode === 400) {
        toast.error(
          "Invalid Request",
          "Please check your input and try again."
        );
      } else if (statusCode === 401) {
        toast.error("Authentication Required", "Please log in to continue.");
      } else if (statusCode === 403) {
        toast.error(
          "Access Denied",
          "You don't have permission to perform this action."
        );
      } else if (statusCode === 404) {
        toast.error("Not Found", "The requested resource could not be found.");
      } else if (statusCode === 429) {
        toast.warning(
          "Rate Limited",
          "Too many requests. Please wait a moment before trying again."
        );
      } else if (statusCode && statusCode >= 500) {
        toast.error(
          "Server Error",
          "Something went wrong on our end. Please try again later.",
          {
            actions: [
              {
                label: "Report Issue",
                action: () => {
                  // Open support/feedback form
                  console.log("Report issue requested");
                },
                style: "secondary",
              },
            ],
          }
        );
      } else {
        toast.error(
          "Request Failed",
          error.message || "An unexpected error occurred."
        );
      }
    } else {
      toast.error(
        "Unexpected Error",
        "Something unexpected happened. Please try again."
      );
    }
  };

  const handleValidationErrors = (
    errors: ValidationError[],
    context?: ErrorContext
  ) => {
    logError(
      new Error(
        `Validation failed: ${errors.map((e) => e.message).join(", ")}`
      ),
      context
    );

    if (errors.length === 1) {
      toast.warning("Validation Error", errors[0].message);
    } else {
      toast.warning(
        "Multiple Validation Errors",
        `Please fix ${errors.length} validation errors and try again.`,
        {
          actions: [
            {
              label: "Show Details",
              action: () => {
                // Show detailed validation errors
                console.log("Show validation details:", errors);
              },
              style: "secondary",
            },
          ],
        }
      );
    }
  };

  const handleGenerationError = (error: Error, context?: ErrorContext) => {
    logError(error, { ...context, action: "svg_generation" });

    if (error instanceof APIError && error.response?.errors) {
      // Handle structured generation errors
      const generationErrors = error.response.errors;
      toast.error("Generation Failed", generationErrors.join(". "), {
        actions: [
          {
            label: "Try Different Prompt",
            action: () => {
              console.log("Suggest prompt changes");
            },
            style: "primary",
          },
        ],
      });
    } else {
      handleAPIError(error, context);
    }
  };

  const handleCopyError = (error: Error, context?: ErrorContext) => {
    logError(error, { ...context, action: "copy_to_clipboard" });

    toast.error(
      "Copy Failed",
      "Unable to copy to clipboard. You can manually select and copy the code.",
      {
        actions: [
          {
            label: "Select Text",
            action: () => {
              // Focus and select the text area
              console.log("Select text requested");
            },
            style: "primary",
          },
        ],
      }
    );
  };

  const handleUnexpectedError = (error: Error, context?: ErrorContext) => {
    logError(error, { ...context, action: "unexpected_error" });

    toast.error(
      "Unexpected Error",
      "Something went wrong. The error has been logged and we'll investigate.",
      {
        actions: [
          {
            label: "Reload Page",
            action: () => {
              window.location.reload();
            },
            style: "secondary",
          },
        ],
      }
    );
  };

  const showSuccess = (title: string, message?: string) => {
    toast.success(title, message);
  };

  const showWarning = (title: string, message?: string) => {
    toast.warning(title, message);
  };

  const showInfo = (title: string, message?: string) => {
    toast.info(title, message);
  };

  return {
    logError,
    handleAPIError,
    handleValidationErrors,
    handleGenerationError,
    handleCopyError,
    handleUnexpectedError,
    showSuccess,
    showWarning,
    showInfo,
  };
}
