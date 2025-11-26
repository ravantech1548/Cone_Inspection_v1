export const errorHandler = (err, req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || 'unknown';
  
  console.error('Error:', {
    correlationId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    name: err.name,
    code: err.code
  });
  
  // Don't leak internal errors in production, but show them in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = err.statusCode ? err.message : (isDevelopment ? err.message : 'Internal server error');
  
  const response = {
    error: message,
    correlationId
  };
  
  // Include stack trace in development
  if (isDevelopment && err.stack) {
    response.stack = err.stack;
  }
  
  res.status(err.statusCode || 500).json(response);
};

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
