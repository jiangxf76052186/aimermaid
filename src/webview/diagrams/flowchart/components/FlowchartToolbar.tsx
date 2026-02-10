import React from 'react';
import { Square, Circle, Database, Braces, Layers } from 'lucide-react';
import { useFlowchartStore } from '../store';
import type { NodeShape } from '@shared/types/flowchart';

const shapeButtons: { shape: NodeShape; icon: React.ReactNode; label: string }[] = [
  { shape: 'rect', icon: <Square className="w-4 h-4" />, label: '矩形' },
  { shape: 'rounded', icon: <Square className="w-4 h-4 rounded" />, label: '圆角' },
  { shape: 'diamond', icon: <Square className="w-4 h-4 rotate-45" />, label: '菱形' },
  { shape: 'circle', icon: <Circle className="w-4 h-4" />, label: '圆形' },
  { shape: 'cylinder', icon: <Database className="w-4 h-4" />, label: '数据库' },
  { shape: 'subprocess', icon: <Braces className="w-4 h-4" />, label: '子程序' },
];

export const FlowchartToolbar: React.FC = () => {
  const addNode = useFlowchartStore((s) => s.addNode);
  const addSubgraph = useFlowchartStore((s) => s.addSubgraph);

  const handleAddShape = (shape: NodeShape) => {
    addNode(shape, '新节点', { x: 300, y: 200 });
  };

  const handleAddSubgraph = () => {
    addSubgraph('新分组');
  };

  return (
    <div className="flex flex-col gap-1 p-2 bg-vscode-sidebar-bg border-r border-vscode-border">
      <div className="text-xs text-vscode-text-secondary mb-1">形状</div>
      {shapeButtons.map((btn) => (
        <button
          key={btn.shape}
          onClick={() => handleAddShape(btn.shape)}
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
        onClick={handleAddSubgraph}
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-vscode-text-hover-bg text-vscode-text-secondary hover:text-vscode-text-primary text-xs"
        title="分组/泳道"
      >
        <Layers className="w-4 h-4" />
        <span>分组</span>
      </button>
    </div>
  );
};