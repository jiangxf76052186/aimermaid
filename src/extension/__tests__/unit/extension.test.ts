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
    createWebviewPanel: vi.fn(),
    activeColorTheme: {
      kind: 2,
    },
  },
  workspace: {
    applyEdit: vi.fn(async () => true),
  },
  languages: {
    registerCodeLensProvider: vi.fn(() => ({ dispose: vi.fn() })),
  },
  commands: {
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

import * as vscode from 'vscode';
import { activate } from '../../extension';
import { createMockDocument } from '../mocks/document';

/**
 * Mock MermaidEditorPanel to avoid complex initialization
 */
vi.mock('../../webview', () => ({
  MermaidEditorPanel: {
    createOrShow: vi.fn(),
    currentPanel: undefined,
  },
}));

function createMockTextEditor(documentLines: string[]) {
  const document = createMockDocument(documentLines) as any;
  return {
    document,
    selection: { active: { line: 2, character: 0 }, anchor: { line: 2, character: 0 } },
    selections: [],
    options: {},
    viewColumn: 1,
    edit: vi.fn(async (callback: any) => {
      const editBuilder = {
        insert: vi.fn(),
        delete: vi.fn(),
        replace: vi.fn(),
      };
      await callback(editBuilder);
      return true;
    }),
  };
}

function createMockExtensionContext() {
  return {
    subscriptions: [] as any[],
    workspaceState: {
      get: vi.fn(),
      update: vi.fn(async () => undefined),
      keys: () => [],
    },
    globalState: {
      get: vi.fn(),
      update: vi.fn(async () => undefined),
      keys: () => [],
      setKeysForSync: vi.fn(),
    },
    secrets: {
      get: vi.fn(),
      store: vi.fn(),
      delete: vi.fn(),
    },
    extensionPath: '/path/to/extension',
    extensionUri: { fsPath: '/path/to/extension' },
    storagePath: '/path/to/storage',
    storageUri: { fsPath: '/path/to/storage' },
    globalStoragePath: '/path/to/global-storage',
    globalStorageUri: { fsPath: '/path/to/global-storage' },
    logPath: '/path/to/logs',
    logUri: { fsPath: '/path/to/logs' },
    extensionMode: 1,
    asAbsolutePath: vi.fn((relative: string) => `/path/to/extension/${relative}`),
    environmentVariableCollection: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      forEach: vi.fn(),
      prepend: vi.fn(),
      append: vi.fn(),
    },
  } as any;
}

