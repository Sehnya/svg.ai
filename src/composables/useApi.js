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
exports.useApi = useApi;
var vue_1 = require("vue");
var api_1 = require("../services/api");
var useErrorHandler_1 = require("./useErrorHandler");
function useApi() {
    var _this = this;
    var errorHandler = (0, useErrorHandler_1.useErrorHandler)();
    var state = (0, vue_1.ref)({
        loading: false,
        error: null,
        isOnline: navigator.onLine,
        lastResponse: null,
    });
    // Setup online/offline detection
    var updateOnlineStatus = function () {
        state.value.isOnline = navigator.onLine;
    };
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    // Add request interceptor for loading state
    api_1.apiService.addRequestInterceptor(function (request) {
        state.value.loading = true;
        state.value.error = null;
        return request;
    });
    // Add response interceptor for loading state
    api_1.apiService.addResponseInterceptor(function (response) {
        state.value.loading = false;
        return response;
    });
    var generateSVG = function (request) { return __awaiter(_this, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    state.value.loading = true;
                    state.value.error = null;
                    return [4 /*yield*/, api_1.apiService.generateSVG(request)];
                case 1:
                    response = _a.sent();
                    state.value.lastResponse = response;
                    // Show success message
                    errorHandler.showSuccess("SVG Generated", "Your SVG has been created successfully!");
                    return [2 /*return*/, response];
                case 2:
                    error_1 = _a.sent();
                    state.value.loading = false;
                    // Use centralized error handling
                    if (error_1 instanceof Error) {
                        errorHandler.handleGenerationError(error_1, {
                            component: "useApi",
                            action: "generateSVG",
                            metadata: { request: request },
                        });
                        // Set simple error message for UI state
                        state.value.error = error_1.message;
                    }
                    return [2 /*return*/, null];
                case 3:
                    state.value.loading = false;
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var checkHealth = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, api_1.apiService.healthCheck()];
                case 1:
                    _b.sent();
                    return [2 /*return*/, true];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var clearError = function () {
        state.value.error = null;
    };
    var retry = function (request) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Clear previous error and retry
            clearError();
            return [2 /*return*/, generateSVG(request)];
        });
    }); };
    // Computed properties for easy access
    var isLoading = (0, vue_1.computed)(function () { return state.value.loading; });
    var hasError = (0, vue_1.computed)(function () { return !!state.value.error; });
    var errorMessage = (0, vue_1.computed)(function () { return state.value.error; });
    var isOnline = (0, vue_1.computed)(function () { return state.value.isOnline; });
    var canRetry = (0, vue_1.computed)(function () {
        var _a, _b, _c;
        return hasError.value &&
            (((_a = state.value.error) === null || _a === void 0 ? void 0 : _a.includes("network")) ||
                ((_b = state.value.error) === null || _b === void 0 ? void 0 : _b.includes("timeout")) ||
                ((_c = state.value.error) === null || _c === void 0 ? void 0 : _c.includes("server")));
    });
    return {
        // State
        state: (0, vue_1.computed)(function () { return state.value; }),
        isLoading: isLoading,
        hasError: hasError,
        errorMessage: errorMessage,
        isOnline: isOnline,
        canRetry: canRetry,
        lastResponse: (0, vue_1.computed)(function () { return state.value.lastResponse; }),
        // Methods
        generateSVG: generateSVG,
        checkHealth: checkHealth,
        clearError: clearError,
        retry: retry,
    };
}
