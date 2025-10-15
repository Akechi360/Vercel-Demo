/**
 * Setup file para tests de Jest
 * Configura mocks globales y utilidades de testing
 */

// Mock global de console para evitar logs en tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock de Date para tests consistentes
const mockDate = new Date('2024-01-15T10:00:00Z');
global.Date = jest.fn(() => mockDate) as any;
global.Date.now = jest.fn(() => mockDate.getTime());
global.Date.UTC = Date.UTC;
global.Date.parse = Date.parse;

// Mock de Intl.DateTimeFormat para timezone
global.Intl = {
  ...global.Intl,
  DateTimeFormat: jest.fn(() => ({
    resolvedOptions: () => ({ timeZone: 'America/Caracas' })
  }))
} as any;

// Mock de process.env para tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
