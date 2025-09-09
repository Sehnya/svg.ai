"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayerAnalyzerTest2 = void 0;
var jsdom_1 = require("jsdom");
var LayerAnalyzerTest2 = /** @class */ (function () {
    function LayerAnalyzerTest2() {
        this.dom = new jsdom_1.JSDOM();
    }
    LayerAnalyzerTest2.prototype.test = function () {
        return {
            id: "test",
            label: "Test",
            type: "shape",
        };
    };
    return LayerAnalyzerTest2;
}());
exports.LayerAnalyzerTest2 = LayerAnalyzerTest2;
