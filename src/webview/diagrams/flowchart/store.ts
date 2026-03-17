import { create } from 'zustand';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import { 
  FlowchartDiagram, 
  FlowNode, 
  FlowEdge, 
  NodeShape, 
  EdgeType,
  Subgraph
} from '@shared/types/flowchart';
import { parseFlowchart } from './utils/parser';
import { generateFlowchart } from './utils/generator';

export interface FlowchartState {
  diagram: FlowchartDiagram;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedEdgeIds: string[];
  theme: 'light' | 'dark';
  history: FlowchartDiagram[];
  historyIndex: number;
}

export interface FlowchartActions {
  loadFromMermaid: (code: string) => void;
  toMermaid: () => string;
  setTheme: (theme: 'light' | 'dark') => void;

  addNode: (shape: NodeShape, text: string, position: { x: number; y: number }) => void;
  updateNode: (id: string, updates: Partial<FlowNode>) => void;
  removeNode: (id: string) => void;

  addEdge: (from: string, to: string, type?: EdgeType, text?: string, sourceHandle?: string, targetHandle?: string) => void;
  updateEdge: (id: string, updates: Partial<FlowEdge>) => void;
  removeEdge: (id: string) => void;

  addSubgraph: (title: string) => void;
  updateSubgraph: (id: string, updates: Partial<Subgraph>) => void;
  removeSubgraph: (id: string) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: (nodeId: string, x: number, y: number) => void;

  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  setSelectedEdges: (ids: string[]) => void;
  deleteSelected: () => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

const DEFAULT_NODE_WIDTH = 120;
const DEFAULT_NODE_HEIGHT = 60;

function diagramToNodes(diagram: FlowchartDiagram): Node[] {
  return diagram.nodes.map(node => ({
    id: node.id,
    type: 'shape',
    position: node.position,
    data: {
      label: node.text,
      shape: node.shape,
      classes: node.classes,
      styles: node.styles,
      icon: node.icon,
    } as unknown as Record<string, unknown>,
    style: {
      width: node.width ?? DEFAULT_NODE_WIDTH,
      height: node.height ?? DEFAULT_NODE_HEIGHT,
    },
    draggable: true,
  }));
}

function computeHandles(
  sourceNode: FlowNode | undefined,
  targetNode: FlowNode | undefined,
): { sourceHandle: string; targetHandle: string } {
  if (!sourceNode || !targetNode) {
    return { sourceHandle: 'source-bottom', targetHandle: 'target-top' };
  }
  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { sourceHandle: 'source-right', targetHandle: 'target-left' }
      : { sourceHandle: 'source-left', targetHandle: 'target-right' };
  }
  return dy > 0
    ? { sourceHandle: 'source-bottom', targetHandle: 'target-top' }
    : { sourceHandle: 'source-top', targetHandle: 'target-bottom' };
}

function diagramToEdges(diagram: FlowchartDiagram): Edge[] {
  const nodeMap = new Map(diagram.nodes.map(n => [n.id, n]));
  return diagram.edges.map(edge => {
    const sourceHandle = edge.sourceHandle ?? computeHandles(nodeMap.get(edge.from), nodeMap.get(edge.to)).sourceHandle;
    const targetHandle = edge.targetHandle ?? computeHandles(nodeMap.get(edge.from), nodeMap.get(edge.to)).targetHandle;
    return {
      id: edge.id,
      source: edge.from,
      target: edge.to,
      sourceHandle,
      targetHandle,
      type: 'flow',
      data: {
        text: edge.text,
        edgeType: edge.type,
        length: edge.length,
      } as unknown as Record<string, unknown>,
      animated: edge.type.includes('dotted'),
    };
  });
}

