"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var plugin_vue_1 = require("@vitejs/plugin-vue");
var path_1 = require("path");
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_vue_1.default)()],
    // Build configuration
    build: {
        // Output directory
        outDir: "dist",
        // Generate source maps for production debugging
        sourcemap: true,
        // Minify with terser for better compression
        minify: "terser",
        // Terser options for optimization
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.log in production
                drop_debugger: true, // Remove debugger statements
            },
        },
        // Rollup options for advanced bundling
        rollupOptions: {
            input: {
                main: (0, path_1.resolve)(__dirname, "index.html"),
            },
            output: {
                // Manual chunks for better caching
                manualChunks: {
                    // Vendor chunk for third-party libraries
                    vendor: ["vue"],
                    // UI components chunk
                    ui: [
                        "./src/components/ToastContainer.vue",
                        "./src/components/ValidationErrors.vue",
                        "./src/components/LazyComponent.vue",
                        "./src/components/VirtualScroll.vue",
                    ],
                    // Utils chunk
                    utils: [
                        "./src/utils/inputSanitizer.ts",
                        "./src/utils/debounce.ts",
                        "./src/utils/performance.ts",
                    ],
                },
                // Asset file naming
                assetFileNames: function (assetInfo) {
                    var _a;
                    var info = ((_a = assetInfo.name) === null || _a === void 0 ? void 0 : _a.split(".")) || [];
                    var extType = info[info.length - 1];
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
                        return "assets/images/[name]-[hash][extname]";
                    }
                    if (/woff2?|eot|ttf|otf/i.test(extType)) {
                        return "assets/fonts/[name]-[hash][extname]";
                    }
                    return "assets/[name]-[hash][extname]";
                },
                // Chunk file naming
                chunkFileNames: "assets/js/[name]-[hash].js",
                entryFileNames: "assets/js/[name]-[hash].js",
            },
        },
        // Chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Asset size warning limit
        assetsInlineLimit: 4096,
    },
    // Development server configuration
    server: {
        port: 5173,
        host: true, // Allow external connections
        cors: true,
        // Proxy API requests to backend in development
        proxy: {
            "/api": {
                target: "http://localhost:3001",
                changeOrigin: true,
            },
            "/health": {
                target: "http://localhost:3001",
                changeOrigin: true,
            },
        },
    },
    // Preview server configuration
    preview: {
        port: 4173,
        host: true,
    },
    // Path resolution
    resolve: {
        alias: {
            "@": (0, path_1.resolve)(__dirname, "./src"),
        },
    },
    // CSS configuration
    css: {
        // PostCSS configuration
        postcss: "./postcss.config.js",
        // CSS modules configuration
        modules: {
            localsConvention: "camelCase",
        },
    },
    // Environment variables
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    // Optimization
    optimizeDeps: {
        include: ["vue"],
        exclude: [],
    },
});
