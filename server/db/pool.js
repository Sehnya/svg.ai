"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.DatabasePool = void 0;
exports.createDatabasePool = createDatabasePool;
exports.getDatabasePool = getDatabasePool;
/**
 * Database connection pooling configuration for optimal performance
 */
var pg_1 = require("pg");
var node_postgres_1 = require("drizzle-orm/node-postgres");
var schema = require("./schema.js");
var DatabasePool = /** @class */ (function () {
    function DatabasePool(config) {
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            waitingClients: 0,
            totalQueries: 0,
            slowQueries: 0,
            errors: 0,
        };
        var poolConfig = {
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
            ssl: config.ssl ? { rejectUnauthorized: false } : false,
            // Connection pool settings
            max: config.maxConnections || 20, // Maximum pool size
            min: 2, // Minimum pool size
            idleTimeoutMillis: config.idleTimeoutMs || 30000, // 30 seconds
            connectionTimeoutMillis: config.connectionTimeoutMs || 5000, // 5 seconds
            // Performance optimizations
            allowExitOnIdle: true,
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
        };
        this.pool = new pg_1.Pool(poolConfig);
        this.db = (0, node_postgres_1.drizzle)(this.pool, { schema: schema });
        // Set up event listeners for monitoring
        this.setupMonitoring();
    }
    DatabasePool.prototype.setupMonitoring = function () {
        var _this = this;
        this.pool.on("connect", function (client) {
            _this.metrics.totalConnections++;
            _this.metrics.activeConnections++;
            console.log("Database connection established. Active: ".concat(_this.metrics.activeConnections));
        });
        this.pool.on("remove", function (client) {
            _this.metrics.activeConnections--;
            console.log("Database connection removed. Active: ".concat(_this.metrics.activeConnections));
        });
        this.pool.on("error", function (err, client) {
            _this.metrics.errors++;
            console.error("Database pool error:", err);
        });
        // Monitor pool status periodically
        setInterval(function () {
            _this.updateMetrics();
        }, 30000); // Every 30 seconds
    };
    DatabasePool.prototype.updateMetrics = function () {
        this.metrics.totalConnections = this.pool.totalCount;
        this.metrics.activeConnections = this.pool.totalCount - this.pool.idleCount;
        this.metrics.idleConnections = this.pool.idleCount;
        this.metrics.waitingClients = this.pool.waitingCount;
    };
    DatabasePool.prototype.getDatabase = function () {
        return this.db;
    };
    DatabasePool.prototype.getPool = function () {
        return this.pool;
    };
    DatabasePool.prototype.getMetrics = function () {
        this.updateMetrics();
        return __assign({}, this.metrics);
    };
    DatabasePool.prototype.executeQuery = function (queryFn_1) {
        return __awaiter(this, arguments, void 0, function (queryFn, options) {
            var startTime, timeout, result, duration, error_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        timeout = options.timeout || 30000;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this.metrics.totalQueries++;
                        return [4 /*yield*/, Promise.race([
                                queryFn(this.db),
                                new Promise(function (_, reject) {
                                    return setTimeout(function () { return reject(new Error("Query timeout")); }, timeout);
                                }),
                            ])];
                    case 2:
                        result = _a.sent();
                        duration = Date.now() - startTime;
                        // Log slow queries
                        if (options.logSlow !== false && duration > 1000) {
                            this.metrics.slowQueries++;
                            console.warn("Slow query detected: ".concat(duration, "ms"));
                        }
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        this.metrics.errors++;
                        console.error("Query execution error:", error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DatabasePool.prototype.healthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Test connection with simple query
                        return [4 /*yield*/, this.executeQuery(function (db) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, db.execute((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1"], ["SELECT 1"]))))];
                            }); }); }, {
                                timeout: 5000,
                            })];
                    case 1:
                        // Test connection with simple query
                        _a.sent();
                        return [2 /*return*/, {
                                healthy: true,
                                metrics: this.getMetrics(),
                                poolStatus: {
                                    total: this.pool.totalCount,
                                    idle: this.pool.idleCount,
                                    waiting: this.pool.waitingCount,
                                },
                            }];
                    case 2:
                        error_2 = _a.sent();
                        return [2 /*return*/, {
                                healthy: false,
                                metrics: this.getMetrics(),
                                poolStatus: {
                                    total: this.pool.totalCount,
                                    idle: this.pool.idleCount,
                                    waiting: this.pool.waitingCount,
                                },
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabasePool.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.pool.end()];
                    case 1:
                        _a.sent();
                        console.log("Database pool closed");
                        return [2 /*return*/];
                }
            });
        });
    };
    return DatabasePool;
}());
exports.DatabasePool = DatabasePool;
// Singleton instance
var dbPool = null;
function createDatabasePool(config) {
    if (dbPool) {
        throw new Error("Database pool already initialized");
    }
    dbPool = new DatabasePool(config);
    return dbPool;
}
function getDatabasePool() {
    if (!dbPool) {
        throw new Error("Database pool not initialized. Call createDatabasePool first.");
    }
    return dbPool;
}
// SQL import for health check
var drizzle_orm_1 = require("drizzle-orm");
var templateObject_1;
