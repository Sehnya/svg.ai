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
exports.RuleBasedGenerator = void 0;
var SVGGenerator_1 = require("./SVGGenerator");
var SVGSanitizer_1 = require("./SVGSanitizer");
var LayerAnalyzer_1 = require("./LayerAnalyzer");
var RuleBasedGenerator = /** @class */ (function (_super) {
    __extends(RuleBasedGenerator, _super);
    function RuleBasedGenerator() {
        var _this = _super.call(this) || this;
        _this.sanitizer = new SVGSanitizer_1.SVGSanitizer();
        _this.layerAnalyzer = new LayerAnalyzer_1.LayerAnalyzer();
        _this.templates = _this.initializeTemplates();
        return _this;
    }
    RuleBasedGenerator.prototype.generate = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var validation, seed, _a, width, height, colors, template, svgContent, sanitizationResult, metadata, layers;
            return __generator(this, function (_b) {
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
                try {
                    seed = request.seed || this.generateSeed();
                    _a = request.size, width = _a.width, height = _a.height;
                    colors = request.palette || this.getDefaultPalette();
                    template = this.selectTemplate(request.prompt);
                    svgContent = this.generateSVGContent(template, width, height, colors, seed, request.prompt);
                    sanitizationResult = this.sanitizer.sanitize(svgContent);
                    if (!sanitizationResult.isValid) {
                        return [2 /*return*/, {
                                svg: "",
                                meta: this.createEmptyMetadata(),
                                layers: [],
                                warnings: sanitizationResult.warnings,
                                errors: sanitizationResult.errors,
                            }];
                    }
                    metadata = this.generateMetadata(width, height, colors, seed, request.prompt);
                    layers = this.layerAnalyzer.analyze(sanitizationResult.sanitizedSVG);
                    return [2 /*return*/, {
                            svg: sanitizationResult.sanitizedSVG,
                            meta: metadata,
                            layers: layers,
                            warnings: sanitizationResult.warnings,
                            errors: [],
                        }];
                }
                catch (error) {
                    return [2 /*return*/, {
                            svg: "",
                            meta: this.createEmptyMetadata(),
                            layers: [],
                            warnings: [],
                            errors: [
                                "Generation error: ".concat(error instanceof Error ? error.message : "Unknown error"),
                            ],
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    RuleBasedGenerator.prototype.initializeTemplates = function () {
        var _this = this;
        return [
            // Basic shapes
            {
                name: "circle",
                keywords: ["circle", "round", "ball", "dot", "ring"],
                generator: function (width, height, colors, seed) {
                    return _this.generateCircle(width, height, colors, seed);
                },
            },
            {
                name: "rectangle",
                keywords: ["rectangle", "rect", "square", "box", "card"],
                generator: function (width, height, colors, seed) {
                    return _this.generateRectangle(width, height, colors, seed);
                },
            },
            {
                name: "triangle",
                keywords: ["triangle", "point", "peak"],
                generator: function (width, height, colors, seed) {
                    return _this.generateTriangle(width, height, colors, seed);
                },
            },
            // Polygonal shapes
            {
                name: "star",
                keywords: ["star", "asterisk", "sparkle", "pentagram"],
                generator: function (width, height, colors, seed) {
                    return _this.generateStar(width, height, colors, seed);
                },
            },
            {
                name: "hexagon",
                keywords: ["hexagon", "hex", "honeycomb"],
                generator: function (width, height, colors, seed) {
                    return _this.generateHexagon(width, height, colors, seed);
                },
            },
            {
                name: "pentagon",
                keywords: ["pentagon", "penta"],
                generator: function (width, height, colors, seed) {
                    return _this.generatePentagon(width, height, colors, seed);
                },
            },
            {
                name: "octagon",
                keywords: ["octagon", "octa", "stop"],
                generator: function (width, height, colors, seed) {
                    return _this.generateOctagon(width, height, colors, seed);
                },
            },
            {
                name: "diamond",
                keywords: ["diamond", "rhombus", "gem", "crystal"],
                generator: function (width, height, colors, seed) {
                    return _this.generateDiamond(width, height, colors, seed);
                },
            },
            // Freeform shapes
            {
                name: "heart",
                keywords: ["heart", "love", "valentine"],
                generator: function (width, height, colors, seed) {
                    return _this.generateHeart(width, height, colors, seed);
                },
            },
            {
                name: "wave",
                keywords: ["wave", "curve", "wavy", "sine"],
                generator: function (width, height, colors, seed) {
                    return _this.generateWave(width, height, colors, seed);
                },
            },
            {
                name: "spiral",
                keywords: ["spiral", "swirl", "coil"],
                generator: function (width, height, colors, seed) {
                    return _this.generateSpiral(width, height, colors, seed);
                },
            },
            {
                name: "arrow",
                keywords: ["arrow", "pointer", "direction"],
                generator: function (width, height, colors, seed) {
                    return _this.generateArrow(width, height, colors, seed);
                },
            },
            // Organic shapes
            {
                name: "flower",
                keywords: ["flower", "petal", "bloom", "blossom"],
                generator: function (width, height, colors, seed) {
                    return _this.generateFlower(width, height, colors, seed);
                },
            },
            {
                name: "leaf",
                keywords: ["leaf", "foliage", "plant"],
                generator: function (width, height, colors, seed) {
                    return _this.generateLeaf(width, height, colors, seed);
                },
            },
            {
                name: "tree",
                keywords: ["tree", "trunk", "branch"],
                generator: function (width, height, colors, seed) {
                    return _this.generateTree(width, height, colors, seed);
                },
            },
            // Complex patterns
            {
                name: "mandala",
                keywords: ["mandala", "circular", "radial", "symmetric"],
                generator: function (width, height, colors, seed) {
                    return _this.generateMandala(width, height, colors, seed);
                },
            },
            {
                name: "pattern",
                keywords: ["pattern", "grid", "lines", "stripes", "dots"],
                generator: function (width, height, colors, seed) {
                    return _this.generatePattern(width, height, colors, seed);
                },
            },
            {
                name: "icon",
                keywords: ["icon", "symbol", "logo", "badge"],
                generator: function (width, height, colors, seed) {
                    return _this.generateIcon(width, height, colors, seed);
                },
            },
        ];
    };
    RuleBasedGenerator.prototype.selectTemplate = function (prompt) {
        var lowerPrompt = prompt.toLowerCase();
        // Find the best matching template based on keywords
        for (var _i = 0, _a = this.templates; _i < _a.length; _i++) {
            var template = _a[_i];
            if (template.keywords.some(function (keyword) { return lowerPrompt.includes(keyword); })) {
                return template;
            }
        }
        // Default to circle if no match found
        return this.templates[0];
    };
    RuleBasedGenerator.prototype.generateSVGContent = function (template, width, height, colors, seed, prompt) {
        var content = template.generator(width, height, colors, seed);
        var backgroundColor = this.extractBackgroundColor(prompt, colors);
        return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ".concat(width, " ").concat(height, "\" width=\"").concat(width, "\" height=\"").concat(height, "\">\n      ").concat(backgroundColor ? "<rect width=\"100%\" height=\"100%\" fill=\"".concat(backgroundColor, "\"/>") : "", "\n      ").concat(content, "\n    </svg>");
    };
    RuleBasedGenerator.prototype.generateCircle = function (width, height, colors, seed) {
        var seededRandom = this.createSeededRandom(seed);
        var centerX = this.limitPrecision(width / 2);
        var centerY = this.limitPrecision(height / 2);
        var radius = this.limitPrecision(Math.min(width, height) * (0.3 + seededRandom() * 0.2));
        var color = colors[Math.floor(seededRandom() * colors.length)];
        var strokeWidth = Math.max(1, Math.floor(seededRandom() * 3) + 1);
        var hasStroke = seededRandom() > 0.5;
        var hasFill = seededRandom() > 0.3;
        var attributes = "cx=\"".concat(centerX, "\" cy=\"").concat(centerY, "\" r=\"").concat(radius, "\"");
        if (hasFill) {
            attributes += " fill=\"".concat(color, "\"");
        }
        else {
            attributes += " fill=\"none\"";
        }
        if (hasStroke) {
            var strokeColor = colors[Math.floor(seededRandom() * colors.length)];
            attributes += " stroke=\"".concat(strokeColor, "\" stroke-width=\"").concat(strokeWidth, "\"");
        }
        return "<circle ".concat(attributes, " id=\"main-circle\"/>");
    };
    RuleBasedGenerator.prototype.generateRectangle = function (width, height, colors, seed) {
        var seededRandom = this.createSeededRandom(seed);
        var padding = Math.min(width, height) * 0.1;
        var rectWidth = this.limitPrecision(width - padding * 2);
        var rectHeight = this.limitPrecision(height - padding * 2);
        var x = this.limitPrecision(padding);
        var y = this.limitPrecision(padding);
        var color = colors[Math.floor(seededRandom() * colors.length)];
        // Add rounded corners sometimes
        var hasRoundedCorners = seededRandom() > 0.6;
        var cornerRadius = hasRoundedCorners
            ? this.limitPrecision(Math.min(rectWidth, rectHeight) * 0.1)
            : 0;
        var attributes = "x=\"".concat(x, "\" y=\"").concat(y, "\" width=\"").concat(rectWidth, "\" height=\"").concat(rectHeight, "\"");
        if (cornerRadius > 0) {
            attributes += " rx=\"".concat(cornerRadius, "\" ry=\"").concat(cornerRadius, "\"");
        }
        attributes += " fill=\"".concat(color, "\"");
        return "<rect ".concat(attributes, " id=\"main-rect\"/>");
    };
    RuleBasedGenerator.prototype.generateTriangle = function (width, height, colors, seed) {
        var seededRandom = this.createSeededRandom(seed);
        var padding = Math.min(width, height) * 0.1;
        var centerX = this.limitPrecision(width / 2);
        var topY = this.limitPrecision(padding);
        var bottomY = this.limitPrecision(height - padding);
        var leftX = this.limitPrecision(padding);
        var rightX = this.limitPrecision(width - padding);
        var color = colors[Math.floor(seededRandom() * colors.length)];
        var points = "".concat(centerX, ",").concat(topY, " ").concat(leftX, ",").concat(bottomY, " ").concat(rightX, ",").concat(bottomY);
        return "<polygon points=\"".concat(points, "\" fill=\"").concat(color, "\" id=\"main-triangle\"/>");
    };
    RuleBasedGenerator.prototype.generateStar = function (width, height, colors, seed) {
        var seededRandom = this.createSeededRandom(seed);
        var centerX = this.limitPrecision(width / 2);
        var centerY = this.limitPrecision(height / 2);
        var outerRadius = this.limitPrecision(Math.min(width, height) * 0.4);
        var innerRadius = this.limitPrecision(outerRadius * 0.4);
        var color = colors[Math.floor(seededRandom() * colors.length)];
        // Generate 5-pointed star
        var points = [];
        for (var i = 0; i < 10; i++) {
            var angle = (i * Math.PI) / 5;
            var radius = i % 2 === 0 ? outerRadius : innerRadius;
            var x = this.limitPrecision(centerX + radius * Math.cos(angle - Math.PI / 2));
            var y = this.limitPrecision(centerY + radius * Math.sin(angle - Math.PI / 2));
            points.push("".concat(x, ",").concat(y));
        }
        return "<polygon points=\"".concat(points.join(" "), "\" fill=\"").concat(color, "\" id=\"main-star\"/>");
    };
    RuleBasedGenerator.prototype.generateIcon = function (width, height, colors, seed) {
        var seededRandom = this.createSeededRandom(seed);
        var color = colors[Math.floor(seededRandom() * colors.length)];
        var strokeColor = colors[Math.floor(seededRandom() * colors.length)];
        // Generate a simple house icon
        var baseY = this.limitPrecision(height * 0.8);
        var roofY = this.limitPrecision(height * 0.3);
        var centerX = this.limitPrecision(width / 2);
        var leftX = this.limitPrecision(width * 0.2);
        var rightX = this.limitPrecision(width * 0.8);
        return "<g id=\"house-icon\">\n      <polygon points=\"".concat(centerX, ",").concat(roofY, " ").concat(leftX, ",").concat(this.limitPrecision(height * 0.5), " ").concat(rightX, ",").concat(this.limitPrecision(height * 0.5), "\" fill=\"").concat(color, "\"/>\n      <rect x=\"").concat(leftX, "\" y=\"").concat(this.limitPrecision(height * 0.5), "\" width=\"").concat(this.limitPrecision(rightX - leftX), "\" height=\"").concat(this.limitPrecision(baseY - height * 0.5), "\" fill=\"").concat(strokeColor, "\"/>\n      <rect x=\"").concat(this.limitPrecision(width * 0.4), "\" y=\"").concat(this.limitPrecision(height * 0.6), "\" width=\"").concat(this.limitPrecision(width * 0.2), "\" height=\"").concat(this.limitPrecision(height * 0.2), "\" fill=\"none\" stroke=\"").concat(color, "\" stroke-width=\"2\"/>\n    </g>");
    };
    RuleBasedGenerator.prototype.generatePattern = function (width, height, colors, seed) {
        var seededRandom = this.createSeededRandom(seed);
        var color = colors[Math.floor(seededRandom() * colors.length)];
        var spacing = Math.max(10, Math.min(width, height) / 8);
        var elements = [];
        // Generate a grid of circles
        for (var x = spacing; x < width; x += spacing) {
            for (var y = spacing; y < height; y += spacing) {
                var radius = this.limitPrecision(spacing * 0.2);
                elements.push("<circle cx=\"".concat(this.limitPrecision(x), "\" cy=\"").concat(this.limitPrecision(y), "\" r=\"").concat(radius, "\" fill=\"").concat(color, "\"/>"));
            }
        }
        return "<g id=\"dot-pattern\">".concat(elements.join(""), "</g>");
    };
    RuleBasedGenerator.prototype.extractBackgroundColor = function (prompt, colors) {
        var lowerPrompt = prompt.toLowerCase();
        // Check for background color keywords
        if (lowerPrompt.includes("background") || lowerPrompt.includes("bg")) {
            return colors[colors.length - 1]; // Use last color as background
        }
        return null;
    };
    RuleBasedGenerator.prototype.createSeededRandom = function (seed) {
        var currentSeed = seed;
        return function () {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };
    };
    RuleBasedGenerator.prototype.generateMetadata = function (width, height, colors, seed, prompt) {
        return {
            width: width,
            height: height,
            viewBox: "0 0 ".concat(width, " ").concat(height),
            backgroundColor: this.extractBackgroundColor(prompt, colors) || "transparent",
            palette: colors,
            description: "Generated SVG based on prompt: \"".concat(prompt, "\""),
            seed: seed,
        };
    };
    RuleBasedGenerator.prototype.getDefaultPalette = function () {
        return ["#3B82F6", "#1E40AF", "#1D4ED8"];
    };
    RuleBasedGenerator.prototype.createEmptyMetadata = function () {
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
    return RuleBasedGenerator;
}(SVGGenerator_1.SVGGenerator));
exports.RuleBasedGenerator = RuleBasedGenerator;
