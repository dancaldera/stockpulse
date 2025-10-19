export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'DATA_SOURCE_ERROR'
  | 'ANALYSIS_ERROR'
  | 'INTERNAL_ERROR'

export interface ErrorOptions {
  code?: ErrorCode
  status?: number
  cause?: unknown
  retryAfter?: number
  details?: unknown
}

export interface ErrorResponseBody {
  success: false
  error: string
  code: ErrorCode
  retryAfter?: number
  details?: unknown
}

export class AppError extends Error {
  code: ErrorCode
  status: number
  retryAfter?: number
  details?: unknown

  constructor(message: string, options: ErrorOptions = {}) {
    super(message)
    this.name = 'AppError'
    this.code = options.code ?? 'INTERNAL_ERROR'
    this.status = options.status ?? 500
    this.retryAfter = options.retryAfter
    this.details = options.details
    if (options.cause) {
      this.cause = options.cause
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, { code: 'VALIDATION_ERROR', status: 400, ...options })
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, retryAfter?: number, options: ErrorOptions = {}) {
    super(message, { code: 'RATE_LIMIT_EXCEEDED', status: 429, retryAfter, ...options })
    this.name = 'RateLimitError'
  }
}

export class DataSourceError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, { code: 'DATA_SOURCE_ERROR', status: 502, ...options })
    this.name = 'DataSourceError'
  }
}

export class AnalysisError extends AppError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, { code: 'ANALYSIS_ERROR', status: 500, ...options })
    this.name = 'AnalysisError'
  }
}

export function mapErrorToResponse(error: unknown): { status: number; body: ErrorResponseBody } {
  if (error instanceof AppError) {
    const { status, code, message, retryAfter, details } = error
    return {
      status,
      body: {
        success: false,
        error: message,
        code,
        retryAfter,
        details,
      },
    }
  }

  if (error instanceof Error) {
    return {
      status: 500,
      body: {
        success: false,
        error: error.message,
        code: 'INTERNAL_ERROR',
      },
    }
  }

  return {
    status: 500,
    body: {
      success: false,
      error: 'Unknown error occurred',
      code: 'INTERNAL_ERROR',
    },
  }
}
