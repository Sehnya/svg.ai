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
var hono_1 = require("hono");
var cors_1 = require("hono/cors");
// Import your existing services
var RuleBasedGenerator_1 = require("./services/RuleBasedGenerator");
var app = new hono_1.Hono();
// CORS for Cloudflare
app.use("*", (0, cors_1.cors)({
    origin: function (origin) {
        var _a;
        // Allow Cloudflare Pages domains and custom domains
        var allowedOrigins = [
            "https://svg-ai.pages.dev",
            /^https:\/\/.*\.pages\.dev$/,
            /^https:\/\/.*\.workers\.dev$/,
        ];
        // Add custom domains from environment
        var customOrigins = ((_a = globalThis.ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(",")) || [];
        return (allowedOrigins.some(function (allowed) {
            if (typeof allowed === "string") {
                return allowed === origin;
            }
            return allowed.test(origin || "");
        }) || customOrigins.includes(origin || ""));
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: false,
}));
// Health check endpoint
app.get("/health", function (c) {
    return c.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        worker: true,
        environment: "cloudflare-workers",
    });
});
// SVG generation endpoint
app.post("/api/generate", function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var request, generator, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, c.req.json()];
            case 1:
                request = _a.sent();
                // Validate request
                if (!request.prompt || !request.size) {
                    return [2 /*return*/, c.json({
                            error: "Invalid request",
                            details: ["Missing required fields: prompt, size"],
                        }, 400)];
                }
                generator = new RuleBasedGenerator_1.RuleBasedGenerator();
                return [4 /*yield*/, generator.generate(request)];
            case 2:
                result = _a.sent();
                return [2 /*return*/, c.json(result)];
            case 3:
                error_1 = _a.sent();
                console.error("Generation error:", error_1);
                return [2 /*return*/, c.json({
                        error: "Generation failed",
                        details: [error_1 instanceof Error ? error_1.message : "Unknown error"],
                    }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Catch-all for API routes
app.all("/api/*", function (c) {
    return c.json({
        error: "Not found",
        details: ["API endpoint ".concat(c.req.path, " not found")],
    }, 404);
});
// Root endpoint
app.get("/", function (c) {
    return c.json({
        name: "SVG AI Code Generator API",
        version: "1.0.0",
        environment: "cloudflare-workers",
        endpoints: {
            health: "/health",
            generate: "/api/generate",
        },
    });
});
exports.default = app;
