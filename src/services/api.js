"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.apiService = exports.APIService = exports.TimeoutError = exports.NetworkError = exports.APIError = void 0;
var API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? "" : "http://localhost:3001");
var APIError = /** @class */ (function (_super) {
    __extends(APIError, _super);
    function APIError(message, statusCode, response) {
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.response = response;
        _this.name = "APIError";
        return _this;
    }
    return APIError;
}(Error));
exports.APIError = APIError;
var NetworkError = /** @class */ (function (_super) {
    __extends(NetworkError, _super);
    function NetworkError(message) {
        if (message === void 0) { message = "Network connection failed"; }
        var _this = _super.call(this, message) || this;
        _this.name = "NetworkError";
        return _this;
    }
    return NetworkError;
}(APIError));
exports.NetworkError = NetworkError;
var TimeoutError = /** @class */ (function (_super) {
    __extends(TimeoutError, _super);
    function TimeoutError(message) {
        if (message === void 0) { message = "Request timeout"; }
        var _this = _super.call(this, message) || this;
        _this.name = "TimeoutError";
        return _this;
    }
    return TimeoutError;
}(APIError));
exports.TimeoutError = TimeoutError;
var APIService = /** @class */ (function () {
    function APIService(baseURL) {
        if (baseURL === void 0) { baseURL = API_BASE_URL; }
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            retryCondition: function (error) {
                return (error instanceof NetworkError ||
                    (error instanceof APIError &&
                        error.statusCode !== undefined &&
                        error.statusCode >= 500));
            },
        };
        this.isOnline = navigator.onLine;
        this.baseURL = baseURL;
        this.setupOnlineDetection();
    }
    APIService.prototype.setupOnlineDetection = function () {
        var _this = this;
        window.addEventListener("online", function () {
            _this.isOnline = true;
        });
        window.addEventListener("offline", function () {
            _this.isOnline = false;
        });
    };
    APIService.prototype.addRequestInterceptor = function (interceptor) {
        this.requestInterceptors.push(interceptor);
    };
    APIService.prototype.addResponseInterceptor = function (interceptor) {
        this.responseInterceptors.push(interceptor);
    };
    APIService.prototype.setRetryConfig = function (config) {
        this.retryConfig = __assign(__assign({}, this.retryConfig), config);
    };
    APIService.prototype.applyRequestInterceptors = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var processedRequest, _i, _a, interceptor;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        processedRequest = request;
                        _i = 0, _a = this.requestInterceptors;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        interceptor = _a[_i];
                        return [4 /*yield*/, interceptor(processedRequest)];
                    case 2:
                        processedRequest = _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, processedRequest];
                }
            });
        });
    };
    APIService.prototype.applyResponseInterceptors = function (response) {
        return __awaiter(this, void 0, void 0, function () {
            var processedResponse, _i, _a, interceptor;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        processedResponse = response;
                        _i = 0, _a = this.responseInterceptors;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        interceptor = _a[_i];
                        return [4 /*yield*/, interceptor(processedResponse)];
                    case 2:
                        processedResponse = _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, processedResponse];
                }
            });
        });
    };
    APIService.prototype.sleep = function (ms) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
            });
        });
    };
    APIService.prototype.calculateDelay = function (attempt) {
        var delay = this.retryConfig.baseDelay * Math.pow(2, attempt);
        return Math.min(delay, this.retryConfig.maxDelay);
    };
    APIService.prototype.fetchWithTimeout = function (url_1, options_1) {
        return __awaiter(this, arguments, void 0, function (url, options, timeout) {
            var controller, timeoutId, response, error_1;
            if (timeout === void 0) { timeout = 30000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        controller = new AbortController();
                        timeoutId = setTimeout(function () { return controller.abort(); }, timeout);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch(url, __assign(__assign({}, options), { signal: controller.signal }))];
                    case 2:
                        response = _a.sent();
                        clearTimeout(timeoutId);
                        return [2 /*return*/, response];
                    case 3:
                        error_1 = _a.sent();
                        clearTimeout(timeoutId);
                        if (error_1 instanceof Error && error_1.name === "AbortError") {
                            throw new TimeoutError();
                        }
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    APIService.prototype.makeRequest = function (url, options) {
        return __awaiter(this, void 0, void 0, function () {
            var processedOptions, lastError, attempt, response, processedResponse, error_2, delay;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // Check online status
                        if (!this.isOnline) {
                            throw new NetworkError("Application is offline. Please check your internet connection.");
                        }
                        return [4 /*yield*/, this.applyRequestInterceptors(options)];
                    case 1:
                        processedOptions = _c.sent();
                        lastError = null;
                        attempt = 0;
                        _c.label = 2;
                    case 2:
                        if (!(attempt <= this.retryConfig.maxRetries)) return [3 /*break*/, 9];
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 6, , 8]);
                        return [4 /*yield*/, this.fetchWithTimeout(url, processedOptions)];
                    case 4:
                        response = _c.sent();
                        return [4 /*yield*/, this.applyResponseInterceptors(response)];
                    case 5:
                        processedResponse = _c.sent();
                        return [2 /*return*/, processedResponse];
                    case 6:
                        error_2 = _c.sent();
                        lastError = error_2 instanceof Error ? error_2 : new Error(String(error_2));
                        // Don't retry on the last attempt
                        if (attempt === this.retryConfig.maxRetries) {
                            return [3 /*break*/, 9];
                        }
                        // Check if we should retry this error
                        if (!((_b = (_a = this.retryConfig).retryCondition) === null || _b === void 0 ? void 0 : _b.call(_a, lastError))) {
                            return [3 /*break*/, 9];
                        }
                        delay = this.calculateDelay(attempt);
                        return [4 /*yield*/, this.sleep(delay)];
                    case 7:
                        _c.sent();
                        return [3 /*break*/, 8];
                    case 8:
                        attempt++;
                        return [3 /*break*/, 2];
                    case 9:
                        // Convert fetch errors to our custom error types
                        if (lastError &&
                            lastError instanceof TypeError &&
                            lastError.message.includes("fetch")) {
                            throw new NetworkError("Network error: Unable to connect to the server");
                        }
                        throw lastError || new Error("Unknown error occurred");
                }
            });
        });
    };
    APIService.prototype.generateSVG = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var response, errorData, data, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/api/generate"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify(request),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                    case 2:
                        errorData = _a.sent();
                        throw new APIError(errorData.message ||
                            "HTTP ".concat(response.status, ": ").concat(response.statusText), response.status, errorData);
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 5:
                        error_3 = _a.sent();
                        if (error_3 instanceof APIError ||
                            error_3 instanceof NetworkError ||
                            error_3 instanceof TimeoutError) {
                            throw error_3;
                        }
                        throw new APIError(error_3 instanceof Error ? error_3.message : "An unexpected error occurred");
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    APIService.prototype.healthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/health"), {
                                method: "GET",
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new APIError("Health check failed: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_4 = _a.sent();
                        if (error_4 instanceof APIError ||
                            error_4 instanceof NetworkError ||
                            error_4 instanceof TimeoutError) {
                            throw error_4;
                        }
                        throw new APIError("Health check failed: Unable to connect to server");
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Utility methods for checking connection status
    APIService.prototype.isOffline = function () {
        return !this.isOnline;
    };
    APIService.prototype.checkConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.healthCheck()];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return APIService;
}());
exports.APIService = APIService;
// Export a default instance
exports.apiService = new APIService();
