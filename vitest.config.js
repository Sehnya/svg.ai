"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("vitest/config");
var plugin_vue_1 = require("@vitejs/plugin-vue");
var path_1 = require("path");
exports.default = (0, config_1.defineConfig)({
    plugins: [(0, plugin_vue_1.default)()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./tests/setup.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/",
                "tests/",
                "dist/",
                "**/*.d.ts",
                "vite.config.ts",
                "vitest.config.ts",
            ],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
            },
        },
        include: [
            "tests/unit/**/*.test.ts",
            "tests/integration/**/*.test.ts",
            "tests/e2e/**/*.test.ts",
        ],
        exclude: ["node_modules/", "dist/"],
    },
    resolve: {
        alias: {
            "@": (0, path_1.resolve)(__dirname, "./src"),
        },
    },
});
