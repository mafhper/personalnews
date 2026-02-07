export interface LogMessage {
  id: string;
  timestamp: number;
  type: 'info' | 'warn' | 'error' | 'log' | 'debug';
  message: string;
  data?: unknown[];
}

class LoggerService {
  private logs: LogMessage[] = [];
  private maxLogs = 100;
  private listeners: ((logs: LogMessage[]) => void)[] = [];
  private originalConsole: { 
    log: (...args: unknown[]) => void; 
    warn: (...args: unknown[]) => void; 
    error: (...args: unknown[]) => void; 
    info: (...args: unknown[]) => void; 
    debug?: (...args: unknown[]) => void; 
  };

  constructor() {
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };

    this.init();
  }

  private init() {
    console.log = (...args: unknown[]) => {
      this.addLog('log', args);
      this.originalConsole.log(...args);
    };

    console.info = (...args: unknown[]) => {
      this.addLog('info', args);
      this.originalConsole.info(...args);
    };

    console.warn = (...args: unknown[]) => {
      this.addLog('warn', args);
      this.originalConsole.warn(...args);
    };

    console.error = (...args: unknown[]) => {
      this.addLog('error', args);
      this.originalConsole.error(...args);
    };
  }

  private addLog(type: LogMessage['type'], args: unknown[]) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    const log: LogMessage = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      message,
      data: args
    };

    this.logs = [log, ...this.logs].slice(0, this.maxLogs);
    this.notifyListeners();
  }

  public getLogs() {
    return this.logs;
  }

  public clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  public subscribe(listener: (logs: LogMessage[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public log(...args: unknown[]) {
    this.addLog('log', args);
    this.originalConsole.log(...args);
  }

  public info(...args: unknown[]) {
    this.addLog('info', args);
    this.originalConsole.info(...args);
  }

  public warn(...args: unknown[]) {
    this.addLog('warn', args);
    this.originalConsole.warn(...args);
  }

  public error(...args: unknown[]) {
    this.addLog('error', args);
    this.originalConsole.error(...args);
  }

  public debug(...args: unknown[]) {
    // Debug logs only in development
    if (import.meta.env.PROD) return;

    this.addLog('debug', args);
    // Use log for debug if debug doesn't exist on console (it usually does)
    if (this.originalConsole.debug) {
        this.originalConsole.debug(...args);
    } else {
        this.originalConsole.log('[GENERAL-DEBUG]', ...args);
    }
  }

  /**
   * Logs a debug message with a specific subject tag: [SUBJECT-DEBUG]
   */
  public debugTag(subject: string, ...args: unknown[]) {
    // Debug logs only in development
    if (import.meta.env.PROD) return;

    const tag = `[${subject.toUpperCase()}-DEBUG]`;
    this.addLog('debug', [tag, ...args]);
    
    if (this.originalConsole.debug) {
      this.originalConsole.debug(tag, ...args);
    } else {
      this.originalConsole.log(tag, ...args);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.logs));
  }
}

export const logger = new LoggerService();
export const getLogger = () => logger;
export const useLogger = (_context?: string) => logger;
