// Re-export shared types for server use
export * from "../../src/types/api";
export * from "../../src/types/validation";

// Server-specific types
export interface GenerationError extends Error {
  code: string;
  statusCode: number;
}

export interface ValidationError extends Error {
  field: string;
  message: string;
}

export interface SanitizationError extends Error {
  element?: string;
  attribute?: string;
}

export interface NetworkError extends Error {
  statusCode?: number;
  timeout?: boolean;
}
