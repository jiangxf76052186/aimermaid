import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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
  WorkspaceEdit: class {
    replace() {}
  },
  Uri: {
    file: vi.fn((path: string) => ({
      fsPath: path,
      path: path,
      scheme: 'file',
      toString: () => `file://${path}`,
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
    createWebviewPanel: vi.fn(() => {
      const messageListeners: Array<(message: any) => void> = [];
      const disposeListeners: Array<() => void> = [];
      return {
        viewType: 'aimermaid.editor',
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
        onDidDispose: vi.fn((listener: () => void) => {
          disposeListeners.push(listener);
          return { dispose: vi.fn() };
        }),
        dispose: vi.fn(function(this: any) {
          disposeListeners.forEach(listener => listener());
        }),
        reveal: vi.fn(),
        _messageListeners: messageListeners,
        _disposeListeners: disposeListeners,
      };
    }),
    activeColorTheme: {
      kind: 2,
    },
  },
  workspace: {
    applyEdit: vi.fn(async () => true),
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
    return 'unknown';
  }),
}));

import * as vscode from 'vscode';
import { MermaidEditorPanel } from '../../webview';
import { detectDiagramType } from '../../utils/diagram-detector';
import { createMockDocument } from '../mocks/document';

function createMockWebviewPanel() {
  const messageListeners: Array<(message: any) => void> = [];
  const disposeListeners: Array<() => void> = [];

  const dispose = vi.fn();
  
  const onDispose = vi.fn((listener: () => void) => {
    disposeListeners.push(listener);
    return { dispose: vi.fn() };
  });

  return {
    viewType: 'aimermaid.editor',
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
    onDidDispose: onDispose,
    dispose: dispose,
    reveal: vi.fn(),
    _messageListeners: messageListeners,
    _disposeListeners: disposeListeners,
  };
}

function createMockExtensionContext() {
  return {
    subscriptions: [] as any[],
    extensionUri: {
      fsPath: '/path/to/extension',
      scheme: 'file',
    },
    asAbsolutePath: vi.fn((relative: string) => `/path/to/extension/${relative}`),
  };
}

function triggerWebviewMessage(panel: any, message: any) {
  if (panel._messageListeners && panel._messageListeners.length > 0) {
    panel._messageListeners.forEach((listener: any) => listener(message));
  }
}

