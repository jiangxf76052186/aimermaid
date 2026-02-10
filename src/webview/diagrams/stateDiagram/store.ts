import { create } from 'zustand';
import {
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
} from '@xyflow/react';
import type {
  StateDiagram,
  State,
  StateType,
  Transition,
  StateNote,
  NotePosition,
} from '@shared/types/stateDiagram';
import { parseStateDiagram } from './utils/state-parser';
import { generateStateDiagram } from './utils/state-generator';

export interface StateStoreState {
  diagram: StateDiagram;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedEdgeIds: string[];
  theme: 'light' | 'dark';
  history: StateDiagram[];
  historyIndex: number;
}

export interface StateStoreActions {
  loadFromMermaid: (code: string) => void;
  toMermaid: () => string;
  setTheme: (theme: 'light' | 'dark') => void;

  addState: (type: StateType, name: string, position: { x: number; y: number }) => void;
  updateState: (id: string, updates: Partial<State>) => void;
  removeState: (id: string) => void;

  addTransition: (from: string, to: string, label?: string) => void;
  updateTransition: (id: string, updates: Partial<Transition>) => void;
  removeTransition: (id: string) => void;

  addNote: (stateId: string, text: string, position: NotePosition) => void;
  updateNote: (id: string, updates: Partial<StateNote>) => void;
  removeNote: (id: string) => void;

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

function diagramToNodes(diagram: StateDiagram): Node[] {
  const nodes: Node[] = [];

  for (const state of diagram.states) {
    let type: string;
    let data: Record<string, unknown>;

    switch (state.type) {
      case 'start':
      case 'end':
        type = 'startEnd';
        data = { stateType: state.type } as unknown as Record<string, unknown>;
        break;
      case 'choice':
        type = 'choice';
        data = { name: state.name, stateType: 'choice' } as unknown as Record<string, unknown>;
        break;
      case 'fork':
      case 'join':
        type = 'forkJoin';
        data = { name: state.name, stateType: state.type } as unknown as Record<string, unknown>;
        break;
      case 'composite':
        type = 'composite';
        data = {
          name: state.name,
          description: state.description,
          stateType: 'composite',
        } as unknown as Record<string, unknown>;
        break;
      default:
        type = 'stateNode';
        data = {
          name: state.name,
          description: state.description,
          stateType: 'normal',
        } as unknown as Record<string, unknown>;
        break;
    }

    nodes.push({
      id: state.id,
      type,
      position: state.position,
      data,
      style: {
        width: state.width,
        height: state.height,
      },
      parentId: state.parentId,
      draggable: true,
    });
  }

  for (const note of diagram.notes) {
    const associatedState = diagram.states.find((s) => s.id === note.stateId);
    const offsetX = note.position === 'right' ? 200 : -200;
    const basePosition = associatedState?.position || { x: 0, y: 0 };

    nodes.push({
      id: note.id,
      type: 'stateNote',
      position: {
        x: basePosition.x + offsetX,
        y: basePosition.y,
      },
      data: {
        text: note.text,
        position: note.position,
        stateId: note.stateId,
      } as unknown as Record<string, unknown>,
      draggable: true,
    });
  }

  return nodes;
}

function diagramToEdges(diagram: StateDiagram): Edge[] {
  return diagram.transitions.map((transition) => ({
    id: transition.id,
    source: transition.from,
    target: transition.to,
    type: 'transition',
    data: {
      label: transition.label,
    } as unknown as Record<string, unknown>,
  }));
}

export const useStateStore = create<StateStoreState & StateStoreActions>((set, get) => ({
  diagram: {
    type: 'state',
    states: [],
    transitions: [],
    notes: [],
    direction: 'TB',
    classDefs: [],
    classAssignments: [],
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
    const diagram = parseStateDiagram(code);
    set({
      diagram,
      nodes: diagramToNodes(diagram),
      edges: diagramToEdges(diagram),
      history: [diagram],
      historyIndex: 0,
    });
  },

  toMermaid: () => {
    return generateStateDiagram(get().diagram);
  },

  setTheme: (theme) => set({ theme }),

  addState: (type, name, position) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newState: State = {
      id: `state_${Date.now()}`,
      name,
      description: name,
      type,
      order: diagram.states.length,
      position,
    };

    const newDiagram = {
      ...diagram,
      states: [...diagram.states, newState],
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
    });
  },

  updateState: (id, updates) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newDiagram = {
      ...diagram,
      states: diagram.states.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  removeState: (id) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newDiagram = {
      ...diagram,
      states: diagram.states.filter((s) => s.id !== id),
      transitions: diagram.transitions.filter((t) => t.from !== id && t.to !== id),
      notes: diagram.notes.filter((n) => n.stateId !== id),
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  addTransition: (from, to, label) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newTransition: Transition = {
      id: `tr_${Date.now()}`,
      from,
      to,
      label,
      order: diagram.transitions.length,
    };

    const newDiagram = {
      ...diagram,
      transitions: [...diagram.transitions, newTransition],
    };

    set({
      diagram: newDiagram,
      edges: diagramToEdges(newDiagram),
    });
  },

  updateTransition: (id, updates) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newDiagram = {
      ...diagram,
      transitions: diagram.transitions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    };

    set({
      diagram: newDiagram,
      edges: diagramToEdges(newDiagram),
    });
  },

  removeTransition: (id) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newDiagram = {
      ...diagram,
      transitions: diagram.transitions.filter((t) => t.id !== id),
    };

    set({
      diagram: newDiagram,
      edges: diagramToEdges(newDiagram),
    });
  },

