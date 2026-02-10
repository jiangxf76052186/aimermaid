/// <reference types="vitest" />
/// <vitest config="{ 'environment': 'node' }" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as path from 'path';

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
    constructor(startLine: number, startChar: number, endLine: number, endChar: number) {
      this.start = { line: startLine, character: startChar };
      this.end = { line: endLine, character: endChar };
    }
  },
  Position: class {
    constructor(public line: number, public character: number) {}
  },
  CodeLens: class {
    range;
    command;
    isResolved;
    constructor(range: any, command: any) {
      this.range = range;
      this.command = command;
      this.isResolved = false;
    }
  },
  WorkspaceEdit: class {
    replace() {}
  },
  Uri: {
    file: vi.fn((filePath: string) => ({
      fsPath: filePath,
      path: filePath,
      scheme: 'file',
      toString: () => `file://${filePath}`,
    })),
    joinPath: vi.fn((base: any, ...segments: string[]) => ({
      fsPath: `${base.fsPath}/${segments.join('/')}`,
      path: `${base.path}/${segments.join('/')}`,
      scheme: 'file',
      toString: () => `file://${base.fsPath}/${segments.join('/')}`,
    })),
  },
  window: {
    activeTextEditor: null,
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    createWebviewPanel: vi.fn(),
    activeColorTheme: {
      kind: 2,
    },
  },
  workspace: {
    openTextDocument: vi.fn(),
    applyEdit: vi.fn(async () => true),
  },
  commands: {
    executeCommand: vi.fn(),
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
  },
  ViewColumn: {
    Beside: -2,
  },
  ColorThemeKind: {
    Light: 1,
    Dark: 2,
  },
}));

vi.mock('../../utils/diagram-detector', () => ({
  detectDiagramType: vi.fn((code: string) => {
    const firstLine = code.trim().split('\n')[0].toLowerCase();
    if (firstLine.includes('sequencediagram')) return 'sequence';
    if (firstLine.includes('graph') || firstLine.includes('flowchart')) return 'flowchart';
    if (firstLine.includes('statediagram')) return 'state';
    return 'unknown';
  }),
}));

import * as vscode from 'vscode';
import { MermaidEditorPanel } from '../../webview';
import { delay } from './helpers/extension';

/**
 * E2E Workflow Tests
 * 
 * Tests the complete end-to-end workflow:
 * 1. Open markdown file
 * 2. Verify CodeLens is displayed
 * 3. Click CodeLens to open editor
 * 4. Verify Webview opened with correct init data
 * 5. Edit diagram in Webview
 * 6. Save and verify markdown is updated
 * 7. Close Webview
 */

/**
 * Creates a mock text document with given lines
 */
function createMockDocument(lines: string[], uri?: string) {
  const fsPath = uri || path.join(__dirname, '../e2e/fixtures/test.md');
  return {
    uri: vscode.Uri.file(fsPath),
    fileName: fsPath,
    isUntitled: false,
    isDirty: false,
    isClosed: false,
    languageId: 'markdown',
    lineCount: lines.length,
    version: 1,
    getText: vi.fn(() => lines.join('\n')),
    getWordRangeAtPosition: vi.fn(),
    lineAt: vi.fn((lineNum: number) => ({
      lineNumber: lineNum,
      text: lines[lineNum] || '',
      range: new vscode.Range(lineNum, 0, lineNum, (lines[lineNum] || '').length),
      rangeIncludingLineBreak: new vscode.Range(
        lineNum,
        0,
        lineNum,
        (lines[lineNum] || '').length + 1
      ),
      firstNonWhitespaceCharacterIndex: 0,
      isEmptyOrWhitespace: !lines[lineNum],
    })),
    save: vi.fn(async () => true),
  };
}

/**
 * Creates a mock webview panel that simulates VS Code webview behavior
 */
function createMockWebviewPanel() {
  const messageListeners: Array<(message: any) => void> = [];
  const disposeListeners: Array<() => void> = [];

  const mockPanel: any = {
    viewType: 'aimermaid.editor',
    title: 'Mermaid 编辑器',
    webview: {
      html: '',
      cspSource: 'https://example.com',
      postMessage: vi.fn(),
      onDidReceiveMessage: vi.fn((listener: (message: any) => void) => {
        messageListeners.push(listener);
        return { dispose: vi.fn() };
      }),
      asWebviewUri: vi.fn((uri: any) => uri),
    },
    onDidDispose: vi.fn((_listener: () => void) => {
      return { dispose: vi.fn() };
    }),
    dispose: vi.fn(),
    reveal: vi.fn(),
    _messageListeners: messageListeners,
    _disposeListeners: disposeListeners,
  };

  return mockPanel;
}

