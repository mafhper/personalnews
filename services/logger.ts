export interface LogMessage {
  id: string;
  timestamp: number;
  type: 'info' | 'warn' | 'error' | 'log' | 'debug';
  message: string;
  data?: any[];
}

class LoggerService {
  private logs: LogMessage[] = [];
  private maxLogs = 100;
  private listeners: ((logs: LogMessage[]) => void)[] = [];
  private originalConsole: { log: any; warn: any; error: any; info: any; debug?: any };

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
    console.log = (...args) => {
      this.addLog('log', args);
      this.originalConsole.log(...args);
    };

    console.info = (...args) => {
      this.addLog('info', args);
      this.originalConsole.info(...args);
    };

    console.warn = (...args) => {
      this.addLog('warn', args);
      this.originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.addLog('error', args);
      this.originalConsole.error(...args);
    };
  }

  private addLog(type: LogMessage['type'], args: any[]) {
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

  public log(...args: any[]) {
    this.addLog('log', args);
    this.originalConsole.log(...args);
  }

  public info(...args: any[]) {
    this.addLog('info', args);
    this.originalConsole.info(...args);
  }

  public warn(...args: any[]) {
    this.addLog('warn', args);
    this.originalConsole.warn(...args);
  }

  public error(...args: any[]) {
    this.addLog('error', args);
    this.originalConsole.error(...args);
  }

  public debug(...args: any[]) {
    // Debug logs might not need to go to console in production, but for now we'll log them
    this.addLog('debug', args);
    // Use log for debug if debug doesn't exist on console (it usually does)
    if (this.originalConsole.debug) {
        this.originalConsole.debug(...args);
    } else {
        this.originalConsole.log('[DEBUG]', ...args);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.logs));
  }
}

export const logger = new LoggerService();
export const getLogger = () => logger;
export const useLogger = (_context?: string) => logger;
