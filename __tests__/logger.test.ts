import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger, getLogger, useLogger } from '../services/logger';

describe('Logger Service', () => {
  beforeEach(() => {
    logger.clearLogs();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should capture logs', () => {
    logger.info('Test message', { key: 'value' });
    const logs = logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].message).toContain('Test message');
    expect(logs[0].type).toBe('info');
  });

  it('should clear logs', () => {
    logger.info('Test message');
    logger.clearLogs();
    expect(logger.getLogs().length).toBe(0);
  });

  it('should notify subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = logger.subscribe(listener);
    
    logger.info('Test message');
    expect(listener).toHaveBeenCalledWith(logger.getLogs());
    
    unsubscribe();
    logger.info('Another message');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should provide multiple log levels', () => {
    logger.log('log');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    logger.debug('debug');

    const logs = logger.getLogs();
    expect(logs.length).toBe(5);
    expect(logs.map(l => l.type)).toContain('log');
    expect(logs.map(l => l.type)).toContain('info');
    expect(logs.map(l => l.type)).toContain('warn');
    expect(logs.map(l => l.type)).toContain('error');
    expect(logs.map(l => l.type)).toContain('debug');
  });

  it('should return the same instance from getLogger and logger', () => {
    expect(getLogger()).toBe(logger);
  });

  it('should return the logger instance from useLogger', () => {
    expect(useLogger('Context')).toBe(logger);
  });
});