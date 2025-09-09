"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGeneration = useGeneration;
var vue_1 = require("vue");
var useApi_1 = require("./useApi");
var useErrorHandler_1 = require("./useErrorHandler");
var useFormValidation_1 = require("./useFormValidation");
var inputSanitizer_1 = require("../utils/inputSanitizer");
var debounce_1 = require("../utils/debounce");
var performance_1 = require("../utils/performance");
function useGeneration() {
    var _this = this;
    // Use API composable for network operations
    var api = (0, useApi_1.useApi)();
    var errorHandler = (0, useErrorHandler_1.useErrorHandler)();
    var validation = (0, useFormValidation_1.useFormValidation)();
    // Reactive state
    var generationParams = (0, vue_1.reactive)({
        prompt: "",
        size: {
            preset: "icon",
            width: 64,
            height: 64,
        },
    });
    var generationResult = (0, vue_1.ref)(null);
    // Size presets
    var sizePresets = [
        { name: "icon", label: "Icon", width: 64, height: 64 },
        { name: "banner", label: "Banner", width: 400, height: 100 },
        { name: "square", label: "Square", width: 200, height: 200 },
        { name: "custom", label: "Custom", width: 100, height: 100 },
    ];
    // Computed properties
    var canGenerate = (0, vue_1.computed)(function () {
        return (generationParams.prompt.trim().length > 0 &&
            generationParams.size.width >= 16 &&
            generationParams.size.width <= 2048 &&
            generationParams.size.height >= 16 &&
            generationParams.size.height <= 2048 &&
            !api.isLoading.value &&
            api.isOnline.value);
    });
    // Methods
    var setSizePreset = function (preset) {
        generationParams.size.preset = preset.name;
        if (preset.name !== "custom") {
            generationParams.size.width = preset.width;
            generationParams.size.height = preset.height;
        }
    };
    // Initialize form validation
    validation.registerField("prompt", {
        isValid: false,
        message: "Prompt is required",
    });
    validation.registerField("width", { isValid: true });
    validation.registerField("height", { isValid: true });
    // Debounced input sanitization to avoid excessive processing
    var debouncedSanitization = (0, debounce_1.debounce)(function (newPrompt) {
        if (newPrompt) {
            performance_1.performanceMonitor.start("input-sanitization");
            var sanitizationResult = inputSanitizer_1.InputSanitizer.sanitizePrompt(newPrompt);
            if (sanitizationResult.wasModified) {
                generationParams.prompt = sanitizationResult.sanitized;
                // Show warnings for sanitization
                sanitizationResult.warnings.forEach(function (warning) {
                    errorHandler.showWarning("Input Modified", warning);
                });
            }
            // Check for suspicious input
            if (inputSanitizer_1.InputSanitizer.isSuspiciousInput(newPrompt)) {
                errorHandler.showWarning("Suspicious Input Detected", "Your input contains potentially unsafe content that has been removed.");
            }
            performance_1.performanceMonitor.end("input-sanitization");
        }
    }, 300); // 300ms debounce
    // Watch for prompt changes and sanitize input
    (0, vue_1.watch)(function () { return generationParams.prompt; }, debouncedSanitization);
    var validateInput = function () {
        // Sanitize and validate prompt
        var promptResult = inputSanitizer_1.InputSanitizer.sanitizePrompt(generationParams.prompt);
        var prompt = promptResult.sanitized;
        // Sanitize and validate dimensions
        var widthResult = inputSanitizer_1.InputSanitizer.sanitizeNumber(generationParams.size.width, 16, 2048, 64);
        var heightResult = inputSanitizer_1.InputSanitizer.sanitizeNumber(generationParams.size.height, 16, 2048, 64);
        // Update values if they were sanitized
        if (widthResult.wasModified) {
            generationParams.size.width = widthResult.value;
            widthResult.warnings.forEach(function (warning) {
                errorHandler.showWarning("Width Adjusted", warning);
            });
        }
        if (heightResult.wasModified) {
            generationParams.size.height = heightResult.value;
            heightResult.warnings.forEach(function (warning) {
                errorHandler.showWarning("Height Adjusted", warning);
            });
        }
        // Validate prompt
        validation.updateFieldValidation("prompt", prompt.length > 0 && prompt.length <= 500, prompt.length === 0
            ? "Prompt is required"
            : prompt.length > 500
                ? "Prompt must be 500 characters or less"
                : undefined);
        // Validate dimensions
        validation.updateFieldValidation("width", widthResult.value >= 16 && widthResult.value <= 2048, widthResult.value < 16 || widthResult.value > 2048
            ? "Width must be between 16 and 2048 pixels"
            : undefined);
        validation.updateFieldValidation("height", heightResult.value >= 16 && heightResult.value <= 2048, heightResult.value < 16 || heightResult.value > 2048
            ? "Height must be between 16 and 2048 pixels"
            : undefined);
        return validation.isFormValid.value;
    };
    var generateSVG = function () { return __awaiter(_this, void 0, void 0, function () {
        var request, result, duration, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    performance_1.performanceMonitor.start("svg-generation", {
                        promptLength: generationParams.prompt.length,
                        size: "".concat(generationParams.size.width, "x").concat(generationParams.size.height),
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    if (!validateInput()) {
                        errorHandler.handleValidationErrors(validation.validationErrors.value, {
                            component: "useGeneration",
                            action: "generateSVG",
                        });
                        return [2 /*return*/];
                    }
                    if (!canGenerate.value)
                        return [2 /*return*/];
                    request = {
                        prompt: generationParams.prompt.trim(),
                        size: {
                            width: generationParams.size.width,
                            height: generationParams.size.height,
                        },
                        palette: generationParams.palette,
                        seed: generationParams.seed,
                    };
                    return [4 /*yield*/, api.generateSVG(request)];
                case 2:
                    result = _a.sent();
                    if (result) {
                        generationResult.value = result;
                        // Log performance metrics in development
                        if (process.env.NODE_ENV === "development") {
                            duration = performance_1.performanceMonitor.end("svg-generation");
                            console.log("SVG generation completed in ".concat(duration === null || duration === void 0 ? void 0 : duration.toFixed(2), "ms"));
                        }
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    performance_1.performanceMonitor.end("svg-generation");
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var retryGeneration = function () { return __awaiter(_this, void 0, void 0, function () {
        var previousEventId, request, result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!generationParams.prompt.trim())
                        return [2 /*return*/];
                    previousEventId = (_a = generationResult.value) === null || _a === void 0 ? void 0 : _a.eventId;
                    request = {
                        prompt: generationParams.prompt.trim(),
                        size: {
                            width: generationParams.size.width,
                            height: generationParams.size.height,
                        },
                        palette: generationParams.palette,
                        seed: generationParams.seed,
                    };
                    return [4 /*yield*/, api.retry(request)];
                case 1:
                    result = _b.sent();
                    if (result) {
                        generationResult.value = result;
                        // Record implicit feedback for the previous generation
                        if (previousEventId) {
                            try {
                                // This would need to be imported and used properly
                                // For now, we'll handle this in the component level
                                console.log("Previous generation regenerated:", previousEventId);
                            }
                            catch (error) {
                                console.warn("Failed to record regeneration feedback:", error);
                            }
                        }
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var clearError = function () {
        api.clearError();
    };
    var clearResult = function () {
        generationResult.value = null;
    };
    var resetParams = function () {
        generationParams.prompt = "";
        generationParams.size = {
            preset: "icon",
            width: 64,
            height: 64,
        };
        generationParams.palette = undefined;
        generationParams.seed = undefined;
    };
    return {
        // State
        generationParams: generationParams,
        generationResult: generationResult,
        sizePresets: sizePresets,
        // API state
        isGenerating: api.isLoading,
        error: api.errorMessage,
        isOnline: api.isOnline,
        canRetry: api.canRetry,
        // Computed
        canGenerate: canGenerate,
        // Methods
        setSizePreset: setSizePreset,
        generateSVG: generateSVG,
        retryGeneration: retryGeneration,
        clearError: clearError,
        clearResult: clearResult,
        resetParams: resetParams,
    };
}
