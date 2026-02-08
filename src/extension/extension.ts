import * as vscode from 'vscode';
import { MermaidCodeLensProvider, MermaidBlock } from './codelens';
import { MermaidEditorPanel } from './webview';
import { MERMAID_FENCE_START, MERMAID_FENCE_END } from '../shared/constants';

function findMermaidBlockAtCursor(document: vscode.TextDocument, position: vscode.Position): MermaidBlock | null {
  let inMermaidBlock = false;
  let blockStart = -1;
  let blockContent = '';

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i).text;

    if (!inMermaidBlock && MERMAID_FENCE_START.test(line)) {
      inMermaidBlock = true;
      blockStart = i;
      blockContent = '';
    } else if (inMermaidBlock && MERMAID_FENCE_END.test(line)) {
      if (position.line >= blockStart && position.line <= i) {
        return {
          startLine: blockStart,
          endLine: i,
          content: blockContent.trim(),
        };
      }
      inMermaidBlock = false;
      blockStart = -1;
      blockContent = '';
    } else if (inMermaidBlock) {
      blockContent += line + '\n';
    }
  }

  return null;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('[AIMermaid] Extension activating...');
  
  const codeLensProvider = new MermaidCodeLensProvider();

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [
        { language: 'markdown' },
        { language: 'juliamarkdown' },
      ],
      codeLensProvider
    )
  );
  
  console.log('[AIMermaid] CodeLens provider registered');

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'aimermaid.openEditor',
      (document?: vscode.TextDocument, startLine?: number, endLine?: number) => {
        console.log('[AIMermaid] openEditor called', startLine, endLine);
        
        if (!document || startLine === undefined || endLine === undefined) {
          const editor = vscode.window.activeTextEditor;
          if (!editor) {
            vscode.window.showErrorMessage('请先打开一个 Markdown 文件');
            return;
          }
          
          const block = findMermaidBlockAtCursor(editor.document, editor.selection.active);
          if (!block) {
            vscode.window.showErrorMessage('请将光标放在 mermaid 代码块内');
            return;
          }
          
          document = editor.document;
          startLine = block.startLine;
          endLine = block.endLine;
        }
        
        MermaidEditorPanel.createOrShow(context, document, startLine, endLine);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aimermaid.insertDiagram', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const template = `\`\`\`mermaid
sequenceDiagram
    participant User
    participant Server
    User->>Server: Request
    Server-->>User: Response
\`\`\``;

      await editor.edit((editBuilder) => {
        editBuilder.insert(editor.selection.active, template);
      });
    })
  );
  
  console.log('[AIMermaid] Extension activated successfully');
}

export function deactivate() {}
