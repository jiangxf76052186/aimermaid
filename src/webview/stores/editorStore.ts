import { create } from 'zustand';
import type { DiagramType } from '@shared/types';

export interface EditorState {
  activeDiagramType: DiagramType;
  theme: 'light' | 'dark';
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedEdgeIds: string[];
}

export interface EditorActions {
  setActiveDiagramType: (type: DiagramType) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  setSelectedEdges: (ids: string[]) => void;
  clearEdgeSelection: () => void;
  clearSelection: () => void;
}

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  activeDiagramType: 'sequence',
  theme: 'dark',
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedEdgeIds: [],

  setActiveDiagramType: (type) => set({ activeDiagramType: type }),
  setTheme: (theme) => set({ theme }),
  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setSelectedEdges: (ids) => set({ selectedEdgeIds: ids }),
  clearEdgeSelection: () => set({ selectedEdgeIds: [] }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null, selectedEdgeIds: [] }),
}));
