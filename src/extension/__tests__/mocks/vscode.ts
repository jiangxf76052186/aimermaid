import { vi } from 'vitest';

/**
 * 核心 VS Code API Mock
 * 用于 Extension 端测试，模拟所有必要的 VS Code API
 */

// ========== Type Constructors ==========

const Range = vi.fn((startLine: number, startChar: number, endLine: number, endChar: number) => ({
  start: { line: startLine, character: startChar },
  end: { line: endLine, character: endChar },
  startLine,
  startChar,
  endLine,
  endChar,
}));

const Position = vi.fn((line: number, character: number) => ({
  line,
  character,
}));

const Uri = {
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
};

// ========== Enums ==========

const ViewColumn = {
  Beside: -2,
  One: 1,
  Two: 2,
  Three: 3,
};

const ColorThemeKind = {
  Light: 1,
  Dark: 2,
  HighContrast: 3,
  HighContrastLight: 4,
};

// ========== Internal Factories ==========

function _createDocument() {
  return {
    uri: { fsPath: '/test.md', scheme: 'file' },
    fileName: 'test.md',
    isUntitled: false,
    languageId: 'markdown',
    version: 1,
    isDirty: false,
    isClosed: false,
    lineCount: 10,
    lineAt: vi.fn((line: number) => ({
      lineNumber: line,
      text: `Line ${line}`,
      range: { start: { line, character: 0 }, end: { line, character: 20 } },
      firstNonWhitespaceCharacterIndex: 0,
      isEmptyOrWhitespace: false,
    })),
    offsetAt: vi.fn(() => 0),
    positionAt: vi.fn(() => ({ line: 0, character: 0 })),
    getText: vi.fn(() => 'test content'),
    getWordRangeAtPosition: vi.fn(),
    validateRange: vi.fn((range) => range),
    validatePosition: vi.fn((position) => position),
    save: vi.fn(async () => true),
  };
}

function _createTextEditor() {
  return {
    document: _createDocument(),
    selection: { active: { line: 0, character: 0 }, anchor: { line: 0, character: 0 } },
    selections: [],
    options: {},
    viewColumn: 1,
    edit: vi.fn(async (callback: any) => {
      await callback({ insert: vi.fn(), delete: vi.fn(), replace: vi.fn() });
      return true;
    }),
    revealRange: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
  };
}

function _createWebviewPanel() {
  return {
    viewType: 'aimermaid.editor',
    title: 'Mermaid Editor',
    iconPath: undefined,
    webview: {
      html: '',
      options: {},
      cspSource: 'https://example.com',
      postMessage: vi.fn(async () => true),
      onDidReceiveMessage: vi.fn(() => ({ dispose: vi.fn() })),
      asWebviewUri: vi.fn((uri: any) => uri),
    },
    viewColumn: ViewColumn.Beside,
    active: true,
    visible: true,
    onDidChangeViewState: vi.fn(() => ({ dispose: vi.fn() })),
    onDidDispose: vi.fn(() => ({ dispose: vi.fn() })),
    dispose: vi.fn(),
    reveal: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
  };
}

function _createExtensionContext() {
  return {
    subscriptions: [],
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
      get: vi.fn(async () => undefined),
      store: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
      onDidChange: vi.fn(() => ({ dispose: vi.fn() })),
    },
    extensionPath: '/path/to/extension',
    extensionUri: Uri.file('/path/to/extension'),
    storagePath: '/path/to/storage',
    storageUri: Uri.file('/path/to/storage'),
    globalStoragePath: '/path/to/global-storage',
    globalStorageUri: Uri.file('/path/to/global-storage'),
    logPath: '/path/to/logs',
    logUri: Uri.file('/path/to/logs'),
    extensionMode: 1,
    logLevel: 0,
    onDidChangeLogLevel: vi.fn(() => ({ dispose: vi.fn() })),
  };
}

function _createWorkspaceEdit() {
  return {
    set: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    replace: vi.fn(),
    has: vi.fn(() => false),
    entries: vi.fn(() => []),
    size: 0,
  };
}

function _createEventEmitter() {
  const listeners: Array<(...args: any[]) => void> = [];
  return {
    event: vi.fn((listener: (...args: any[]) => void) => {
      listeners.push(listener);
      return {
        dispose: vi.fn(() => {
          const index = listeners.indexOf(listener);
          if (index > -1) listeners.splice(index, 1);
        }),
      };
    }),
    fire: (...args: any[]) => {
      listeners.forEach((listener) => listener(...args));
    },
    dispose: vi.fn(),
  };
}

// ========== Main VS Code Mock Export ==========

