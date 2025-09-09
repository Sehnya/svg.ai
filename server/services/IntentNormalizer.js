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
exports.IntentNormalizer = void 0;
var pipeline_js_1 = require("../schemas/pipeline.js");
var IntentNormalizer = /** @class */ (function () {
    function IntentNormalizer() {
        this.motifKeywords = new Map([
            [
                "geometric",
                ["circle", "square", "triangle", "polygon", "diamond", "hexagon"],
            ],
            ["nature", ["leaf", "tree", "flower", "branch", "organic", "natural"]],
            ["abstract", ["wave", "spiral", "curve", "flow", "gradient", "pattern"]],
            ["architectural", ["building", "structure", "column", "arch", "geometric"]],
            [
                "decorative",
                ["ornament", "border", "frame", "flourish", "embellishment"],
            ],
        ]);
        this.styleKeywords = new Map([
            ["minimalist", { density: "sparse", strokeOnly: true }],
            ["detailed", { density: "dense", strokeOnly: false }],
            ["clean", { density: "sparse", strokeOnly: true }],
            ["complex", { density: "dense", strokeOnly: false }],
            ["simple", { density: "sparse", strokeOnly: true }],
        ]);
        this.arrangementKeywords = new Map([
            ["centered", "centered"],
            ["grid", "grid"],
            ["scattered", "scattered"],
            ["organic", "organic"],
            ["random", "scattered"],
            ["structured", "grid"],
            ["flowing", "organic"],
        ]);
    }
    IntentNormalizer.prototype.normalize = function (prompt, context) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedPrompt, style, motifs, layout, constraints, intent, validationResult;
            return __generator(this, function (_a) {
                normalizedPrompt = prompt.toLowerCase().trim();
                style = this.extractStyle(normalizedPrompt, context);
                motifs = this.extractMotifs(normalizedPrompt);
                layout = this.extractLayout(normalizedPrompt, context);
                constraints = this.extractConstraints(normalizedPrompt, motifs);
                intent = {
                    style: style,
                    motifs: motifs,
                    layout: layout,
                    constraints: constraints,
                };
                validationResult = pipeline_js_1.DesignIntentSchema.safeParse(intent);
                if (!validationResult.success) {
                    throw new Error("Invalid design intent: ".concat(validationResult.error.message));
                }
                return [2 /*return*/, intent];
            });
        });
    };
    IntentNormalizer.prototype.extractStyle = function (prompt, context) {
        // Extract palette
        var palette = this.extractPalette(prompt, context === null || context === void 0 ? void 0 : context.defaultPalette);
        // Extract stroke rules
        var strokeRules = this.extractStrokeRules(prompt);
        // Extract density
        var density = this.extractDensity(prompt);
        // Extract symmetry
        var symmetry = this.extractSymmetry(prompt);
        return {
            palette: palette,
            strokeRules: strokeRules,
            density: density,
            symmetry: symmetry,
        };
    };
    IntentNormalizer.prototype.extractPalette = function (prompt, defaultPalette) {
        // Color extraction patterns
        var colorPatterns = [
            /blue/i,
            /red/i,
            /green/i,
            /yellow/i,
            /purple/i,
            /orange/i,
            /pink/i,
            /black/i,
            /white/i,
            /gray/i,
        ];
        var colorMap = new Map([
            ["blue", "#2563eb"],
            ["red", "#dc2626"],
            ["green", "#16a34a"],
            ["yellow", "#eab308"],
            ["purple", "#9333ea"],
            ["orange", "#ea580c"],
            ["pink", "#ec4899"],
            ["black", "#000000"],
            ["white", "#ffffff"],
            ["gray", "#6b7280"],
        ]);
        var extractedColors = [];
        for (var _i = 0, colorMap_1 = colorMap; _i < colorMap_1.length; _i++) {
            var _a = colorMap_1[_i], color = _a[0], hex = _a[1];
            if (prompt.includes(color)) {
                extractedColors.push(hex);
            }
        }
        // Monochrome detection
        if (prompt.includes("monochrome") || prompt.includes("black and white")) {
            return ["#000000", "#ffffff"];
        }
        // Use default palette if no colors found
        if (extractedColors.length === 0) {
            return defaultPalette || ["#2563eb", "#16a34a", "#eab308"];
        }
        return extractedColors.slice(0, 6); // Limit to 6 colors
    };
    IntentNormalizer.prototype.extractStrokeRules = function (prompt) {
        var strokeOnly = prompt.includes("outline") ||
            prompt.includes("stroke") ||
            prompt.includes("line art") ||
            prompt.includes("wireframe");
        var minStrokeWidth = strokeOnly ? 1 : 0.5;
        var maxStrokeWidth = prompt.includes("thick")
            ? 4
            : prompt.includes("thin")
                ? 1
                : 2;
        return {
            strokeOnly: strokeOnly,
            minStrokeWidth: minStrokeWidth,
            maxStrokeWidth: maxStrokeWidth,
            allowFill: !strokeOnly,
        };
    };
    IntentNormalizer.prototype.extractDensity = function (prompt) {
        if (prompt.includes("simple") ||
            prompt.includes("minimal") ||
            prompt.includes("clean")) {
            return "sparse";
        }
        if (prompt.includes("detailed") ||
            prompt.includes("complex") ||
            prompt.includes("intricate")) {
            return "dense";
        }
        return "medium";
    };
    IntentNormalizer.prototype.extractSymmetry = function (prompt) {
        if (prompt.includes("radial") || prompt.includes("circular")) {
            return "radial";
        }
        if (prompt.includes("horizontal") || prompt.includes("mirror")) {
            return "horizontal";
        }
        if (prompt.includes("vertical")) {
            return "vertical";
        }
        if (prompt.includes("symmetric") || prompt.includes("symmetry")) {
            return "horizontal"; // Default symmetry
        }
        return "none";
    };
    IntentNormalizer.prototype.extractMotifs = function (prompt) {
        var motifs = [];
        // Check for explicit motif keywords
        for (var _i = 0, _a = this.motifKeywords; _i < _a.length; _i++) {
            var _b = _a[_i], category = _b[0], keywords = _b[1];
            for (var _c = 0, keywords_1 = keywords; _c < keywords_1.length; _c++) {
                var keyword = keywords_1[_c];
                if (prompt.includes(keyword)) {
                    motifs.push(keyword);
                }
            }
        }
        // Extract noun phrases that could be motifs
        var words = prompt.split(/\s+/);
        var potentialMotifs = words.filter(function (word) {
            return word.length > 3 &&
                !["with", "and", "the", "for", "that", "this"].includes(word);
        });
        motifs.push.apply(motifs, potentialMotifs.slice(0, 5));
        return __spreadArray([], new Set(motifs), true).slice(0, 10); // Remove duplicates and limit
    };
    IntentNormalizer.prototype.extractLayout = function (prompt, context) {
        // Extract arrangement
        var arrangement = "centered";
        for (var _i = 0, _a = this.arrangementKeywords; _i < _a.length; _i++) {
            var _b = _a[_i], keyword = _b[0], value = _b[1];
            if (prompt.includes(keyword)) {
                arrangement = value;
                break;
            }
        }
        // Extract size preferences
        var sizes = this.extractSizes(prompt);
        // Extract count preferences
        var counts = this.extractCounts(prompt);
        return {
            sizes: sizes,
            counts: counts,
            arrangement: arrangement,
        };
    };
    IntentNormalizer.prototype.extractSizes = function (prompt) {
        var sizes = [];
        // Default size based on common elements
        if (prompt.includes("icon") || prompt.includes("small")) {
            sizes.push({ type: "icon", minSize: 16, maxSize: 64 });
        }
        if (prompt.includes("large") || prompt.includes("big")) {
            sizes.push({ type: "main", minSize: 100, maxSize: 300 });
        }
        // Default medium size if nothing specified
        if (sizes.length === 0) {
            sizes.push({ type: "default", minSize: 50, maxSize: 150 });
        }
        return sizes;
    };
    IntentNormalizer.prototype.extractCounts = function (prompt) {
        var counts = [];
        // Extract numbers from prompt
        var numbers = prompt.match(/\d+/g);
        if (numbers && numbers.length > 0) {
            var count = parseInt(numbers[0]);
            counts.push({
                type: "element",
                min: Math.max(1, count - 2),
                max: count + 2,
                preferred: count,
            });
        }
        else {
            // Default count based on density
            var density = this.extractDensity(prompt);
            var baseCount = density === "sparse" ? 3 : density === "dense" ? 8 : 5;
            counts.push({
                type: "element",
                min: baseCount - 2,
                max: baseCount + 3,
                preferred: baseCount,
            });
        }
        return counts;
    };
    IntentNormalizer.prototype.extractConstraints = function (prompt, motifs) {
        var strokeOnly = prompt.includes("outline") ||
            prompt.includes("stroke") ||
            prompt.includes("line art");
        // Extract max elements based on complexity
        var maxElements = prompt.includes("simple")
            ? 10
            : prompt.includes("complex")
                ? 50
                : 25;
        // Required motifs are the most important ones mentioned
        var requiredMotifs = motifs.slice(0, 3);
        return {
            strokeOnly: strokeOnly,
            maxElements: maxElements,
            requiredMotifs: requiredMotifs,
        };
    };
    return IntentNormalizer;
}());
exports.IntentNormalizer = IntentNormalizer;
