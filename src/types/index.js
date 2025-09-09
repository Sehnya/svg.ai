"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SVG_CONSTANTS = void 0;
// Main types export file
__exportStar(require("./api"), exports);
__exportStar(require("./validation"), exports);
__exportStar(require("./components"), exports);
// Constants for SVG validation
exports.SVG_CONSTANTS = {
    ALLOWED_TAGS: [
        "svg",
        "g",
        "path",
        "circle",
        "rect",
        "line",
        "polyline",
        "polygon",
        "ellipse",
    ],
    FORBIDDEN_TAGS: ["script", "foreignObject", "image"],
    FORBIDDEN_ATTRIBUTES: /^on[a-z]+$/i,
    MAX_DECIMAL_PRECISION: 2,
    REQUIRED_ATTRIBUTES: {
        svg: ["xmlns", "viewBox"],
    },
    SIZE_PRESETS: {
        icon: { width: 24, height: 24 },
        banner: { width: 800, height: 200 },
        square: { width: 400, height: 400 },
    },
    DEFAULT_PALETTES: {
        primary: ["#3B82F6", "#1E40AF", "#1D4ED8"],
        secondary: ["#10B981", "#059669", "#047857"],
        accent: ["#F59E0B", "#D97706", "#B45309"],
        monochrome: ["#374151", "#6B7280", "#9CA3AF"],
    },
};