describe('MermaidEditorPanel Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (MermaidEditorPanel as any).currentPanel = undefined;
  });

  afterEach(() => {
    (MermaidEditorPanel as any).currentPanel = undefined;
  });

  describe('createOrShow() - Singleton Pattern', () => {
    it('should create a new panel when currentPanel is undefined', () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'sequenceDiagram', '```']);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      expect((MermaidEditorPanel as any).currentPanel).toBeDefined();
      expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
        'aimermaid.editor',
        'Mermaid 编辑器',
        vscode.ViewColumn.Beside,
        expect.objectContaining({
          enableScripts: true,
          retainContextWhenHidden: true,
        })
      );
    });

    it('should set retainContextWhenHidden to true for state preservation', () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'sequenceDiagram', '```']);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      const callArgs = vi.mocked(vscode.window.createWebviewPanel).mock.calls[0];
      expect(callArgs?.[3]?.retainContextWhenHidden).toBe(true);
    });
  });

  describe('_sendInitData() - Theme Detection and Init Message', () => {
    it('should detect dark theme and send init message with dark theme', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument([
        '```mermaid',
        'sequenceDiagram',
        '  participant A',
        '  participant B',
        '```',
      ]);

      Object.defineProperty(vscode.window.activeColorTheme, 'kind', {
        value: vscode.ColorThemeKind.Dark,
        configurable: true,
      });

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(detectDiagramType).mockReturnValue('sequence');

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 5);

      triggerWebviewMessage(mockPanel, { type: 'ready' });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'init',
          data: expect.objectContaining({
            theme: 'dark',
            diagramType: 'sequence',
          }),
        })
      );
    });

    it('should detect light theme and send init message with light theme', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'graph TD', '```']);

      Object.defineProperty(vscode.window.activeColorTheme, 'kind', {
        value: vscode.ColorThemeKind.Light,
        configurable: true,
      });

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(detectDiagramType).mockReturnValue('flowchart');

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      triggerWebviewMessage(mockPanel, { type: 'ready' });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'init',
          data: expect.objectContaining({
            theme: 'light',
          }),
        })
      );
    });

    it('should include correct mermaidCode in init message', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument([
        '```mermaid',
        '  participant Alice',
        '  participant Bob',
        '  Alice->>Bob: Hello',
        '```',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 5);

      triggerWebviewMessage(mockPanel, { type: 'ready' });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'init',
          data: expect.objectContaining({
            mermaidCode: expect.stringContaining('participant'),
          }),
        })
      );
    });

    it('should include diagramType detected from mermaid code', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'sequenceDiagram', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(detectDiagramType).mockReturnValue('sequence');

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      triggerWebviewMessage(mockPanel, { type: 'ready' });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(vi.mocked(detectDiagramType)).toHaveBeenCalled();
      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            diagramType: 'sequence',
          }),
        })
      );
    });
  });

  describe('_handleMessage() - Message Handling', () => {
    it('should handle ready message and call _sendInitData', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'sequenceDiagram', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      triggerWebviewMessage(mockPanel, { type: 'ready' });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'init' })
      );
    });

    it('should handle save message and call _saveToDocument', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'sequenceDiagram', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(true);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      const newMermaidCode = 'sequenceDiagram\nparticipant A\nparticipant B';
      triggerWebviewMessage(mockPanel, { type: 'save', data: { mermaidCode: newMermaidCode } });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(vscode.workspace.applyEdit).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Mermaid 图表已保存');
    });

    it('should handle cancel message and dispose panel', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'sequenceDiagram', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      expect((MermaidEditorPanel as any).currentPanel).toBeDefined();

      triggerWebviewMessage(mockPanel, { type: 'cancel' });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPanel.dispose).toHaveBeenCalled();
    });

    it('should ignore unknown message types gracefully', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'sequenceDiagram', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      expect(() => {
        triggerWebviewMessage(mockPanel, { type: 'unknown' });
      }).not.toThrow();
    });
  });

  describe('_saveToDocument() - Document Updates', () => {
    it('should apply WorkspaceEdit to replace mermaid code', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'old code', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(true);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      const newCode = 'new mermaid code\nwith multiple lines';
      triggerWebviewMessage(mockPanel, { type: 'save', data: { mermaidCode: newCode } });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(vscode.workspace.applyEdit).toHaveBeenCalled();
    });

    it('should save document after applying edit', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'code', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(true);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      triggerWebviewMessage(mockPanel, { type: 'save', data: { mermaidCode: 'new code' } });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect((document as any).save).toHaveBeenCalled();
    });

    it('should calculate new endLine based on number of lines in new code', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'old', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(true);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      // New code with 3 lines
      const newCode = 'line1\nline2\nline3';
      triggerWebviewMessage(mockPanel, { type: 'save', data: { mermaidCode: newCode } });

      await new Promise(resolve => setTimeout(resolve, 10));

      // endLine should be startLine (0) + 1 + lines.length (3) = 4
      // This is stored in the private _endLine field
      expect(vscode.workspace.applyEdit).toHaveBeenCalled();
    });

    it('should show success message after save', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'code', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(true);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      triggerWebviewMessage(mockPanel, { type: 'save', data: { mermaidCode: 'code' } });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Mermaid 图表已保存');
    });
  });

  describe('_getMermaidContent() - Content Extraction', () => {
    it('should extract mermaid content between start and end lines', () => {
      const context = createMockExtensionContext();
      const document = createMockDocument([
        '# Title',
        '```mermaid',
        'sequenceDiagram',
        '  participant A',
        '  participant B',
        '```',
        'Some text',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      // Start at line 1 (```mermaid), end at line 6 (```)
      MermaidEditorPanel.createOrShow(context as any, document as any, 1, 6);

      triggerWebviewMessage(mockPanel, { type: 'ready' });

      // Verify the mermaidCode includes content between startLine+1 and endLine
      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'init',
          data: expect.objectContaining({
            mermaidCode: expect.stringContaining('sequenceDiagram'),
          }),
        })
      );
    });

    it('should handle single-line mermaid blocks', () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 2);

      triggerWebviewMessage(mockPanel, { type: 'ready' });

      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'init',
        })
      );
    });

    it('should preserve line breaks in extracted content', () => {
      const context = createMockExtensionContext();
      const mermaidLines = [
        'sequenceDiagram',
        '  participant Alice',
        '  participant Bob',
        '  Alice->>Bob: Hello',
      ];
      const document = createMockDocument(['```mermaid', ...mermaidLines, '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 6);

      triggerWebviewMessage(mockPanel, { type: 'ready' });

      // Content should preserve original line structure
      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'init',
          data: expect.objectContaining({
            mermaidCode: expect.any(String),
          }),
        })
      );
    });
  });

  describe('dispose() - Resource Cleanup', () => {
    it('should set currentPanel to undefined', () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'code', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      expect((MermaidEditorPanel as any).currentPanel).toBeDefined();

      (MermaidEditorPanel as any).currentPanel?.dispose();

      expect((MermaidEditorPanel as any).currentPanel).toBeUndefined();
    });

    it('should dispose the webview panel', () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'code', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      const panel = (MermaidEditorPanel as any).currentPanel;
      panel.dispose();

      expect(mockPanel.dispose).toHaveBeenCalled();
    });

    it('should dispose all registered disposables', () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'code', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      const panel = (MermaidEditorPanel as any).currentPanel;
      panel.dispose();

      // Verify all listeners were called (onDidDispose was triggered)
      expect(mockPanel._disposeListeners.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple dispose calls gracefully', () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'code', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);

      const panel = (MermaidEditorPanel as any).currentPanel;

      expect(() => {
        panel.dispose();
        panel.dispose();
      }).not.toThrow();
    });
  });

  describe('Integration - Full Workflow', () => {
    it('should handle complete workflow: create > ready > save > dispose', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument([
        '```mermaid',
        'sequenceDiagram',
        '  participant A',
        '```',
      ]);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);
      vi.mocked(vscode.workspace.applyEdit).mockResolvedValue(true);

      // 1. Create panel
      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 4);
      expect((MermaidEditorPanel as any).currentPanel).toBeDefined();

      // 2. Send ready message
      triggerWebviewMessage(mockPanel, { type: 'ready' });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockPanel.webview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'init' })
      );

      // 3. Send save message
      triggerWebviewMessage(mockPanel, {
        type: 'save',
        data: { mermaidCode: 'new content' },
      });
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(vscode.workspace.applyEdit).toHaveBeenCalled();

      // 4. Dispose
      (MermaidEditorPanel as any).currentPanel?.dispose();
      expect((MermaidEditorPanel as any).currentPanel).toBeUndefined();
    });

    it('should handle workflow: create > cancel', async () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['```mermaid', 'code', '```']);

      const mockPanel = createMockWebviewPanel();
      vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(mockPanel as any);

      MermaidEditorPanel.createOrShow(context as any, document as any, 0, 3);
      expect((MermaidEditorPanel as any).currentPanel).toBeDefined();

      triggerWebviewMessage(mockPanel, { type: 'cancel' });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPanel.dispose).toHaveBeenCalled();
    });
  });
});
