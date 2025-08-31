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
    
    // Logs simplificados - apenas informações essenciais
    if (this.isVerbose && this.isDevelopment) {
      if (input && Object.keys(input).length > 0) {
        logMessage += `\n  📥 INPUT: ${this.sanitizeData(input)}`;
      }
      
      if (output && Object.keys(output).length > 0) {
        logMessage += `\n  📤 OUTPUT: ${this.sanitizeData(output)}`;
      }
      
      if (error) {
        logMessage += `\n  ❌ ERROR: ${typeof error === 'string' ? error : error.message || 'Unknown error'}`;
      }
      
      if (metadata && Object.keys(metadata).length > 0) {
        logMessage += `\n  📋 METADATA: ${this.sanitizeData(metadata)}`;
      }
    }
    
    return logMessage;
  }

  private sanitizeData(data: any): string {
    try {
      // Limitar tamanho dos logs e remover dados sensíveis
      const sanitized = this.removeSensitiveData(data);
      const jsonString = JSON.stringify(sanitized, null, 2);
      
      // Limitar tamanho do log para evitar spam
      if (jsonString.length > 500) {
        return jsonString.substring(0, 500) + '... [truncated]';
      }
      
      return jsonString;
    } catch {
      return '[Unable to serialize data]';
    }
  }

  private removeSensitiveData(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
    const cleaned = { ...obj };
    
    for (const key in cleaned) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof cleaned[key] === 'object') {
        cleaned[key] = this.removeSensitiveData(cleaned[key]);
      }
    }
    
    return cleaned;
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

  // Método para medir tempo de execução - simplificado
  async timeAsync<T>(
    action: string,
    fn: () => Promise<T>,
    options?: { input?: any; metadata?: Record<string, any> }
  ): Promise<T> {
    const startTime = Date.now();
    
    // Log de início apenas em desenvolvimento verbose
    if (this.isDevelopment && this.isVerbose) {
      this.debug(`🚀 ${action} - INICIADO`);
    }

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      // Log de sucesso sempre, mas com informações limitadas
      this.info(`✅ ${action}`, {
        metadata: { 
          duration,
          success: true,
          ...options?.metadata 
        }
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log de erro sempre
      this.error(`❌ ${action}`, error, {
        metadata: { 
          duration,
          success: false,
          ...options?.metadata 
        }
      });
      
      throw error;
    }
  }

  // Método para logar chamadas de API - simplificado
  async apiCall<T>(
    apiName: string,
    endpoint: string,
    fn: () => Promise<T>,
    options?: { input?: any; metadata?: Record<string, any> }
  ): Promise<T> {
    return this.timeAsync(
      `🌐 API ${apiName}/${endpoint}`,
      fn,
      {
        metadata: {
          type: 'api_call',
          apiName,
          endpoint,
          ...options?.metadata,
        },
      }
    );
  }
}

export const logger = new Logger();

// Função helper simplificada para logar ações do servidor
export const logServerAction = async <T>(
  actionName: string,
  fn: () => Promise<T>,
  input?: any
): Promise<T> => {
  return logger.timeAsync(
    `🔧 ${actionName}`, 
    fn, 
    { 
      metadata: { 
        type: 'server_action',
        hasInput: !!input 
      } 
    }
  );
};

// Função helper simplificada para logar chamadas de API
export const logApiCall = async <T>(
  apiName: string,
  endpoint: string,
  fn: () => Promise<T>,
  input?: any
): Promise<T> => {
  return logger.apiCall(apiName, endpoint, fn, { 
    metadata: { 
      hasInput: !!input 
    } 
  });
};

// Função helper para logs rápidos de info
export const logInfo = (message: string, data?: any) => {
  logger.info(`ℹ️ ${message}`, { metadata: data });
};

// Função helper para logs rápidos de erro
export const logError = (message: string, error: unknown, data?: any) => {
  logger.error(`💥 ${message}`, error, { metadata: data });
};