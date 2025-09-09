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
exports.QualityGate = void 0;
var QualityGate = /** @class */ (function () {
    function QualityGate() {
        this.PASS_THRESHOLD = 70; // Minimum score to pass
        this.ENABLE_VISION_VALIDATION = false; // Feature flag for vision model validation
    }
    QualityGate.prototype.validate = function (document, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var issues, warnings, structuralResult, motifResult, styleResult, technicalResult, metrics, score, passed, visionResult, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        issues = [];
                        warnings = [];
                        structuralResult = this.checkStructuralIntegrity(document, intent);
                        motifResult = this.checkMotifCompliance(document, intent);
                        styleResult = this.checkStyleConsistency(document, intent);
                        technicalResult = this.checkTechnicalQuality(document, intent);
                        // Collect issues and warnings
                        issues.push.apply(issues, structuralResult.issues);
                        issues.push.apply(issues, motifResult.issues);
                        issues.push.apply(issues, styleResult.issues);
                        issues.push.apply(issues, technicalResult.issues);
                        warnings.push.apply(warnings, structuralResult.warnings);
                        warnings.push.apply(warnings, motifResult.warnings);
                        warnings.push.apply(warnings, styleResult.warnings);
                        warnings.push.apply(warnings, technicalResult.warnings);
                        metrics = {
                            structuralIntegrity: structuralResult.score,
                            motifCompliance: motifResult.score,
                            styleConsistency: styleResult.score,
                            technicalQuality: technicalResult.score,
                        };
                        score = this.calculateOverallScore(metrics);
                        passed = score >= this.PASS_THRESHOLD && issues.length === 0;
                        if (!(this.ENABLE_VISION_VALIDATION && passed)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.validateWithVisionModel(document, intent)];
                    case 2:
                        visionResult = _a.sent();
                        if (!visionResult.passed) {
                            warnings.push.apply(warnings, visionResult.warnings);
                            // Don't fail on vision validation, just add warnings
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        warnings.push("Vision validation failed: ".concat(error_1 instanceof Error ? error_1.message : "Unknown error"));
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, {
                            passed: passed,
                            issues: issues,
                            warnings: warnings,
                            score: score,
                        }];
                }
            });
        });
    };
    QualityGate.prototype.checkStructuralIntegrity = function (document, intent) {
        var issues = [];
        var warnings = [];
        var score = 100;
        // Check component count constraints
        if (document.components.length > intent.constraints.maxElements) {
            issues.push("Too many components: ".concat(document.components.length, " > ").concat(intent.constraints.maxElements));
            score -= 30;
        }
        if (document.components.length === 0) {
            issues.push("Document has no components");
            score = 0;
        }
        // Check bounds validity
        if (!document.bounds.width || !document.bounds.height) {
            issues.push("Invalid document bounds");
            score -= 20;
        }
        if (document.bounds.width < 16 || document.bounds.height < 16) {
            warnings.push("Document bounds are very small");
            score -= 5;
        }
        if (document.bounds.width > 2048 || document.bounds.height > 2048) {
            warnings.push("Document bounds are very large");
            score -= 5;
        }
        // Check component positioning
        var componentsOutOfBounds = 0;
        for (var _i = 0, _a = document.components; _i < _a.length; _i++) {
            var component = _a[_i];
            if (this.isComponentOutOfBounds(component, document.bounds)) {
                componentsOutOfBounds++;
            }
        }
        if (componentsOutOfBounds > 0) {
            var ratio = componentsOutOfBounds / document.components.length;
            if (ratio > 0.5) {
                issues.push("".concat(componentsOutOfBounds, " components are out of bounds"));
                score -= 25;
            }
            else {
                warnings.push("".concat(componentsOutOfBounds, " components are partially out of bounds"));
                score -= 10;
            }
        }
        return { issues: issues, warnings: warnings, score: Math.max(0, score) };
    };
    QualityGate.prototype.checkMotifCompliance = function (document, intent) {
        var issues = [];
        var warnings = [];
        var score = 100;
        // Check required motifs
        var presentMotifs = new Set(document.components.map(function (c) { var _a; return (_a = c.metadata) === null || _a === void 0 ? void 0 : _a.motif; }).filter(Boolean));
        var missingMotifs = intent.constraints.requiredMotifs.filter(function (motif) { return !presentMotifs.has(motif); });
        if (missingMotifs.length > 0) {
            issues.push("Missing required motifs: ".concat(missingMotifs.join(", ")));
            score -= missingMotifs.length * 20;
        }
        // Check motif distribution
        var motifCounts = new Map();
        document.components.forEach(function (comp) {
            var _a;
            var motif = (_a = comp.metadata) === null || _a === void 0 ? void 0 : _a.motif;
            if (motif) {
                motifCounts.set(motif, (motifCounts.get(motif) || 0) + 1);
            }
        });
        // Warn about motif imbalance
        if (motifCounts.size > 1) {
            var counts = Array.from(motifCounts.values());
            var max = Math.max.apply(Math, counts);
            var min = Math.min.apply(Math, counts);
            if (max / min > 3) {
                warnings.push("Motif distribution is imbalanced");
                score -= 10;
            }
        }
        // Check for unexpected motifs
        var allowedMotifs = new Set(__spreadArray(__spreadArray([], intent.motifs, true), intent.constraints.requiredMotifs, true));
        var unexpectedMotifs = Array.from(presentMotifs).filter(function (motif) { return !allowedMotifs.has(motif); });
        if (unexpectedMotifs.length > 0) {
            warnings.push("Unexpected motifs present: ".concat(unexpectedMotifs.join(", ")));
            score -= 5;
        }
        return { issues: issues, warnings: warnings, score: Math.max(0, score) };
    };
    QualityGate.prototype.checkStyleConsistency = function (document, intent) {
        var issues = [];
        var warnings = [];
        var score = 100;
        // Check stroke-only compliance
        if (intent.constraints.strokeOnly) {
            var componentsWithFill = document.components.filter(function (comp) { return comp.attributes.fill && comp.attributes.fill !== "none"; });
            if (componentsWithFill.length > 0) {
                issues.push("".concat(componentsWithFill.length, " components have fill but stroke-only is required"));
                score -= componentsWithFill.length * 15;
            }
        }
        // Check stroke width consistency
        var strokeWidths = document.components
            .map(function (comp) { return comp.attributes["stroke-width"]; })
            .filter(function (width) { return typeof width === "number"; });
        if (strokeWidths.length > 0) {
            var minStroke = Math.min.apply(Math, strokeWidths);
            var maxStroke = Math.max.apply(Math, strokeWidths);
            // Check minimum stroke width requirement
            if (minStroke < 1) {
                issues.push("Stroke width ".concat(minStroke, " is below minimum of 1"));
                score -= 20;
            }
            // Check stroke width consistency
            if (maxStroke / minStroke > 4) {
                warnings.push("Stroke widths vary significantly");
                score -= 5;
            }
        }
        // Check color palette compliance
        var usedColors = new Set();
        document.components.forEach(function (comp) {
            if (comp.attributes.fill && comp.attributes.fill !== "none") {
                usedColors.add(comp.attributes.fill);
            }
            if (comp.attributes.stroke) {
                usedColors.add(comp.attributes.stroke);
            }
        });
        var paletteColors = new Set(document.palette);
        var unauthorizedColors = Array.from(usedColors).filter(function (color) { return !paletteColors.has(color); });
        if (unauthorizedColors.length > 0) {
            warnings.push("Colors used outside palette: ".concat(unauthorizedColors.join(", ")));
            score -= unauthorizedColors.length * 5;
        }
        return { issues: issues, warnings: warnings, score: Math.max(0, score) };
    };
    QualityGate.prototype.checkTechnicalQuality = function (document, intent) {
        var _this = this;
        var issues = [];
        var warnings = [];
        var score = 100;
        // Check for NaN or invalid numeric values
        var invalidNumericCount = 0;
        document.components.forEach(function (comp) {
            Object.entries(comp.attributes).forEach(function (_a) {
                var attributeName = _a[0], value = _a[1];
                if (typeof value === "number") {
                    if (!_this.isValidNumber(value)) {
                        invalidNumericCount++;
                        issues.push("Component ".concat(comp.id, " has invalid ").concat(attributeName, ": ").concat(value));
                    }
                }
            });
        });
        if (invalidNumericCount > 0) {
            score -= invalidNumericCount * 25; // Heavy penalty for invalid numbers
        }
        // Check decimal precision
        var highPrecisionCount = 0;
        document.components.forEach(function (comp) {
            Object.entries(comp.attributes).forEach(function (_a) {
                var _b;
                var key = _a[0], value = _a[1];
                if (typeof value === "number" &&
                    _this.isValidNumber(value) &&
                    !Number.isInteger(value)) {
                    var decimals = ((_b = value.toString().split(".")[1]) === null || _b === void 0 ? void 0 : _b.length) || 0;
                    if (decimals > 2) {
                        highPrecisionCount++;
                    }
                }
            });
        });
        if (highPrecisionCount > 0) {
            warnings.push("".concat(highPrecisionCount, " attributes have >2 decimal places"));
            score -= Math.min(20, highPrecisionCount * 2);
        }
        // Check for required SVG attributes
        var hasValidViewBox = document.bounds.width > 0 && document.bounds.height > 0;
        if (!hasValidViewBox) {
            issues.push("Invalid or missing viewBox");
            score -= 25;
        }
        // Check component validity
        var invalidComponents = 0;
        document.components.forEach(function (comp) {
            if (!_this.isValidComponent(comp)) {
                invalidComponents++;
            }
        });
        if (invalidComponents > 0) {
            issues.push("".concat(invalidComponents, " components have invalid attributes"));
            score -= invalidComponents * 10;
        }
        // Check for empty or degenerate shapes
        var degenerateShapes = 0;
        document.components.forEach(function (comp) {
            if (_this.isDegenerateShape(comp)) {
                degenerateShapes++;
            }
        });
        if (degenerateShapes > 0) {
            warnings.push("".concat(degenerateShapes, " components are degenerate (zero size)"));
            score -= degenerateShapes * 5;
        }
        // Check complexity
        if (document.components.length > 20) {
            warnings.push("Document is quite complex");
            score -= 5;
        }
        return { issues: issues, warnings: warnings, score: Math.max(0, score) };
    };
    QualityGate.prototype.isComponentOutOfBounds = function (component, bounds) {
        var attrs = component.attributes;
        switch (component.element) {
            case "circle":
                var cx = attrs.cx;
                var cy = attrs.cy;
                var r = attrs.r;
                // Check for invalid coordinates first
                if (!this.isValidNumber(cx) ||
                    !this.isValidNumber(cy) ||
                    !this.isValidNumber(r)) {
                    return true; // Consider invalid coordinates as out of bounds
                }
                return (cx - r < 0 ||
                    cx + r > bounds.width ||
                    cy - r < 0 ||
                    cy + r > bounds.height);
            case "rect":
                var x = attrs.x;
                var y = attrs.y;
                var width = attrs.width;
                var height = attrs.height;
                // Check for invalid coordinates first
                if (!this.isValidNumber(x) ||
                    !this.isValidNumber(y) ||
                    !this.isValidNumber(width) ||
                    !this.isValidNumber(height)) {
                    return true; // Consider invalid coordinates as out of bounds
                }
                return (x < 0 ||
                    y < 0 ||
                    x + width > bounds.width ||
                    y + height > bounds.height);
            case "ellipse":
                var ecx = attrs.cx;
                var ecy = attrs.cy;
                var rx = attrs.rx;
                var ry = attrs.ry;
                // Check for invalid coordinates first
                if (!this.isValidNumber(ecx) ||
                    !this.isValidNumber(ecy) ||
                    !this.isValidNumber(rx) ||
                    !this.isValidNumber(ry)) {
                    return true; // Consider invalid coordinates as out of bounds
                }
                return (ecx - rx < 0 ||
                    ecx + rx > bounds.width ||
                    ecy - ry < 0 ||
                    ecy + ry > bounds.height);
            default:
                // For other shapes, do a simple bounds check
                return false; // Simplified for now
        }
    };
    QualityGate.prototype.isValidComponent = function (component) {
        var attrs = component.attributes;
        switch (component.element) {
            case "circle":
                return (this.isValidNumber(attrs.cx) &&
                    this.isValidNumber(attrs.cy) &&
                    this.isValidNumber(attrs.r) &&
                    attrs.r > 0);
            case "rect":
                return (this.isValidNumber(attrs.x) &&
                    this.isValidNumber(attrs.y) &&
                    this.isValidNumber(attrs.width) &&
                    attrs.width > 0 &&
                    this.isValidNumber(attrs.height) &&
                    attrs.height > 0);
            case "ellipse":
                return (this.isValidNumber(attrs.cx) &&
                    this.isValidNumber(attrs.cy) &&
                    this.isValidNumber(attrs.rx) &&
                    attrs.rx > 0 &&
                    this.isValidNumber(attrs.ry) &&
                    attrs.ry > 0);
            case "line":
                return (this.isValidNumber(attrs.x1) &&
                    this.isValidNumber(attrs.y1) &&
                    this.isValidNumber(attrs.x2) &&
                    this.isValidNumber(attrs.y2));
            case "polygon":
            case "polyline":
                return typeof attrs.points === "string" && attrs.points.length > 0;
            case "path":
                return typeof attrs.d === "string" && attrs.d.length > 0;
            default:
                return true; // Unknown elements pass by default
        }
    };
    QualityGate.prototype.isDegenerateShape = function (component) {
        var attrs = component.attributes;
        switch (component.element) {
            case "circle":
                return attrs.r <= 0;
            case "rect":
                return attrs.width <= 0 || attrs.height <= 0;
            case "ellipse":
                return attrs.rx <= 0 || attrs.ry <= 0;
            case "line":
                return attrs.x1 === attrs.x2 && attrs.y1 === attrs.y2;
            default:
                return false;
        }
    };
    QualityGate.prototype.calculateOverallScore = function (metrics) {
        // Weighted average of quality metrics
        var weights = {
            structuralIntegrity: 0.3,
            motifCompliance: 0.25,
            styleConsistency: 0.25,
            technicalQuality: 0.2,
        };
        return Math.round(metrics.structuralIntegrity * weights.structuralIntegrity +
            metrics.motifCompliance * weights.motifCompliance +
            metrics.styleConsistency * weights.styleConsistency +
            metrics.technicalQuality * weights.technicalQuality);
    };
    /**
     * Optional vision model validation for enhanced quality checks
     * Rasterizes SVG and validates motif presence using vision model
     */
    QualityGate.prototype.validateWithVisionModel = function (document, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var warnings, _i, _a, requiredMotif, isMotifPresent, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        warnings = [];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        _i = 0, _a = intent.constraints.requiredMotifs;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        requiredMotif = _a[_i];
                        return [4 /*yield*/, this.checkMotifWithVision(document, requiredMotif)];
                    case 3:
                        isMotifPresent = _b.sent();
                        if (!isMotifPresent) {
                            warnings.push("Vision model could not detect required motif: ".concat(requiredMotif));
                        }
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, {
                            passed: warnings.length === 0,
                            warnings: warnings,
                        }];
                    case 6:
                        error_2 = _b.sent();
                        return [2 /*return*/, {
                                passed: false,
                                warnings: [
                                    "Vision validation error: ".concat(error_2 instanceof Error ? error_2.message : "Unknown error"),
                                ],
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Placeholder for vision-based motif detection
     * In a real implementation, this would use a vision model API
     */
    QualityGate.prototype.checkMotifWithVision = function (document, motif) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder implementation - always returns true for now
                // In production, this would:
                // 1. Convert SVG to PNG/JPEG using a library like sharp or puppeteer
                // 2. Send image to vision model with prompt like:
                //    "Does this image contain a {motif}? Answer yes or no."
                // 3. Parse the response and return boolean
                // For now, just check if the motif exists in component metadata
                return [2 /*return*/, document.components.some(function (comp) { var _a; return ((_a = comp.metadata) === null || _a === void 0 ? void 0 : _a.motif) === motif; })];
            });
        });
    };
    /**
     * Checks if a number is valid (not NaN, not Infinity)
     */
    QualityGate.prototype.isValidNumber = function (value) {
        return typeof value === "number" && isFinite(value) && !isNaN(value);
    };
    return QualityGate;
}());
exports.QualityGate = QualityGate;
