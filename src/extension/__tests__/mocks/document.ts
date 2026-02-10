import { vi } from 'vitest';

/**
 * Helper function to create mock TextDocument instances for testing
 * Accepts an array of lines and returns a mock TextDocument with lineAt() support
 */
export function createMockDocument(lines: string[] = []) {
  return {
    uri: { fsPath: '/test.md', scheme: 'file' },
    fileName: 'test.md',
    isUntitled: false,
    languageId: 'markdown',
    version: 1,
    isDirty: false,
    isClosed: false,
    lineCount: lines.length,
    lineAt: vi.fn((lineNumber: number) => {
      if (lineNumber < 0 || lineNumber >= lines.length) {
        throw new Error(`Line out of bounds: ${lineNumber}`);
      }
      return {
        lineNumber,
        text: lines[lineNumber],
        range: {
          start: { line: lineNumber, character: 0 },
          end: { line: lineNumber, character: lines[lineNumber].length },
        },
        firstNonWhitespaceCharacterIndex: lines[lineNumber].search(/\S/),
        isEmptyOrWhitespace: /^\s*$/.test(lines[lineNumber]),
      };
    }),
    offsetAt: vi.fn(() => 0),
    positionAt: vi.fn(() => ({ line: 0, character: 0 })),
    getText: vi.fn(() => lines.join('\n')),
    getWordRangeAtPosition: vi.fn(),
    validateRange: vi.fn((range) => range),
    validatePosition: vi.fn((position) => position),
    save: vi.fn(async () => true),
  };
}
