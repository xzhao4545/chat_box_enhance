/**
 * Logger service
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

export function getLogLevel(): LogLevel {
  return currentLevel;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatTaggedArgs(tag: string, args: any[]): any[] {
  return [`[${tag}]`, ...args];
}

export const logger = {
  debug: (...args: any[]) => {
    if (shouldLog('debug')) console.log('[DEBUG]', ...args);
  },
  info: (...args: any[]) => {
    if (shouldLog('info')) console.log('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    if (shouldLog('warn')) console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    if (shouldLog('error')) console.error('[ERROR]', ...args);
  }
};

export function createTaggedLogger(tag: string) {
  return {
    debug: (...args: any[]) => {
      logger.debug(...formatTaggedArgs(tag, args));
    },
    info: (...args: any[]) => {
      logger.info(...formatTaggedArgs(tag, args));
    },
    warn: (...args: any[]) => {
      logger.warn(...formatTaggedArgs(tag, args));
    },
    error: (...args: any[]) => {
      logger.error(...formatTaggedArgs(tag, args));
    }
  };
}