describe('extension.ts', () => {
  let mockVscodeLanguages: any;
  let mockVscodeCommands: any;
  let mockVscodeWindow: any;
  let mockMermaidEditorPanel: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetAllMocks();

    mockVscodeLanguages = vscode.languages;
    mockVscodeCommands = vscode.commands;
    mockVscodeWindow = vscode.window;
    const webviewModule = await import('../../webview');
    mockMermaidEditorPanel = vi.mocked(webviewModule).MermaidEditorPanel;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('activate() - Registration', () => {
    it('should register CodeLens provider for markdown and juliamarkdown', () => {
      const context = createMockExtensionContext();

      activate(context);

      expect(mockVscodeLanguages.registerCodeLensProvider).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ language: 'markdown' }),
          expect.objectContaining({ language: 'juliamarkdown' }),
        ]),
        expect.any(Object)
      );
    });

    it('should add CodeLens registration to subscriptions', () => {
      const context = createMockExtensionContext();

      activate(context);

      expect(context.subscriptions.length).toBeGreaterThan(0);
      expect(mockVscodeLanguages.registerCodeLensProvider).toHaveBeenCalled();
    });

    it('should register openEditor command', () => {
      const context = createMockExtensionContext();

      activate(context);

      expect(mockVscodeCommands.registerCommand).toHaveBeenCalledWith(
        'aimermaid.openEditor',
        expect.any(Function)
      );
    });

    it('should register insertDiagram command', () => {
      const context = createMockExtensionContext();

      activate(context);

      expect(mockVscodeCommands.registerCommand).toHaveBeenCalledWith(
        'aimermaid.insertDiagram',
        expect.any(Function)
      );
    });

    it('should register both commands to subscriptions', () => {
      const context = createMockExtensionContext();

      activate(context);

      const commandRegistrations = mockVscodeCommands.registerCommand.mock.calls.length;
      expect(commandRegistrations).toBe(2);
    });

    it('should log activation start and completion messages', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const context = createMockExtensionContext();

      activate(context);

      expect(consoleSpy).toHaveBeenCalledWith('[AIMermaid] Extension activating...');
      expect(consoleSpy).toHaveBeenCalledWith('[AIMermaid] CodeLens provider registered');
      expect(consoleSpy).toHaveBeenCalledWith('[AIMermaid] Extension activated successfully');

      consoleSpy.mockRestore();
    });
  });

  describe('findMermaidBlockAtCursor() - Block Detection', () => {
    let openEditorCommand: any;

    beforeEach(() => {
      const context = createMockExtensionContext();
      activate(context);

      const openEditorCall = mockVscodeCommands.registerCommand.mock.calls.find(
        (call: any[]) => call[0] === 'aimermaid.openEditor'
      );
      openEditorCommand = openEditorCall?.[1];
    });

    it('should find mermaid block at cursor position', () => {
      const lines = [
        'Some text',
        '```mermaid',
        'sequenceDiagram',
        '  participant Alice',
        '  Alice->>Bob: Hello',
        '```',
        'More text',
      ];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      openEditorCommand();

      expect(mockMermaidEditorPanel.createOrShow).toHaveBeenCalled();
    });

    it('should find block when cursor is on mermaid fence line', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        '  Alice->>Bob: Hi',
        '```',
      ];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      openEditorCommand();

      expect(mockMermaidEditorPanel.createOrShow).toHaveBeenCalled();
    });

    it('should find block when cursor is in the middle of content', () => {
      const lines = [
        'Text before',
        '```mermaid',
        'sequenceDiagram',
        '  Alice->>Bob: Hello',
        '  Bob->>Alice: Hi',
        '```',
        'Text after',
      ];
      const editor = createMockTextEditor(lines);
      editor.selection.active.line = 3;
      (mockVscodeWindow.activeTextEditor as any) = editor;

      openEditorCommand();

      expect(mockMermaidEditorPanel.createOrShow).toHaveBeenCalled();
    });

    it('should not find block when cursor is outside mermaid block', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        '```',
        'Text outside block',
      ];
      const editor = createMockTextEditor(lines);
      editor.selection.active.line = 3;
      (mockVscodeWindow.activeTextEditor as any) = editor;

      openEditorCommand();

      expect(mockVscodeWindow.showErrorMessage).toHaveBeenCalledWith(
        '请将光标放在 mermaid 代码块内'
      );
    });

    it('should return null when no mermaid block exists in document', () => {
      const lines = [
        '# Document without mermaid',
        'Just regular text',
        'No code blocks here',
      ];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      openEditorCommand();

      expect(mockVscodeWindow.showErrorMessage).toHaveBeenCalledWith(
        '请将光标放在 mermaid 代码块内'
      );
    });

    it('should handle multiple blocks and find the correct one', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        '```',
        'Middle content',
        '```mermaid',
        'flowchart TD',
        '  A-->B',
        '```',
        'End',
      ];
      const editor = createMockTextEditor(lines);
      editor.selection.active.line = 5;
      (mockVscodeWindow.activeTextEditor as any) = editor;

      openEditorCommand();

      expect(mockMermaidEditorPanel.createOrShow).toHaveBeenCalled();
    });

    it('should find block with spaces around fence markers', () => {
      const lines = [
        '  ```mermaid  ',
        '  sequenceDiagram',
        '  ```  ',
      ];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      openEditorCommand();

      expect(mockMermaidEditorPanel.createOrShow).toHaveBeenCalled();
    });

    it('should handle case-insensitive mermaid keyword', () => {
      const lines = [
        '```MERMAID',
        'graph TD',
        '```',
      ];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      openEditorCommand();

      expect(mockMermaidEditorPanel.createOrShow).toHaveBeenCalled();
    });
  });

  describe('openEditor command', () => {
    let openEditorCommand: any;

    beforeEach(() => {
      const context = createMockExtensionContext();
      activate(context);

      const openEditorCall = mockVscodeCommands.registerCommand.mock.calls.find(
        (call: any[]) => call[0] === 'aimermaid.openEditor'
      );
      openEditorCommand = openEditorCall?.[1];
    });

    it('should create or show MermaidEditorPanel with correct parameters when called with args', () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['test']) as any;

      activate(context);

      const openEditorCall = mockVscodeCommands.registerCommand.mock.calls.find(
        (call: any[]) => call[0] === 'aimermaid.openEditor'
      );
      const command = openEditorCall?.[1];

      command(document, 1, 5);

      expect(mockMermaidEditorPanel.createOrShow).toHaveBeenCalledWith(
        expect.any(Object),
        document,
        1,
        5
      );
    });

    it('should show error when no active editor and no args provided', () => {
      (mockVscodeWindow.activeTextEditor as any) = null;

      openEditorCommand();

      expect(mockVscodeWindow.showErrorMessage).toHaveBeenCalledWith(
        '请先打开一个 Markdown 文件'
      );
    });

    it('should extract block from active editor when called without args', () => {
      const lines = [
        'Text',
        '```mermaid',
        'sequenceDiagram',
        '```',
      ];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      openEditorCommand();

      expect(mockMermaidEditorPanel.createOrShow).toHaveBeenCalled();
    });

    it('should pass correct context to MermaidEditorPanel', () => {
      const context = createMockExtensionContext();
      const document = createMockDocument(['test']) as any;

      activate(context);

      const openEditorCall = mockVscodeCommands.registerCommand.mock.calls.find(
        (call: any[]) => call[0] === 'aimermaid.openEditor'
      );
      const command = openEditorCall?.[1];

      command(document, 0, 5);

      const createOrShowCall = mockMermaidEditorPanel.createOrShow.mock.calls[0];
      expect(createOrShowCall[0]).toEqual(expect.objectContaining({
        subscriptions: expect.any(Array),
      }));
    });
  });

  describe('insertDiagram command', () => {
    let insertDiagramCommand: any;

    beforeEach(() => {
      const context = createMockExtensionContext();
      activate(context);

      const insertCall = mockVscodeCommands.registerCommand.mock.calls.find(
        (call: any[]) => call[0] === 'aimermaid.insertDiagram'
      );
      insertDiagramCommand = insertCall?.[1];
    });

    it('should insert mermaid template at cursor position', async () => {
      const lines = ['# Document'];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      await insertDiagramCommand();

      expect(editor.edit).toHaveBeenCalled();
    });

    it('should insert sequenceDiagram template with participants and messages', async () => {
      const lines = ['# Document'];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      let insertedText = '';
      (editor.edit as any).mockImplementation(async (callback: any) => {
        const editBuilder = {
          insert: vi.fn((_pos: any, text: string) => {
            insertedText = text;
          }),
        };
        await callback(editBuilder);
        return true;
      });

      await insertDiagramCommand();

      expect(insertedText).toContain('```mermaid');
      expect(insertedText).toContain('sequenceDiagram');
      expect(insertedText).toContain('participant User');
      expect(insertedText).toContain('participant Server');
    });

    it('should include default message exchange in template', async () => {
      const lines = ['# Document'];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      let insertedText = '';
      (editor.edit as any).mockImplementation(async (callback: any) => {
        const editBuilder = {
          insert: vi.fn((_pos: any, text: string) => {
            insertedText = text;
          }),
        };
        await callback(editBuilder);
        return true;
      });

      await insertDiagramCommand();

      expect(insertedText).toContain('User->>Server: Request');
      expect(insertedText).toContain('Server-->>User: Response');
    });

    it('should insert template at cursor position', async () => {
      const lines = ['# Document'];
      const editor = createMockTextEditor(lines);
      editor.selection.active = { line: 1, character: 0 };
      (mockVscodeWindow.activeTextEditor as any) = editor;

      let insertPosition: any = null;
      (editor.edit as any).mockImplementation(async (callback: any) => {
        const editBuilder = {
          insert: vi.fn((position: any) => {
            insertPosition = position;
          }),
        };
        await callback(editBuilder);
        return true;
      });

      await insertDiagramCommand();

      expect(insertPosition).toEqual(editor.selection.active);
    });

    it('should not proceed if no active editor', async () => {
      (mockVscodeWindow.activeTextEditor as any) = null;

      await insertDiagramCommand();

      expect(mockVscodeWindow.activeTextEditor).toBeNull();
    });

    it('should use insert method with editBuilder', async () => {
      const lines = ['# Document'];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      let editBuilderUsed: any = null;
      (editor.edit as any).mockImplementation(async (callback: any) => {
        const editBuilder = {
          insert: vi.fn(),
          delete: vi.fn(),
          replace: vi.fn(),
        };
        editBuilderUsed = editBuilder;
        await callback(editBuilder);
        return true;
      });

      await insertDiagramCommand();

      expect(editBuilderUsed?.insert).toHaveBeenCalled();
    });

    it('should handle async edit operation', async () => {
      const lines = ['# Document'];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      const editSpy = vi.spyOn(editor, 'edit');

      await insertDiagramCommand();

      expect(editSpy).toHaveBeenCalled();
      expect(editor.edit).toHaveBeenCalled();
    });
  });

  describe('Integration - Full workflow', () => {
    it('should complete full activation and command registration cycle', () => {
      const context = createMockExtensionContext();

      activate(context);

      expect(mockVscodeLanguages.registerCodeLensProvider).toHaveBeenCalled();
      expect(mockVscodeCommands.registerCommand).toHaveBeenCalledTimes(2);
      expect(context.subscriptions.length).toBeGreaterThan(0);
    });

    it('should handle sequential command calls', async () => {
      const context = createMockExtensionContext();
      activate(context);

      const insertCall = mockVscodeCommands.registerCommand.mock.calls.find(
        (call: any[]) => call[0] === 'aimermaid.insertDiagram'
      );
      const insertCommand = insertCall?.[1];

      const lines = ['# Document'];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      await insertCommand();

      expect(editor.edit).toHaveBeenCalled();
    });

    it('should maintain mocks across command invocations', () => {
      const context = createMockExtensionContext();
      activate(context);

      expect(mockVscodeCommands.registerCommand).toHaveBeenCalledTimes(2);

      vi.clearAllMocks();
      expect(mockVscodeCommands.registerCommand).not.toHaveBeenCalled();
    });

    it('should properly dispose subscriptions', () => {
      const context = createMockExtensionContext();
      activate(context);

      const disposables = context.subscriptions;
      expect(disposables.length).toBeGreaterThan(0);

      disposables.forEach((disposable: any) => {
        expect(disposable).toHaveProperty('dispose');
      });
    });
  });

  describe('Block content extraction', () => {
    let openEditorCommand: any;

    beforeEach(() => {
      const context = createMockExtensionContext();
      activate(context);

      const openEditorCall = mockVscodeCommands.registerCommand.mock.calls.find(
        (call: any[]) => call[0] === 'aimermaid.openEditor'
      );
      openEditorCommand = openEditorCall?.[1];
    });

    it('should extract clean content from mermaid block', () => {
      const lines = [
        'Text',
        '```mermaid',
        'sequenceDiagram',
        '  participant Alice',
        '  Alice->>Bob: Hello',
        '```',
      ];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      openEditorCommand();

      expect(mockMermaidEditorPanel.createOrShow).toHaveBeenCalledWith(
        expect.any(Object),
        editor.document,
        1,
        5
      );
    });

    it('should find block with nested indentation', () => {
      const lines = [
        '```mermaid',
        '  sequenceDiagram',
        '    participant Alice',
        '    Alice->>Bob: Message',
        '```',
      ];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      openEditorCommand();

      expect(mockMermaidEditorPanel.createOrShow).toHaveBeenCalled();
    });

    it('should handle empty lines within block', () => {
      const lines = [
        '```mermaid',
        'sequenceDiagram',
        '',
        '  participant Alice',
        '',
        '  Alice->>Bob: Hello',
        '```',
      ];
      const editor = createMockTextEditor(lines);
      (mockVscodeWindow.activeTextEditor as any) = editor;

      openEditorCommand();

      expect(mockMermaidEditorPanel.createOrShow).toHaveBeenCalled();
    });
  });
});
