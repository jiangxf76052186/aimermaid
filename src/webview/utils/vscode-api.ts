import { ExtensionMessage, WebviewMessage } from '@shared/types';

declare const acquireVsCodeApi: () => {
  postMessage: (message: WebviewMessage) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

class VSCodeAPI {
  private readonly vscode: ReturnType<typeof acquireVsCodeApi> | null;
  private messageHandlers: ((message: ExtensionMessage) => void)[] = [];

  constructor() {
    if (typeof acquireVsCodeApi !== 'undefined') {
      this.vscode = acquireVsCodeApi();
      window.addEventListener('message', (event) => {
        const message = event.data as ExtensionMessage;
        this.messageHandlers.forEach((handler) => handler(message));
      });
    } else {
      this.vscode = null;
    }
  }

  postMessage(message: WebviewMessage) {
    if (this.vscode) {
      this.vscode.postMessage(message);
    } else {
      console.log('[DEV] postMessage:', message);
    }
  }

  onMessage(handler: (message: ExtensionMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  ready() {
    this.postMessage({ type: 'ready' });
  }

  save(mermaidCode: string) {
    this.postMessage({ type: 'save', data: { mermaidCode } });
  }

  cancel() {
    this.postMessage({ type: 'cancel' });
  }
}

export const vscodeApi = new VSCodeAPI();
