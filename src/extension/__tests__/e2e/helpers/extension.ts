import * as vscode from 'vscode';
import * as path from 'path';

export async function openTestDocument(fixtureName: string): Promise<vscode.TextDocument> {
  const fixturePath = path.join(__dirname, '../fixtures', fixtureName);
  const doc = await vscode.workspace.openTextDocument(fixturePath);
  await vscode.window.showTextDocument(doc);
  return doc;
}

export async function waitForCodeLens(uri: vscode.Uri): Promise<vscode.CodeLens[]> {
  const codeLenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
    'vscode.executeCodeLensProvider',
    uri
  );
  return codeLenses || [];
}

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
