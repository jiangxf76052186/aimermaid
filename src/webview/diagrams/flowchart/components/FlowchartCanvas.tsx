import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ShapeNode from '../nodes/ShapeNode';
import SubgraphNode from '../nodes/SubgraphNode';
import FlowEdge from '../edges/FlowEdge';
import { useFlowchartStore } from '../store';

const nodeTypes = {
  shape: ShapeNode,
  subgraph: SubgraphNode,
};

const edgeTypes = {
  flow: FlowEdge,
};

export const FlowchartCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStop,
    setSelectedNode,
    setSelectedEdge,
  } = useFlowchartStore();

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const x = node.position.x;
      const y = node.position.y;
      onNodeDragStop(node.id, x, y);
    },
    [onNodeDragStop]
  );

  return (
    <div className="flex-1 bg-vscode-editor-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onEdgeClick={(_, edge) => setSelectedEdge(edge.id)}
        onPaneClick={() => {
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.25}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap nodeColor="#3b82f6" />
      </ReactFlow>
    </div>
  );
};