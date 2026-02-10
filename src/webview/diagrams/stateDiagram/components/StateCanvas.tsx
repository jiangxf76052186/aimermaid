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
import StateNode from '../nodes/StateNode';
import StartEndNode from '../nodes/StartEndNode';
import ChoiceNode from '../nodes/ChoiceNode';
import ForkJoinNode from '../nodes/ForkJoinNode';
import CompositeStateNode from '../nodes/CompositeStateNode';
import StateNoteNode from '../nodes/StateNoteNode';
import TransitionEdge from '../edges/TransitionEdge';
import { useStateStore } from '../store';

const nodeTypes = {
  stateNode: StateNode,
  startEnd: StartEndNode,
  choice: ChoiceNode,
  forkJoin: ForkJoinNode,
  composite: CompositeStateNode,
  stateNote: StateNoteNode,
};

const edgeTypes = {
  transition: TransitionEdge,
};

export const StateCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeDragStop,
    setSelectedNode,
    setSelectedEdge,
  } = useStateStore();

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeDragStop(node.id, node.position.x, node.position.y);
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
