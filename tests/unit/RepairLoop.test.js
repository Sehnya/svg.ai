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
 * Unit tests for repair loop functionality and KB object compatibility
 */
var vitest_1 = require("vitest");
var SVGSynthesizer_js_1 = require("../../server/services/SVGSynthesizer.js");
var QualityGate_js_1 = require("../../server/services/QualityGate.js");
var KnowledgeBaseManager_js_1 = require("../../server/services/KnowledgeBaseManager.js");
(0, vitest_1.describe)("Repair Loop Functionality", function () {
    var synthesizer;
    var qualityGate;
    var kbManager;
    (0, vitest_1.beforeEach)(function () {
        synthesizer = new SVGSynthesizer_js_1.SVGSynthesizer();
        qualityGate = new QualityGate_js_1.QualityGate();
        kbManager = new KnowledgeBaseManager_js_1.KnowledgeBaseManager();
    });
    (0, vitest_1.describe)("SVG validation and repair", function () {
        (0, vitest_1.it)("should detect and repair missing xmlns attribute", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidSVG, repairResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidSVG = "\n        <svg viewBox=\"0 0 100 100\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n        </svg>\n      ";
                        return [4 /*yield*/, synthesizer.repairSVG(invalidSVG)];
                    case 1:
                        repairResult = _a.sent();
                        (0, vitest_1.expect)(repairResult.success).toBe(true);
                        (0, vitest_1.expect)(repairResult.repairedSVG).toContain('xmlns="http://www.w3.org/2000/svg"');
                        (0, vitest_1.expect)(repairResult.repairsApplied).toContain("added_xmlns");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should detect and repair missing viewBox attribute", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidSVG, repairResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n        </svg>\n      ";
                        return [4 /*yield*/, synthesizer.repairSVG(invalidSVG)];
                    case 1:
                        repairResult = _a.sent();
                        (0, vitest_1.expect)(repairResult.success).toBe(true);
                        (0, vitest_1.expect)(repairResult.repairedSVG).toContain("viewBox=");
                        (0, vitest_1.expect)(repairResult.repairsApplied).toContain("added_viewbox");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should repair invalid stroke-width values", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidSVG, repairResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" stroke=\"black\" stroke-width=\"0.5\" />\n          <rect x=\"10\" y=\"10\" width=\"80\" height=\"80\" stroke=\"red\" stroke-width=\"0.1\" />\n        </svg>\n      ";
                        return [4 /*yield*/, synthesizer.repairSVG(invalidSVG)];
                    case 1:
                        repairResult = _a.sent();
                        (0, vitest_1.expect)(repairResult.success).toBe(true);
                        (0, vitest_1.expect)(repairResult.repairedSVG).not.toMatch(/stroke-width="0\./);
                        (0, vitest_1.expect)(repairResult.repairedSVG).toMatch(/stroke-width="1"/g);
                        (0, vitest_1.expect)(repairResult.repairsApplied).toContain("fixed_stroke_width");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should limit decimal precision to 2 places", function () { return __awaiter(void 0, void 0, void 0, function () {
            var highPrecisionSVG, repairResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        highPrecisionSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n          <circle cx=\"50.123456789\" cy=\"50.987654321\" r=\"40.555555555\" />\n        </svg>\n      ";
                        return [4 /*yield*/, synthesizer.repairSVG(highPrecisionSVG)];
                    case 1:
                        repairResult = _a.sent();
                        (0, vitest_1.expect)(repairResult.success).toBe(true);
                        (0, vitest_1.expect)(repairResult.repairedSVG).toMatch(/cx="50\.12"/);
                        (0, vitest_1.expect)(repairResult.repairedSVG).toMatch(/cy="50\.99"/);
                        (0, vitest_1.expect)(repairResult.repairedSVG).toMatch(/r="40\.56"/);
                        (0, vitest_1.expect)(repairResult.repairsApplied).toContain("limited_precision");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle maximum repair attempts", function () { return __awaiter(void 0, void 0, void 0, function () {
            var severelyInvalidSVG, repairResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        severelyInvalidSVG = "\n        <svg>\n          <circle cx=\"invalid\" cy=\"invalid\" r=\"invalid\" stroke-width=\"0\" />\n          <rect x=\"NaN\" y=\"NaN\" width=\"NaN\" height=\"NaN\" />\n        </svg>\n      ";
                        return [4 /*yield*/, synthesizer.repairSVG(severelyInvalidSVG, {
                                maxAttempts: 2,
                            })];
                    case 1:
                        repairResult = _a.sent();
                        (0, vitest_1.expect)(repairResult.attempts).toBeLessThanOrEqual(2);
                        if (!repairResult.success) {
                            (0, vitest_1.expect)(repairResult.finalErrors).toBeDefined();
                            (0, vitest_1.expect)(repairResult.finalErrors.length).toBeGreaterThan(0);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should provide structured error feedback", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidSVG, repairResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidSVG = "\n        <svg>\n          <circle />\n          <rect />\n        </svg>\n      ";
                        return [4 /*yield*/, synthesizer.repairSVG(invalidSVG)];
                    case 1:
                        repairResult = _a.sent();
                        if (!repairResult.success) {
                            (0, vitest_1.expect)(repairResult.errors).toBeDefined();
                            (0, vitest_1.expect)(Array.isArray(repairResult.errors)).toBe(true);
                            repairResult.errors.forEach(function (error) {
                                (0, vitest_1.expect)(error.type).toBeDefined();
                                (0, vitest_1.expect)(error.message).toBeDefined();
                                (0, vitest_1.expect)(error.element).toBeDefined();
                            });
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("Quality gate validation", function () {
        (0, vitest_1.it)("should validate required motifs are present", function () { return __awaiter(void 0, void 0, void 0, function () {
            var svgWithMotifs, requiredMotifs, validation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        svgWithMotifs = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n          <rect x=\"10\" y=\"10\" width=\"30\" height=\"30\" fill=\"red\" />\n        </svg>\n      ";
                        requiredMotifs = ["circle", "rectangle"];
                        return [4 /*yield*/, qualityGate.validateMotifs(svgWithMotifs, requiredMotifs)];
                    case 1:
                        validation = _a.sent();
                        (0, vitest_1.expect)(validation.passed).toBe(true);
                        (0, vitest_1.expect)(validation.foundMotifs).toContain("circle");
                        (0, vitest_1.expect)(validation.foundMotifs).toContain("rectangle");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should enforce stroke-only rules when required", function () { return __awaiter(void 0, void 0, void 0, function () {
            var strokeOnlySVG, validation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        strokeOnlySVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" stroke=\"black\" stroke-width=\"2\" fill=\"none\" />\n          <rect x=\"10\" y=\"10\" width=\"30\" height=\"30\" stroke=\"red\" stroke-width=\"1\" fill=\"none\" />\n        </svg>\n      ";
                        return [4 /*yield*/, qualityGate.validateStrokeOnly(strokeOnlySVG)];
                    case 1:
                        validation = _a.sent();
                        (0, vitest_1.expect)(validation.passed).toBe(true);
                        (0, vitest_1.expect)(validation.violations).toHaveLength(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should detect stroke-only violations", function () { return __awaiter(void 0, void 0, void 0, function () {
            var filledSVG, validation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filledSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n          <circle cx=\"50\" cy=\"50\" r=\"40\" fill=\"blue\" />\n          <rect x=\"10\" y=\"10\" width=\"30\" height=\"30\" fill=\"red\" />\n        </svg>\n      ";
                        return [4 /*yield*/, qualityGate.validateStrokeOnly(filledSVG)];
                    case 1:
                        validation = _a.sent();
                        (0, vitest_1.expect)(validation.passed).toBe(false);
                        (0, vitest_1.expect)(validation.violations.length).toBeGreaterThan(0);
                        (0, vitest_1.expect)(validation.violations[0].element).toBe("circle");
                        (0, vitest_1.expect)(validation.violations[0].issue).toContain("fill");
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should enforce element count limits", function () { return __awaiter(void 0, void 0, void 0, function () {
            var manyElementsSVG, validation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        manyElementsSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n          ".concat(Array.from({ length: 15 }, function (_, i) { return "<circle cx=\"".concat(i * 5, "\" cy=\"").concat(i * 5, "\" r=\"2\" fill=\"blue\" />"); }).join("\n"), "\n        </svg>\n      ");
                        return [4 /*yield*/, qualityGate.validateElementCount(manyElementsSVG, {
                                maxElements: 10,
                            })];
                    case 1:
                        validation = _a.sent();
                        (0, vitest_1.expect)(validation.passed).toBe(false);
                        (0, vitest_1.expect)(validation.elementCount).toBe(15);
                        (0, vitest_1.expect)(validation.maxAllowed).toBe(10);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate component reuse efficiency", function () { return __awaiter(void 0, void 0, void 0, function () {
            var reusedComponentsSVG, validation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        reusedComponentsSVG = "\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n          <defs>\n            <g id=\"star\">\n              <polygon points=\"50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35\" />\n            </g>\n          </defs>\n          <use href=\"#star\" x=\"0\" y=\"0\" />\n          <use href=\"#star\" x=\"50\" y=\"50\" />\n        </svg>\n      ";
                        return [4 /*yield*/, qualityGate.validateComponentReuse(reusedComponentsSVG)];
                    case 1:
                        validation = _a.sent();
                        (0, vitest_1.expect)(validation.passed).toBe(true);
                        (0, vitest_1.expect)(validation.reuseRatio).toBeGreaterThan(0.5);
                        (0, vitest_1.expect)(validation.reusedComponents).toContain("star");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("KB object compatibility testing", function () {
        (0, vitest_1.it)("should test object compatibility with canonical prompts", function () { return __awaiter(void 0, void 0, void 0, function () {
            var testObject, canonicalPrompts, compatibilityResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testObject = {
                            kind: "style_pack",
                            title: "Modern Minimalist",
                            body: {
                                colors: ["#000000", "#ffffff", "#808080"],
                                description: "Clean, modern aesthetic with minimal color palette",
                            },
                            tags: ["modern", "minimal", "monochrome"],
                            version: "1.0.0",
                            status: "experimental",
                        };
                        canonicalPrompts = [
                            "modern minimalist design",
                            "black and white geometric shapes",
                            "clean simple layout",
                            "monochrome pattern",
                        ];
                        return [4 /*yield*/, kbManager.testObjectCompatibility(testObject, canonicalPrompts)];
                    case 1:
                        compatibilityResult = _a.sent();
                        (0, vitest_1.expect)(compatibilityResult.totalTests).toBe(canonicalPrompts.length);
                        (0, vitest_1.expect)(compatibilityResult.passedTests).toBeGreaterThan(0);
                        (0, vitest_1.expect)(compatibilityResult.compatibilityScore).toBeGreaterThan(0);
                        (0, vitest_1.expect)(compatibilityResult.compatibilityScore).toBeLessThanOrEqual(1);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should identify incompatible objects", function () { return __awaiter(void 0, void 0, void 0, function () {
            var incompatibleObject, canonicalPrompts, compatibilityResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        incompatibleObject = {
                            kind: "motif",
                            title: "Broken Motif",
                            body: {
                                shape: "invalid_shape_type",
                                properties: { invalid: "structure" },
                            },
                            tags: ["broken", "invalid"],
                            version: "1.0.0",
                            status: "experimental",
                        };
                        canonicalPrompts = [
                            "geometric circle",
                            "simple square",
                            "basic triangle",
                        ];
                        return [4 /*yield*/, kbManager.testObjectCompatibility(incompatibleObject, canonicalPrompts)];
                    case 1:
                        compatibilityResult = _a.sent();
                        (0, vitest_1.expect)(compatibilityResult.compatibilityScore).toBeLessThan(0.5);
                        (0, vitest_1.expect)(compatibilityResult.issues).toBeDefined();
                        (0, vitest_1.expect)(compatibilityResult.issues.length).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should validate object structure before testing", function () { return __awaiter(void 0, void 0, void 0, function () {
            var malformedObject;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        malformedObject = {
                            kind: "rule",
                            // Missing required fields
                            body: null,
                            tags: [],
                            version: "invalid",
                        };
                        return [4 /*yield*/, (0, vitest_1.expect)(kbManager.testObjectCompatibility(malformedObject, ["test"])).rejects.toThrow(/invalid.*object.*structure/i)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should provide detailed compatibility feedback", function () { return __awaiter(void 0, void 0, void 0, function () {
            var testObject, canonicalPrompts, compatibilityResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        testObject = {
                            kind: "fewshot",
                            title: "Circle Example",
                            body: {
                                prompt: "blue circle",
                                response: '<circle cx="50" cy="50" r="40" fill="blue" />',
                            },
                            tags: ["circle", "blue", "example"],
                            version: "1.0.0",
                            status: "experimental",
                        };
                        canonicalPrompts = [
                            "blue circle",
                            "red circle",
                            "blue square",
                            "green triangle",
                        ];
                        return [4 /*yield*/, kbManager.testObjectCompatibility(testObject, canonicalPrompts)];
                    case 1:
                        compatibilityResult = _a.sent();
                        (0, vitest_1.expect)(compatibilityResult.detailedResults).toBeDefined();
                        (0, vitest_1.expect)(compatibilityResult.detailedResults).toHaveLength(canonicalPrompts.length);
                        compatibilityResult.detailedResults.forEach(function (result, index) {
                            (0, vitest_1.expect)(result.prompt).toBe(canonicalPrompts[index]);
                            (0, vitest_1.expect)(result.passed).toBeDefined();
                            (0, vitest_1.expect)(result.score).toBeGreaterThanOrEqual(0);
                            (0, vitest_1.expect)(result.score).toBeLessThanOrEqual(1);
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, vitest_1.describe)("Repair loop integration", function () {
        (0, vitest_1.it)("should integrate validation and repair in pipeline", function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidDocument, repairPipeline, currentDoc, attempts, success, validation, repairResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidDocument = {
                            svg: '<svg><circle cx="50" cy="50" r="40" stroke-width="0.5" /></svg>',
                            metadata: { prompt: "test circle" },
                            layers: [],
                        };
                        repairPipeline = {
                            validate: function (doc) { return qualityGate.validateDocument(doc); },
                            repair: function (doc) { return synthesizer.repairDocument(doc); },
                            maxAttempts: 2,
                        };
                        currentDoc = invalidDocument;
                        attempts = 0;
                        success = false;
                        _a.label = 1;
                    case 1:
                        if (!(attempts < repairPipeline.maxAttempts && !success)) return [3 /*break*/, 4];
                        return [4 /*yield*/, repairPipeline.validate(currentDoc)];
                    case 2:
                        validation = _a.sent();
                        if (validation.passed) {
                            success = true;
                            return [3 /*break*/, 4];
                        }
                        return [4 /*yield*/, repairPipeline.repair(currentDoc)];
                    case 3:
                        repairResult = _a.sent();
                        if (repairResult.success) {
                            currentDoc = repairResult.repairedDocument;
                        }
                        attempts++;
                        return [3 /*break*/, 1];
                    case 4:
                        (0, vitest_1.expect)(attempts).toBeLessThanOrEqual(repairPipeline.maxAttempts);
                        if (success) {
                            (0, vitest_1.expect)(currentDoc.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
                            (0, vitest_1.expect)(currentDoc.svg).toContain("viewBox=");
                            (0, vitest_1.expect)(currentDoc.svg).not.toMatch(/stroke-width="0\./);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should handle repair failures gracefully", function () { return __awaiter(void 0, void 0, void 0, function () {
            var unreparableSVG, repairResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        unreparableSVG = "\n        <svg>\n          <invalid-element with=\"malformed attributes\" />\n          <circle cx=\"NaN\" cy=\"undefined\" r=\"null\" />\n        </svg>\n      ";
                        return [4 /*yield*/, synthesizer.repairSVG(unreparableSVG, {
                                maxAttempts: 3,
                                strictMode: true,
                            })];
                    case 1:
                        repairResult = _a.sent();
                        (0, vitest_1.expect)(repairResult.attempts).toBe(3);
                        (0, vitest_1.expect)(repairResult.success).toBe(false);
                        (0, vitest_1.expect)(repairResult.finalErrors).toBeDefined();
                        (0, vitest_1.expect)(repairResult.fallbackRecommended).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
        (0, vitest_1.it)("should track repair statistics", function () { return __awaiter(void 0, void 0, void 0, function () {
            var testSVGs, repairStats, _i, testSVGs_1, svg, repairResult;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        testSVGs = [
                            '<svg><circle cx="50" cy="50" r="40" /></svg>', // Missing xmlns, viewBox
                            '<svg xmlns="http://www.w3.org/2000/svg"><rect stroke-width="0.1" /></svg>', // Missing viewBox, invalid stroke
                            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle /></svg>', // Valid structure, missing attributes
                        ];
                        repairStats = {
                            totalAttempts: 0,
                            successfulRepairs: 0,
                            failedRepairs: 0,
                            commonIssues: {},
                        };
                        _i = 0, testSVGs_1 = testSVGs;
                        _b.label = 1;
                    case 1:
                        if (!(_i < testSVGs_1.length)) return [3 /*break*/, 4];
                        svg = testSVGs_1[_i];
                        return [4 /*yield*/, synthesizer.repairSVG(svg)];
                    case 2:
                        repairResult = _b.sent();
                        repairStats.totalAttempts++;
                        if (repairResult.success) {
                            repairStats.successfulRepairs++;
                        }
                        else {
                            repairStats.failedRepairs++;
                        }
                        (_a = repairResult.repairsApplied) === null || _a === void 0 ? void 0 : _a.forEach(function (repair) {
                            repairStats.commonIssues[repair] =
                                (repairStats.commonIssues[repair] || 0) + 1;
                        });
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        (0, vitest_1.expect)(repairStats.totalAttempts).toBe(testSVGs.length);
                        (0, vitest_1.expect)(repairStats.successfulRepairs + repairStats.failedRepairs).toBe(repairStats.totalAttempts);
                        (0, vitest_1.expect)(Object.keys(repairStats.commonIssues).length).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
