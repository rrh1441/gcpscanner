export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

const LOG_LEVEL = process.env.LOG_LEVEL === 'DEBUG' ? LogLevel.DEBUG : LogLevel.INFO;

export function log(...args: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

export function debug(...args: any[]) {
  if (LOG_LEVEL <= LogLevel.DEBUG) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [DEBUG]`, ...args);
  }
}

export function info(...args: any[]) {
  if (LOG_LEVEL <= LogLevel.INFO) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO]`, ...args);
  }
}

export function warn(...args: any[]) {
  if (LOG_LEVEL <= LogLevel.WARN) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN]`, ...args);
  }
}

export function error(...args: any[]) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR]`, ...args);
} 