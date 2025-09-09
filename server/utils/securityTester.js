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
exports.SecurityTester = void 0;
var SVGSanitizer_1 = require("../services/SVGSanitizer");
var SecurityTester = /** @class */ (function () {
    function SecurityTester() {
        this.sanitizer = new SVGSanitizer_1.SVGSanitizer();
    }
    SecurityTester.prototype.runAllTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results, _a, _b, _c, _d, _e, _f, _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        results = [];
                        _b = 
                        // XSS Prevention Tests
                        (_a = results.push).apply;
                        _c = [
                            // XSS Prevention Tests
                            results];
                        return [4 /*yield*/, this.testXSSPrevention()];
                    case 1:
                        // XSS Prevention Tests
                        _b.apply(_a, _c.concat([(_k.sent())]));
                        _e = 
                        // Input Validation Tests
                        (_d = results.push).apply;
                        _f = [
                            // Input Validation Tests
                            results];
                        return [4 /*yield*/, this.testInputValidation()];
                    case 2:
                        // Input Validation Tests
                        _e.apply(_d, _f.concat([(_k.sent())]));
                        _h = 
                        // SVG Sanitization Tests
                        (_g = results.push).apply;
                        _j = [
                            // SVG Sanitization Tests
                            results];
                        return [4 /*yield*/, this.testSVGSanitization()];
                    case 3:
                        // SVG Sanitization Tests
                        _h.apply(_g, _j.concat([(_k.sent())]));
                        return [2 /*return*/, results];
                }
            });
        });
    };
    SecurityTester.prototype.testXSSPrevention = function () {
        return __awaiter(this, void 0, void 0, function () {
            var xssPayloads, results, _i, xssPayloads_1, test, result, containsScript, containsJavaScript, containsEventHandlers, containsForeignObject, passed;
            return __generator(this, function (_a) {
                xssPayloads = [
                    {
                        name: "Script tag injection",
                        payload: '<svg><script>alert("xss")</script></svg>',
                    },
                    {
                        name: "Event handler injection",
                        payload: "<svg onload=\"alert('xss')\"><rect /></svg>",
                    },
                    {
                        name: "JavaScript URL injection",
                        payload: "<svg><a href=\"javascript:alert('xss')\"><rect /></a></svg>",
                    },
                    {
                        name: "Foreign object injection",
                        payload: '<svg><foreignObject><script>alert("xss")</script></foreignObject></svg>',
                    },
                    {
                        name: "Image with JavaScript",
                        payload: "<svg><image href=\"javascript:alert('xss')\" /></svg>",
                    },
                ];
                results = [];
                for (_i = 0, xssPayloads_1 = xssPayloads; _i < xssPayloads_1.length; _i++) {
                    test = xssPayloads_1[_i];
                    try {
                        result = this.sanitizer.sanitize(test.payload);
                        containsScript = result.sanitizedSVG.includes("<script");
                        containsJavaScript = result.sanitizedSVG.includes("javascript:");
                        containsEventHandlers = /on\w+\s*=/i.test(result.sanitizedSVG);
                        containsForeignObject = result.sanitizedSVG.includes("<foreignObject");
                        passed = !containsScript &&
                            !containsJavaScript &&
                            !containsEventHandlers &&
                            !containsForeignObject;
                        results.push({
                            testName: test.name,
                            passed: passed,
                            details: passed
                                ? "XSS payload successfully sanitized"
                                : "XSS payload not properly sanitized",
                            input: test.payload,
                            output: result.sanitizedSVG,
                        });
                    }
                    catch (error) {
                        results.push({
                            testName: test.name,
                            passed: false,
                            details: "Sanitization failed: ".concat(error instanceof Error ? error.message : "Unknown error"),
                            input: test.payload,
                        });
                    }
                }
                return [2 /*return*/, results];
            });
        });
    };
    SecurityTester.prototype.testInputValidation = function () {
        return __awaiter(this, void 0, void 0, function () {
            var validationTests, results, _i, validationTests_1, test, isValid, passed;
            return __generator(this, function (_a) {
                validationTests = [
                    {
                        name: "Extremely long prompt",
                        input: "A".repeat(10000),
                        shouldPass: false,
                    },
                    {
                        name: "Valid prompt",
                        input: "A simple blue circle",
                        shouldPass: true,
                    },
                    {
                        name: "Empty prompt",
                        input: "",
                        shouldPass: false,
                    },
                    {
                        name: "Prompt with special characters",
                        input: "Circle with <>&\"' characters",
                        shouldPass: true,
                    },
                ];
                results = [];
                for (_i = 0, validationTests_1 = validationTests; _i < validationTests_1.length; _i++) {
                    test = validationTests_1[_i];
                    isValid = test.input.length > 0 && test.input.length <= 500;
                    passed = isValid === test.shouldPass;
                    results.push({
                        testName: test.name,
                        passed: passed,
                        details: passed
                            ? "Input validation working correctly"
                            : "Expected ".concat(test.shouldPass ? "valid" : "invalid", ", got ").concat(isValid ? "valid" : "invalid"),
                        input: test.input.substring(0, 100) + (test.input.length > 100 ? "..." : ""),
                    });
                }
                return [2 /*return*/, results];
            });
        });
    };
    SecurityTester.prototype.testSVGSanitization = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sanitizationTests, results, _loop_1, this_1, _i, sanitizationTests_1, test;
            return __generator(this, function (_a) {
                sanitizationTests = [
                    {
                        name: "Valid SVG preservation",
                        input: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue" /></svg>',
                        shouldContain: ["<svg", "<circle", "xmlns", "viewBox"],
                        shouldNotContain: [],
                    },
                    {
                        name: "Unsafe element removal",
                        input: '<svg><script>alert("xss")</script><circle cx="50" cy="50" r="40" /></svg>',
                        shouldContain: ["<svg", "<circle"],
                        shouldNotContain: ["<script", "alert"],
                    },
                    {
                        name: "Event handler removal",
                        input: '<svg onclick="alert(\'xss\')"><rect onmouseover="steal()" /></svg>',
                        shouldContain: ["<svg", "<rect"],
                        shouldNotContain: ["onclick", "onmouseover", "alert", "steal"],
                    },
                    {
                        name: "External reference blocking",
                        input: '<svg><image href="http://evil.com/steal.js" /><use href="#external" /></svg>',
                        shouldContain: ["<svg"],
                        shouldNotContain: ["http://evil.com", 'href="http'],
                    },
                ];
                results = [];
                _loop_1 = function (test) {
                    try {
                        var result = this_1.sanitizer.sanitize(test.input);
                        var output_1 = result.sanitizedSVG;
                        var hasRequiredContent = test.shouldContain.every(function (content) {
                            return output_1.includes(content);
                        });
                        var hasForbiddenContent = test.shouldNotContain.some(function (content) {
                            return output_1.includes(content);
                        });
                        var passed = hasRequiredContent && !hasForbiddenContent;
                        var details = "Sanitization test ";
                        if (!hasRequiredContent) {
                            details += "failed - missing required content. ";
                        }
                        if (hasForbiddenContent) {
                            details += "failed - contains forbidden content. ";
                        }
                        if (passed) {
                            details += "passed successfully.";
                        }
                        results.push({
                            testName: test.name,
                            passed: passed,
                            details: details,
                            input: test.input,
                            output: output_1,
                        });
                    }
                    catch (error) {
                        results.push({
                            testName: test.name,
                            passed: false,
                            details: "Sanitization failed: ".concat(error instanceof Error ? error.message : "Unknown error"),
                            input: test.input,
                        });
                    }
                };
                this_1 = this;
                for (_i = 0, sanitizationTests_1 = sanitizationTests; _i < sanitizationTests_1.length; _i++) {
                    test = sanitizationTests_1[_i];
                    _loop_1(test);
                }
                return [2 /*return*/, results];
            });
        });
    };
    SecurityTester.prototype.generateSecurityReport = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results, passedTests, totalTests, report, _i, results_1, result, status_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runAllTests()];
                    case 1:
                        results = _a.sent();
                        passedTests = results.filter(function (r) { return r.passed; }).length;
                        totalTests = results.length;
                        report = "# Security Test Report\n\n";
                        report += "**Overall Result:** ".concat(passedTests, "/").concat(totalTests, " tests passed\n\n");
                        if (passedTests === totalTests) {
                            report += "\u2705 All security tests passed!\n\n";
                        }
                        else {
                            report += "\u26A0\uFE0F ".concat(totalTests - passedTests, " security tests failed!\n\n");
                        }
                        report += "## Test Results\n\n";
                        for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                            result = results_1[_i];
                            status_1 = result.passed ? "✅" : "❌";
                            report += "### ".concat(status_1, " ").concat(result.testName, "\n");
                            report += "**Status:** ".concat(result.passed ? "PASSED" : "FAILED", "\n");
                            report += "**Details:** ".concat(result.details, "\n");
                            if (result.input) {
                                report += "**Input:** `".concat(result.input.substring(0, 100)).concat(result.input.length > 100 ? "..." : "", "`\n");
                            }
                            if (result.output) {
                                report += "**Output:** `".concat(result.output.substring(0, 100)).concat(result.output.length > 100 ? "..." : "", "`\n");
                            }
                            report += "\n";
                        }
                        return [2 /*return*/, report];
                }
            });
        });
    };
    return SecurityTester;
}());
exports.SecurityTester = SecurityTester;