export const mockVscode = {
  languages: {
    registerCodeLensProvider: vi.fn(() => ({ dispose: vi.fn() })),
    registerHoverProvider: vi.fn(() => ({ dispose: vi.fn() })),
    registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
    registerDefinitionProvider: vi.fn(() => ({ dispose: vi.fn() })),
    getLanguages: vi.fn(async () => ['markdown', 'typescript']),
    match: vi.fn(() => 0),
    onDidChangeDiagnostics: vi.fn(() => ({ dispose: vi.fn() })),
    createDiagnosticCollection: vi.fn(() => ({
      dispose: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    })),
    getDiagnostics: vi.fn(() => []),
  },

  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    registerTextEditorCommand: vi.fn(() => ({ dispose: vi.fn() })),
    executeCommand: vi.fn(async () => undefined),
    getCommands: vi.fn(async () => []),
  },

  window: {
    activeTextEditor: _createTextEditor(),
    activeTerminal: undefined,
    terminals: [],
    onDidChangeActiveTextEditor: vi.fn(() => ({ dispose: vi.fn() })),
    onDidOpenTerminal: vi.fn(() => ({ dispose: vi.fn() })),
    onDidCloseTerminal: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeWindowState: vi.fn(() => ({ dispose: vi.fn() })),
    showTextDocument: vi.fn(async () => _createTextEditor()),
    showInformationMessage: vi.fn(async (...args: any[]) => args[0]),
    showWarningMessage: vi.fn(async (...args: any[]) => args[0]),
    showErrorMessage: vi.fn(async (...args: any[]) => args[0]),
    showQuickPick: vi.fn(async () => undefined),
    showInputBox: vi.fn(async () => undefined),
    showOpenDialog: vi.fn(async () => undefined),
    showSaveDialog: vi.fn(async () => undefined),
    showWorkspaceFolderPick: vi.fn(async () => undefined),
    createTextEditorDecorationType: vi.fn(() => ({ dispose: vi.fn() })),
    createWebviewPanel: vi.fn(() => _createWebviewPanel()),
    createTerminal: vi.fn(() => ({
      name: 'test',
      processId: Promise.resolve(undefined),
      exitStatus: undefined,
      sendText: vi.fn(),
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
    })),
    activeColorTheme: {
      kind: ColorThemeKind.Dark,
    },
    visibleTextEditors: [_createTextEditor()],
    onDidChangeVisibleTextEditors: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeTextEditorSelection: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeTextEditorOptions: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeTextEditorViewColumn: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeActiveColorTheme: vi.fn(() => ({ dispose: vi.fn() })),
  },

  workspace: {
    workspaceFolders: [],
    name: 'test-workspace',
    rootPath: '/workspace',
    rootUri: Uri.file('/workspace'),
    onDidChangeWorkspaceFolders: vi.fn(() => ({ dispose: vi.fn() })),
    onDidOpenTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onDidCloseTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onDidSaveTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onDidRenameFiles: vi.fn(() => ({ dispose: vi.fn() })),
    onDidDeleteFiles: vi.fn(() => ({ dispose: vi.fn() })),
    onDidCreateFiles: vi.fn(() => ({ dispose: vi.fn() })),
    onWillSaveTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onWillCreateFiles: vi.fn(() => ({ dispose: vi.fn() })),
    onWillDeleteFiles: vi.fn(() => ({ dispose: vi.fn() })),
    onWillRenameFiles: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
    getConfiguration: vi.fn(() => ({
      get: vi.fn(),
      has: vi.fn(() => false),
      inspect: vi.fn(),
      update: vi.fn(async () => undefined),
    })),
    applyEdit: vi.fn(async () => true),
    openTextDocument: vi.fn(async () => _createDocument()),
    openNotebookDocument: vi.fn(async () => ({})),
    save: vi.fn(async () => true),
    saveAll: vi.fn(async () => true),
    saveAs: vi.fn(async () => undefined),
    saveAllFiles: vi.fn(async () => true),
    textDocuments: [_createDocument()],
    findTextInFiles: vi.fn(async () => ({})),
    findFiles: vi.fn(async () => []),
    createFileSystemWatcher: vi.fn(() => ({
      onDidCreate: vi.fn(() => ({ dispose: vi.fn() })),
      onDidChange: vi.fn(() => ({ dispose: vi.fn() })),
      onDidDelete: vi.fn(() => ({ dispose: vi.fn() })),
      ignoreCreateEvents: false,
      ignoreChangeEvents: false,
      ignoreDeleteEvents: false,
      dispose: vi.fn(),
    })),
    asRelativePath: vi.fn((path: string) => path),
    getWorkspaceFolder: vi.fn(() => undefined),
    updateWorkspaceFolders: vi.fn(() => false),
    fs: {
      stat: vi.fn(async () => ({})),
      readDirectory: vi.fn(async () => []),
      createDirectory: vi.fn(async () => undefined),
      readFile: vi.fn(async () => new Uint8Array()),
      writeFile: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
      rename: vi.fn(async () => undefined),
      copy: vi.fn(async () => undefined),
      isIgnored: vi.fn(async () => false),
    },
  },

  Range,
  Position,
  Uri,

  ViewColumn,
  ColorThemeKind,

  CodeLens: vi.fn((range, command) => ({
    range: range || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
    command,
    isResolved: false,
  })),
  EventEmitter: vi.fn(_createEventEmitter),

  CancellationTokenSource: vi.fn(() => ({
    token: { isCancellationRequested: false },
    cancel: vi.fn(),
    dispose: vi.fn(),
  })),
};

// ========== Exported Factory Functions ==========

export function createMockDocument() {
  return _createDocument();
}

export function createMockTextEditor() {
  return _createTextEditor();
}

export function createMockWebviewPanel() {
  return _createWebviewPanel();
}

export function createMockExtensionContext() {
  return _createExtensionContext();
}

export function createMockWorkspaceEdit() {
  return _createWorkspaceEdit();
}

export function createMockEventEmitter() {
  return _createEventEmitter();
}

export function resetAllMocks() {
  vi.clearAllMocks();
}
