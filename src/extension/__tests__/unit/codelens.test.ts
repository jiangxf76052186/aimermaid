import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('vscode', () => ({
  EventEmitter: class {
    listeners: Array<(...args: any[]) => void> = [];
    event = vi.fn((listener: (...args: any[]) => void) => {
      this.listeners.push(listener);
      return { dispose: vi.fn() };
    });
    fire(...args: any[]) {
      this.listeners.forEach(listener => listener(...args));
    }
    dispose = vi.fn();
  },
  Range: class {
    start;
    end;
    startLine;
    startChar;
    endLine;
    endChar;
    constructor(startLine: number, startChar: number, endLine: number, endChar: number) {
      this.start = { line: startLine, character: startChar };
      this.end = { line: endLine, character: endChar };
      this.startLine = startLine;
      this.startChar = startChar;
      this.endLine = endLine;
      this.endChar = endChar;
    }
  },
  CodeLens: class {
    range;
    command;
    isResolved;
    constructor(range: any, command: any) {
      this.range = range || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
      this.command = command;
      this.isResolved = false;
    }
  },
}));

import { MermaidCodeLensProvider } from '../../codelens';
import { createMockDocument } from '../mocks/document';

describe('MermaidCodeLensProvider', () => {
  let provider: MermaidCodeLensProvider;

  beforeEach(() => {
    provider = new MermaidCodeLensProvider();
    vi.clearAllMocks();
  });

  describe('findMermaidBlocks() - Single block detection', () => {
    it('should detect a single mermaid block with sequenceDiagram', () => {
      const lines = [
        'Some text before',
        '```mermaid',
        'sequenceDiagram',
        '  Alice->>Bob: Hello',
        '```',
        'Some text after',
      ];

      const doc = createMockDocument(lines) as any;

      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(1);
      expect(codeLenses[0].range.start.line).toBe(1);
      expect(codeLenses[0].command?.title).toBe('🎨 可视化编辑');
    });

    it('should detect a single mermaid block with flowchart', () => {
      const lines = [
        '# Document',
        '```mermaid',
        'flowchart TD',
        '  A-->B',
        '```',
        'End of doc',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(1);
      expect(codeLenses[0].range.start.line).toBe(1);
    });

    it('should detect single block with spaces around fence markers', () => {
      const lines = [
        '  ```mermaid  ',
        '  sequenceDiagram',
        '  ```  ',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(1);
    });

    it('should detect single block with case-insensitive mermaid keyword', () => {
      const lines = [
        '```MERMAID',
        'graph TD',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(1);
    });
  });

  describe('findMermaidBlocks() - Multiple blocks detection', () => {
    it('should detect two sequential mermaid blocks', () => {
      const lines = [
        '# Document',
        '```mermaid',
        'sequenceDiagram',
        '```',
        'Middle content',
        '```mermaid',
        'flowchart TD',
        '```',
        'End',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(2);
      expect(codeLenses[0].range.start.line).toBe(1);
      expect(codeLenses[1].range.start.line).toBe(5);
    });

    it('should detect three mermaid blocks with different diagram types', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        '```',
        'text',
        '```mermaid',
        'flowchart',
        '```',
        'text',
        '```mermaid',
        'stateDiagram',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(3);
      expect(codeLenses[0].range.start.line).toBe(0);
      expect(codeLenses[1].range.start.line).toBe(4);
      expect(codeLenses[2].range.start.line).toBe(8);
    });

    it('should detect blocks with mermaid blocks interspersed with other code blocks', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        '```',
        '```javascript',
        'console.log("test");',
        '```',
        '```mermaid',
        'flowchart',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      // Should detect 2 mermaid blocks, ignore javascript block
      expect(codeLenses).toHaveLength(2);
      expect(codeLenses[0].range.start.line).toBe(0);
      expect(codeLenses[1].range.start.line).toBe(6);
    });
  });

  describe('findMermaidBlocks() - Nested block boundaries', () => {
    it('should correctly identify block boundaries with multi-line content', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        '  participant Alice',
        '  participant Bob',
        '  Alice->>Bob: Hello',
        '  Bob->>Alice: Hi',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(1);
      const codeLens = codeLenses[0];
      expect(codeLens.command?.arguments?.[1]).toBe(0);
      expect(codeLens.command?.arguments?.[2]).toBe(6);
    });

    it('should not treat closing triple backticks within content as end marker', () => {
      const lines = [
        '```mermaid',
        'flowchart TD',
        '  A-->B',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(1);
    });

    it('should handle empty mermaid block', () => {
      const lines = [
        '```mermaid',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(1);
    });

    it('should handle mermaid block with only whitespace', () => {
      const lines = [
        '```mermaid',
        '   ',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(1);
    });
  });

  describe('provideCodeLenses() - Return correct CodeLens count', () => {
    it('should return array with correct number of CodeLens objects', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        '```',
        '```mermaid',
        'flowchart',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(Array.isArray(codeLenses)).toBe(true);
      expect(codeLenses).toHaveLength(2);
    });
  });

  describe('provideCodeLenses() - CodeLens command and arguments', () => {
    it('should create CodeLens with correct command title', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses[0].command?.title).toBe('🎨 可视化编辑');
    });

    it('should create CodeLens with correct command name', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses[0].command?.command).toBe('aimermaid.openEditor');
    });

    it('should create CodeLens with correct arguments (document, startLine, endLine)', () => {
      const lines = [
        'text before',
        '```mermaid',
        'sequenceDiagram',
        '```',
        'text after',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses[0].command?.arguments).toHaveLength(3);
      expect(codeLenses[0].command?.arguments?.[0]).toBe(doc);
      expect(codeLenses[0].command?.arguments?.[1]).toBe(1);
      expect(codeLenses[0].command?.arguments?.[2]).toBe(3);
    });

    it('should create CodeLens with Range at correct line', () => {
      const lines = [
        '# Header',
        '```mermaid',
        'flowchart',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses[0].range.start.line).toBe(1);
      expect(codeLenses[0].range.start.character).toBe(0);
    });

    it('should pass correct arguments for multiple blocks', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        '```',
        'middle',
        '```mermaid',
        'flowchart',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses[0].command?.arguments?.[1]).toBe(0);
      expect(codeLenses[0].command?.arguments?.[2]).toBe(2);

      expect(codeLenses[1].command?.arguments?.[1]).toBe(4);
      expect(codeLenses[1].command?.arguments?.[2]).toBe(6);
    });
  });

  describe('Edge cases - Empty documents', () => {
    it('should return empty array for empty document', () => {
      const doc = createMockDocument([]) as any;

      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toEqual([]);
    });

    it('should return empty array for single-line empty document', () => {
      const doc = createMockDocument(['']) as any;

      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toEqual([]);
    });
  });

  describe('Edge cases - No mermaid blocks', () => {
    it('should return empty array when no mermaid blocks present', () => {
      const lines = [
        '# Document',
        'Some content',
        '```javascript',
        'code here',
        '```',
        'More content',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toEqual([]);
    });

    it('should return empty array when document has only regular text', () => {
      const lines = [
        'This is a paragraph',
        'This is another paragraph',
        'No code blocks here',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toEqual([]);
    });

    it('should ignore non-mermaid code blocks', () => {
      const lines = [
        '```python',
        'print("hello")',
        '```',
        '```typescript',
        'console.log("world")',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toEqual([]);
    });
  });

  describe('Edge cases - Unclosed mermaid blocks (error tolerance)', () => {
    it('should ignore unclosed mermaid block at end of document', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        'Alice->>Bob: Hello',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toEqual([]);
    });

    it('should handle mixed closed and unclosed blocks', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        '```',
        '```mermaid',
        'flowchart',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(1);
      expect(codeLenses[0].range.start.line).toBe(0);
    });

    it('should treat block without opening as regular text', () => {
      const lines = [
        'Some content',
        '```',
        'More content',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toEqual([]);
    });
  });

  describe('CodeLensProvider interface', () => {
    it('should have onDidChangeCodeLenses event', () => {
      expect(provider.onDidChangeCodeLenses).toBeDefined();
    });

    it('should implement provideCodeLenses method', () => {
      expect(typeof provider.provideCodeLenses).toBe('function');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle markdown document with multiple diagrams of different types', () => {
      const lines = [
        '# Mermaid Diagram Examples',
        '',
        '## Sequence Diagram',
        '```mermaid',
        'sequenceDiagram',
        '  Alice->>Bob: Hello',
        '```',
        '',
        '## Flowchart',
        '```mermaid',
        'flowchart TD',
        '  A-->B',
        '```',
        '',
        '## State Diagram',
        '```mermaid',
        'stateDiagram-v2',
        '  [*] --> State1',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(3);
    });

    it('should handle document with code blocks before and after mermaid blocks', () => {
      const lines = [
        '```typescript',
        'export const foo = () => {};',
        '```',
        '',
        '```mermaid',
        'sequenceDiagram',
        '```',
        '',
        '```python',
        'def bar():\n  pass',
        '```',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(1);
      expect(codeLenses[0].range.start.line).toBe(4);
    });

    it('should correctly parse realistic mermaid sequence diagram', () => {
      const lines = [
        '# User Authentication Flow',
        '',
        'This diagram shows the authentication sequence:',
        '',
        '```mermaid',
        'sequenceDiagram',
        '  participant User',
        '  participant Browser',
        '  participant Server',
        '  User->>Browser: Click Login',
        '  Browser->>Server: POST /login',
        '  Server->>Browser: 200 OK with token',
        '  Browser->>User: Redirect to dashboard',
        '```',
        '',
        'The flow is complete.',
      ];

      const doc = createMockDocument(lines) as any;
      const codeLenses = provider.provideCodeLenses(doc);

      expect(codeLenses).toHaveLength(1);
      expect(codeLenses[0].range.start.line).toBe(4);
      expect(codeLenses[0].command?.arguments?.[2]).toBe(13);
    });
  });
});
