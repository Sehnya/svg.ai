"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.onRequest = onRequest;
// Cloudflare Pages Function - Browser-compatible API
function onRequest(context) {
    return __awaiter(this, void 0, void 0, function () {
        var request, url, path, corsHeaders, requestData, prompt_1, size, width, height, svgContent, seed, radius, cx, cy, color, rectWidth, rectHeight, x, y, color, points, color, radius, cx, cy, color, svg, response, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    request = context.request;
                    url = new URL(request.url);
                    path = url.pathname.replace("/api/", "");
                    corsHeaders = {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type",
                    };
                    // Handle preflight requests
                    if (request.method === "OPTIONS") {
                        return [2 /*return*/, new Response(null, { headers: corsHeaders })];
                    }
                    // Health check endpoint
                    if (path === "health") {
                        return [2 /*return*/, new Response(JSON.stringify({
                                status: "ok",
                                timestamp: new Date().toISOString(),
                                environment: "cloudflare-pages-functions",
                            }), {
                                headers: __assign({ "Content-Type": "application/json" }, corsHeaders),
                            })];
                    }
                    if (!(path === "generate" && request.method === "POST")) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, request.json()];
                case 2:
                    requestData = _b.sent();
                    // Validate request
                    if (!requestData.prompt || !requestData.size) {
                        return [2 /*return*/, new Response(JSON.stringify({
                                error: "Invalid request",
                                details: ["Missing required fields: prompt, size"],
                            }), {
                                status: 400,
                                headers: __assign({ "Content-Type": "application/json" }, corsHeaders),
                            })];
                    }
                    prompt_1 = requestData.prompt, size = requestData.size;
                    width = size.width, height = size.height;
                    svgContent = "";
                    seed = requestData.seed || Math.floor(Math.random() * 1000000);
                    // Simple pattern matching for shapes
                    if (prompt_1.toLowerCase().includes("circle")) {
                        radius = Math.min(width, height) * 0.3;
                        cx = width / 2;
                        cy = height / 2;
                        color = getColorFromPrompt(prompt_1);
                        svgContent = "<circle cx=\"".concat(cx, "\" cy=\"").concat(cy, "\" r=\"").concat(radius, "\" fill=\"").concat(color, "\" id=\"main-circle\"></circle>");
                    }
                    else if (prompt_1.toLowerCase().includes("square") ||
                        prompt_1.toLowerCase().includes("rect")) {
                        rectWidth = width * 0.6;
                        rectHeight = height * 0.6;
                        x = (width - rectWidth) / 2;
                        y = (height - rectHeight) / 2;
                        color = getColorFromPrompt(prompt_1);
                        svgContent = "<rect x=\"".concat(x, "\" y=\"").concat(y, "\" width=\"").concat(rectWidth, "\" height=\"").concat(rectHeight, "\" fill=\"").concat(color, "\" id=\"main-rect\"></rect>");
                    }
                    else if (prompt_1.toLowerCase().includes("triangle")) {
                        points = "".concat(width / 2, ",").concat(height * 0.1, " ").concat(width * 0.1, ",").concat(height * 0.9, " ").concat(width * 0.9, ",").concat(height * 0.9);
                        color = getColorFromPrompt(prompt_1);
                        svgContent = "<polygon points=\"".concat(points, "\" fill=\"").concat(color, "\" id=\"main-triangle\"></polygon>");
                    }
                    else {
                        radius = Math.min(width, height) * 0.3;
                        cx = width / 2;
                        cy = height / 2;
                        color = getColorFromPrompt(prompt_1);
                        svgContent = "<circle cx=\"".concat(cx, "\" cy=\"").concat(cy, "\" r=\"").concat(radius, "\" fill=\"").concat(color, "\" id=\"main-shape\"></circle>");
                    }
                    svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ".concat(width, " ").concat(height, "\" width=\"").concat(width, "\" height=\"").concat(height, "\">\n      ").concat(svgContent, "\n    </svg>");
                    response = {
                        svg: svg,
                        meta: {
                            width: width,
                            height: height,
                            viewBox: "0 0 ".concat(width, " ").concat(height),
                            backgroundColor: "transparent",
                            palette: ["#3B82F6", "#1E40AF", "#1D4ED8"],
                            description: "Generated SVG based on prompt: \"".concat(prompt_1, "\""),
                            seed: seed,
                        },
                        layers: [
                            {
                                id: svgContent.includes('id="')
                                    ? ((_a = svgContent.match(/id="([^"]+)"/)) === null || _a === void 0 ? void 0 : _a[1]) || "main-shape"
                                    : "main-shape",
                                label: "Main Shape",
                                type: "shape",
                            },
                        ],
                        warnings: [],
                        errors: [],
                    };
                    return [2 /*return*/, new Response(JSON.stringify(response), {
                            headers: __assign({ "Content-Type": "application/json" }, corsHeaders),
                        })];
                case 3:
                    error_1 = _b.sent();
                    return [2 /*return*/, new Response(JSON.stringify({
                            error: "Generation failed",
                            details: [error_1 instanceof Error ? error_1.message : "Unknown error"],
                        }), {
                            status: 500,
                            headers: __assign({ "Content-Type": "application/json" }, corsHeaders),
                        })];
                case 4: 
                // 404 for other routes
                return [2 /*return*/, new Response(JSON.stringify({
                        error: "Not found",
                        details: ["API endpoint ".concat(path, " not found")],
                    }), {
                        status: 404,
                        headers: __assign({ "Content-Type": "application/json" }, corsHeaders),
                    })];
            }
        });
    });
}
// Helper function to extract color from prompt
function getColorFromPrompt(prompt) {
    var colorMap = {
        red: "#EF4444",
        blue: "#3B82F6",
        green: "#10B981",
        yellow: "#F59E0B",
        purple: "#8B5CF6",
        pink: "#EC4899",
        orange: "#F97316",
        gray: "#6B7280",
        black: "#1F2937",
        white: "#F9FAFB",
    };
    var lowerPrompt = prompt.toLowerCase();
    for (var _i = 0, _a = Object.entries(colorMap); _i < _a.length; _i++) {
        var _b = _a[_i], color = _b[0], hex = _b[1];
        if (lowerPrompt.includes(color)) {
            return hex;
        }
    }
    // Default color
    return "#3B82F6";
}
