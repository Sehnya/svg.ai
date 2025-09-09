"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    schema: "./server/db/schema.ts",
    out: "./server/db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgresql://localhost:5432/svg_ai_dev",
    },
    verbose: true,
    strict: true,
};
