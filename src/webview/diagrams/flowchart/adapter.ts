import type { Node, Edge } from '@xyflow/react';
import type { DiagramAdapter } from '@shared/types/diagram';
import type { FlowchartDiagram } from '@shared/types/flowchart';
import ShapeNode from './nodes/ShapeNode';
import FlowEdge from './edges/FlowEdge';
import { parseFlowchart } from './utils/parser';
import { generateFlowchart } from './utils/generator';

const FlowchartToolbar: React.FC = () => {
  return null;
};

const FlowchartPropertyPanel: React.FC = () => {
  return null;
};

function stateToNodes(diagram: FlowchartDiagram): Node[] {
  return diagram.nodes.map((node) => ({
    id: node.id,
    type: 'shape',
    position: node.position,
    data: {
      label: node.text,
      shape: node.shape,
      classes: node.classes,
      styles: node.styles,
      icon: node.icon,
    },
    style: {
      width: node.width ?? 120,
      height: node.height ?? 60,
    },
    draggable: true,
  }));
}

function stateToEdges(diagram: FlowchartDiagram): Edge[] {
  return diagram.edges.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    type: 'flow',
    data: {
      text: edge.text,
      edgeType: edge.type,
      length: edge.length,
    },
    animated: edge.type.includes('dotted'),
  }));
}

export const FlowchartAdapter: DiagramAdapter<FlowchartDiagram> = {
  type: 'flowchart',
  name: '流程图',

  parse: parseFlowchart,
  generate: generateFlowchart,

  detect: (code: string) => {
    const firstLine = code.trim().split('\n')[0].toLowerCase().trim();
    return firstLine.startsWith('flowchart');
  },

  nodeTypes: {
    shape: ShapeNode,
  },

  edgeTypes: {
    flow: FlowEdge,
  },

  Toolbar: FlowchartToolbar,
  PropertyPanel: FlowchartPropertyPanel,

  stateToNodes,
  stateToEdges,

  createInitialState: () => ({
    type: 'flowchart',
    direction: 'TB',
    nodes: [],
    edges: [],
    subgraphs: [],
    classDefs: [],
  }),
};
