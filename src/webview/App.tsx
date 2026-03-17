import React, { useEffect, useMemo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { TopBar } from './components/TopBar';
import { Canvas } from './components/Canvas';
import { Preview } from './components/Preview';
import { useDiagramStore } from './stores/diagramStore';
import { useEditorStore } from './stores/editorStore';
import { vscodeApi } from './utils/vscode-api';
import { ExtensionMessage, DiagramType } from '@shared/types';
import { getActiveStore } from './hooks/useActiveStore';
import { DiagramRegistry } from './core/registry/DiagramRegistry';
import { FlowchartCanvas } from './diagrams/flowchart/components/FlowchartCanvas';
import { StateCanvas } from './diagrams/stateDiagram/components/StateCanvas';
import './core/initAdapters';

const App: React.FC = () => {
  const { activeDiagramType, setActiveDiagramType } = useEditorStore();

  const adapter = useMemo(() => {
    return DiagramRegistry.getOrDefault(activeDiagramType);
  }, [activeDiagramType]);

  const ToolbarComponent = adapter.Toolbar;
  const PropertyPanelComponent = adapter.PropertyPanel;

  useEffect(() => {
    const handleMessage = (message: ExtensionMessage) => {
      console.log('[AIMermaid] Received message:', message);
      switch (message.type) {
        case 'init': {
          console.log('[AIMermaid] Init with code:', message.data.mermaidCode);
          console.log('[AIMermaid] Diagram type:', message.data.diagramType);
          const diagramType = message.data.diagramType as DiagramType;
          setActiveDiagramType(diagramType);
          const store = getActiveStore(diagramType);
          store.getState().loadFromMermaid(message.data.mermaidCode);
          store.getState().setTheme(message.data.theme as 'light' | 'dark');
          break;
        }
        case 'themeChanged': {
          const store = getActiveStore(activeDiagramType);
          store.getState().setTheme(message.data.theme as 'light' | 'dark');
          break;
        }
      }
    };

    const unsubscribe = vscodeApi.onMessage(handleMessage);
    console.log('[AIMermaid] App mounted, sending ready');
    vscodeApi.ready();

    return unsubscribe;
  }, [activeDiagramType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentType = useEditorStore.getState().activeDiagramType;
      const activeStore = getActiveStore(currentType);
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        activeStore.getState().undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        activeStore.getState().redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentType === 'sequence') {
          useDiagramStore.getState().recalculateAllBlockContents();
        }
        const code = activeStore.getState().toMermaid();
        vscodeApi.save(code);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        activeStore.getState().deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isFlowchart = activeDiagramType === 'flowchart';
  const isStateDiagram = activeDiagramType === 'state';

  const renderCanvas = () => {
    if (isFlowchart) return <FlowchartCanvas />;
    if (isStateDiagram) return <StateCanvas />;
    return <Canvas />;
  };

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-vscode-bg text-vscode-fg">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <ToolbarComponent />
          <div className="flex flex-col flex-1">
            {renderCanvas()}
            <Preview />
          </div>
          <PropertyPanelComponent />
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default App;