export const useFlowchartStore = create<FlowchartState & FlowchartActions>((set, get) => ({
  diagram: {
    type: 'flowchart',
    keyword: 'flowchart',
    direction: 'TB',
    nodes: [],
    edges: [],
    subgraphs: [],
    classDefs: [],
  },
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedEdgeIds: [],
  theme: 'dark',
  history: [],
  historyIndex: -1,

  loadFromMermaid: (code: string) => {
    console.log('[AIMermaid] Loading flowchart mermaid code');
    const diagram = parseFlowchart(code);
    
    set({
      diagram,
      nodes: diagramToNodes(diagram),
      edges: diagramToEdges(diagram),
      history: [diagram],
      historyIndex: 0,
    });
  },

  toMermaid: () => {
    return generateFlowchart(get().diagram);
  },

  setTheme: (theme) => set({ theme }),

  addNode: (shape, text, position) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      text,
      shape,
      position,
    };

    const newDiagram = {
      ...diagram,
      nodes: [...diagram.nodes, newNode],
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
    });
  },

  updateNode: (id, updates) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newDiagram = {
      ...diagram,
      nodes: diagram.nodes.map(n => 
        n.id === id ? { ...n, ...updates } : n
      ),
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  removeNode: (id) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newDiagram = {
      ...diagram,
      nodes: diagram.nodes.filter(n => n.id !== id),
      edges: diagram.edges.filter(e => e.from !== id && e.to !== id),
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  addEdge: (from, to, type = 'arrow', text, sourceHandle, targetHandle) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newEdge: FlowEdge = {
      id: `edge_${Date.now()}`,
      from,
      to,
      type,
      text,
      sourceHandle,
      targetHandle,
    };

    const newDiagram = {
      ...diagram,
      edges: [...diagram.edges, newEdge],
    };

    set({
      diagram: newDiagram,
      edges: diagramToEdges(newDiagram),
    });
  },

  updateEdge: (id, updates) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newDiagram = {
      ...diagram,
      edges: diagram.edges.map(e => 
        e.id === id ? { ...e, ...updates } : e
      ),
    };

    set({
      diagram: newDiagram,
      edges: diagramToEdges(newDiagram),
    });
  },

  removeEdge: (id) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newDiagram = {
      ...diagram,
      edges: diagram.edges.filter(e => e.id !== id),
    };

    set({
      diagram: newDiagram,
      edges: diagramToEdges(newDiagram),
    });
  },

  addSubgraph: (title) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newSubgraph: Subgraph = {
      id: `subgraph_${Date.now()}`,
      title,
      nodeIds: [],
    };

    const newDiagram = {
      ...diagram,
      subgraphs: [...diagram.subgraphs, newSubgraph],
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
    });
  },

  updateSubgraph: (id, updates) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newDiagram = {
      ...diagram,
      subgraphs: diagram.subgraphs.map(s => 
        s.id === id ? { ...s, ...updates } : s
      ),
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
    });
  },

  removeSubgraph: (id) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newDiagram = {
      ...diagram,
      subgraphs: diagram.subgraphs.filter(s => s.id !== id),
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
    });
  },

  onNodesChange: (changes) => {
    const { nodes, diagram } = get();
    const newNodes = applyNodeChanges(changes, nodes);
    
    let diagramUpdated = false;
    let newDiagram = diagram;

    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        const nodeIndex = newDiagram.nodes.findIndex(n => n.id === change.id);
        if (nodeIndex !== -1) {
          const updatedNode = newNodes.find(n => n.id === change.id);
          if (updatedNode) {
            newDiagram = {
              ...newDiagram,
              nodes: newDiagram.nodes.map((n, idx) => 
                idx === nodeIndex ? { ...n, position: updatedNode.position } : n
              ),
            };
            diagramUpdated = true;
          }
        }
      }
      
      if (change.type === 'dimensions' && change.dimensions) {
         const nodeIndex = newDiagram.nodes.findIndex(n => n.id === change.id);
         if (nodeIndex !== -1) {
           newDiagram = {
             ...newDiagram,
             nodes: newDiagram.nodes.map((n, idx) => 
               idx === nodeIndex ? { 
                 ...n, 
                 width: change.dimensions?.width, 
                 height: change.dimensions?.height 
               } : n
             ),
           };
           diagramUpdated = true;
         }
      }
    });

    set({ 
      nodes: newNodes, 
      diagram: diagramUpdated ? newDiagram : diagram 
    });
  },

  onEdgesChange: (changes) => {
    const { edges } = get();
    set({ edges: applyEdgeChanges(changes, edges) });
  },

  onConnect: (connection) => {
    if (connection.source && connection.target) {
      get().addEdge(
        connection.source,
        connection.target,
        'arrow',
        undefined,
        connection.sourceHandle ?? undefined,
        connection.targetHandle ?? undefined,
      );
    }
  },

  onNodeDragStop: (_nodeId, _x, _y) => {
    get().pushHistory();
  },

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  
  setSelectedEdges: (ids) => set({ selectedEdgeIds: ids }),
  
  deleteSelected: () => {
    const { selectedNodeId, selectedEdgeId, removeNode, removeEdge } = get();
    if (selectedNodeId) {
      removeNode(selectedNodeId);
      set({ selectedNodeId: null });
    }
    if (selectedEdgeId) {
      removeEdge(selectedEdgeId);
      set({ selectedEdgeId: null });
    }
  },

  pushHistory: () => {
    const { diagram, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(diagram)));
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const diagram = history[newIndex];
      set({
        diagram,
        nodes: diagramToNodes(diagram),
        edges: diagramToEdges(diagram),
        historyIndex: newIndex,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const diagram = history[newIndex];
      set({
        diagram,
        nodes: diagramToNodes(diagram),
        edges: diagramToEdges(diagram),
        historyIndex: newIndex,
      });
    }
  },
}));
