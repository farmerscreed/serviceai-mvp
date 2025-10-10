/**
 * Comprehensive Error Handling and Logging Utility
 * 
 * This utility provides standardized error handling, logging, and monitoring
 * for the ServiceAI platform, ensuring consistent error reporting across all services.
 */

export interface ErrorContext {
  organizationId?: string
  userId?: string
  callId?: string
  webhookType?: string
  operation?: string
  attempt?: number
  maxRetries?: number
  detectedLanguage?: string
  metadata?: Record<string, any>
}

export interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

export const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

export interface StructuredLog {
  timestamp: string
  level: string
  message: string
  context?: ErrorContext
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  metadata?: Record<string, any>
}

/**
 * Enhanced error class with context and structured logging
 */
export class ServiceAIError extends Error {
  public readonly code: string
  public readonly context: ErrorContext
  public readonly isOperational: boolean
  public readonly timestamp: string

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    context: ErrorContext = {},
    isOperational: boolean = true
  ) {
    super(message)
    this.name = 'ServiceAIError'
    this.code = code
    this.context = context
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, ServiceAIError)
  }
}

/**
 * Error codes for different types of errors
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Webhook & API
  INVALID_WEBHOOK_SIGNATURE: 'INVALID_WEBHOOK_SIGNATURE',
  INVALID_WEBHOOK_PAYLOAD: 'INVALID_WEBHOOK_PAYLOAD',
  WEBHOOK_PROCESSING_FAILED: 'WEBHOOK_PROCESSING_FAILED',
  API_RATE_LIMIT_EXCEEDED: 'API_RATE_LIMIT_EXCEEDED',
  
  // Database
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  DATABASE_QUERY_FAILED: 'DATABASE_QUERY_FAILED',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  
  // External Services
  STRIPE_API_ERROR: 'STRIPE_API_ERROR',
  VAPI_API_ERROR: 'VAPI_API_ERROR',
  TWILIO_API_ERROR: 'TWILIO_API_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  
  // Business Logic
  INSUFFICIENT_MINUTES: 'INSUFFICIENT_MINUTES',
  SUBSCRIPTION_INACTIVE: 'SUBSCRIPTION_INACTIVE',
  INVALID_SUBSCRIPTION_TIER: 'INVALID_SUBSCRIPTION_TIER',
  
  // System
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

/**
 * Structured logger for consistent logging across the application
 */
export class StructuredLogger {
  private static instance: StructuredLogger
  private logLevel: string

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info'
  }

  public static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger()
    }
    return StructuredLogger.instance
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  private formatLog(level: string, message: string, context?: ErrorContext, error?: Error, metadata?: Record<string, any>): StructuredLog {
    const structuredLog: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata
    }

    if (error) {
      structuredLog.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    }

    return structuredLog
  }

  public debug(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    if (this.shouldLog('debug')) {
      const log = this.formatLog('debug', message, context, undefined, metadata)
      console.debug(JSON.stringify(log))
    }
  }

  public info(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    if (this.shouldLog('info')) {
      const log = this.formatLog('info', message, context, undefined, metadata)
      console.info(JSON.stringify(log))
    }
  }

  public warn(message: string, context?: ErrorContext, metadata?: Record<string, any>): void {
    if (this.shouldLog('warn')) {
      const log = this.formatLog('warn', message, context, undefined, metadata)
      console.warn(JSON.stringify(log))
    }
  }

  public error(message: string, error?: Error, context?: ErrorContext, metadata?: Record<string, any>): void {
    if (this.shouldLog('error')) {
      const log = this.formatLog('error', message, context, error, metadata)
      console.error(JSON.stringify(log))
    }
  }
}

/**
 * Error handler for API routes
 */
export class APIErrorHandler {
  private logger: StructuredLogger

  constructor() {
    this.logger = StructuredLogger.getInstance()
  }