  addNote: (stateId, text, position) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newNote: StateNote = {
      id: `note_${Date.now()}`,
      text,
      position,
      stateId,
      order: diagram.notes.length,
    };

    const newDiagram = {
      ...diagram,
      notes: [...diagram.notes, newNote],
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
    });
  },

  updateNote: (id, updates) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newDiagram = {
      ...diagram,
      notes: diagram.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
    });
  },

  removeNote: (id) => {
    const { diagram, pushHistory } = get();
    pushHistory();

    const newDiagram = {
      ...diagram,
      notes: diagram.notes.filter((n) => n.id !== id),
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

    changes.forEach((change) => {
      if (change.type === 'position' && change.position) {
        const stateIndex = newDiagram.states.findIndex((s) => s.id === change.id);
        if (stateIndex !== -1) {
          const updatedNode = newNodes.find((n) => n.id === change.id);
          if (updatedNode) {
            newDiagram = {
              ...newDiagram,
              states: newDiagram.states.map((s, idx) =>
                idx === stateIndex ? { ...s, position: updatedNode.position } : s
              ),
            };
            diagramUpdated = true;
          }
        }
      }

      if (change.type === 'dimensions' && change.dimensions) {
        const stateIndex = newDiagram.states.findIndex((s) => s.id === change.id);
        if (stateIndex !== -1) {
          newDiagram = {
            ...newDiagram,
            states: newDiagram.states.map((s, idx) =>
              idx === stateIndex
                ? {
                    ...s,
                    width: change.dimensions?.width,
                    height: change.dimensions?.height,
                  }
                : s
            ),
          };
          diagramUpdated = true;
        }
      }
    });

    set({
      nodes: newNodes,
      diagram: diagramUpdated ? newDiagram : diagram,
    });
  },

  onEdgesChange: (changes) => {
    const { edges } = get();
    set({ edges: applyEdgeChanges(changes, edges) });
  },

  onConnect: (connection) => {
    if (connection.source && connection.target) {
      get().addTransition(connection.source, connection.target);
    }
  },

  onNodeDragStop: () => {
    get().pushHistory();
  },

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),

  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  setSelectedEdges: (ids) => set({ selectedEdgeIds: ids }),

  deleteSelected: () => {
    const { selectedNodeId, selectedEdgeId, removeState, removeTransition } = get();
    if (selectedNodeId) {
      removeState(selectedNodeId);
      set({ selectedNodeId: null });
    }
    if (selectedEdgeId) {
      removeTransition(selectedEdgeId);
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
