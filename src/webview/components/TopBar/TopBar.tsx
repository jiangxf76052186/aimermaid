import React from 'react';
import { Save, X, Undo2, Redo2 } from 'lucide-react';
import { useDiagramStore } from '../../stores/diagramStore';
import { useEditorStore } from '../../stores/editorStore';
import { getActiveStore } from '../../hooks/useActiveStore';
import { vscodeApi } from '../../utils/vscode-api';

const TopBar: React.FC = () => {
  const activeDiagramType = useEditorStore((s) => s.activeDiagramType);
  const store = getActiveStore(activeDiagramType);
  const { toMermaid, undo, redo, history, historyIndex } = store();

  const handleSave = () => {
    console.log('[AIMermaid] === SAVE START ===');
    if (activeDiagramType === 'sequence') {
      useDiagramStore.getState().recalculateAllBlockContents();
    }
    const code = toMermaid();
    console.log('[AIMermaid] Generated code:', code);
    console.log('[AIMermaid] === SAVE END ===');
    vscodeApi.save(code);
  };

  const handleCancel = () => {
    vscodeApi.cancel();
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const titleMap: Record<string, string> = {
    sequence: '时序图',
    flowchart: '流程图',
    state: '状态图',
  };
  const title = titleMap[activeDiagramType] || activeDiagramType;

  return (
    <div className="h-12 bg-vscode-input-bg border-b border-vscode-border flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-3 py-1.5 bg-vscode-button-bg text-vscode-button-fg rounded hover:bg-vscode-button-hover transition-colors"
        >
          <Save className="w-4 h-4" />
          <span className="text-sm">保存</span>
        </button>
        
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-3 py-1.5 border border-vscode-border rounded hover:bg-vscode-list-hover transition-colors"
        >
          <X className="w-4 h-4" />
          <span className="text-sm">取消</span>
        </button>

        <div className="w-px h-6 bg-vscode-border mx-2" />

        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded ${canUndo ? 'hover:bg-vscode-list-hover' : 'opacity-40 cursor-not-allowed'}`}
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded ${canRedo ? 'hover:bg-vscode-list-hover' : 'opacity-40 cursor-not-allowed'}`}
          title="重做 (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="text-sm text-gray-400">
        AI Mermaid Editor - {title}
      </div>
    </div>
  );
};

export default TopBar;
