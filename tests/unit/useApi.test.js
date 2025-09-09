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
var vitest_1 = require("vitest");
var useApi_1 = require("../../src/composables/useApi");
var api_1 = require("../../src/services/api");
// Mock the error handler
vitest_1.vi.mock("../../src/composables/useErrorHandler", function () { return ({
    useErrorHandler: function () { return ({
        handleGenerationError: vitest_1.vi.fn(),
        showSuccess: vitest_1.vi.fn(),
    }); },
}); });
// Mock the API service
vitest_1.vi.mock("../../src/services/api", function () { return __awaiter(void 0, void 0, void 0, function () {
    var actual;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, vitest_1.vi.importActual("../../src/services/api")];
            case 1:
                actual = _a.sent();
                return [2 /*return*/, __assign(__assign({}, actual), { apiService: {
                            generateSVG: vitest_1.vi.fn(),
                            healthCheck: vitest_1.vi.fn(),
                            addRequestInterceptor: vitest_1.vi.fn(),
                            addResponseInterceptor: vitest_1.vi.fn(),
                        } })];
        }
    });
}); });
(0, vitest_1.describe)("useApi", function () {
    var api;
    (0, vitest_1.beforeEach)(function () {
        api = (0, useApi_1.useApi)();
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.afterEach)(function () {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)("initialization", function () {
        (0, vitest_1.it)("should initialize with correct default state", function () {
            (0, vitest_1.expect)(api.isLoading.value).toBe(false);
            (0, vitest_1.expect)(api.hasError.value).toBe(false);
            (0, vitest_1.expect)(api.errorMessage.value).toBeNull();
            (0, vitest_1.expect)(api.lastResponse.value).toBeNull();
        });
        (0, vitest_1.it)("should detect online status", function () {
            // Mock navigator.onLine
            Object.defineProperty(navigator, "onLine", {
                writable: true,
                value: true,
            });
            var onlineApi = (0, useApi_1.useApi)();
            (0, vitest_1.expect)(onlineApi.isOnline.value).toBe(true);
        });
    });
    (0, vitest_1.describe)("generateSVG", function () {
        (0, vitest_1.it)("should handle successful generation", function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockResponse, apiService, request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockResponse = {
                            svg: "<svg></svg>",
                            meta: { width: 100, height: 100, seed: 123 },
                            layers: [],
                            warnings: [],
                            errors: [],
                        };
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("../../src/services/api"); })];
                    case 1:
                        apiService = (_a.sent()).apiService;
                        vitest_1.vi.mocked(apiService.generateSVG).mockResolvedValue(mockResponse);
                        request = {
                            prompt: "test prompt",
                            size: { width: 100, height: 100 },
                        };
                        return [4 /*yield*/, api.generateSVG(request)];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toEqual(mockResponse);
                        (0, vitest_1.expect)(api.lastResponse.value).toEqual(mockResponse);
                        (0, vitest_1.expect)(api.isLoading.value).toBe(false);
                        (0, vitest_1.expect)(api.hasError.value).toBe(false);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle API errors", function () { return __awaiter(void 0, void 0, void 0, function () {
            var error, apiService, request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        error = new api_1.APIError("Generation failed", 400);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("../../src/services/api"); })];
                    case 1:
                        apiService = (_a.sent()).apiService;
                        vitest_1.vi.mocked(apiService.generateSVG).mockRejectedValue(error);
                        request = {
                            prompt: "test prompt",
                            size: { width: 100, height: 100 },
                        };
                        return [4 /*yield*/, api.generateSVG(request)];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toBeNull();
                        (0, vitest_1.expect)(api.isLoading.value).toBe(false);
                        (0, vitest_1.expect)(api.hasError.value).toBe(true);
                        (0, vitest_1.expect)(api.errorMessage.value).toBe("Generation failed");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle network errors", function () { return __awaiter(void 0, void 0, void 0, function () {
            var error, apiService, request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        error = new api_1.NetworkError("Connection failed");
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("../../src/services/api"); })];
                    case 1:
                        apiService = (_a.sent()).apiService;
                        vitest_1.vi.mocked(apiService.generateSVG).mockRejectedValue(error);
                        request = {
                            prompt: "test prompt",
                            size: { width: 100, height: 100 },
                        };
                        return [4 /*yield*/, api.generateSVG(request)];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toBeNull();
                        (0, vitest_1.expect)(api.isLoading.value).toBe(false);
                        (0, vitest_1.expect)(api.hasError.value).toBe(true);
                        (0, vitest_1.expect)(api.errorMessage.value).toBe("Connection failed");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle timeout errors", function () { return __awaiter(void 0, void 0, void 0, function () {
            var error, apiService, request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        error = new api_1.TimeoutError("Request timeout");
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("../../src/services/api"); })];
                    case 1:
                        apiService = (_a.sent()).apiService;
                        vitest_1.vi.mocked(apiService.generateSVG).mockRejectedValue(error);
                        request = {
                            prompt: "test prompt",
                            size: { width: 100, height: 100 },
                        };
                        return [4 /*yield*/, api.generateSVG(request)];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toBeNull();
                        (0, vitest_1.expect)(api.isLoading.value).toBe(false);
                        (0, vitest_1.expect)(api.hasError.value).toBe(true);
                        (0, vitest_1.expect)(api.errorMessage.value).toBe("Request timeout");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle generic errors", function () { return __awaiter(void 0, void 0, void 0, function () {
            var error, apiService, request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        error = new Error("Unknown error");
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("../../src/services/api"); })];
                    case 1:
                        apiService = (_a.sent()).apiService;
                        vitest_1.vi.mocked(apiService.generateSVG).mockRejectedValue(error);
                        request = {
                            prompt: "test prompt",
                            size: { width: 100, height: 100 },
                        };
                        return [4 /*yield*/, api.generateSVG(request)];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toBeNull();
                        (0, vitest_1.expect)(api.isLoading.value).toBe(false);
                        (0, vitest_1.expect)(api.hasError.value).toBe(true);
                        (0, vitest_1.expect)(api.errorMessage.value).toBe("Unknown error");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("healthCheck", function () {
        (0, vitest_1.it)("should return true for successful health check", function () { return __awaiter(void 0, void 0, void 0, function () {
            var apiService, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require("../../src/services/api"); })];
                    case 1:
                        apiService = (_a.sent()).apiService;
                        vitest_1.vi.mocked(apiService.healthCheck).mockResolvedValue({
                            status: "ok",
                            timestamp: new Date().toISOString(),
                        });
                        return [4 /*yield*/, api.checkHealth()];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should return false for failed health check", function () { return __awaiter(void 0, void 0, void 0, function () {
            var apiService, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require("../../src/services/api"); })];
                    case 1:
                        apiService = (_a.sent()).apiService;
                        vitest_1.vi.mocked(apiService.healthCheck).mockRejectedValue(new Error("Health check failed"));
                        return [4 /*yield*/, api.checkHealth()];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toBe(false);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("retry functionality", function () {
        (0, vitest_1.it)("should clear error and retry generation", function () { return __awaiter(void 0, void 0, void 0, function () {
            var mockResponse, apiService, request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockResponse = {
                            svg: "<svg></svg>",
                            meta: { width: 100, height: 100, seed: 123 },
                            layers: [],
                            warnings: [],
                            errors: [],
                        };
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("../../src/services/api"); })];
                    case 1:
                        apiService = (_a.sent()).apiService;
                        vitest_1.vi.mocked(apiService.generateSVG).mockResolvedValue(mockResponse);
                        request = {
                            prompt: "test prompt",
                            size: { width: 100, height: 100 },
                        };
                        return [4 /*yield*/, api.retry(request)];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result).toEqual(mockResponse);
                        (0, vitest_1.expect)(api.hasError.value).toBe(false);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("error clearing", function () {
        (0, vitest_1.it)("should clear error state", function () { return __awaiter(void 0, void 0, void 0, function () {
            var error, apiService;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        error = new api_1.APIError("Test error");
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("../../src/services/api"); })];
                    case 1:
                        apiService = (_a.sent()).apiService;
                        vitest_1.vi.mocked(apiService.generateSVG).mockRejectedValue(error);
                        return [4 /*yield*/, api.generateSVG({
                                prompt: "test",
                                size: { width: 100, height: 100 },
                            })];
                    case 2:
                        _a.sent();
                        (0, vitest_1.expect)(api.hasError.value).toBe(true);
                        // Then clear it
                        api.clearError();
                        (0, vitest_1.expect)(api.hasError.value).toBe(false);
                        (0, vitest_1.expect)(api.errorMessage.value).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("computed properties", function () {
        (0, vitest_1.it)("should correctly compute canRetry", function () { return __awaiter(void 0, void 0, void 0, function () {
            var error, apiService;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Initially should not be able to retry
                        (0, vitest_1.expect)(api.canRetry.value).toBe(false);
                        error = new api_1.NetworkError("Connection failed");
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("../../src/services/api"); })];
                    case 1:
                        apiService = (_a.sent()).apiService;
                        vitest_1.vi.mocked(apiService.generateSVG).mockRejectedValue(error);
                        return [4 /*yield*/, api.generateSVG({
                                prompt: "test",
                                size: { width: 100, height: 100 },
                            })];
                    case 2:
                        _a.sent();
                        (0, vitest_1.expect)(api.canRetry.value).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("offline detection", function () {
        (0, vitest_1.it)("should detect offline status", function () {
            // Mock navigator.onLine
            Object.defineProperty(navigator, "onLine", {
                writable: true,
                value: false,
            });
            var offlineApi = (0, useApi_1.useApi)();
            (0, vitest_1.expect)(offlineApi.isOffline()).toBe(true);
        });
    });
});
