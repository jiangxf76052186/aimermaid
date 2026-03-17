import type { Node, Edge } from '@xyflow/react';
import type { DiagramAdapter } from '@shared/types/diagram';
import type { FlowchartDiagram } from '@shared/types/flowchart';
import ShapeNode from './nodes/ShapeNode';
import SubgraphNode from './nodes/SubgraphNode';
import FlowEdge from './edges/FlowEdge';
import { parseFlowchart } from './utils/parser';
import { generateFlowchart } from './utils/generator';
import { FlowchartToolbar } from './components/FlowchartToolbar';
import FlowchartPropertyPanel from './components/FlowchartPropertyPanel';

function stateToNodes(diagram: FlowchartDiagram): Node[] {
  const nodes: Node[] = [];

  const nodeMap = new Map(diagram.nodes.map(n => [n.id, n]));

  diagram.nodes.forEach((node) => {
    nodes.push({
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
    });
  });

  diagram.subgraphs.forEach((subgraph) => {
    const nodeIds = subgraph.nodeIds || [];
    nodes.push({
      id: subgraph.id,
      type: 'subgraph',
      position: subgraph.position || { x: 50, y: 50 },
      data: {
        label: subgraph.title,
        direction: subgraph.direction,
      },
      style: {
        width: subgraph.width ?? 300,
        height: subgraph.height ?? 200,
      },
      draggable: true,
    });

    nodeIds.forEach((nodeId) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        nodes.push({
          id: node.id,
          type: 'shape',
          position: node.position,
          parentId: subgraph.id,
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
        });
      }
    });
  });

  return nodes;
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
    return firstLine.startsWith('flowchart') || firstLine.startsWith('graph');
  },

  nodeTypes: {
    shape: ShapeNode,
    subgraph: SubgraphNode,
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
    keyword: 'flowchart' as const,
    direction: 'TB',
    nodes: [],
    edges: [],
    subgraphs: [],
    classDefs: [],
  }),
};
