import * as vscode from 'vscode';
import { ExtensionMessage, WebviewMessage } from '../shared/types';
import { detectDiagramType } from './utils/diagram-detector';

export class MermaidEditorPanel {
  public static currentPanel: MermaidEditorPanel | undefined;
  private static readonly viewType = 'aimermaid.editor';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _document: vscode.TextDocument;
  private readonly _startLine: number;
  private _endLine: number;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(
    context: vscode.ExtensionContext,
    document: vscode.TextDocument,
    startLine: number,
    endLine: number
  ) {
    const column = vscode.ViewColumn.Beside;

    if (MermaidEditorPanel.currentPanel) {
      MermaidEditorPanel.currentPanel.dispose();
    }

    const panel = vscode.window.createWebviewPanel(
      MermaidEditorPanel.viewType,
      'Mermaid 编辑器',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview'),
        ],
      }
    );

    MermaidEditorPanel.currentPanel = new MermaidEditorPanel(
      panel,
      context.extensionUri,
      document,
      startLine,
      endLine
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    document: vscode.TextDocument,
    startLine: number,
    endLine: number
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._document = document;
    this._startLine = startLine;
    this._endLine = endLine;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => this._handleMessage(message),
      null,
      this._disposables
    );
  }

  private async _handleMessage(message: WebviewMessage) {
    switch (message.type) {
      case 'ready':
        this._sendInitData();
        break;
      case 'save':
        await this._saveToDocument(message.data.mermaidCode);
        break;
      case 'cancel':
        this._panel.dispose();
        break;
    }
  }

  private _sendInitData() {
    const mermaidCode = this._getMermaidContent();
    const theme =
      vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark
        ? 'dark'
        : 'light';
    const diagramType = detectDiagramType(mermaidCode);

    const message: ExtensionMessage = {
      type: 'init',
      data: { mermaidCode, theme, diagramType },
    };

    this._panel.webview.postMessage(message);
  }

  private _getMermaidContent(): string {
    const lines: string[] = [];
    for (let i = this._startLine + 1; i < this._endLine; i++) {
      lines.push(this._document.lineAt(i).text);
    }
    return lines.join('\n');
  }

  private async _saveToDocument(mermaidCode: string) {
    const edit = new vscode.WorkspaceEdit();
    const startPos = new vscode.Position(this._startLine + 1, 0);
    const endPos = new vscode.Position(this._endLine, 0);
    const range = new vscode.Range(startPos, endPos);

    const newLines = mermaidCode.split('\n');
    const newEndLine = this._startLine + 1 + newLines.length;

    edit.replace(this._document.uri, range, mermaidCode + '\n');
    await vscode.workspace.applyEdit(edit);
    await this._document.save();

    this._endLine = newEndLine;

    vscode.window.showInformationMessage('Mermaid 图表已保存');
  }

  private _update() {
    this._panel.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview(): string {
    const webview = this._panel.webview;
    const distPath = vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview');

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distPath, 'assets', 'main.js')
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource};">
    <title>Mermaid 编辑器</title>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose() {
    MermaidEditorPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

function getNonce(): string {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
