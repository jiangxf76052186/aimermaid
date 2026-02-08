import React, { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { PropertyPanel } from './components/PropertyPanel';
import { Preview } from './components/Preview';
import { useDiagramStore } from './stores/diagramStore';
import { vscodeApi } from './utils/vscode-api';
import { ExtensionMessage } from '@shared/types';

const App: React.FC = () => {
  const { loadFromMermaid, setTheme } = useDiagramStore();

  useEffect(() => {
    const handleMessage = (message: ExtensionMessage) => {
      console.log('[AIMermaid] Received message:', message);
      switch (message.type) {
        case 'init':
          console.log('[AIMermaid] Init with code:', message.data.mermaidCode);
          console.log('[AIMermaid] Diagram type:', message.data.diagramType);
          loadFromMermaid(message.data.mermaidCode);
          setTheme(message.data.theme as 'light' | 'dark');
          // TODO: 后续根据 diagramType 选择对应的 Adapter
          break;
        case 'themeChanged':
          setTheme(message.data.theme as 'light' | 'dark');
          break;
      }
    };

    const unsubscribe = vscodeApi.onMessage(handleMessage);
    console.log('[AIMermaid] App mounted, sending ready');
    vscodeApi.ready();

    return unsubscribe;
  }, [loadFromMermaid, setTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        useDiagramStore.getState().undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        useDiagramStore.getState().redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        useDiagramStore.getState().recalculateAllBlockContents();
        const code = useDiagramStore.getState().toMermaid();
        vscodeApi.save(code);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        useDiagramStore.getState().deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-vscode-bg text-vscode-fg">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Toolbar />
          <div className="flex flex-col flex-1">
            <Canvas />
            <Preview />
          </div>
          <PropertyPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default App;
