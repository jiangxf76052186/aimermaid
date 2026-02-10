import { vi } from 'vitest';

export function createMockDocument(lines: string[] = []) {
  const uri = {
    fsPath: '/test.md',
    scheme: 'file',
    authority: '',
    path: '/test.md',
    query: '',
    fragment: '',
    with: vi.fn(function(this: any) { return this; }),
    toString: vi.fn(() => 'file:///test.md'),
    toJSON: vi.fn(() => ({ fsPath: '/test.md' })),
  };

  return {
    uri,
    fileName: 'test.md',
    isUntitled: false,
    languageId: 'markdown',
    version: 1,
    isDirty: false,
    isClosed: false,
    encoding: 'utf8',
    eol: 1,
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
        rangeIncludingLineBreak: {
          start: { line: lineNumber, character: 0 },
          end: { line: lineNumber + 1, character: 0 },
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
