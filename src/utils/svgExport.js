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
exports.SVGExporter = void 0;
var SVGExporter = /** @class */ (function () {
    function SVGExporter() {
    }
    /**
     * Export SVG with various optimization options
     */
    SVGExporter.exportSVG = function (svgContent_1) {
        return __awaiter(this, arguments, void 0, function (svgContent, options) {
            var processedContent, blob;
            if (options === void 0) { options = { format: "svg" }; }
            return __generator(this, function (_a) {
                processedContent = svgContent;
                switch (options.format) {
                    case "optimized":
                        processedContent = this.optimizeSVG(svgContent, options);
                        break;
                    case "minified":
                        processedContent = this.minifySVG(svgContent, options);
                        break;
                    case "png":
                    case "jpeg":
                        return [2 /*return*/, this.exportRaster(svgContent, options)];
                    default:
                        processedContent = svgContent;
                }
                blob = new Blob([processedContent], { type: "image/svg+xml" });
                return [2 /*return*/, {
                        data: processedContent,
                        filename: this.generateFilename(options.format),
                        mimeType: "image/svg+xml",
                        size: blob.size,
                    }];
            });
        });
    };
    /**
     * Optimize SVG by removing unnecessary whitespace and formatting
     */
    SVGExporter.optimizeSVG = function (svg, options) {
        var optimized = svg;
        // Remove comments if requested
        if (options.removeComments !== false) {
            optimized = optimized.replace(/<!--[\s\S]*?-->/g, "");
        }
        // Remove metadata if requested
        if (options.removeMetadata !== false) {
            optimized = optimized.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
            optimized = optimized.replace(/<title[\s\S]*?<\/title>/gi, "");
            optimized = optimized.replace(/<desc[\s\S]*?<\/desc>/gi, "");
        }
        // Normalize whitespace
        optimized = optimized
            .replace(/\s+/g, " ") // Multiple spaces to single space
            .replace(/>\s+</g, "><") // Remove whitespace between tags
            .replace(/\s*=\s*/g, "=") // Remove whitespace around equals
            .replace(/"\s+/g, '" ') // Normalize attribute spacing
            .trim();
        // Optimize numeric precision
        if (options.precision !== undefined) {
            optimized = this.optimizeNumericPrecision(optimized, options.precision);
        }
        // Minify inline styles if requested
        if (options.minifyStyles) {
            optimized = this.minifyInlineStyles(optimized);
        }
        return optimized;
    };
    /**
     * Aggressively minify SVG
     */
    SVGExporter.minifySVG = function (svg, options) {
        var minified = this.optimizeSVG(svg, options);
        // More aggressive whitespace removal
        minified = minified
            .replace(/\s*\/>/g, "/>") // Remove space before self-closing tags
            .replace(/;\s*/g, ";") // Remove spaces after semicolons in styles
            .replace(/:\s*/g, ":") // Remove spaces after colons in styles
            .replace(/,\s*/g, ",") // Remove spaces after commas
            .replace(/\s*{\s*/g, "{") // Remove spaces around braces
            .replace(/\s*}\s*/g, "}");
        // Remove unnecessary quotes from attribute values where safe
        minified = minified.replace(/="([a-zA-Z0-9-_]+)"/g, "=$1");
        return minified;
    };
    /**
     * Export SVG as raster format (PNG/JPEG)
     */
    SVGExporter.exportRaster = function (svgContent, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Create a temporary canvas
                        var canvas = document.createElement("canvas");
                        var ctx = canvas.getContext("2d");
                        if (!ctx) {
                            reject(new Error("Could not get canvas context"));
                            return;
                        }
                        // Create an image from the SVG
                        var img = new Image();
                        var svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
                        var url = URL.createObjectURL(svgBlob);
                        img.onload = function () {
                            try {
                                var scale = options.scale || 1;
                                canvas.width = img.width * scale;
                                canvas.height = img.height * scale;
                                // Set background color for JPEG
                                if (options.format === "jpeg") {
                                    ctx.fillStyle = "white";
                                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                                }
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                canvas.toBlob(function (blob) {
                                    URL.revokeObjectURL(url);
                                    if (!blob) {
                                        reject(new Error("Failed to create blob"));
                                        return;
                                    }
                                    resolve({
                                        data: blob,
                                        filename: _this.generateFilename(options.format),
                                        mimeType: options.format === "png" ? "image/png" : "image/jpeg",
                                        size: blob.size,
                                    });
                                }, options.format === "png" ? "image/png" : "image/jpeg", options.quality || 0.9);
                            }
                            catch (error) {
                                URL.revokeObjectURL(url);
                                reject(error);
                            }
                        };
                        img.onerror = function () {
                            URL.revokeObjectURL(url);
                            reject(new Error("Failed to load SVG image"));
                        };
                        img.src = url;
                    })];
            });
        });
    };
    /**
     * Optimize numeric precision in SVG
     */
    SVGExporter.optimizeNumericPrecision = function (svg, precision) {
        return svg.replace(/(\d+\.\d+)/g, function (match) {
            var num = parseFloat(match);
            return num.toFixed(precision).replace(/\.?0+$/, "");
        });
    };
    /**
     * Minify inline CSS styles
     */
    SVGExporter.minifyInlineStyles = function (svg) {
        return svg.replace(/style="([^"]+)"/g, function (_match, styles) {
            var minified = styles
                .replace(/\s*;\s*/g, ";")
                .replace(/\s*:\s*/g, ":")
                .replace(/;\s*$/, "") // Remove trailing semicolon
                .trim();
            return "style=\"".concat(minified, "\"");
        });
    };
    /**
     * Generate filename based on format
     */
    SVGExporter.generateFilename = function (format) {
        var timestamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:-]/g, "");
        var extension = format === "optimized" || format === "minified" ? "svg" : format;
        var suffix = format === "svg" ? "" : "-".concat(format);
        return "generated".concat(suffix, "-").concat(timestamp, ".").concat(extension);
    };
    /**
     * Download file to user's device
     */
    SVGExporter.downloadFile = function (data, filename, mimeType) {
        var blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    /**
     * Get file size in human readable format
     */
    SVGExporter.formatFileSize = function (bytes) {
        if (bytes === 0)
            return "0 B";
        var k = 1024;
        var sizes = ["B", "KB", "MB", "GB"];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return "".concat(parseFloat((bytes / Math.pow(k, i)).toFixed(1)), " ").concat(sizes[i]);
    };
    /**
     * Calculate compression ratio
     */
    SVGExporter.calculateCompressionRatio = function (originalSize, compressedSize) {
        if (originalSize === 0)
            return 0;
        return Math.round(((originalSize - compressedSize) / originalSize) * 100);
    };
    return SVGExporter;
}());
exports.SVGExporter = SVGExporter;
