#!/usr/bin/env bun
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
var OpenAIGenerator_1 = require("../server/services/OpenAIGenerator");
function testOpenAI() {
    return __awaiter(this, void 0, void 0, function () {
        var generator, testRequest, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log("🧪 Testing OpenAI integration...");
                    if (!process.env.OPENAI_API_KEY) {
                        console.error("❌ OPENAI_API_KEY not found in environment variables");
                        console.log("Please add your OpenAI API key to the .env file");
                        process.exit(1);
                    }
                    generator = new OpenAIGenerator_1.OpenAIGenerator();
                    testRequest = {
                        prompt: "A simple blue circle",
                        size: { width: 100, height: 100 },
                        palette: ["#0066CC"],
                        seed: 12345,
                        model: "llm",
                    };
                    console.log("📝 Generating SVG with prompt:", testRequest.prompt);
                    return [4 /*yield*/, generator.generate(testRequest)];
                case 1:
                    result = _a.sent();
                    if (result.errors.length > 0) {
                        console.error("❌ Generation failed with errors:");
                        result.errors.forEach(function (error) { return console.error("  -", error); });
                        if (result.warnings.length > 0) {
                            console.log("⚠️  Warnings:");
                            result.warnings.forEach(function (warning) { return console.log("  -", warning); });
                        }
                        if (result.warnings.includes("Fell back to rule-based generation")) {
                            console.log("✅ Fallback to rule-based generation worked correctly");
                        }
                    }
                    else {
                        console.log("✅ OpenAI generation successful!");
                        console.log("📊 Generated SVG length:", result.svg.length, "characters");
                        console.log("🎨 Layers found:", result.layers.length);
                        if (result.warnings.length > 0) {
                            console.log("⚠️  Warnings:");
                            result.warnings.forEach(function (warning) { return console.log("  -", warning); });
                        }
                        // Show first 200 characters of SVG
                        console.log("🖼️  SVG preview:");
                        console.log(result.svg.substring(0, 200) + "...");
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error("❌ Test failed:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
testOpenAI();
