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
var vitest_1 = require("vitest");
// Mock server for integration tests
var TEST_SERVER_URL = "http://localhost:3001";
(0, vitest_1.describe)("API Integration Tests", function () {
    var serverAvailable = false;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("".concat(TEST_SERVER_URL, "/health"))];
                case 1:
                    response = _b.sent();
                    serverAvailable = response.ok;
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    serverAvailable = false;
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.describe)("Health Check Endpoint", function () {
        (0, vitest_1.it)("should return health status", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!serverAvailable) {
                            console.warn("Test server not available, skipping integration tests");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fetch("".concat(TEST_SERVER_URL, "/health"))];
                    case 1:
                        response = _a.sent();
                        (0, vitest_1.expect)(response.ok).toBe(true);
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        (0, vitest_1.expect)(data).toHaveProperty("status", "ok");
                        (0, vitest_1.expect)(data).toHaveProperty("timestamp");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("SVG Generation Endpoint", function () {
        (0, vitest_1.it)("should generate SVG from valid request", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!serverAvailable) {
                            console.warn("Test server not available, skipping integration tests");
                            return [2 /*return*/];
                        }
                        request = {
                            prompt: "A simple blue circle",
                            size: { width: 100, height: 100 },
                        };
                        return [4 /*yield*/, fetch("".concat(TEST_SERVER_URL, "/api/generate"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify(request),
                            })];
                    case 1:
                        response = _a.sent();
                        (0, vitest_1.expect)(response.ok).toBe(true);
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        (0, vitest_1.expect)(data).toHaveProperty("svg");
                        (0, vitest_1.expect)(data).toHaveProperty("meta");
                        (0, vitest_1.expect)(data).toHaveProperty("layers");
                        (0, vitest_1.expect)(data).toHaveProperty("warnings");
                        (0, vitest_1.expect)(data).toHaveProperty("errors");
                        // Validate SVG structure
                        (0, vitest_1.expect)(data.svg).toContain("<svg");
                        (0, vitest_1.expect)(data.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
                        (0, vitest_1.expect)(data.svg).toContain("viewBox");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should reject invalid requests", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidRequest, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!serverAvailable) {
                            console.warn("Test server not available, skipping integration tests");
                            return [2 /*return*/];
                        }
                        invalidRequest = {
                            prompt: "", // Empty prompt should be invalid
                            size: { width: -1, height: -1 }, // Invalid dimensions
                        };
                        return [4 /*yield*/, fetch("".concat(TEST_SERVER_URL, "/api/generate"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify(invalidRequest),
                            })];
                    case 1:
                        response = _a.sent();
                        (0, vitest_1.expect)(response.ok).toBe(false);
                        (0, vitest_1.expect)(response.status).toBe(400);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle malformed JSON", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!serverAvailable) {
                            console.warn("Test server not available, skipping integration tests");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fetch("".concat(TEST_SERVER_URL, "/api/generate"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: "invalid json",
                            })];
                    case 1:
                        response = _a.sent();
                        (0, vitest_1.expect)(response.ok).toBe(false);
                        (0, vitest_1.expect)(response.status).toBe(400);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should enforce rate limiting", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, promises, responses, rateLimitedResponses;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!serverAvailable) {
                            console.warn("Test server not available, skipping integration tests");
                            return [2 /*return*/];
                        }
                        request = {
                            prompt: "Test prompt",
                            size: { width: 100, height: 100 },
                        };
                        promises = Array.from({ length: 35 }, function () {
                            return fetch("".concat(TEST_SERVER_URL, "/api/generate"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify(request),
                            });
                        });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        responses = _a.sent();
                        rateLimitedResponses = responses.filter(function (r) { return r.status === 429; });
                        (0, vitest_1.expect)(rateLimitedResponses.length).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should sanitize malicious input", function () { return __awaiter(void 0, void 0, void 0, function () {
            var maliciousRequest, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!serverAvailable) {
                            console.warn("Test server not available, skipping integration tests");
                            return [2 /*return*/];
                        }
                        maliciousRequest = {
                            prompt: '<script>alert("xss")</script>Create a circle',
                            size: { width: 100, height: 100 },
                        };
                        return [4 /*yield*/, fetch("".concat(TEST_SERVER_URL, "/api/generate"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify(maliciousRequest),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        // SVG should not contain script tags
                        (0, vitest_1.expect)(data.svg).not.toContain("<script>");
                        (0, vitest_1.expect)(data.svg).not.toContain("alert");
                        return [3 /*break*/, 4];
                    case 3:
                        // Or the request should be rejected
                        (0, vitest_1.expect)(response.status).toBe(400);
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("Security Tests", function () {
        (0, vitest_1.it)("should reject requests with suspicious content", function () { return __awaiter(void 0, void 0, void 0, function () {
            var suspiciousRequests, _i, suspiciousRequests_1, request, response, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!serverAvailable) {
                            console.warn("Test server not available, skipping integration tests");
                            return [2 /*return*/];
                        }
                        suspiciousRequests = [
                            {
                                prompt: 'javascript:alert("xss")',
                                size: { width: 100, height: 100 },
                            },
                            { prompt: 'onclick="malicious()"', size: { width: 100, height: 100 } },
                            { prompt: "eval(maliciousCode)", size: { width: 100, height: 100 } },
                        ];
                        _i = 0, suspiciousRequests_1 = suspiciousRequests;
                        _a.label = 1;
                    case 1:
                        if (!(_i < suspiciousRequests_1.length)) return [3 /*break*/, 6];
                        request = suspiciousRequests_1[_i];
                        return [4 /*yield*/, fetch("".concat(TEST_SERVER_URL, "/api/generate"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify(request),
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        (0, vitest_1.expect)(data.svg).not.toContain("javascript:");
                        (0, vitest_1.expect)(data.svg).not.toContain("onclick");
                        (0, vitest_1.expect)(data.svg).not.toContain("eval");
                        return [3 /*break*/, 5];
                    case 4:
                        (0, vitest_1.expect)(response.status).toBe(400);
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should enforce CORS headers", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!serverAvailable) {
                            console.warn("Test server not available, skipping integration tests");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fetch("".concat(TEST_SERVER_URL, "/health"), {
                                method: "OPTIONS",
                            })];
                    case 1:
                        response = _a.sent();
                        (0, vitest_1.expect)(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
                        (0, vitest_1.expect)(response.headers.get("Access-Control-Allow-Methods")).toBeTruthy();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should include security headers", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!serverAvailable) {
                            console.warn("Test server not available, skipping integration tests");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fetch("".concat(TEST_SERVER_URL, "/health"))];
                    case 1:
                        response = _a.sent();
                        // Check for security headers
                        (0, vitest_1.expect)(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
                        (0, vitest_1.expect)(response.headers.get("X-Frame-Options")).toBeTruthy();
                        (0, vitest_1.expect)(response.headers.get("Content-Security-Policy")).toBeTruthy();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("Performance Tests", function () {
        (0, vitest_1.it)("should respond within reasonable time", function () { return __awaiter(void 0, void 0, void 0, function () {
            var startTime, response, endTime, responseTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!serverAvailable) {
                            console.warn("Test server not available, skipping integration tests");
                            return [2 /*return*/];
                        }
                        startTime = Date.now();
                        return [4 /*yield*/, fetch("".concat(TEST_SERVER_URL, "/health"))];
                    case 1:
                        response = _a.sent();
                        endTime = Date.now();
                        responseTime = endTime - startTime;
                        (0, vitest_1.expect)(response.ok).toBe(true);
                        (0, vitest_1.expect)(responseTime).toBeLessThan(1000); // Should respond within 1 second
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle concurrent requests", function () { return __awaiter(void 0, void 0, void 0, function () {
            var request, promises, responses, successfulResponses;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!serverAvailable) {
                            console.warn("Test server not available, skipping integration tests");
                            return [2 /*return*/];
                        }
                        request = {
                            prompt: "A simple circle",
                            size: { width: 50, height: 50 },
                        };
                        promises = Array.from({ length: 10 }, function () {
                            return fetch("".concat(TEST_SERVER_URL, "/api/generate"), {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify(request),
                            });
                        });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        responses = _a.sent();
                        successfulResponses = responses.filter(function (r) { return r.ok; });
                        (0, vitest_1.expect)(successfulResponses.length).toBeGreaterThan(5);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
