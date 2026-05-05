import pino from 'pino';
import pinoHttp from 'pino-http';

// Create a Pino logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Do not format in production, but if pretty-print is needed locally, it can be added.
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    }
  } : undefined,
});

// Create Pino HTTP middleware for Express
export const loggerMiddleware = pinoHttp({
  logger,
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    }
    return 'info';
  },
  // Optionally skip logging for certain routes like /api/health
  autoLogging: {
    ignore: (req) => req.url === '/api/health'
  }
});