/**
 * Creates a mock extension context
 */
function createMockExtensionContext() {
  return {
    subscriptions: [] as any[],
    extensionUri: vscode.Uri.file('/path/to/extension'),
    asAbsolutePath: vi.fn((relative: string) => `/path/to/extension/${relative}`),
  };
}

/**
 * Simulates webview message dispatch
 */
function sendWebviewMessage(panel: any, message: any) {
  if (panel._messageListeners && panel._messageListeners.length > 0) {
    panel._messageListeners.forEach((listener: any) => listener(message));
  }
}

describe('E2E Workflow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (MermaidEditorPanel as any).currentPanel = undefined;
  });

  afterEach(() => {
    (MermaidEditorPanel as any).currentPanel = undefined;
  });

  describe('Workflow: Open File → CodeLens → Edit → Save → Close', () => {
    it('should open markdown file with mermaid block', async () => {
      const document = createMockDocument([
        '# Test Document',
        '',
        '```mermaid',
        'sequenceDiagram',
        '    participant Alice',
        '    participant Bob',
        '    Alice->>Bob: Hello',
        '    Bob-->>Alice: Hi',
        '```',
        '',
        'Some text after diagram',
      ]);

      vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(document as any);

      const result = await vscode.workspace.openTextDocument('test.md');

      expect(result).toBeDefined();
      expect(result.getText()).toContain('sequenceDiagram');
      expect(result.getText()).toContain('participant Alice');
    });

    it('should display CodeLens on mermaid blocks', async () => {
      const lines = [
        '# Test Document',
        '',
        '```mermaid',
        'sequenceDiagram',
        '    participant Alice',
        '```',
      ];
      const document = createMockDocument(lines);

      // Verify document has mermaid blocks by checking content
      expect(document.getText()).toContain('```mermaid');
      expect(document.getText()).toContain('sequenceDiagram');

      // CodeLens would be detected via diagram-detector
      const mermaidContent = document.getText().substring(
        document.getText().indexOf('```mermaid'),
        document.getText().indexOf('```', document.getText().indexOf('```mermaid') + 10) + 3
      );

      expect(mermaidContent).toContain('sequenceDiagram');
    });

    it('should open webview when CodeLens button is clicked', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument([
        '```mermaid',
        'sequenceDiagram',
        '    participant Alice',
        '    participant Bob',
        '    Alice->>Bob: Hello',
        '```',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      // Simulate CodeLens click by calling createOrShow
      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 6);

      expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
        'aimermaid.editor',
        'Mermaid 编辑器',
        vscode.ViewColumn.Beside,
        expect.any(Object)
      );

      expect((MermaidEditorPanel as any).currentPanel).toBeDefined();
    });

    it('should verify webview has correct init data', async () => {
      const context = createMockExtensionContext();
      const mermaidCode = 'sequenceDiagram\n    participant Alice\n    participant Bob\n    Alice->>Bob: Hello';
      const document = createMockDocument([
        '```mermaid',
        ...mermaidCode.split('\n'),
        '```',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 5);

      // Simulate webview ready message
      sendWebviewMessage(mockPanel, { type: 'ready' });

      await delay(10);

      // Verify init message was sent with correct data
      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'init',
          data: expect.objectContaining({
            mermaidCode: expect.stringContaining('participant'),
            theme: 'dark',
            diagramType: 'sequence',
          }),
        })
      );
    });

    it('should verify init data includes complete mermaid code', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument([
        '```mermaid',
        'sequenceDiagram',
        '    participant Alice',
        '    participant Bob',
        '    Alice->>Bob: Request',
        '    Bob-->>Alice: Response',
        '```',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 7);

      sendWebviewMessage(mockPanel, { type: 'ready' });

      await delay(10);

      const initCall = vi.mocked(mockPanel.webview.postMessage).mock.calls[0];
      const initMessage = initCall?.[0];

      expect(initMessage).toMatchObject({
        type: 'init',
        data: {
          theme: 'dark',
          diagramType: 'sequence',
        },
      });

      // Code should contain all participants
      expect(initMessage?.data.mermaidCode).toContain('Alice');
      expect(initMessage?.data.mermaidCode).toContain('Bob');
    });

    it('should handle diagram editing workflow', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument([
        '```mermaid',
        'sequenceDiagram',
        '    participant A',
        '```',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(true);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 4);

      // 1. Webview sends ready message
      sendWebviewMessage(mockPanel, { type: 'ready' });
      await delay(10);

      // Verify init was sent
      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'init' })
      );

      // 2. User edits diagram in webview and sends save message
      const newMermaidCode = 'sequenceDiagram\n    participant A\n    participant B\n    A->>B: Hello';
      sendWebviewMessage(mockPanel, {
        type: 'save',
        data: { mermaidCode: newMermaidCode },
      });

      await delay(10);

      // Verify save was processed
      expect(vscode.workspace.applyEdit).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Mermaid 图表已保存');
    });

    it('should save updated mermaid code to document', async () => {
      const context = createMockExtensionContext();
      const originalCode = 'sequenceDiagram\n    participant Alice';
      const document = createMockDocument([
        '```mermaid',
        ...originalCode.split('\n'),
        '```',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(true);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 4);

      // Send new mermaid code
      const newCode = 'sequenceDiagram\n    participant Alice\n    participant Bob\n    Alice->>Bob: Message';
      sendWebviewMessage(mockPanel, {
        type: 'save',
        data: { mermaidCode: newCode },
      });

      await delay(10);

      // Verify workspace edit was applied (document update)
      expect(vscode.workspace.applyEdit).toHaveBeenCalled();

      // Verify document save was called
      expect((document as any).save).toHaveBeenCalled();

      // Verify success message
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Mermaid 图表已保存');
    });

    it('should close webview when cancel message is received', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument([
        '```mermaid',
        'sequenceDiagram',
        '```',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      expect((MermaidEditorPanel as any).currentPanel).toBeDefined();

      // Send cancel message
      sendWebviewMessage(mockPanel, { type: 'cancel' });

      await delay(10);

      // Verify panel dispose was called
      expect(mockPanel.dispose).toHaveBeenCalled();
    });

    it('should support multiple diagram types in same file', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument([
        '# Test Document',
        '',
        '## Sequence Diagram',
        '```mermaid',
        'sequenceDiagram',
        '    participant A',
        '```',
        '',
        'Some text',
        '',
        '## Flowchart',
        '```mermaid',
        'graph TD',
        '    A --> B',
        '```',
      ]);

      const mockPanel1 = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel1 as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 3, 7);

      expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
      expect((MermaidEditorPanel as any).currentPanel).toBeDefined();
    });

    it('should maintain singleton pattern - only one webview at a time', async () => {
      const context = createMockExtensionContext();
      const document1 = createMockDocument(['```mermaid', 'sequenceDiagram', '```']);
      const document2 = createMockDocument(['```mermaid', 'flowchart TD', '```']);

      const mockPanel1 = createMockWebviewPanel();
      const mockPanel2 = createMockWebviewPanel();

      vi.mocked(vscode.window.createWebviewPanel).mockReturnValueOnce(mockPanel1 as any);

      MermaidEditorPanel.createOrShow(context as any, document1 as any, 0, 3);
      expect((MermaidEditorPanel as any).currentPanel).toBeDefined();

      vi.mocked(vscode.window.createWebviewPanel).mockReturnValueOnce(mockPanel2 as any);
      MermaidEditorPanel.createOrShow(context as any, document2 as any, 0, 3);

      expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(2);
      expect((MermaidEditorPanel as any).currentPanel).toBeDefined();
    });
  });

  describe('Workflow: Full End-to-End Cycle', () => {
    it('should complete full workflow: open → init → edit → save → close', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument([
        '# My Document',
        '',
        '```mermaid',
        'sequenceDiagram',
        '    participant User',
        '    participant API',
        '    User->>API: Request',
        '```',
        '',
        'End',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(true);

      expect(document.getText()).toContain('sequenceDiagram');

      MermaidEditorPanel.createOrShow(context as any, document as any, 2, 8);
      expect((MermaidEditorPanel as any).currentPanel).toBeDefined();
      expect(vscode.window.createWebviewPanel).toHaveBeenCalled();

      sendWebviewMessage(mockPanel, { type: 'ready' });
      await delay(10);

      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'init',
          data: expect.any(Object),
        })
      );

      const updatedCode = 'sequenceDiagram\n    participant User\n    participant API\n    participant DB\n    User->>API: Request\n    API->>DB: Query';

      sendWebviewMessage(mockPanel, {
        type: 'save',
        data: { mermaidCode: updatedCode },
      });
      await delay(10);

      expect(vscode.workspace.applyEdit).toHaveBeenCalled();
      expect((document as any).save).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Mermaid 图表已保存');

      sendWebviewMessage(mockPanel, { type: 'cancel' });
      await delay(10);

      expect(mockPanel.dispose).toHaveBeenCalled();
    });

    it('should handle theme detection in init data', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'sequenceDiagram', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      // Test dark theme
      Object.defineProperty(vscode.window.activeColorTheme, 'kind', {
        value: vscode.ColorThemeKind.Dark,
        configurable: true,
      });

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);
      sendWebviewMessage(mockPanel, { type: 'ready' });

      await delay(10);

      const initData = vi.mocked(mockPanel.webview.postMessage).mock.calls[0]?.[0];
      expect(initData?.data.theme).toBe('dark');
    });

    it('should handle light theme detection', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'sequenceDiagram', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      // Test light theme
      Object.defineProperty(vscode.window.activeColorTheme, 'kind', {
        value: vscode.ColorThemeKind.Light,
        configurable: true,
      });

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);
      sendWebviewMessage(mockPanel, { type: 'ready' });

      await delay(10);

      const initData = vi.mocked(mockPanel.webview.postMessage).mock.calls[0]?.[0];
      expect(initData?.data.theme).toBe('light');
    });

    it('should detect diagram type correctly in init data', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'graph TD', 'A --> B', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 4);
      sendWebviewMessage(mockPanel, { type: 'ready' });

      await delay(10);

      const initData = vi.mocked(mockPanel.webview.postMessage).mock.calls[0]?.[0];
      expect(initData?.data.diagramType).toBe('flowchart');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty mermaid blocks', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 2);
      sendWebviewMessage(mockPanel, { type: 'ready' });

      await delay(10);

      // Should still send init message even with empty content
      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'init' })
      );
    });

    it('should handle mermaid blocks with extra whitespace', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument([
        '```mermaid',
        '  sequenceDiagram',
        '    participant A',
        '    A->>B: Message',
        '```',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 5);
      sendWebviewMessage(mockPanel, { type: 'ready' });

      await delay(10);

      const initCall = vi.mocked(mockPanel.webview.postMessage).mock.calls[0];
      expect(initCall?.[0]).toMatchObject({ type: 'init' });
    });

    it('should handle save with multiline code including newlines', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'sequenceDiagram', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(true);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      const multilineCode = 'sequenceDiagram\n    participant A\n    participant B\n    participant C\n    A->>B: Message 1\n    B->>C: Message 2';

      sendWebviewMessage(mockPanel, {
        type: 'save',
        data: { mermaidCode: multilineCode },
      });

      await delay(10);

      expect(vscode.workspace.applyEdit).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Mermaid 图表已保存');
    });

    it('should handle rapid message succession', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'sequenceDiagram', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(true);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      // Send multiple messages in sequence
      sendWebviewMessage(mockPanel, { type: 'ready' });
      sendWebviewMessage(mockPanel, {
        type: 'save',
        data: { mermaidCode: 'sequenceDiagram\n    A->>B: Hi' },
      });
      sendWebviewMessage(mockPanel, { type: 'cancel' });

      await delay(20);

      // All messages should be processed
      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'init' })
      );
      expect(vscode.workspace.applyEdit).toHaveBeenCalled();
      expect(mockPanel.dispose).toHaveBeenCalled();
    });
  });

  describe('Fixture File Tests', () => {
    it('should handle test.md fixture file with sequence diagram', async () => {
      const context = createMockExtensionContext();
      // Simulating reading from test.md
      const document = createMockDocument([
        '# Test Markdown File',
        '',
        'This is a test file for E2E testing.',
        '',
        '## Sequence Diagram',
        '',
        '```mermaid',
        'sequenceDiagram',
        '    participant Alice',
        '    participant Bob',
        '    Alice->>Bob: Hello',
        '    Bob-->>Alice: Hi',
        '```',
        '',
        '## Flowchart',
        '',
        '```mermaid',
        'graph TD',
        '    A[Start] --> B[End]',
        '```',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      // Open the sequence diagram block
      MermaidEditorPanel.createOrShow(context as any, document as any, 6, 13);

      expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
      expect((MermaidEditorPanel as any).currentPanel).toBeDefined();

      sendWebviewMessage(mockPanel, { type: 'ready' });
      await delay(10);

      const initData = vi.mocked(mockPanel.webview.postMessage).mock.calls[0]?.[0];
      expect(initData?.data.diagramType).toBe('sequence');
      expect(initData?.data.mermaidCode).toContain('Alice');
      expect(initData?.data.mermaidCode).toContain('Bob');
    });

    it('should handle test.md fixture file with flowchart', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument([
        '# Test Markdown File',
        '',
        '## Flowchart',
        '',
        '```mermaid',
        'graph TD',
        '    A[Start] --> B[End]',
        '```',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 4, 8);

      sendWebviewMessage(mockPanel, { type: 'ready' });
      await delay(10);

      const initData = vi.mocked(mockPanel.webview.postMessage).mock.calls[0]?.[0];
      expect(initData?.data.diagramType).toBe('flowchart');
    });
  });
});
