"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SVGGenerator = void 0;
var types_1 = require("../types");
var SVGGenerator = /** @class */ (function () {
    function SVGGenerator() {
    }
    SVGGenerator.prototype.validateRequest = function (request) {
        try {
            var result = types_1.GenerationRequestSchema.safeParse(request);
            if (!result.success) {
                return {
                    success: false,
                    errors: result.error.errors.map(function (err) { return "".concat(err.path.join("."), ": ").concat(err.message); }),
                };
            }
            return {
                success: true,
                errors: [],
            };
        }
        catch (error) {
            return {
                success: false,
                errors: [
                    "Validation error: ".concat(error instanceof Error ? error.message : "Unknown error"),
                ],
            };
        }
    };
    SVGGenerator.prototype.generateSeed = function () {
        return Math.floor(Math.random() * 1000000);
    };
    SVGGenerator.prototype.limitPrecision = function (value, precision) {
        if (precision === void 0) { precision = 2; }
        return (Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision));
    };
    return SVGGenerator;
}());
exports.SVGGenerator = SVGGenerator;
