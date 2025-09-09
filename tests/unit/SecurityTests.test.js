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
/**
 * Security tests for SVG sanitization, XSS prevention, and content policy enforcement
 */
var vitest_1 = require("vitest");
var SVGSanitizer_js_1 = require("../../server/services/SVGSanitizer.js");
var KnowledgeBaseManager_js_1 = require("../../server/services/KnowledgeBaseManager.js");
(0, vitest_1.describe)("Security Tests", function () {
    var sanitizer;
    var kbManager;
    beforeEach(function () {
        sanitizer = new SVGSanitizer_js_1.SVGSanitizer();
        kbManager = new KnowledgeBaseManager_js_1.KnowledgeBaseManager();
    });
    (0, vitest_1.describe)("SVG Sanitization", function () {
        (0, vitest_1.it)("should remove script tags from SVG", function () {
            var maliciousSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\">\n          <script>alert('XSS')</script>\n          <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(maliciousSVG);
            (0, vitest_1.expect)(sanitized).not.toContain("<script");
            (0, vitest_1.expect)(sanitized).not.toContain("alert");
            (0, vitest_1.expect)(sanitized).toContain("<circle");
        });
        (0, vitest_1.it)("should remove foreignObject tags", function () {
            var maliciousSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\">\n          <foreignObject>\n            <div onclick=\"alert('XSS')\">Click me</div>\n          </foreignObject>\n          <rect x=\"0\" y=\"0\" width=\"100\" height=\"100\" fill=\"red\" />\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(maliciousSVG);
            (0, vitest_1.expect)(sanitized).not.toContain("foreignObject");
            (0, vitest_1.expect)(sanitized).not.toContain("onclick");
            (0, vitest_1.expect)(sanitized).toContain("<rect");
        });
        (0, vitest_1.it)("should remove image tags", function () {
            var maliciousSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\">\n          <image href=\"javascript:alert('XSS')\" />\n          <image xlink:href=\"data:image/svg+xml;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=\" />\n          <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(maliciousSVG);
            (0, vitest_1.expect)(sanitized).not.toContain("<image");
            (0, vitest_1.expect)(sanitized).not.toContain("javascript:");
            (0, vitest_1.expect)(sanitized).toContain("<circle");
        });
        (0, vitest_1.it)("should remove all event handlers", function () {
            var maliciousSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" \n                  onclick=\"alert('XSS')\" \n                  onmouseover=\"steal_data()\" \n                  onload=\"malicious_code()\" />\n          <rect x=\"0\" y=\"0\" width=\"100\" height=\"100\" fill=\"red\" \n                onanimationend=\"hack()\" />\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(maliciousSVG);
            (0, vitest_1.expect)(sanitized).not.toContain("onclick");
            (0, vitest_1.expect)(sanitized).not.toContain("onmouseover");
            (0, vitest_1.expect)(sanitized).not.toContain("onload");
            (0, vitest_1.expect)(sanitized).not.toContain("onanimationend");
            (0, vitest_1.expect)(sanitized).toContain("<circle");
            (0, vitest_1.expect)(sanitized).toContain("<rect");
        });
        (0, vitest_1.it)("should only allow safe SVG elements", function () {
            var mixedSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n          <rect x=\"0\" y=\"0\" width=\"100\" height=\"100\" fill=\"red\" />\n          <path d=\"M10 10 L90 90\" stroke=\"green\" />\n          <line x1=\"0\" y1=\"0\" x2=\"100\" y2=\"100\" stroke=\"black\" />\n          <polygon points=\"50,0 100,50 50,100 0,50\" fill=\"yellow\" />\n          <polyline points=\"0,0 50,25 100,0\" stroke=\"purple\" />\n          <ellipse cx=\"50\" cy=\"50\" rx=\"40\" ry=\"20\" fill=\"orange\" />\n          <g transform=\"translate(10,10)\">\n            <circle cx=\"10\" cy=\"10\" r=\"5\" fill=\"pink\" />\n          </g>\n          <div>This should be removed</div>\n          <span>This too</span>\n          <iframe src=\"evil.com\"></iframe>\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(mixedSVG);
            // Should keep safe elements
            (0, vitest_1.expect)(sanitized).toContain("<circle");
            (0, vitest_1.expect)(sanitized).toContain("<rect");
            (0, vitest_1.expect)(sanitized).toContain("<path");
            (0, vitest_1.expect)(sanitized).toContain("<line");
            (0, vitest_1.expect)(sanitized).toContain("<polygon");
            (0, vitest_1.expect)(sanitized).toContain("<polyline");
            (0, vitest_1.expect)(sanitized).toContain("<ellipse");
            (0, vitest_1.expect)(sanitized).toContain("<g");
            // Should remove unsafe elements
            (0, vitest_1.expect)(sanitized).not.toContain("<div");
            (0, vitest_1.expect)(sanitized).not.toContain("<span");
            (0, vitest_1.expect)(sanitized).not.toContain("<iframe");
        });
        (0, vitest_1.it)("should preserve safe attributes", function () {
            var safeSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" stroke=\"red\" stroke-width=\"2\" />\n          <rect x=\"10\" y=\"10\" width=\"80\" height=\"80\" fill=\"none\" stroke=\"green\" />\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(safeSVG);
            (0, vitest_1.expect)(sanitized).toContain('xmlns="http://www.w3.org/2000/svg"');
            (0, vitest_1.expect)(sanitized).toContain('viewBox="0 0 100 100"');
            (0, vitest_1.expect)(sanitized).toContain('fill="blue"');
            (0, vitest_1.expect)(sanitized).toContain('stroke="red"');
            (0, vitest_1.expect)(sanitized).toContain('stroke-width="2"');
        });
        (0, vitest_1.it)("should handle malformed SVG gracefully", function () {
            var malformedSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\"\n          <rect x=\"0\" y=\"0\" width=\"100\" height=\"100\" fill=\"red\" />\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(malformedSVG);
            (0, vitest_1.expect)(sanitized).toBeDefined();
            (0, vitest_1.expect)(sanitized).toContain("<svg");
            (0, vitest_1.expect)(sanitized).toContain("</svg>");
        });
    });
    (0, vitest_1.describe)("XSS Prevention", function () {
        (0, vitest_1.it)("should prevent JavaScript injection via href attributes", function () {
            var xssSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\">\n          <a href=\"javascript:alert('XSS')\">\n            <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n          </a>\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(xssSVG);
            (0, vitest_1.expect)(sanitized).not.toContain("javascript:");
            (0, vitest_1.expect)(sanitized).not.toContain("alert");
        });
        (0, vitest_1.it)("should prevent data URI XSS attacks", function () {
            var xssSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\">\n          <image href=\"data:text/html,<script>alert('XSS')</script>\" />\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(xssSVG);
            (0, vitest_1.expect)(sanitized).not.toContain("data:text/html");
            (0, vitest_1.expect)(sanitized).not.toContain("<script");
        });
        (0, vitest_1.it)("should prevent CSS injection attacks", function () {
            var cssSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\">\n          <style>\n            .malicious { background: url('javascript:alert(\"XSS\")'); }\n          </style>\n          <circle cx=\"50\" cy=\"50\" r=\"40\" class=\"malicious\" />\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(cssSVG);
            (0, vitest_1.expect)(sanitized).not.toContain("<style");
            (0, vitest_1.expect)(sanitized).not.toContain("javascript:");
        });
        (0, vitest_1.it)("should prevent animation-based attacks", function () {
            var animationSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\">\n            <animate attributeName=\"onload\" values=\"alert('XSS')\" />\n          </circle>\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(animationSVG);
            (0, vitest_1.expect)(sanitized).not.toContain("onload");
            (0, vitest_1.expect)(sanitized).not.toContain("alert");
        });
    });
    (0, vitest_1.describe)("Content Policy Enforcement", function () {
        (0, vitest_1.it)("should detect inappropriate content in KB objects", function () { return __awaiter(void 0, void 0, void 0, function () {
            var inappropriateContent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        inappropriateContent = {
                            kind: "motif",
                            title: "Inappropriate Motif",
                            body: {
                                description: "This contains sensitive personal information and inappropriate content",
                            },
                            tags: ["inappropriate", "sensitive"],
                            version: "1.0.0",
                            status: "active",
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(kbManager.createObject(inappropriateContent)).rejects.toThrow(/content.*policy/i)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should detect bias in glossary terms", function () { return __awaiter(void 0, void 0, void 0, function () {
            var biasedGlossary;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        biasedGlossary = {
                            kind: "glossary",
                            title: "Biased Glossary",
                            body: {
                                terms: {
                                    good: "only things that are blue",
                                    bad: "everything that is not blue",
                                    superior: "blue geometric shapes",
                                    inferior: "all other shapes and colors",
                                },
                            },
                            tags: ["biased"],
                            version: "1.0.0",
                            status: "active",
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(kbManager.createObject(biasedGlossary)).rejects.toThrow(/bias.*detected/i)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate neutrality in style packs", function () { return __awaiter(void 0, void 0, void 0, function () {
            var neutralStylePack, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        neutralStylePack = {
                            kind: "style_pack",
                            title: "Neutral Style Pack",
                            body: {
                                colors: ["#ff0000", "#00ff00", "#0000ff"],
                                description: "A balanced color palette for geometric designs",
                            },
                            tags: ["neutral", "balanced"],
                            version: "1.0.0",
                            status: "active",
                        };
                        return [4 /*yield*/, kbManager.createObject(neutralStylePack)];
                    case 1:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.id).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should prevent sensitive information in prompts", function () {
            var sensitivePrompts = [
                "Create an SVG with my social security number 123-45-6789",
                "Draw a circle with my credit card number 4111-1111-1111-1111",
                "Make a design with my phone number (555) 123-4567",
                "Generate an SVG with my email address john.doe@example.com",
            ];
            for (var _i = 0, sensitivePrompts_1 = sensitivePrompts; _i < sensitivePrompts_1.length; _i++) {
                var prompt_1 = sensitivePrompts_1[_i];
                var isValid = kbManager.validatePromptContent(prompt_1);
                (0, vitest_1.expect)(isValid).toBe(false);
            }
        });
        (0, vitest_1.it)("should allow appropriate content", function () {
            var appropriatePrompts = [
                "Create a blue circle with red border",
                "Draw geometric shapes in a grid pattern",
                "Make a minimalist design with earth tones",
                "Generate an abstract pattern with flowing lines",
            ];
            for (var _i = 0, appropriatePrompts_1 = appropriatePrompts; _i < appropriatePrompts_1.length; _i++) {
                var prompt_2 = appropriatePrompts_1[_i];
                var isValid = kbManager.validatePromptContent(prompt_2);
                (0, vitest_1.expect)(isValid).toBe(true);
            }
        });
        (0, vitest_1.it)("should enforce content length limits", function () { return __awaiter(void 0, void 0, void 0, function () {
            var oversizedContent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        oversizedContent = {
                            kind: "fewshot",
                            title: "Oversized Example",
                            body: {
                                prompt: "test",
                                response: "A".repeat(2000), // Exceeds reasonable limits
                            },
                            tags: ["oversized"],
                            version: "1.0.0",
                            status: "active",
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(kbManager.createObject(oversizedContent)).rejects.toThrow(/size.*limit/i)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("Access Control and Data Isolation", function () {
        (0, vitest_1.it)("should isolate user data properly", function () { return __awaiter(void 0, void 0, void 0, function () {
            var user1, user2, user1Prefs, user2Prefs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        user1 = "user-1";
                        user2 = "user-2";
                        // Create user-specific preferences
                        return [4 /*yield*/, kbManager.setUserPreference(user1, "blue", 1.0)];
                    case 1:
                        // Create user-specific preferences
                        _a.sent();
                        return [4 /*yield*/, kbManager.setUserPreference(user2, "red", 1.0)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, kbManager.getUserPreferences(user1)];
                    case 3:
                        user1Prefs = _a.sent();
                        return [4 /*yield*/, kbManager.getUserPreferences(user2)];
                    case 4:
                        user2Prefs = _a.sent();
                        (0, vitest_1.expect)(user1Prefs.blue).toBeDefined();
                        (0, vitest_1.expect)(user1Prefs.red).toBeUndefined();
                        (0, vitest_1.expect)(user2Prefs.red).toBeDefined();
                        (0, vitest_1.expect)(user2Prefs.blue).toBeUndefined();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should prevent unauthorized access to KB objects", function () { return __awaiter(void 0, void 0, void 0, function () {
            var restrictedObject, created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        restrictedObject = {
                            kind: "rule",
                            title: "Restricted Rule",
                            body: { condition: "admin", action: "allow" },
                            tags: ["restricted"],
                            version: "1.0.0",
                            status: "active",
                            ownerId: "admin-user",
                        };
                        return [4 /*yield*/, kbManager.createObject(restrictedObject)];
                    case 1:
                        created = _a.sent();
                        // Regular user should not be able to access restricted object
                        return [4 /*yield*/, (0, vitest_1.expect)(kbManager.getObject(created.id, { userId: "regular-user" })).rejects.toThrow(/access.*denied/i)];
                    case 2:
                        // Regular user should not be able to access restricted object
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate user permissions for operations", function () { return __awaiter(void 0, void 0, void 0, function () {
            var regularUser, adminUser, globalObject, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        regularUser = "regular-user";
                        adminUser = "admin-user";
                        globalObject = {
                            kind: "style_pack",
                            title: "Global Style Pack",
                            body: { colors: ["#000000"] },
                            tags: ["global"],
                            version: "1.0.0",
                            status: "active",
                            scope: "global",
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(kbManager.createObject(globalObject, { userId: regularUser })).rejects.toThrow(/permission.*denied/i)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, kbManager.createObject(globalObject, {
                                userId: adminUser,
                            })];
                    case 2:
                        result = _a.sent();
                        (0, vitest_1.expect)(result.id).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("Input Validation and Sanitization", function () {
        (0, vitest_1.it)("should validate SVG structure requirements", function () {
            var validSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" stroke=\"black\" stroke-width=\"2\" />\n        </svg>\n      ";
            var invalidSVGs = [
                '<svg><circle cx="50" cy="50" r="40" /></svg>', // Missing xmlns
                '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" /></svg>', // Missing viewBox
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke-width="0.5" /></svg>', // Invalid stroke-width
            ];
            (0, vitest_1.expect)(sanitizer.validateStructure(validSVG)).toBe(true);
            for (var _i = 0, invalidSVGs_1 = invalidSVGs; _i < invalidSVGs_1.length; _i++) {
                var invalidSVG = invalidSVGs_1[_i];
                (0, vitest_1.expect)(sanitizer.validateStructure(invalidSVG)).toBe(false);
            }
        });
        (0, vitest_1.it)("should limit decimal precision", function () {
            var highPrecisionSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n          <circle cx=\"50.123456789\" cy=\"50.987654321\" r=\"40.555555555\" />\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(highPrecisionSVG);
            // Should limit to 2 decimal places
            (0, vitest_1.expect)(sanitized).toMatch(/cx="50\.12"/);
            (0, vitest_1.expect)(sanitized).toMatch(/cy="50\.99"/);
            (0, vitest_1.expect)(sanitized).toMatch(/r="40\.56"/);
        });
        (0, vitest_1.it)("should enforce minimum stroke width", function () {
            var thinStrokeSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" stroke=\"black\" stroke-width=\"0.5\" />\n          <rect x=\"10\" y=\"10\" width=\"80\" height=\"80\" stroke=\"red\" stroke-width=\"0.1\" />\n        </svg>\n      ";
            var sanitized = sanitizer.sanitize(thinStrokeSVG);
            // Should enforce minimum stroke-width of 1
            (0, vitest_1.expect)(sanitized).toMatch(/stroke-width="1"/g);
            (0, vitest_1.expect)(sanitized).not.toMatch(/stroke-width="0\./);
        });
        (0, vitest_1.it)("should handle edge cases in validation", function () {
            var edgeCases = [
                "", // Empty string
                "<invalid>not svg</invalid>", // Not SVG
                "<svg>incomplete", // Incomplete SVG
                null, // Null input
                undefined, // Undefined input
            ];
            var _loop_1 = function (edgeCase) {
                (0, vitest_1.expect)(function () { return sanitizer.sanitize(edgeCase); }).not.toThrow();
            };
            for (var _i = 0, edgeCases_1 = edgeCases; _i < edgeCases_1.length; _i++) {
                var edgeCase = edgeCases_1[_i];
                _loop_1(edgeCase);
            }
        });
    });
});
