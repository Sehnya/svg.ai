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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIGenerator = void 0;
var openai_1 = require("openai");
var SVGGenerator_1 = require("./SVGGenerator");
var SVGSanitizer_1 = require("./SVGSanitizer");
var LayerAnalyzer_1 = require("./LayerAnalyzer");
var RuleBasedGenerator_1 = require("./RuleBasedGenerator");
var OpenAIGenerator = /** @class */ (function (_super) {
    __extends(OpenAIGenerator, _super);
    function OpenAIGenerator(apiKey) {
        var _this = _super.call(this) || this;
        if (!apiKey && !process.env.OPENAI_API_KEY) {
            throw new Error("OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass it to constructor.");
        }
        _this.openai = new openai_1.default({
            apiKey: apiKey || process.env.OPENAI_API_KEY,
        });
        _this.sanitizer = new SVGSanitizer_1.SVGSanitizer();
        _this.layerAnalyzer = new LayerAnalyzer_1.LayerAnalyzer();
        _this.fallbackGenerator = new RuleBasedGenerator_1.RuleBasedGenerator();
        return _this;
    }
    OpenAIGenerator.prototype.generate = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var validation, seed, _a, width, height, colors, openaiResult, sanitizationResult, metadata, layers, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        validation = this.validateRequest(request);
                        if (!validation.success) {
                            return [2 /*return*/, {
                                    svg: "",
                                    meta: this.createEmptyMetadata(),
                                    layers: [],
                                    warnings: [],
                                    errors: validation.errors,
                                }];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        seed = request.seed || this.generateSeed();
                        _a = request.size, width = _a.width, height = _a.height;
                        colors = request.palette || this.getDefaultPalette();
                        return [4 /*yield*/, this.generateWithOpenAI(request, seed)];
                    case 2:
                        openaiResult = _b.sent();
                        if (openaiResult.success && openaiResult.svg) {
                            sanitizationResult = this.sanitizer.sanitize(openaiResult.svg);
                            if (sanitizationResult.isValid) {
                                metadata = this.generateMetadata(width, height, colors, seed, request.prompt);
                                layers = this.layerAnalyzer.analyze(sanitizationResult.sanitizedSVG);
                                return [2 /*return*/, {
                                        svg: sanitizationResult.sanitizedSVG,
                                        meta: metadata,
                                        layers: layers,
                                        warnings: __spreadArray(__spreadArray([], sanitizationResult.warnings, true), (openaiResult.warnings || []), true),
                                        errors: [],
                                    }];
                            }
                            else {
                                // If sanitization fails, fall back to rule-based
                                console.warn("OpenAI SVG failed sanitization, falling back to rule-based generation");
                                return [2 /*return*/, this.fallbackToRuleBased(request, __spreadArray([
                                        "OpenAI SVG failed sanitization"
                                    ], sanitizationResult.errors, true))];
                            }
                        }
                        else {
                            // If OpenAI generation fails, fall back to rule-based
                            console.warn("OpenAI generation failed, falling back to rule-based generation");
                            return [2 /*return*/, this.fallbackToRuleBased(request, openaiResult.errors || ["OpenAI generation failed"])];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _b.sent();
                        console.error("OpenAI generation error:", error_1);
                        // Fall back to rule-based generation on any error
                        return [2 /*return*/, this.fallbackToRuleBased(request, [
                                "OpenAI error: ".concat(error_1 instanceof Error ? error_1.message : "Unknown error"),
                            ])];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OpenAIGenerator.prototype.generateWithOpenAI = function (request, seed) {
        return __awaiter(this, void 0, void 0, function () {
            var systemPrompt, userPrompt, completion, response, parsed, svg, error_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        systemPrompt = this.createSystemPrompt(request.size, request.palette);
                        userPrompt = this.createUserPrompt(request.prompt, seed);
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: "gpt-4o-mini",
                                messages: [
                                    { role: "system", content: systemPrompt },
                                    { role: "user", content: userPrompt },
                                ],
                                temperature: 0.7,
                                max_tokens: 2000,
                                response_format: { type: "json_object" },
                            })];
                    case 1:
                        completion = _c.sent();
                        response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!response) {
                            return [2 /*return*/, { success: false, errors: ["No response from OpenAI"] }];
                        }
                        try {
                            parsed = JSON.parse(response);
                            if (!parsed.elements || !Array.isArray(parsed.elements)) {
                                return [2 /*return*/, {
                                        success: false,
                                        errors: [
                                            "Invalid JSON structure from OpenAI - missing elements array",
                                        ],
                                    }];
                            }
                            svg = this.generateSVGFromJSON(parsed, request.size);
                            return [2 /*return*/, {
                                    success: true,
                                    svg: svg,
                                    warnings: parsed.warnings || [],
                                }];
                        }
                        catch (parseError) {
                            return [2 /*return*/, {
                                    success: false,
                                    errors: [
                                        "Failed to parse OpenAI response: ".concat(parseError instanceof Error ? parseError.message : "Unknown error"),
                                    ],
                                }];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _c.sent();
                        if (error_2 instanceof Error && error_2.message.includes("rate limit")) {
                            return [2 /*return*/, { success: false, errors: ["OpenAI rate limit exceeded"] }];
                        }
                        return [2 /*return*/, {
                                success: false,
                                errors: [
                                    "OpenAI API error: ".concat(error_2 instanceof Error ? error_2.message : "Unknown error"),
                                ],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OpenAIGenerator.prototype.generateSVGFromJSON = function (jsonData, size) {
        var _this = this;
        var elements = jsonData.elements, background = jsonData.background;
        var svgContent = "";
        // Add background if specified
        if (background && background.type !== "none") {
            if (background.type === "solid" && background.color) {
                svgContent += "<rect width=\"100%\" height=\"100%\" fill=\"".concat(background.color, "\" id=\"background\"/>");
            }
            else if (background.type === "gradient" && background.gradient) {
                var _a = background.gradient, startColor = _a.startColor, endColor = _a.endColor, _b = _a.direction, direction = _b === void 0 ? "vertical" : _b;
                var gradientId = "bg-gradient";
                var x1 = "0%", y1 = "0%", x2 = "0%", y2 = "100%";
                if (direction === "horizontal") {
                    x1 = "0%";
                    y1 = "0%";
                    x2 = "100%";
                    y2 = "0%";
                }
                else if (direction === "diagonal") {
                    x1 = "0%";
                    y1 = "0%";
                    x2 = "100%";
                    y2 = "100%";
                }
                svgContent += "\n          <defs>\n            <linearGradient id=\"".concat(gradientId, "\" x1=\"").concat(x1, "\" y1=\"").concat(y1, "\" x2=\"").concat(x2, "\" y2=\"").concat(y2, "\">\n              <stop offset=\"0%\" style=\"stop-color:").concat(startColor, ";stop-opacity:1\" />\n              <stop offset=\"100%\" style=\"stop-color:").concat(endColor, ";stop-opacity:1\" />\n            </linearGradient>\n          </defs>\n          <rect width=\"100%\" height=\"100%\" fill=\"url(#").concat(gradientId, ")\" id=\"background\"/>");
            }
        }
        // Generate elements
        elements.forEach(function (element, index) {
            var elementSVG = _this.generateElementSVG(element, index);
            if (elementSVG) {
                svgContent += elementSVG;
            }
        });
        return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ".concat(size.width, " ").concat(size.height, "\" width=\"").concat(size.width, "\" height=\"").concat(size.height, "\">\n      ").concat(svgContent, "\n    </svg>");
    };
    OpenAIGenerator.prototype.generateElementSVG = function (element, index) {
        var id = element.id || "element-".concat(index);
        switch (element.type) {
            case "circle":
                return this.generateCircleElement(element, id);
            case "rectangle":
                return this.generateRectangleElement(element, id);
            case "polygon":
                return this.generatePolygonElement(element, id);
            case "path":
                return this.generatePathElement(element, id);
            case "ellipse":
                return this.generateEllipseElement(element, id);
            case "line":
                return this.generateLineElement(element, id);
            case "text":
                return this.generateTextElement(element, id);
            default:
                console.warn("Unknown element type: ".concat(element.type));
                return "";
        }
    };
    OpenAIGenerator.prototype.generateCircleElement = function (element, id) {
        var x = element.x, y = element.y, radius = element.radius, fill = element.fill, stroke = element.stroke, strokeWidth = element.strokeWidth;
        var attributes = "cx=\"".concat(this.limitPrecision(x), "\" cy=\"").concat(this.limitPrecision(y), "\" r=\"").concat(this.limitPrecision(radius), "\"");
        if (fill)
            attributes += " fill=\"".concat(fill, "\"");
        if (stroke)
            attributes += " stroke=\"".concat(stroke, "\"");
        if (strokeWidth && strokeWidth >= 1)
            attributes += " stroke-width=\"".concat(strokeWidth, "\"");
        return "<circle ".concat(attributes, " id=\"").concat(id, "\"/>");
    };
    OpenAIGenerator.prototype.generateRectangleElement = function (element, id) {
        var x = element.x, y = element.y, width = element.width, height = element.height, rx = element.rx, fill = element.fill, stroke = element.stroke, strokeWidth = element.strokeWidth;
        var attributes = "x=\"".concat(this.limitPrecision(x), "\" y=\"").concat(this.limitPrecision(y), "\" width=\"").concat(this.limitPrecision(width), "\" height=\"").concat(this.limitPrecision(height), "\"");
        if (rx)
            attributes += " rx=\"".concat(this.limitPrecision(rx), "\"");
        if (fill)
            attributes += " fill=\"".concat(fill, "\"");
        if (stroke)
            attributes += " stroke=\"".concat(stroke, "\"");
        if (strokeWidth && strokeWidth >= 1)
            attributes += " stroke-width=\"".concat(strokeWidth, "\"");
        return "<rect ".concat(attributes, " id=\"").concat(id, "\"/>");
    };
    OpenAIGenerator.prototype.generatePolygonElement = function (element, id) {
        var _this = this;
        var points = element.points, fill = element.fill, stroke = element.stroke, strokeWidth = element.strokeWidth;
        if (!Array.isArray(points) || points.length < 3) {
            console.warn("Invalid polygon points");
            return "";
        }
        var pointsStr = points
            .map(function (point) {
            return "".concat(_this.limitPrecision(point[0]), ",").concat(_this.limitPrecision(point[1]));
        })
            .join(" ");
        var attributes = "points=\"".concat(pointsStr, "\"");
        if (fill)
            attributes += " fill=\"".concat(fill, "\"");
        if (stroke)
            attributes += " stroke=\"".concat(stroke, "\"");
        if (strokeWidth && strokeWidth >= 1)
            attributes += " stroke-width=\"".concat(strokeWidth, "\"");
        return "<polygon ".concat(attributes, " id=\"").concat(id, "\"/>");
    };
    OpenAIGenerator.prototype.generatePathElement = function (element, id) {
        var d = element.d, fill = element.fill, stroke = element.stroke, strokeWidth = element.strokeWidth;
        if (!d) {
            console.warn("Path element missing d attribute");
            return "";
        }
        var attributes = "d=\"".concat(d, "\"");
        if (fill !== undefined)
            attributes += " fill=\"".concat(fill, "\"");
        if (stroke)
            attributes += " stroke=\"".concat(stroke, "\"");
        if (strokeWidth && strokeWidth >= 1)
            attributes += " stroke-width=\"".concat(strokeWidth, "\"");
        return "<path ".concat(attributes, " id=\"").concat(id, "\"/>");
    };
    OpenAIGenerator.prototype.generateEllipseElement = function (element, id) {
        var cx = element.cx, cy = element.cy, rx = element.rx, ry = element.ry, fill = element.fill, stroke = element.stroke, strokeWidth = element.strokeWidth;
        var attributes = "cx=\"".concat(this.limitPrecision(cx), "\" cy=\"").concat(this.limitPrecision(cy), "\" rx=\"").concat(this.limitPrecision(rx), "\" ry=\"").concat(this.limitPrecision(ry), "\"");
        if (fill)
            attributes += " fill=\"".concat(fill, "\"");
        if (stroke)
            attributes += " stroke=\"".concat(stroke, "\"");
        if (strokeWidth && strokeWidth >= 1)
            attributes += " stroke-width=\"".concat(strokeWidth, "\"");
        return "<ellipse ".concat(attributes, " id=\"").concat(id, "\"/>");
    };
    OpenAIGenerator.prototype.generateLineElement = function (element, id) {
        var x1 = element.x1, y1 = element.y1, x2 = element.x2, y2 = element.y2, stroke = element.stroke, strokeWidth = element.strokeWidth;
        var attributes = "x1=\"".concat(this.limitPrecision(x1), "\" y1=\"").concat(this.limitPrecision(y1), "\" x2=\"").concat(this.limitPrecision(x2), "\" y2=\"").concat(this.limitPrecision(y2), "\"");
        attributes += " stroke=\"".concat(stroke || "#000000", "\"");
        attributes += " stroke-width=\"".concat(strokeWidth && strokeWidth >= 1 ? strokeWidth : 1, "\"");
        return "<line ".concat(attributes, " id=\"").concat(id, "\"/>");
    };
    OpenAIGenerator.prototype.generateTextElement = function (element, id) {
        var x = element.x, y = element.y, content = element.content, fontSize = element.fontSize, fill = element.fill, fontFamily = element.fontFamily;
        var attributes = "x=\"".concat(this.limitPrecision(x), "\" y=\"").concat(this.limitPrecision(y), "\"");
        if (fontSize)
            attributes += " font-size=\"".concat(fontSize, "\"");
        if (fill)
            attributes += " fill=\"".concat(fill, "\"");
        if (fontFamily)
            attributes += " font-family=\"".concat(fontFamily, "\"");
        return "<text ".concat(attributes, " id=\"").concat(id, "\">").concat(content || "", "</text>");
    };
    OpenAIGenerator.prototype.createSystemPrompt = function (size, palette) {
        var paletteText = palette
            ? "Available colors: ".concat(palette.join(", "))
            : "Use appropriate colors for the design";
        return "You are an SVG Shape Planner. Output STRICT JSON that matches the provided JSON Schema.\n\nCANVAS: ".concat(size.width, "x").concat(size.height, "\n").concat(paletteText, "\n\nRULES:\n- Think in terms of basic primitives (rect, circle, ellipse, line, polyline, polygon, path, text)\n- All colors must be valid CSS color strings or \"url(#gradientId)\" for gradients\n- Prefer simple coordinates and whole numbers unless smoothness is required\n- Avoid excessive elements; keep it minimal and clean\n- Never include explanations or markdown\u2014ONLY the JSON that validates\n- Ensure the composition fits within the width/height bounds\n\nJSON SCHEMA:\n{\n  \"type\": \"object\",\n  \"properties\": {\n    \"elements\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"oneOf\": [\n          {\n            \"type\": \"object\",\n            \"properties\": {\n              \"type\": {\"const\": \"rect\"},\n              \"id\": {\"type\": \"string\"},\n              \"x\": {\"type\": \"number\"},\n              \"y\": {\"type\": \"number\"},\n              \"width\": {\"type\": \"number\"},\n              \"height\": {\"type\": \"number\"},\n              \"rx\": {\"type\": \"number\"},\n              \"fill\": {\"type\": \"string\"},\n              \"stroke\": {\"type\": \"string\"},\n              \"strokeWidth\": {\"type\": \"number\", \"minimum\": 1}\n            },\n            \"required\": [\"type\", \"id\", \"x\", \"y\", \"width\", \"height\"]\n          },\n          {\n            \"type\": \"object\",\n            \"properties\": {\n              \"type\": {\"const\": \"circle\"},\n              \"id\": {\"type\": \"string\"},\n              \"cx\": {\"type\": \"number\"},\n              \"cy\": {\"type\": \"number\"},\n              \"r\": {\"type\": \"number\"},\n              \"fill\": {\"type\": \"string\"},\n              \"stroke\": {\"type\": \"string\"},\n              \"strokeWidth\": {\"type\": \"number\", \"minimum\": 1}\n            },\n            \"required\": [\"type\", \"id\", \"cx\", \"cy\", \"r\"]\n          },\n          {\n            \"type\": \"object\",\n            \"properties\": {\n              \"type\": {\"const\": \"polygon\"},\n              \"id\": {\"type\": \"string\"},\n              \"points\": {\"type\": \"string\"},\n              \"fill\": {\"type\": \"string\"},\n              \"stroke\": {\"type\": \"string\"},\n              \"strokeWidth\": {\"type\": \"number\", \"minimum\": 1}\n            },\n            \"required\": [\"type\", \"id\", \"points\"]\n          },\n          {\n            \"type\": \"object\",\n            \"properties\": {\n              \"type\": {\"const\": \"path\"},\n              \"id\": {\"type\": \"string\"},\n              \"d\": {\"type\": \"string\"},\n              \"fill\": {\"type\": \"string\"},\n              \"stroke\": {\"type\": \"string\"},\n              \"strokeWidth\": {\"type\": \"number\", \"minimum\": 1}\n            },\n            \"required\": [\"type\", \"id\", \"d\"]\n          },\n          {\n            \"type\": \"object\",\n            \"properties\": {\n              \"type\": {\"const\": \"ellipse\"},\n              \"id\": {\"type\": \"string\"},\n              \"cx\": {\"type\": \"number\"},\n              \"cy\": {\"type\": \"number\"},\n              \"rx\": {\"type\": \"number\"},\n              \"ry\": {\"type\": \"number\"},\n              \"fill\": {\"type\": \"string\"},\n              \"stroke\": {\"type\": \"string\"},\n              \"strokeWidth\": {\"type\": \"number\", \"minimum\": 1}\n            },\n            \"required\": [\"type\", \"id\", \"cx\", \"cy\", \"rx\", \"ry\"]\n          },\n          {\n            \"type\": \"object\",\n            \"properties\": {\n              \"type\": {\"const\": \"line\"},\n              \"id\": {\"type\": \"string\"},\n              \"x1\": {\"type\": \"number\"},\n              \"y1\": {\"type\": \"number\"},\n              \"x2\": {\"type\": \"number\"},\n              \"y2\": {\"type\": \"number\"},\n              \"stroke\": {\"type\": \"string\"},\n              \"strokeWidth\": {\"type\": \"number\", \"minimum\": 1}\n            },\n            \"required\": [\"type\", \"id\", \"x1\", \"y1\", \"x2\", \"y2\", \"stroke\"]\n          }\n        ]\n      }\n    },\n    \"gradients\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\"type\": \"string\"},\n          \"type\": {\"enum\": [\"linear\", \"radial\"]},\n          \"stops\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"object\",\n              \"properties\": {\n                \"offset\": {\"type\": \"string\"},\n                \"color\": {\"type\": \"string\"}\n              },\n              \"required\": [\"offset\", \"color\"]\n            }\n          },\n          \"x1\": {\"type\": \"string\"},\n          \"y1\": {\"type\": \"string\"},\n          \"x2\": {\"type\": \"string\"},\n          \"y2\": {\"type\": \"string\"}\n        },\n        \"required\": [\"id\", \"type\", \"stops\"]\n      }\n    }\n  },\n  \"required\": [\"elements\"]\n}");
    };
    OpenAIGenerator.prototype.createUserPrompt = function (prompt, seed) {
        return "Analyze this design request and return a JSON structure describing the SVG elements: \"".concat(prompt, "\"\n\nANALYSIS REQUIREMENTS:\n- Break down the prompt into specific visual elements\n- Determine appropriate shapes, positions, sizes, and colors\n- Consider composition and visual hierarchy\n- Use seed ").concat(seed, " for any randomization decisions\n- Think about how to best represent the concept visually\n\nEXAMPLES:\n- \"red star\" \u2192 single star polygon element\n- \"blue house with yellow door\" \u2192 rectangle for house, triangle for roof, smaller rectangle for door\n- \"abstract geometric pattern\" \u2192 multiple shapes with interesting arrangements\n- \"flower with petals\" \u2192 central circle + multiple ellipses arranged radially\n\nFocus on creating a clear, structured representation that captures the essence of the request.");
    };
    OpenAIGenerator.prototype.fallbackToRuleBased = function (request, warnings) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fallbackGenerator.generate(request)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, __assign(__assign({}, result), { warnings: __spreadArray(__spreadArray(__spreadArray([], warnings, true), result.warnings, true), [
                                    "Fell back to rule-based generation",
                                ], false) })];
                }
            });
        });
    };
    OpenAIGenerator.prototype.generateMetadata = function (width, height, colors, seed, prompt) {
        return {
            width: width,
            height: height,
            viewBox: "0 0 ".concat(width, " ").concat(height),
            backgroundColor: "transparent",
            palette: colors,
            description: "AI-generated SVG based on prompt: \"".concat(prompt, "\""),
            seed: seed,
        };
    };
    OpenAIGenerator.prototype.getDefaultPalette = function () {
        return ["#3B82F6", "#1E40AF", "#1D4ED8"];
    };
    OpenAIGenerator.prototype.createEmptyMetadata = function () {
        return {
            width: 0,
            height: 0,
            viewBox: "0 0 0 0",
            backgroundColor: "transparent",
            palette: [],
            description: "",
            seed: 0,
        };
    };
    return OpenAIGenerator;
}(SVGGenerator_1.SVGGenerator));
exports.OpenAIGenerator = OpenAIGenerator;
