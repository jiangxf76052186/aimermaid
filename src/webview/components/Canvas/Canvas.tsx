import React, { useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  SelectionMode,
  OnSelectionChangeParams,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useDiagramStore } from '../../stores/diagramStore';
import { ParticipantNode, TimelineNode, NoteNode, BlockNode } from '../../nodes';
import { MessageEdge } from '../../edges';
import { BlockType } from '@shared/types';
import { ContextMenu } from '../ContextMenu';

const nodeTypes = {
  participant: ParticipantNode,
  timeline: TimelineNode,
  note: NoteNode,
  block: BlockNode,
};

const edgeTypes = {
  message: MessageEdge,
};

const blockTypeOptions: { value: BlockType; label: string; color: string }[] = [
  { value: 'loop', label: '循环', color: '#3b82f6' },
  { value: 'alt', label: '条件', color: '#22c55e' },
  { value: 'opt', label: '可选', color: '#a855f7' },
  { value: 'par', label: '并行', color: '#f97316' },
  { value: 'critical', label: '关键', color: '#ef4444' },
  { value: 'break', label: '中断', color: '#6b7280' },
];

const Canvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStop,
    setSelectedNode,
    setSelectedEdge,
    setSelectedEdges,
    selectedEdgeIds,
    addBlock,
    clearEdgeSelection,
  } = useDiagramStore();

  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string; nodeType: string } | null>(null);

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const width = (typeof node.style?.width === 'number' ? node.style.width : node.measured?.width) || 200;
      const height = (typeof node.style?.height === 'number' ? node.style.height : node.measured?.height) || 100;
      onNodeDragStop(node.id, node.position.x, node.position.y, width, height);
    },
    [onNodeDragStop]
  );

  const handleSelectionChange = useCallback(
    ({ edges: selectedEdges }: OnSelectionChangeParams) => {
      const edgeIds = selectedEdges.map((e) => e.id);
      setSelectedEdges(edgeIds);
      
      if (edgeIds.length >= 1) {
        setShowBlockMenu(true);
        setMenuPosition({ x: 20, y: 20 });
      } else {
        setShowBlockMenu(false);
      }
    },
    [setSelectedEdges]
  );

  const handleCreateBlock = useCallback(
    (type: BlockType) => {
      if (selectedEdgeIds.length > 0) {
        addBlock(type, 'condition', selectedEdgeIds);
        clearEdgeSelection();
        setShowBlockMenu(false);
      }
    },
    [selectedEdgeIds, addBlock, clearEdgeSelection]
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (node.type === 'timeline') return;
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeType: node.type || 'unknown',
      });
    },
    []
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'message',
    }),
    []
  );

  return (
    <div className="flex-1 h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeClick={(_, edge) => setSelectedEdge(edge.id)}
        onPaneClick={() => {
          setSelectedNode(null);
          setSelectedEdge(null);
          clearEdgeSelection();
          setShowBlockMenu(false);
          setContextMenu(null);
        }}
        onSelectionChange={handleSelectionChange}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag
        selectNodesOnDrag={false}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="bg-vscode-bg"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#444" />
        <Controls className="!bg-vscode-input-bg !border-vscode-border" />
        <MiniMap
          className="!bg-vscode-input-bg !border-vscode-border"
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.5)"
          pannable
          zoomable
        />
      </ReactFlow>

      {showBlockMenu && selectedEdgeIds.length > 0 && (
        <div
          className="absolute bg-vscode-input-bg border border-vscode-border rounded-lg shadow-lg p-3 z-50"
          style={{ top: menuPosition.y, right: menuPosition.x }}
        >
          <div className="text-xs text-gray-400 mb-2">
            已选 {selectedEdgeIds.length} 条消息 - 创建块
          </div>
          <div className="flex flex-wrap gap-1">
            {blockTypeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleCreateBlock(opt.value)}
                className="px-2 py-1 text-xs rounded border border-vscode-border hover:opacity-80 transition-opacity"
                style={{ backgroundColor: opt.color }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              clearEdgeSelection();
              setShowBlockMenu(false);
            }}
            className="mt-2 w-full text-xs text-gray-400 hover:text-gray-300"
          >
            取消
          </button>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodeType={contextMenu.nodeType}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default Canvas;
