import '@testing-library/jest-dom';
import { vi } from 'vitest';

(global as any).acquireVsCodeApi = vi.fn(() => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
}));
