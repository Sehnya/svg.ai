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
exports.LLMIntentNormalizer = void 0;
var pipeline_js_1 = require("../schemas/pipeline.js");
var IntentNormalizer_js_1 = require("./IntentNormalizer.js");
var LLMIntentNormalizer = /** @class */ (function (_super) {
    __extends(LLMIntentNormalizer, _super);
    function LLMIntentNormalizer(config) {
        var _this = _super.call(this) || this;
        _this.llmConfig = config;
        _this.fallbackNormalizer = new IntentNormalizer_js_1.IntentNormalizer();
        return _this;
    }
    LLMIntentNormalizer.prototype.normalize = function (prompt, context, grounding) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.normalizeWithLLM(prompt, context, grounding)];
                    case 1: 
                    // Try LLM-powered normalization first
                    return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        console.warn("LLM normalization failed, falling back to rule-based:", error_1);
                        // Fallback to rule-based normalization
                        return [2 /*return*/, this.fallbackNormalizer.normalize(prompt, context)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    LLMIntentNormalizer.prototype.normalizeWithLLM = function (prompt, context, grounding) {
        return __awaiter(this, void 0, void 0, function () {
            var systemPrompt, userPrompt, response, intent, validationResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        systemPrompt = this.buildSystemPrompt(grounding);
                        userPrompt = this.buildUserPrompt(prompt, context);
                        return [4 /*yield*/, this.callLLM(systemPrompt, userPrompt)];
                    case 1:
                        response = _a.sent();
                        intent = this.parseResponse(response);
                        validationResult = pipeline_js_1.DesignIntentSchema.safeParse(intent);
                        if (!validationResult.success) {
                            throw new Error("Invalid design intent from LLM: ".concat(validationResult.error.message));
                        }
                        return [2 /*return*/, intent];
                }
            });
        });
    };
    LLMIntentNormalizer.prototype.buildSystemPrompt = function (grounding) {
        var systemPrompt = "You are an expert SVG design intent analyzer. Your task is to convert natural language prompts into structured design specifications for SVG generation.\n\nYou must respond with a valid JSON object that matches this exact schema:\n\n{\n  \"style\": {\n    \"palette\": [\"#color1\", \"#color2\", ...], // Array of hex colors (1-10 colors)\n    \"strokeRules\": {\n      \"strokeOnly\": boolean, // true if only outlines/strokes should be used\n      \"minStrokeWidth\": number, // minimum stroke width (0.1-10)\n      \"maxStrokeWidth\": number, // maximum stroke width (0.1-20)\n      \"allowFill\": boolean // whether fills are allowed\n    },\n    \"density\": \"sparse\" | \"medium\" | \"dense\", // visual complexity\n    \"symmetry\": \"none\" | \"horizontal\" | \"vertical\" | \"radial\" // symmetry type\n  },\n  \"motifs\": [\"motif1\", \"motif2\", ...], // Array of design elements/shapes (max 20)\n  \"layout\": {\n    \"sizes\": [{\"type\": \"string\", \"minSize\": number, \"maxSize\": number, \"aspectRatio\"?: number}],\n    \"counts\": [{\"type\": \"string\", \"min\": number, \"max\": number, \"preferred\": number}],\n    \"arrangement\": \"grid\" | \"organic\" | \"centered\" | \"scattered\" // layout style\n  },\n  \"constraints\": {\n    \"strokeOnly\": boolean, // must match strokeRules.strokeOnly\n    \"maxElements\": number, // maximum number of elements (1-100)\n    \"requiredMotifs\": [\"motif1\", ...] // motifs that must be present (max 10)\n  }\n}\n\nGuidelines:\n- Extract colors mentioned in the prompt or use appropriate defaults\n- Identify visual style keywords (minimal, detailed, clean, complex, etc.)\n- Recognize arrangement preferences (grid, scattered, centered, organic)\n- Detect symmetry requirements\n- List all mentioned shapes, objects, or design elements as motifs\n- Set appropriate element counts based on complexity\n- Ensure strokeOnly constraint matches strokeRules.strokeOnly";
        // Add grounding context if available
        if (grounding === null || grounding === void 0 ? void 0 : grounding.stylePack) {
            systemPrompt += "\n\nAvailable style pack: ".concat(JSON.stringify(grounding.stylePack));
        }
        if ((grounding === null || grounding === void 0 ? void 0 : grounding.motifs) && grounding.motifs.length > 0) {
            systemPrompt += "\n\nAvailable motifs: ".concat(grounding.motifs.map(function (m) { return m.name || m.type; }).join(", "));
        }
        if ((grounding === null || grounding === void 0 ? void 0 : grounding.glossary) && grounding.glossary.length > 0) {
            systemPrompt += "\n\nDesign glossary: ".concat(grounding.glossary.map(function (g) { return g.term + ": " + g.definition; }).join("; "));
        }
        return systemPrompt;
    };
    LLMIntentNormalizer.prototype.buildUserPrompt = function (prompt, context) {
        var userPrompt = "Convert this prompt into structured design intent: \"".concat(prompt, "\"");
        if (context === null || context === void 0 ? void 0 : context.defaultPalette) {
            userPrompt += "\n\nDefault palette: ".concat(context.defaultPalette.join(", "));
        }
        if (context === null || context === void 0 ? void 0 : context.defaultSize) {
            userPrompt += "\n\nTarget size: ".concat(context.defaultSize.width, "x").concat(context.defaultSize.height);
        }
        userPrompt += "\n\nRespond with valid JSON only, no additional text.";
        return userPrompt;
    };
    LLMIntentNormalizer.prototype.callLLM = function (systemPrompt, userPrompt) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.llmConfig.apiKey) {
                            throw new Error("OpenAI API key not configured");
                        }
                        return [4 /*yield*/, fetch("https://api.openai.com/v1/chat/completions", {
                                method: "POST",
                                headers: {
                                    Authorization: "Bearer ".concat(this.llmConfig.apiKey),
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    model: this.llmConfig.model,
                                    messages: [
                                        { role: "system", content: systemPrompt },
                                        { role: "user", content: userPrompt },
                                    ],
                                    temperature: this.llmConfig.temperature,
                                    max_tokens: this.llmConfig.maxTokens,
                                    response_format: { type: "json_object" },
                                }),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        error = _a.sent();
                        throw new Error("OpenAI API error: ".concat(response.status, " ").concat(error));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        data = _a.sent();
                        if (!data.choices || data.choices.length === 0) {
                            throw new Error("No response from OpenAI API");
                        }
                        return [2 /*return*/, data.choices[0].message.content];
                }
            });
        });
    };
    LLMIntentNormalizer.prototype.parseResponse = function (response) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        try {
            var parsed = JSON.parse(response);
            // Ensure required fields are present with defaults
            var intent = {
                style: {
                    palette: ((_a = parsed.style) === null || _a === void 0 ? void 0 : _a.palette) || ["#2563eb", "#16a34a", "#eab308"],
                    strokeRules: {
                        strokeOnly: ((_c = (_b = parsed.style) === null || _b === void 0 ? void 0 : _b.strokeRules) === null || _c === void 0 ? void 0 : _c.strokeOnly) || false,
                        minStrokeWidth: ((_e = (_d = parsed.style) === null || _d === void 0 ? void 0 : _d.strokeRules) === null || _e === void 0 ? void 0 : _e.minStrokeWidth) || 1,
                        maxStrokeWidth: ((_g = (_f = parsed.style) === null || _f === void 0 ? void 0 : _f.strokeRules) === null || _g === void 0 ? void 0 : _g.maxStrokeWidth) || 3,
                        allowFill: ((_j = (_h = parsed.style) === null || _h === void 0 ? void 0 : _h.strokeRules) === null || _j === void 0 ? void 0 : _j.allowFill) !== false,
                    },
                    density: ((_k = parsed.style) === null || _k === void 0 ? void 0 : _k.density) || "medium",
                    symmetry: ((_l = parsed.style) === null || _l === void 0 ? void 0 : _l.symmetry) || "none",
                },
                motifs: parsed.motifs || [],
                layout: {
                    sizes: ((_m = parsed.layout) === null || _m === void 0 ? void 0 : _m.sizes) || [
                        { type: "default", minSize: 50, maxSize: 150 },
                    ],
                    counts: ((_o = parsed.layout) === null || _o === void 0 ? void 0 : _o.counts) || [
                        { type: "element", min: 3, max: 7, preferred: 5 },
                    ],
                    arrangement: ((_p = parsed.layout) === null || _p === void 0 ? void 0 : _p.arrangement) || "centered",
                },
                constraints: {
                    strokeOnly: ((_q = parsed.constraints) === null || _q === void 0 ? void 0 : _q.strokeOnly) ||
                        ((_s = (_r = parsed.style) === null || _r === void 0 ? void 0 : _r.strokeRules) === null || _s === void 0 ? void 0 : _s.strokeOnly) ||
                        false,
                    maxElements: ((_t = parsed.constraints) === null || _t === void 0 ? void 0 : _t.maxElements) || 25,
                    requiredMotifs: ((_u = parsed.constraints) === null || _u === void 0 ? void 0 : _u.requiredMotifs) || [],
                },
            };
            return intent;
        }
        catch (error) {
            throw new Error("Failed to parse LLM response: ".concat(error));
        }
    };
    // Enhanced normalization with few-shot examples
    LLMIntentNormalizer.prototype.normalizeWithFewShot = function (prompt, context, grounding) {
        return __awaiter(this, void 0, void 0, function () {
            var examples, systemPrompt, userPrompt, response, intent, validationResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        examples = this.getFewShotExamples(grounding);
                        systemPrompt = this.buildSystemPrompt(grounding) + "\n\n" + examples;
                        userPrompt = this.buildUserPrompt(prompt, context);
                        return [4 /*yield*/, this.callLLM(systemPrompt, userPrompt)];
                    case 1:
                        response = _a.sent();
                        intent = this.parseResponse(response);
                        validationResult = pipeline_js_1.DesignIntentSchema.safeParse(intent);
                        if (!validationResult.success) {
                            throw new Error("Invalid design intent from LLM: ".concat(validationResult.error.message));
                        }
                        return [2 /*return*/, intent];
                }
            });
        });
    };
    LLMIntentNormalizer.prototype.getFewShotExamples = function (grounding) {
        var examples = "Here are some examples:\n\n";
        // Default examples
        examples += "Example 1:\nInput: \"blue circle with red outline\"\nOutput: {\n  \"style\": {\n    \"palette\": [\"#2563eb\", \"#dc2626\"],\n    \"strokeRules\": {\"strokeOnly\": false, \"minStrokeWidth\": 1, \"maxStrokeWidth\": 3, \"allowFill\": true},\n    \"density\": \"sparse\",\n    \"symmetry\": \"none\"\n  },\n  \"motifs\": [\"circle\"],\n  \"layout\": {\n    \"sizes\": [{\"type\": \"circle\", \"minSize\": 50, \"maxSize\": 100}],\n    \"counts\": [{\"type\": \"element\", \"min\": 1, \"max\": 1, \"preferred\": 1}],\n    \"arrangement\": \"centered\"\n  },\n  \"constraints\": {\"strokeOnly\": false, \"maxElements\": 5, \"requiredMotifs\": [\"circle\"]}\n}\n\nExample 2:\nInput: \"geometric pattern with triangles and squares in a grid\"\nOutput: {\n  \"style\": {\n    \"palette\": [\"#374151\", \"#6b7280\"],\n    \"strokeRules\": {\"strokeOnly\": false, \"minStrokeWidth\": 1, \"maxStrokeWidth\": 2, \"allowFill\": true},\n    \"density\": \"medium\",\n    \"symmetry\": \"none\"\n  },\n  \"motifs\": [\"triangle\", \"square\", \"geometric\"],\n  \"layout\": {\n    \"sizes\": [{\"type\": \"shape\", \"minSize\": 30, \"maxSize\": 60}],\n    \"counts\": [{\"type\": \"element\", \"min\": 6, \"max\": 12, \"preferred\": 9}],\n    \"arrangement\": \"grid\"\n  },\n  \"constraints\": {\"strokeOnly\": false, \"maxElements\": 15, \"requiredMotifs\": [\"triangle\", \"square\"]}\n}";
        // Add grounding-specific examples if available
        if ((grounding === null || grounding === void 0 ? void 0 : grounding.fewshot) && grounding.fewshot.length > 0) {
            examples += "\n\nAdditional examples from knowledge base:\n";
            grounding.fewshot.forEach(function (example, i) {
                examples += "\nExample ".concat(i + 3, ":\n").concat(JSON.stringify(example, null, 2));
            });
        }
        return examples;
    };
    return LLMIntentNormalizer;
}(IntentNormalizer_js_1.IntentNormalizer));
exports.LLMIntentNormalizer = LLMIntentNormalizer;
