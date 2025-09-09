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
var config_1 = require("./config");
var schema_1 = require("./schema");
// Default style packs
var defaultStylePacks = [
    {
        id: "mediterranean-line-art",
        kind: "style_pack",
        title: "Mediterranean Line Art",
        body: {
            name: "Mediterranean Line Art",
            description: "Clean line art inspired by Mediterranean architecture and motifs",
            styleParameters: {
                colorPalette: ["#2563eb", "#0ea5e9", "#06b6d4", "#14b8a6"],
                strokeWidth: 2,
                cornerRadius: 4,
                fillOpacity: 0,
                strokeOpacity: 1,
                fontFamily: "Inter",
                fontSize: 14,
                lineHeight: 1.4,
                spacing: 16,
            },
        },
        tags: ["mediterranean", "line-art", "architecture", "clean", "minimal"],
        version: "1.0.0",
        status: "active",
        qualityScore: "0.9",
        sourceProvenance: {
            source: "curator",
            notes: "Default Mediterranean style pack",
        },
    },
    {
        id: "art-deco-geometric",
        kind: "style_pack",
        title: "Art Deco Geometric",
        body: {
            name: "Art Deco Geometric",
            description: "Bold geometric patterns inspired by Art Deco design",
            styleParameters: {
                colorPalette: ["#dc2626", "#ea580c", "#d97706", "#ca8a04"],
                strokeWidth: 3,
                cornerRadius: 0,
                fillOpacity: 0.8,
                strokeOpacity: 1,
                fontFamily: "Inter",
                fontSize: 16,
                lineHeight: 1.2,
                spacing: 20,
            },
        },
        tags: ["art-deco", "geometric", "bold", "patterns", "vintage"],
        version: "1.0.0",
        status: "active",
        qualityScore: "0.85",
        sourceProvenance: {
            source: "curator",
            notes: "Default Art Deco style pack",
        },
    },
    {
        id: "modern-minimal",
        kind: "style_pack",
        title: "Modern Minimal",
        body: {
            name: "Modern Minimal",
            description: "Clean, modern minimalist design with subtle colors",
            styleParameters: {
                colorPalette: ["#6b7280", "#9ca3af", "#d1d5db", "#f3f4f6"],
                strokeWidth: 1.5,
                cornerRadius: 8,
                fillOpacity: 0.1,
                strokeOpacity: 0.8,
                fontFamily: "Inter",
                fontSize: 12,
                lineHeight: 1.5,
                spacing: 12,
            },
        },
        tags: ["modern", "minimal", "clean", "subtle", "contemporary"],
        version: "1.0.0",
        status: "active",
        qualityScore: "0.95",
        sourceProvenance: {
            source: "curator",
            notes: "Default modern minimal style pack",
        },
    },
];
// Default motifs
var defaultMotifs = [
    {
        id: "mediterranean-arch",
        kind: "motif",
        title: "Mediterranean Arch",
        body: {
            name: "Mediterranean Arch",
            description: "Classic rounded arch found in Mediterranean architecture",
            parameters: {
                shapes: [
                    {
                        type: "path",
                        pathData: "M 10 50 Q 50 10 90 50 L 90 60 L 10 60 Z",
                        strokeWidth: 2,
                        fill: "none",
                    },
                ],
                patterns: [],
                decorativeElements: [],
                layoutHints: ["center", "architectural"],
            },
        },
        tags: ["arch", "mediterranean", "architecture", "curved", "classic"],
        version: "1.0.0",
        status: "active",
        qualityScore: "0.9",
        sourceProvenance: {
            source: "curator",
            notes: "Classic Mediterranean arch motif",
        },
    },
    {
        id: "olive-branch",
        kind: "motif",
        title: "Olive Branch",
        body: {
            name: "Olive Branch",
            description: "Stylized olive branch with leaves",
            parameters: {
                shapes: [
                    {
                        type: "path",
                        pathData: "M 20 50 Q 30 40 40 50 Q 50 40 60 50 Q 70 40 80 50",
                        strokeWidth: 2,
                        fill: "none",
                    },
                ],
                patterns: ["organic", "flowing"],
                decorativeElements: ["leaves", "natural"],
                layoutHints: ["decorative", "border", "accent"],
            },
        },
        tags: ["olive", "branch", "natural", "mediterranean", "organic", "peace"],
        version: "1.0.0",
        status: "active",
        qualityScore: "0.85",
        sourceProvenance: {
            source: "curator",
            notes: "Mediterranean olive branch motif",
        },
    },
    {
        id: "greek-key",
        kind: "motif",
        title: "Greek Key Pattern",
        body: {
            name: "Greek Key Pattern",
            description: "Traditional Greek key geometric pattern",
            parameters: {
                shapes: [
                    {
                        type: "path",
                        pathData: "M 10 10 L 30 10 L 30 30 L 50 30 L 50 10 L 70 10 L 70 50 L 10 50 Z",
                        strokeWidth: 2,
                        fill: "none",
                    },
                ],
                patterns: ["geometric", "repeating"],
                decorativeElements: ["border", "frame"],
                layoutHints: ["border", "pattern", "geometric"],
            },
        },
        tags: ["greek", "key", "pattern", "geometric", "traditional", "border"],
        version: "1.0.0",
        status: "active",
        qualityScore: "0.88",
        sourceProvenance: {
            source: "curator",
            notes: "Traditional Greek key pattern",
        },
    },
];
// Default glossary terms
var defaultGlossary = [
    {
        id: "stroke-width-guide",
        kind: "glossary",
        title: "Stroke Width Guidelines",
        body: {
            term: "stroke-width",
            definition: "The width of the outline of SVG shapes",
            guidelines: {
                thin: "1-1.5px for delicate details",
                medium: "2-3px for standard elements",
                thick: "4-6px for bold emphasis",
                constraints: "Must be >= 1px for visibility",
            },
        },
        tags: ["stroke", "width", "guidelines", "technical"],
        version: "1.0.0",
        status: "active",
        qualityScore: "0.95",
        sourceProvenance: {
            source: "curator",
            notes: "Technical guidelines for stroke width",
        },
    },
];
// Default rules
var defaultRules = [
    {
        id: "stroke-only-rule",
        kind: "rule",
        title: "Stroke-Only Rendering",
        body: {
            rule: "stroke-only",
            description: "All elements must use stroke rendering without fill",
            constraints: {
                fill: "none",
                stroke: "required",
                strokeWidth: ">= 1",
            },
            exceptions: ["background", "canvas"],
        },
        tags: ["stroke", "rendering", "constraint", "style"],
        version: "1.0.0",
        status: "active",
        qualityScore: "1.0",
        sourceProvenance: {
            source: "curator",
            notes: "Core rendering constraint for stroke-only SVGs",
        },
    },
];
function seedDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var existingObjects, _i, defaultStylePacks_1, stylePack, _a, defaultMotifs_1, motif, _b, defaultGlossary_1, glossaryItem, _c, defaultRules_1, rule, error_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 20, 21, 23]);
                    console.log("Starting database seeding...");
                    return [4 /*yield*/, config_1.db.select().from(schema_1.kbObjects).limit(1)];
                case 1:
                    existingObjects = _d.sent();
                    if (existingObjects.length > 0) {
                        console.log("Database already contains data. Skipping seed.");
                        return [2 /*return*/];
                    }
                    // Insert style packs
                    console.log("Inserting default style packs...");
                    _i = 0, defaultStylePacks_1 = defaultStylePacks;
                    _d.label = 2;
                case 2:
                    if (!(_i < defaultStylePacks_1.length)) return [3 /*break*/, 5];
                    stylePack = defaultStylePacks_1[_i];
                    return [4 /*yield*/, config_1.db.insert(schema_1.kbObjects).values(stylePack)];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    // Insert motifs
                    console.log("Inserting default motifs...");
                    _a = 0, defaultMotifs_1 = defaultMotifs;
                    _d.label = 6;
                case 6:
                    if (!(_a < defaultMotifs_1.length)) return [3 /*break*/, 9];
                    motif = defaultMotifs_1[_a];
                    return [4 /*yield*/, config_1.db.insert(schema_1.kbObjects).values(motif)];
                case 7:
                    _d.sent();
                    _d.label = 8;
                case 8:
                    _a++;
                    return [3 /*break*/, 6];
                case 9:
                    // Insert glossary terms
                    console.log("Inserting default glossary...");
                    _b = 0, defaultGlossary_1 = defaultGlossary;
                    _d.label = 10;
                case 10:
                    if (!(_b < defaultGlossary_1.length)) return [3 /*break*/, 13];
                    glossaryItem = defaultGlossary_1[_b];
                    return [4 /*yield*/, config_1.db.insert(schema_1.kbObjects).values(glossaryItem)];
                case 11:
                    _d.sent();
                    _d.label = 12;
                case 12:
                    _b++;
                    return [3 /*break*/, 10];
                case 13:
                    // Insert rules
                    console.log("Inserting default rules...");
                    _c = 0, defaultRules_1 = defaultRules;
                    _d.label = 14;
                case 14:
                    if (!(_c < defaultRules_1.length)) return [3 /*break*/, 17];
                    rule = defaultRules_1[_c];
                    return [4 /*yield*/, config_1.db.insert(schema_1.kbObjects).values(rule)];
                case 15:
                    _d.sent();
                    _d.label = 16;
                case 16:
                    _c++;
                    return [3 /*break*/, 14];
                case 17:
                    // Create some relationships
                    console.log("Creating object relationships...");
                    return [4 /*yield*/, config_1.db.insert(schema_1.kbLinks).values([
                            {
                                srcId: "mediterranean-arch",
                                dstId: "mediterranean-line-art",
                                rel: "belongs_to",
                            },
                            {
                                srcId: "olive-branch",
                                dstId: "mediterranean-line-art",
                                rel: "belongs_to",
                            },
                            {
                                srcId: "greek-key",
                                dstId: "mediterranean-line-art",
                                rel: "belongs_to",
                            },
                        ])];
                case 18:
                    _d.sent();
                    // Insert default global preferences
                    console.log("Setting up default preferences...");
                    return [4 /*yield*/, config_1.db.insert(schema_1.globalPreferences).values({
                            id: true,
                            weights: {
                                motifs: {
                                    "mediterranean-arch": 1.0,
                                    "olive-branch": 0.9,
                                    "greek-key": 0.8,
                                },
                                tags: {
                                    mediterranean: 1.0,
                                    clean: 0.9,
                                    minimal: 0.8,
                                    geometric: 0.7,
                                },
                                strokeWidth: "[1.5, 3]",
                            },
                        })];
                case 19:
                    _d.sent();
                    console.log("Database seeding completed successfully!");
                    return [3 /*break*/, 23];
                case 20:
                    error_1 = _d.sent();
                    console.error("Seeding failed:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 23];
                case 21: return [4 /*yield*/, (0, config_1.closeDatabaseConnection)()];
                case 22:
                    _d.sent();
                    return [7 /*endfinally*/];
                case 23: return [2 /*return*/];
            }
        });
    });
}
seedDatabase();
