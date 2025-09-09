"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StylePackManager = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var StylePackManager = /** @class */ (function () {
    function StylePackManager(stylesDir) {
        if (stylesDir === void 0) { stylesDir = "server/styles"; }
        this.stylePacks = new Map();
        this.stylesDir = stylesDir;
        this.loadStylePacks();
    }
    StylePackManager.prototype.loadStylePacks = function () {
        try {
            // Load Mediterranean Line Art
            var medPath = (0, path_1.join)(process.cwd(), this.stylesDir, "mediterranean-line-art.json");
            var medStyle = JSON.parse((0, fs_1.readFileSync)(medPath, "utf-8"));
            this.stylePacks.set("mediterranean", medStyle);
            // Load Geometric Modern
            var geoPath = (0, path_1.join)(process.cwd(), this.stylesDir, "geometric-modern.json");
            var geoStyle = JSON.parse((0, fs_1.readFileSync)(geoPath, "utf-8"));
            this.stylePacks.set("geometric", geoStyle);
            console.log("\u2705 Loaded ".concat(this.stylePacks.size, " style packs"));
        }
        catch (error) {
            console.warn("⚠️  Could not load style packs:", error);
        }
    };
    StylePackManager.prototype.getStylePack = function (name) {
        return this.stylePacks.get(name) || null;
    };
    StylePackManager.prototype.detectStyleFromPrompt = function (prompt) {
        var lowerPrompt = prompt.toLowerCase();
        // Mediterranean keywords
        if (lowerPrompt.includes("mediterranean") ||
            lowerPrompt.includes("greek") ||
            lowerPrompt.includes("classical") ||
            lowerPrompt.includes("arch") ||
            lowerPrompt.includes("column") ||
            lowerPrompt.includes("line art")) {
            return "mediterranean";
        }
        // Geometric keywords
        if (lowerPrompt.includes("geometric") ||
            lowerPrompt.includes("modern") ||
            lowerPrompt.includes("abstract") ||
            lowerPrompt.includes("minimal") ||
            lowerPrompt.includes("clean")) {
            return "geometric";
        }
        return null;
    };
    StylePackManager.prototype.createStylePrompt = function (stylePack, prompt, size) {
        var motifNames = Object.keys(stylePack.motifs);
        var motifDescriptions = motifNames
            .map(function (name) { return "".concat(name, ": ").concat(stylePack.motifs[name].description); })
            .join("\n");
        return "You are an SVG Shape Planner for ".concat(stylePack.name, " style. Output STRICT JSON that matches the schema.\n\nCANVAS: ").concat(size.width, "x").concat(size.height, "\nSTYLE: ").concat(stylePack.description, "\n\nCONSTRAINTS:\n- Fill mode: ").concat(stylePack.constraints.fillMode, "\n- Background: ").concat(stylePack.constraints.background, "\n- Line weights: ").concat(stylePack.constraints.lineWeights.join(", "), "\n- Stroke linecap: ").concat(stylePack.constraints.strokeLinecap, "\n- Stroke linejoin: ").concat(stylePack.constraints.strokeLinejoin, "\n- Max elements: ").concat(stylePack.constraints.maxElements, "\n\nPALETTE:\n- Primary: ").concat(stylePack.palette.primary.join(", "), "\n- Accent: ").concat(stylePack.palette.accent.join(", "), "\n- Neutral: ").concat(stylePack.palette.neutral.join(", "), "\n\nAVAILABLE MOTIFS:\n").concat(motifDescriptions, "\n\nDO:\n").concat(stylePack.dos.map(function (item) { return "- ".concat(item); }).join("\n"), "\n\nDON'T:\n").concat(stylePack.donts.map(function (item) { return "- ".concat(item); }).join("\n"), "\n\nSELF-CRITIQUE RULE:\nBefore returning JSON, verify your design follows ALL style constraints and guidelines above. Fix any violations.\n\nMOTIF USAGE:\nReference motifs by name in a \"motifs\" array. Example:\n{\n  \"elements\": [...],\n  \"motifs\": [\n    {\"name\": \"arch\", \"x\": 100, \"y\": 50, \"w\": 80, \"h\": 60, \"color\": \"#2E8B57\"},\n    {\"name\": \"olive_branch\", \"x\": 200, \"y\": 100, \"w\": 40, \"h\": 20, \"color\": \"#4682B4\"}\n  ]\n}\n\nThink in terms of basic primitives (rect, circle, ellipse, line, polyline, polygon, path, text).\nAll colors must be valid CSS color strings.\nPrefer simple coordinates and whole numbers.\nNever include explanations\u2014ONLY the JSON.");
    };
    StylePackManager.prototype.expandMotifs = function (motifs, stylePack) {
        var _this = this;
        var expandedElements = [];
        motifs.forEach(function (motif) {
            var motifDef = stylePack.motifs[motif.name];
            if (!motifDef) {
                console.warn("Unknown motif: ".concat(motif.name));
                return;
            }
            motifDef.elements.forEach(function (element, index) {
                // Replace template variables
                var expandedElement = JSON.parse(JSON.stringify(element));
                // Replace coordinate variables
                expandedElement = _this.replaceVariables(expandedElement, {
                    x: motif.x,
                    y: motif.y,
                    w: motif.w,
                    h: motif.h,
                    color: motif.color,
                    accent: motif.accent || motif.color,
                });
                // Generate unique ID
                expandedElement.id = "".concat(motif.name, "-").concat(index);
                expandedElements.push(expandedElement);
            });
        });
        return expandedElements;
    };
    StylePackManager.prototype.replaceVariables = function (obj, vars) {
        var _this = this;
        if (typeof obj === "string") {
            var result_1 = obj;
            Object.entries(vars).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                var regex = new RegExp("\\{".concat(key, "\\}"), "g");
                result_1 = result_1.replace(regex, value.toString());
            });
            // Handle mathematical expressions
            result_1 = result_1.replace(/\{([^}]+)\}/g, function (match, expr) {
                try {
                    // Simple expression evaluation (safe for basic math)
                    var safeExpr = expr.replace(/[^0-9+\-*/().x y w h]/g, "");
                    if (safeExpr !== expr)
                        return match; // Don't evaluate if unsafe chars found
                    // Replace variables in expression
                    var evalExpr_1 = safeExpr;
                    Object.entries(vars).forEach(function (_a) {
                        var key = _a[0], value = _a[1];
                        evalExpr_1 = evalExpr_1.replace(new RegExp(key, "g"), value.toString());
                    });
                    return eval(evalExpr_1).toString();
                }
                catch (_a) {
                    return match; // Return original if evaluation fails
                }
            });
            return result_1;
        }
        else if (Array.isArray(obj)) {
            return obj.map(function (item) { return _this.replaceVariables(item, vars); });
        }
        else if (typeof obj === "object" && obj !== null) {
            var result_2 = {};
            Object.entries(obj).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                result_2[key] = _this.replaceVariables(value, vars);
            });
            return result_2;
        }
        return obj;
    };
    StylePackManager.prototype.getAvailableStyles = function () {
        return Array.from(this.stylePacks.keys());
    };
    StylePackManager.prototype.getStyleInfo = function (name) {
        var pack = this.stylePacks.get(name);
        return pack ? { name: pack.name, description: pack.description } : null;
    };
    return StylePackManager;
}());
exports.StylePackManager = StylePackManager;
