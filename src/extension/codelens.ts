import * as vscode from 'vscode';
import { MERMAID_FENCE_START, MERMAID_FENCE_END } from '../shared/constants';

export interface MermaidBlock {
  startLine: number;
  endLine: number;
  content: string;
}

export class MermaidCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  public provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    console.log('[AIMermaid] provideCodeLenses called for:', document.fileName);
    const codeLenses: vscode.CodeLens[] = [];
    const blocks = this.findMermaidBlocks(document);
    console.log('[AIMermaid] Found blocks:', blocks.length);

    for (const block of blocks) {
      const range = new vscode.Range(block.startLine, 0, block.startLine, 0);
      const codeLens = new vscode.CodeLens(range, {
        title: '🎨 可视化编辑',
        command: 'aimermaid.openEditor',
        arguments: [document, block.startLine, block.endLine],
      });
      codeLenses.push(codeLens);
    }

    return codeLenses;
  }

  private findMermaidBlocks(document: vscode.TextDocument): MermaidBlock[] {
    const blocks: MermaidBlock[] = [];
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
        blocks.push({
          startLine: blockStart,
          endLine: i,
          content: blockContent.trim(),
        });
        inMermaidBlock = false;
        blockStart = -1;
        blockContent = '';
      } else if (inMermaidBlock) {
        blockContent += line + '\n';
      }
    }

    return blocks;
  }
}
