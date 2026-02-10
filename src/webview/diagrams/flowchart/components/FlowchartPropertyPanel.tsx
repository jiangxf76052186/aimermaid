import React from 'react';
import { Trash2 } from 'lucide-react';
import { useFlowchartStore } from '../store';
import { NodeShape, EdgeType } from '@shared/types/flowchart';

const nodeShapes: { value: NodeShape; label: string }[] = [
  { value: 'rect', label: 'Rectangle []' },
  { value: 'rounded', label: 'Rounded ()' },
  { value: 'diamond', label: 'Decision {}' },
  { value: 'circle', label: 'Circle (())' },
  { value: 'cylinder', label: 'Database [()]' },
  { value: 'subprocess', label: 'Subprocess [[]]' },
  { value: 'parallelogram', label: 'Input/Output [/]' },
  { value: 'hexagon', label: 'Hexagon {{}}' },
];

const edgeTypes: { value: EdgeType; label: string }[] = [
  { value: 'arrow', label: 'Arrow (-->)' },
  { value: 'open', label: 'Line (---)' },
  { value: 'dotted-arrow', label: 'Dotted Arrow (-.->)' },
  { value: 'dotted-open', label: 'Dotted Line (-.-)' },
  { value: 'thick-arrow', label: 'Thick Arrow (==>)' },
  { value: 'thick-open', label: 'Thick Line (===)' },
];

const FlowchartPropertyPanel: React.FC = () => {
  const {
    selectedNodeId,
    selectedEdgeId,
    diagram,
    updateNode,
    removeNode,
    updateEdge,
    removeEdge,
  } = useFlowchartStore();

  const selectedNode = selectedNodeId
    ? diagram.nodes.find((n) => n.id === selectedNodeId)
    : null;

  const selectedEdge = selectedEdgeId
    ? diagram.edges.find((e) => e.id === selectedEdgeId)
    : null;

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="w-64 bg-vscode-input-bg border-l border-vscode-border p-4">
        <div className="text-sm text-gray-400">选择元素以编辑属性</div>
      </div>
    );
  }

  if (selectedNode) {
    return (
      <div className="w-64 bg-vscode-input-bg border-l border-vscode-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">节点属性</h3>
          <button
            onClick={() => removeNode(selectedNode.id)}
            className="p-1 text-red-400 hover:bg-red-400/20 rounded"
            title="删除节点"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">文本内容</label>
            <textarea
              value={selectedNode.text}
              onChange={(e) => updateNode(selectedNode.id, { text: e.target.value })}
              rows={2}
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">形状</label>
            <select
              value={selectedNode.shape}
              onChange={(e) => updateNode(selectedNode.id, { shape: e.target.value as NodeShape })}
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
            >
              {nodeShapes.map((shape) => (
                <option key={shape.value} value={shape.value}>
                  {shape.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">位置 (x, y)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={Math.round(selectedNode.position.x)}
                onChange={(e) => updateNode(selectedNode.id, { position: { ...selectedNode.position, x: Number(e.target.value) } })}
                className="w-1/2 px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
                placeholder="X"
              />
              <input
                type="number"
                value={Math.round(selectedNode.position.y)}
                onChange={(e) => updateNode(selectedNode.id, { position: { ...selectedNode.position, y: Number(e.target.value) } })}
                className="w-1/2 px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
                placeholder="Y"
              />
            </div>
          </div>

          {(selectedNode.width !== undefined || selectedNode.height !== undefined) && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">尺寸 (w, h)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={selectedNode.width || 0}
                  onChange={(e) => updateNode(selectedNode.id, { width: Number(e.target.value) })}
                  className="w-1/2 px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
                  placeholder="W"
                />
                <input
                  type="number"
                  value={selectedNode.height || 0}
                  onChange={(e) => updateNode(selectedNode.id, { height: Number(e.target.value) })}
                  className="w-1/2 px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
                  placeholder="H"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    const fromNode = diagram.nodes.find(n => n.id === selectedEdge.from);
    const toNode = diagram.nodes.find(n => n.id === selectedEdge.to);

    return (
      <div className="w-64 bg-vscode-input-bg border-l border-vscode-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">连线属性</h3>
          <button
            onClick={() => removeEdge(selectedEdge.id)}
            className="p-1 text-red-400 hover:bg-red-400/20 rounded"
            title="删除连线"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">连线文本</label>
            <input
              type="text"
              value={selectedEdge.text || ''}
              onChange={(e) => updateEdge(selectedEdge.id, { text: e.target.value })}
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">连线类型</label>
            <select
              value={selectedEdge.type}
              onChange={(e) => updateEdge(selectedEdge.id, { type: e.target.value as EdgeType })}
              className="w-full px-2 py-1 text-sm bg-vscode-bg border border-vscode-border rounded"
            >
              {edgeTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t border-vscode-border">
            <div className="mb-1">
              <span className="text-gray-400">From:</span> {fromNode?.text || selectedEdge.from}
            </div>
            <div>
              <span className="text-gray-400">To:</span> {toNode?.text || selectedEdge.to}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FlowchartPropertyPanel;
