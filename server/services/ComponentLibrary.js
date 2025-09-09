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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentLibrary = void 0;
var ComponentLibrary = /** @class */ (function () {
    function ComponentLibrary() {
        this.templates = new Map();
        this.initializeDefaultTemplates();
    }
    ComponentLibrary.prototype.initializeDefaultTemplates = function () {
        // Geometric shapes
        this.addTemplate({
            id: "circle-basic",
            name: "Basic Circle",
            type: "circle",
            category: "geometric",
            template: '<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{strokeWidth}"/>',
            parameters: [
                { name: "cx", type: "number", default: 50 },
                { name: "cy", type: "number", default: 50 },
                { name: "r", type: "number", default: 25, min: 1, max: 100 },
                { name: "fill", type: "color", default: "#2563eb" },
                { name: "stroke", type: "color", default: "none" },
                { name: "strokeWidth", type: "number", default: 1, min: 0, max: 10 },
            ],
            metadata: {
                reusable: true,
                scalable: true,
                tags: ["circle", "geometric", "basic"],
            },
        });
        this.addTemplate({
            id: "rect-basic",
            name: "Basic Rectangle",
            type: "rect",
            category: "geometric",
            template: '<rect x="{x}" y="{y}" width="{width}" height="{height}" fill="{fill}" stroke="{stroke}" stroke-width="{strokeWidth}"/>',
            parameters: [
                { name: "x", type: "number", default: 25 },
                { name: "y", type: "number", default: 25 },
                { name: "width", type: "number", default: 50, min: 1, max: 200 },
                { name: "height", type: "number", default: 50, min: 1, max: 200 },
                { name: "fill", type: "color", default: "#16a34a" },
                { name: "stroke", type: "color", default: "none" },
                { name: "strokeWidth", type: "number", default: 1, min: 0, max: 10 },
            ],
            metadata: {
                reusable: true,
                scalable: true,
                tags: ["rectangle", "square", "geometric", "basic"],
            },
        });
        this.addTemplate({
            id: "triangle-basic",
            name: "Basic Triangle",
            type: "polygon",
            category: "geometric",
            template: '<polygon points="{points}" fill="{fill}" stroke="{stroke}" stroke-width="{strokeWidth}"/>',
            parameters: [
                { name: "points", type: "string", default: "50,10 90,90 10,90" },
                { name: "fill", type: "color", default: "#eab308" },
                { name: "stroke", type: "color", default: "none" },
                { name: "strokeWidth", type: "number", default: 1, min: 0, max: 10 },
            ],
            metadata: {
                reusable: true,
                scalable: true,
                tags: ["triangle", "polygon", "geometric", "basic"],
            },
        });
        // Organic shapes
        this.addTemplate({
            id: "leaf-organic",
            name: "Organic Leaf",
            type: "path",
            category: "nature",
            template: '<path d="{pathData}" fill="{fill}" stroke="{stroke}" stroke-width="{strokeWidth}"/>',
            parameters: [
                {
                    name: "pathData",
                    type: "string",
                    default: "M50,10 Q70,30 60,50 Q50,70 40,50 Q30,30 50,10 Z",
                },
                { name: "fill", type: "color", default: "#16a34a" },
                { name: "stroke", type: "color", default: "#15803d" },
                { name: "strokeWidth", type: "number", default: 1, min: 0, max: 5 },
            ],
            metadata: {
                reusable: true,
                scalable: true,
                tags: ["leaf", "nature", "organic", "plant"],
            },
        });
        this.addTemplate({
            id: "wave-abstract",
            name: "Abstract Wave",
            type: "path",
            category: "abstract",
            template: '<path d="{pathData}" fill="none" stroke="{stroke}" stroke-width="{strokeWidth}"/>',
            parameters: [
                {
                    name: "pathData",
                    type: "string",
                    default: "M10,50 Q30,20 50,50 Q70,80 90,50",
                },
                { name: "stroke", type: "color", default: "#2563eb" },
                { name: "strokeWidth", type: "number", default: 2, min: 1, max: 8 },
            ],
            metadata: {
                reusable: true,
                scalable: true,
                tags: ["wave", "curve", "abstract", "flow"],
            },
        });
    };
    ComponentLibrary.prototype.addTemplate = function (template) {
        this.templates.set(template.id, template);
    };
    ComponentLibrary.prototype.getTemplate = function (id) {
        return this.templates.get(id);
    };
    ComponentLibrary.prototype.findTemplates = function (criteria) {
        var results = [];
        var _loop_1 = function (template) {
            var matches = true;
            if (criteria.category && template.category !== criteria.category) {
                matches = false;
            }
            if (criteria.type && template.type !== criteria.type) {
                matches = false;
            }
            if (criteria.tags && criteria.tags.length > 0) {
                var hasMatchingTag = criteria.tags.some(function (tag) {
                    return template.metadata.tags.includes(tag);
                });
                if (!hasMatchingTag) {
                    matches = false;
                }
            }
            if (matches) {
                results.push(template);
            }
        };
        for (var _i = 0, _a = this.templates.values(); _i < _a.length; _i++) {
            var template = _a[_i];
            _loop_1(template);
        }
        return results;
    };
    ComponentLibrary.prototype.instantiateComponent = function (templateId, parameters, position, size) {
        var template = this.getTemplate(templateId);
        if (!template) {
            return null;
        }
        // Merge provided parameters with defaults
        var finalParams = __assign(__assign({}, this.getDefaultParameters(template)), parameters);
        // Scale parameters based on size
        if (template.metadata.scalable) {
            finalParams.cx = (finalParams.cx || 50) * (size.width / 100);
            finalParams.cy = (finalParams.cy || 50) * (size.height / 100);
            finalParams.r =
                ((finalParams.r || 25) * Math.min(size.width, size.height)) / 100;
            finalParams.width = (finalParams.width || 50) * (size.width / 100);
            finalParams.height = (finalParams.height || 50) * (size.height / 100);
        }
        // Apply position offset
        if (finalParams.cx !== undefined)
            finalParams.cx += position.x;
        if (finalParams.cy !== undefined)
            finalParams.cy += position.y;
        if (finalParams.x !== undefined)
            finalParams.x += position.x;
        if (finalParams.y !== undefined)
            finalParams.y += position.y;
        // Generate SVG markup
        var markup = template.template;
        for (var _i = 0, _a = Object.entries(finalParams); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            markup = markup.replace(new RegExp("{".concat(key, "}"), "g"), String(value));
        }
        // Parse attributes from the markup
        var attributes = this.parseAttributes(markup, template.type);
        return {
            id: "".concat(templateId, "-").concat(Date.now()),
            type: template.name,
            element: template.type,
            attributes: attributes,
            metadata: {
                motif: template.category,
                generated: true,
                reused: template.metadata.reusable,
            },
        };
    };
    ComponentLibrary.prototype.getDefaultParameters = function (template) {
        var defaults = {};
        for (var _i = 0, _a = template.parameters; _i < _a.length; _i++) {
            var param = _a[_i];
            defaults[param.name] = param.default;
        }
        return defaults;
    };
    ComponentLibrary.prototype.parseAttributes = function (markup, elementType) {
        var attributes = {};
        // Extract attributes from SVG markup
        var attrRegex = /(\w+)="([^"]+)"/g;
        var match;
        while ((match = attrRegex.exec(markup)) !== null) {
            var name_1 = match[1], value = match[2];
            // Convert numeric values
            if (["cx", "cy", "r", "x", "y", "width", "height", "stroke-width"].includes(name_1)) {
                attributes[name_1] = parseFloat(value);
            }
            else {
                attributes[name_1] = value;
            }
        }
        return attributes;
    };
    ComponentLibrary.prototype.getReusableComponents = function (motifs) {
        var components = [];
        for (var _i = 0, motifs_1 = motifs; _i < motifs_1.length; _i++) {
            var motif = motifs_1[_i];
            var matching = this.findTemplates({ tags: [motif] });
            components.push.apply(components, matching.filter(function (t) { return t.metadata.reusable; }));
        }
        return components;
    };
    ComponentLibrary.prototype.generateVariation = function (templateId, variationLevel) {
        if (variationLevel === void 0) { variationLevel = 0.2; }
        var template = this.getTemplate(templateId);
        if (!template) {
            return null;
        }
        // Create a variation by modifying parameters
        var newTemplate = __assign(__assign({}, template), { id: "".concat(template.id, "-var-").concat(Date.now()), name: "".concat(template.name, " Variation"), parameters: template.parameters.map(function (param) {
                if (param.type === "number" && param.name !== "strokeWidth") {
                    var variation = param.default * variationLevel * (Math.random() - 0.5) * 2;
                    var newDefault = Math.max(param.min || 0, Math.min(param.max || 1000, param.default + variation));
                    return __assign(__assign({}, param), { default: newDefault });
                }
                return param;
            }) });
        return newTemplate;
    };
    return ComponentLibrary;
}());
exports.ComponentLibrary = ComponentLibrary;
