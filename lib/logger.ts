import { parseError } from './error/parse';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  action: string;
  input?: any;
  output?: any;
  error?: any;
  duration?: number;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isVerbose = process.env.VERBOSE_LOGGING === 'true';

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, action, input, output, error, duration, metadata } = entry;
    
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${action}`;
    
    if (duration !== undefined) {
      logMessage += ` (${duration}ms)`;
    }
    
    if (this.isVerbose || this.isDevelopment) {
      if (input) {
        logMessage += `\n  📥 INPUT: ${JSON.stringify(input, null, 2)}`;
      }
      
      if (output) {
        logMessage += `\n  📤 OUTPUT: ${JSON.stringify(output, null, 2)}`;
      }
      
      if (error) {
        logMessage += `\n  ❌ ERROR: ${JSON.stringify(error, null, 2)}`;
      }
      
      if (metadata) {
        logMessage += `\n  📋 METADATA: ${JSON.stringify(metadata, null, 2)}`;
      }
    }
    
    return logMessage;
  }

  private log(entry: LogEntry): void {
    const formattedLog = this.formatLog(entry);
    
    switch (entry.level) {
      case 'error':
        console.error(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
      default:
        console.log(formattedLog);
    }
  }

  info(action: string, data?: { input?: any; output?: any; metadata?: Record<string, any> }): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      action,
      ...data,
    });
  }

  warn(action: string, data?: { input?: any; output?: any; metadata?: Record<string, any> }): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      action,
      ...data,
    });
  }

  error(action: string, error: unknown, data?: { input?: any; metadata?: Record<string, any> }): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      action,
      error: parseError(error),
      ...data,
    });
  }

  debug(action: string, data?: { input?: any; output?: any; metadata?: Record<string, any> }): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'debug',
      action,
      ...data,
    });
  }

  // Método para medir tempo de execução
  async timeAsync<T>(
    action: string,
    fn: () => Promise<T>,
    options?: { input?: any; metadata?: Record<string, any> }
  ): Promise<T> {
    const startTime = Date.now();
    
    this.debug(`${action} - STARTED`, {
      input: options?.input,
      metadata: options?.metadata,
    });

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.info(`${action} - COMPLETED`, {
        input: options?.input,
        output: result,
        duration,
        metadata: options?.metadata,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`${action} - FAILED`, error, {
        input: options?.input,
        duration,
        metadata: options?.metadata,
      });
      
      throw error;
    }
  }

  // Método para logar chamadas de API
  async apiCall<T>(
    apiName: string,
    endpoint: string,
    fn: () => Promise<T>,
    options?: { input?: any; metadata?: Record<string, any> }
  ): Promise<T> {
    return this.timeAsync(
      `API_CALL: ${apiName} - ${endpoint}`,
      fn,
      {
        ...options,
        metadata: {
          ...options?.metadata,
          apiName,
          endpoint,
        },
      }
    );
  }
}

export const logger = new Logger();

// Função helper para logar ações do servidor
export const logServerAction = async <T>(
  actionName: string,
  fn: () => Promise<T>,
  input?: any
): Promise<T> => {
  return logger.timeAsync(`SERVER_ACTION: ${actionName}`, fn, { input });
};

// Função helper para logar chamadas de API específicas
export const logApiCall = async <T>(
  apiName: string,
  endpoint: string,
  fn: () => Promise<T>,
  input?: any
): Promise<T> => {
  return logger.apiCall(apiName, endpoint, fn, { input });
};