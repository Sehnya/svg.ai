"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useErrorHandler = useErrorHandler;
var useToast_1 = require("./useToast");
var api_1 = require("../services/api");
function useErrorHandler() {
    var toast = (0, useToast_1.useToast)();
    var logError = function (error, context) {
        var errorLog = {
            message: error.message,
            stack: error.stack,
            name: error.name,
            timestamp: new Date().toISOString(),
            context: context,
        };
        // In production, send to error monitoring service
        console.error("Error logged:", errorLog);
        // Could integrate with services like Sentry, LogRocket, etc.
        // Sentry.captureException(error, { contexts: { custom: context } });
    };
    var handleAPIError = function (error, context) {
        logError(error, context);
        if (error instanceof api_1.NetworkError) {
            toast.error("Connection Failed", "Unable to connect to the server. Please check your internet connection.", {
                actions: [
                    {
                        label: "Retry",
                        action: function () {
                            // Retry logic would be handled by the calling component
                            console.log("Retry requested");
                        },
                        style: "primary",
                    },
                ],
            });
        }
        else if (error instanceof api_1.TimeoutError) {
            toast.error("Request Timeout", "The request took too long to complete. The server may be busy.", {
                actions: [
                    {
                        label: "Try Again",
                        action: function () {
                            console.log("Retry requested");
                        },
                        style: "primary",
                    },
                ],
            });
        }
        else if (error instanceof api_1.APIError) {
            var statusCode = error.statusCode;
            if (statusCode === 400) {
                toast.error("Invalid Request", "Please check your input and try again.");
            }
            else if (statusCode === 401) {
                toast.error("Authentication Required", "Please log in to continue.");
            }
            else if (statusCode === 403) {
                toast.error("Access Denied", "You don't have permission to perform this action.");
            }
            else if (statusCode === 404) {
                toast.error("Not Found", "The requested resource could not be found.");
            }
            else if (statusCode === 429) {
                toast.warning("Rate Limited", "Too many requests. Please wait a moment before trying again.");
            }
            else if (statusCode && statusCode >= 500) {
                toast.error("Server Error", "Something went wrong on our end. Please try again later.", {
                    actions: [
                        {
                            label: "Report Issue",
                            action: function () {
                                // Open support/feedback form
                                console.log("Report issue requested");
                            },
                            style: "secondary",
                        },
                    ],
                });
            }
            else {
                toast.error("Request Failed", error.message || "An unexpected error occurred.");
            }
        }
        else {
            toast.error("Unexpected Error", "Something unexpected happened. Please try again.");
        }
    };
    var handleValidationErrors = function (errors, context) {
        logError(new Error("Validation failed: ".concat(errors.map(function (e) { return e.message; }).join(", "))), context);
        if (errors.length === 1) {
            toast.warning("Validation Error", errors[0].message);
        }
        else {
            toast.warning("Multiple Validation Errors", "Please fix ".concat(errors.length, " validation errors and try again."), {
                actions: [
                    {
                        label: "Show Details",
                        action: function () {
                            // Show detailed validation errors
                            console.log("Show validation details:", errors);
                        },
                        style: "secondary",
                    },
                ],
            });
        }
    };
    var handleGenerationError = function (error, context) {
        var _a;
        logError(error, __assign(__assign({}, context), { action: "svg_generation" }));
        if (error instanceof api_1.APIError && ((_a = error.response) === null || _a === void 0 ? void 0 : _a.errors)) {
            // Handle structured generation errors
            var generationErrors = error.response.errors;
            toast.error("Generation Failed", generationErrors.join(". "), {
                actions: [
                    {
                        label: "Try Different Prompt",
                        action: function () {
                            console.log("Suggest prompt changes");
                        },
                        style: "primary",
                    },
                ],
            });
        }
        else {
            handleAPIError(error, context);
        }
    };
    var handleCopyError = function (error, context) {
        logError(error, __assign(__assign({}, context), { action: "copy_to_clipboard" }));
        toast.error("Copy Failed", "Unable to copy to clipboard. You can manually select and copy the code.", {
            actions: [
                {
                    label: "Select Text",
                    action: function () {
                        // Focus and select the text area
                        console.log("Select text requested");
                    },
                    style: "primary",
                },
            ],
        });
    };
    var handleUnexpectedError = function (error, context) {
        logError(error, __assign(__assign({}, context), { action: "unexpected_error" }));
        toast.error("Unexpected Error", "Something went wrong. The error has been logged and we'll investigate.", {
            actions: [
                {
                    label: "Reload Page",
                    action: function () {
                        window.location.reload();
                    },
                    style: "secondary",
                },
            ],
        });
    };
    var showSuccess = function (title, message) {
        toast.success(title, message);
    };
    var showWarning = function (title, message) {
        toast.warning(title, message);
    };
    var showInfo = function (title, message) {
        toast.info(title, message);
    };
    var showError = function (title, message) {
        toast.error(title, message);
    };
    return {
        logError: logError,
        handleAPIError: handleAPIError,
        handleValidationErrors: handleValidationErrors,
        handleGenerationError: handleGenerationError,
        handleCopyError: handleCopyError,
        handleUnexpectedError: handleUnexpectedError,
        showSuccess: showSuccess,
        showWarning: showWarning,
        showInfo: showInfo,
        showError: showError,
    };
}