  public handleError(error: unknown, context: ErrorContext = {}): {
    statusCode: number
    error: string
    message: string
    code: string
    details?: any
  } {
    let statusCode = 500
    let errorCode: string = ERROR_CODES.UNKNOWN_ERROR
    let message = 'An unexpected error occurred'
    let details: any = undefined

    if (error instanceof ServiceAIError) {
      statusCode = this.getStatusCodeFromErrorCode(error.code)
      errorCode = error.code
      message = error.message
      details = error.context

      this.logger.error(`ServiceAI Error: ${error.message}`, error, {
        ...context,
        ...error.context
      })
    } else if (error instanceof Error) {
      message = error.message
      
      // Map common error types to error codes
      if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
        errorCode = ERROR_CODES.UNAUTHORIZED
        statusCode = 401
      } else if (error.message.includes('forbidden') || error.message.includes('Forbidden')) {
        errorCode = ERROR_CODES.FORBIDDEN
        statusCode = 403
      } else if (error.message.includes('not found') || error.message.includes('Not found')) {
        errorCode = ERROR_CODES.RECORD_NOT_FOUND
        statusCode = 404
      } else if (error.message.includes('database') || error.message.includes('Database')) {
        errorCode = ERROR_CODES.DATABASE_QUERY_FAILED
        statusCode = 500
      }

      this.logger.error(`Unexpected Error: ${error.message}`, error, context)
    } else {
      this.logger.error('Unknown error type', new Error(String(error)), context)
    }

    return {
      statusCode,
      error: errorCode,
      message,
      code: errorCode,
      details
    }
  }

  private getStatusCodeFromErrorCode(code: string): number {
    const statusCodeMap: Record<string, number> = {
      [ERROR_CODES.UNAUTHORIZED]: 401,
      [ERROR_CODES.FORBIDDEN]: 403,
      [ERROR_CODES.INVALID_TOKEN]: 401,
      [ERROR_CODES.INVALID_WEBHOOK_SIGNATURE]: 401,
      [ERROR_CODES.INVALID_WEBHOOK_PAYLOAD]: 400,
      [ERROR_CODES.WEBHOOK_PROCESSING_FAILED]: 500,
      [ERROR_CODES.API_RATE_LIMIT_EXCEEDED]: 429,
      [ERROR_CODES.RECORD_NOT_FOUND]: 404,
      [ERROR_CODES.DUPLICATE_RECORD]: 409,
      [ERROR_CODES.INSUFFICIENT_MINUTES]: 403,
      [ERROR_CODES.SUBSCRIPTION_INACTIVE]: 403,
      [ERROR_CODES.INVALID_SUBSCRIPTION_TIER]: 400,
      [ERROR_CODES.CONFIGURATION_ERROR]: 500,
      [ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE]: 503
    }

    return statusCodeMap[code] || 500
  }
}

/**
 * Utility functions for common error scenarios
 */
export const ErrorUtils = {
  /**
   * Create a ServiceAI error with proper context
   */
  createError: (
    message: string,
    code: string = ERROR_CODES.UNKNOWN_ERROR,
    context: ErrorContext = {},
    isOperational: boolean = true
  ): ServiceAIError => {
    return new ServiceAIError(message, code, context, isOperational)
  },

  /**
   * Wrap async operations with error handling
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext = {},
    errorCode: string = ERROR_CODES.UNKNOWN_ERROR
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      const logger = StructuredLogger.getInstance()
      logger.error(`Operation failed: ${errorCode}`, error as Error, context)
      throw ErrorUtils.createError(
        error instanceof Error ? error.message : 'Operation failed',
        errorCode,
        context
      )
    }
  },

  /**
   * Validate required environment variables
   */
  validateEnvironment: (requiredVars: string[]): void => {
    const missing = requiredVars.filter(varName => !process.env[varName])
    
    if (missing.length > 0) {
      throw ErrorUtils.createError(
        `Missing required environment variables: ${missing.join(', ')}`,
        ERROR_CODES.CONFIGURATION_ERROR,
        { metadata: { missingVariables: missing } }
      )
    }
  },

  /**
   * Retry operation with exponential backoff
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context: ErrorContext = {}
  ): Promise<T> {
    const logger = StructuredLogger.getInstance()
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxRetries) {
          logger.error(`Operation failed after ${maxRetries} attempts`, error as Error, context)
          throw error
        }

        const delay = baseDelay * Math.pow(2, attempt - 1)
        logger.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`, {
          ...context,
          attempt,
          maxRetries,
          delay
        })

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new Error('Retry logic failed')
  }
}

// Export singleton instances
export const logger = StructuredLogger.getInstance()
export const errorHandler = new APIErrorHandler()
