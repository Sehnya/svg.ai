// Server types export
export * from "./api";

// Additional server-specific constants
export const SERVER_CONSTANTS = {
  DEFAULT_PORT: 3001,
  MAX_REQUEST_SIZE: "10mb",
  CORS_ORIGINS: ["http://localhost:5173", "http://localhost:3000"],
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
} as const;
