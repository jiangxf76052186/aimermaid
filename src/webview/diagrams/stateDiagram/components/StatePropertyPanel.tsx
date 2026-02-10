import React from 'react';
import { Trash2 } from 'lucide-react';
import { useStateStore } from '../store';
import type { StateType } from '@shared/types/stateDiagram';

const stateTypes: { value: StateType; label: string }[] = [
  { value: 'normal', label: '普通状态' },
  { value: 'choice', label: '选择节点 <<choice>>' },
  { value: 'fork', label: '分叉 <<fork>>' },
  { value: 'join', label: '汇合 <<join>>' },
  { value: 'composite', label: '复合状态' },
];

export const StatePropertyPanel: React.FC = () => {
  const {
    selectedNodeId,
    selectedEdgeId,
    diagram,
    updateState,
    removeState,
    updateTransition,
    removeTransition,
  } = useStateStore();

  const selectedState = selectedNodeId
    ? diagram.states.find((s) => s.id === selectedNodeId)
    : null;

  const selectedTransition = selectedEdgeId
    ? diagram.transitions.find((t) => t.id === selectedEdgeId)
    : null;

  if (!selectedState && !selectedTransition) {
    return (
      <div className="w-64 bg-vscode-input-bg border-l border-vscode-border p-4">
        <div className="text-sm text-gray-400">选择元素以编辑属性</div>
      </div>
    );
  }

  if (selectedState) {
    const isSpecial = selectedState.type === 'start' || selectedState.type === 'end';

    return (
      <div className="w-64 bg-vscode-input-bg border-l border-vscode-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">状态属性</h3>
          <button
            onClick={() => removeState(selectedState.id)}
            className="p-1 text-red-400 hover:bg-red-400/20 rounded"
            title="删除状态"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {!isSpecial && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">状态名称</label>
                <input
                  type="text"
                  value={selectedState.name}
                  onChange={(e) => updateState(selectedState.id, { name: e.target.value })}
                  className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">描述</label>
                <textarea
                  value={selectedState.description || ''}
                  onChange={(e) =>
                    updateState(selectedState.id, { description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">类型</label>
                <select
                  value={selectedState.type}
                  onChange={(e) =>
                    updateState(selectedState.id, { type: e.target.value as StateType })
                  }
                  className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
                >
                  {stateTypes.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">位置 (x, y)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={Math.round(selectedState.position.x)}
                onChange={(e) =>
                  updateState(selectedState.id, {
                    position: { ...selectedState.position, x: Number(e.target.value) },
                  })
                }
                className="w-1/2 px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
                placeholder="X"
              />
              <input
                type="number"
                value={Math.round(selectedState.position.y)}
                onChange={(e) =>
                  updateState(selectedState.id, {
                    position: { ...selectedState.position, y: Number(e.target.value) },
                  })
                }
                className="w-1/2 px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
                placeholder="Y"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedTransition) {
    const fromState = diagram.states.find((s) => s.id === selectedTransition.from);
    const toState = diagram.states.find((s) => s.id === selectedTransition.to);

    return (
      <div className="w-64 bg-vscode-input-bg border-l border-vscode-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">转换属性</h3>
          <button
            onClick={() => removeTransition(selectedTransition.id)}
            className="p-1 text-red-400 hover:bg-red-400/20 rounded"
            title="删除转换"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">标签</label>
            <input
              type="text"
              value={selectedTransition.label || ''}
              onChange={(e) =>
                updateTransition(selectedTransition.id, { label: e.target.value })
              }
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
            />
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t border-vscode-border">
            <div className="mb-1">
              <span className="text-gray-400">From:</span>{' '}
              {fromState?.name || selectedTransition.from}
            </div>
            <div>
              <span className="text-gray-400">To:</span>{' '}
              {toState?.name || selectedTransition.to}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default StatePropertyPanel;
