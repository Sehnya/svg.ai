"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayerAnalyzerTest = void 0;
var jsdom_1 = require("jsdom");
var LayerAnalyzerTest = /** @class */ (function () {
    function LayerAnalyzerTest() {
        this.dom = new jsdom_1.JSDOM();
    }
    LayerAnalyzerTest.prototype.test = function () {
        return "JSDOM import works";
    };
    return LayerAnalyzerTest;
}());
exports.LayerAnalyzerTest = LayerAnalyzerTest;
