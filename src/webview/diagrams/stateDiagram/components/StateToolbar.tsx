import React from 'react';
import { Square, Circle, CircleDot, GitBranch, GitMerge, Layers } from 'lucide-react';
import { useStateStore } from '../store';
import type { StateType } from '@shared/types/stateDiagram';

const stateButtons: { type: StateType; icon: React.ReactNode; label: string }[] = [
  { type: 'normal', icon: <Square className="w-4 h-4 rounded" />, label: '普通状态' },
  { type: 'start', icon: <Circle className="w-4 h-4" />, label: '开始节点' },
  { type: 'end', icon: <CircleDot className="w-4 h-4" />, label: '结束节点' },
  { type: 'choice', icon: <Square className="w-4 h-4 rotate-45" />, label: '选择节点' },
  { type: 'fork', icon: <GitBranch className="w-4 h-4" />, label: '分叉' },
  { type: 'join', icon: <GitMerge className="w-4 h-4" />, label: '汇合' },
];

export const StateToolbar: React.FC = () => {
  const addState = useStateStore((s) => s.addState);

  const handleAddState = (type: StateType) => {
    const nameMap: Record<StateType, string> = {
      normal: '新状态',
      start: '[*]',
      end: '[*]',
      choice: 'check',
      fork: 'fork_state',
      join: 'join_state',
      composite: '复合状态',
    };
    addState(type, nameMap[type], { x: 300, y: 200 });
  };

  const handleAddComposite = () => {
    addState('composite', '复合状态', { x: 300, y: 200 });
  };

  return (
    <div className="flex flex-col gap-1 p-2 bg-vscode-sidebar-bg border-r border-vscode-border">
      <div className="text-xs text-vscode-text-secondary mb-1">状态</div>
      {stateButtons.map((btn) => (
        <button
          key={btn.type}
          onClick={() => handleAddState(btn.type)}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-vscode-text-hover-bg text-vscode-text-secondary hover:text-vscode-text-primary text-xs"
          title={btn.label}
        >
          {btn.icon}
          <span>{btn.label}</span>
        </button>
      ))}

      <div className="border-t border-vscode-border my-1"></div>

      <div className="text-xs text-vscode-text-secondary mb-1">容器</div>
      <button
        onClick={handleAddComposite}
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-vscode-text-hover-bg text-vscode-text-secondary hover:text-vscode-text-primary text-xs"
        title="复合状态"
      >
        <Layers className="w-4 h-4" />
        <span>复合状态</span>
      </button>
    </div>
  );
};
