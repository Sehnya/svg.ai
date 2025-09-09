"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var vue_1 = require("vue");
require("./style.css");
var App_vue_1 = require("./App.vue");
// Create Vue app with error handling
var app = (0, vue_1.createApp)(App_vue_1.default);
// Global error handler
app.config.errorHandler = function (err, _instance, info) {
    console.error("Vue error:", err, info);
    // In production, you might want to send this to an error reporting service
};
// Global warning handler (development only)
if ((_a = import.meta.env) === null || _a === void 0 ? void 0 : _a.DEV) {
    app.config.warnHandler = function (msg, _instance, trace) {
        console.warn("Vue warning:", msg, trace);
    };
}
app.mount("#app");
