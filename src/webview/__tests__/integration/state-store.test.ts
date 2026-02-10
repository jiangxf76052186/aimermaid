import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStateStore } from '@/webview/diagrams/stateDiagram/store';

describe('State Diagram Store Integration Tests', () => {
  beforeEach(() => {
    const initialDiagram = {
      type: 'state' as const,
      states: [],
      transitions: [],
      notes: [],
      direction: 'TB' as const,
      classDefs: [],
      classAssignments: [],
    };
    useStateStore.setState({
      diagram: initialDiagram,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      selectedEdgeIds: [],
      theme: 'dark',
      history: [initialDiagram],
      historyIndex: 0,
    });
  });

  describe('loadFromMermaid', () => {
    it('should parse basic state diagram with transitions', () => {
      const code = `stateDiagram-v2
  [*] --> Active
  Active --> Inactive
  Inactive --> [*]`;

      useStateStore.getState().loadFromMermaid(code);
      const state = useStateStore.getState();

      expect(state.diagram.states).toHaveLength(4);
      expect(state.diagram.states.some((s) => s.type === 'start')).toBe(true);
      expect(state.diagram.states.some((s) => s.type === 'end')).toBe(true);
      expect(state.diagram.states.some((s) => s.name === 'Active')).toBe(true);
      expect(state.diagram.states.some((s) => s.name === 'Inactive')).toBe(true);

      expect(state.diagram.transitions).toHaveLength(3);

      expect(state.nodes).toHaveLength(4);
      const startNode = state.nodes.find((n) => n.type === 'startEnd');
      expect(startNode).toBeDefined();

      expect(state.edges).toHaveLength(3);
      expect(state.edges.every((e) => e.type === 'transition')).toBe(true);

      expect(state.history).toHaveLength(1);
      expect(state.historyIndex).toBe(0);
    });

    it('should preserve direction from mermaid code', () => {
      const code = `stateDiagram-v2
  direction LR
  [*] --> A
  A --> [*]`;

      useStateStore.getState().loadFromMermaid(code);
      const state = useStateStore.getState();

      expect(state.diagram.direction).toBe('LR');
    });
  });

  describe('addState', () => {
    it('should add a normal state and update nodes', () => {
      useStateStore.getState().addState('normal', 'StateA', { x: 100, y: 100 });

      const state = useStateStore.getState();
      expect(state.diagram.states).toHaveLength(1);
      expect(state.nodes).toHaveLength(1);

      const addedState = state.diagram.states[0];
      expect(addedState.name).toBe('StateA');
      expect(addedState.type).toBe('normal');
      expect(addedState.position).toEqual({ x: 100, y: 100 });

      const addedNode = state.nodes[0];
      expect(addedNode.type).toBe('stateNode');
      expect(addedNode.position).toEqual({ x: 100, y: 100 });
    });

    it('should generate unique state IDs', () => {
      const now = Date.now();
      const spy = vi.spyOn(Date, 'now');
      spy.mockReturnValueOnce(now);
      useStateStore.getState().addState('normal', 'A', { x: 0, y: 0 });
      const firstStateId = useStateStore.getState().diagram.states[0].id;

      spy.mockReturnValueOnce(now + 1);
      useStateStore.getState().addState('normal', 'B', { x: 100, y: 0 });
      const secondStateId = useStateStore.getState().diagram.states[1].id;

      expect(firstStateId).not.toEqual(secondStateId);
      spy.mockRestore();
    });

    it('should push history when adding state', () => {
      const beforeHistory = useStateStore.getState().history.length;

      useStateStore.getState().addState('normal', 'TestState', { x: 0, y: 0 });

      const afterHistory = useStateStore.getState().history.length;
      expect(afterHistory).toBe(beforeHistory + 1);
    });
  });

  describe('removeState', () => {
    it('should cascade delete associated notes', () => {
      useStateStore.getState().addState('normal', 'A', { x: 0, y: 0 });
      const stateA = useStateStore.getState().diagram.states[0];

      useStateStore.getState().addNote(stateA.id, 'Note for A', 'right');
      expect(useStateStore.getState().diagram.notes).toHaveLength(1);

      useStateStore.getState().removeState(stateA.id);

      const state = useStateStore.getState();
      expect(state.diagram.states).toHaveLength(0);
      expect(state.diagram.notes).toHaveLength(0);
    });
  });

  describe('addTransition', () => {
    it('should add transition between states', () => {
      useStateStore.getState().addState('normal', 'A', { x: 0, y: 0 });
      useStateStore.getState().addState('normal', 'B', { x: 100, y: 0 });

      const statesAfterAdd = useStateStore.getState().diagram.states;
      const stateA = statesAfterAdd[0];
      const stateB = statesAfterAdd[1];

      useStateStore.getState().addTransition(stateA.id, stateB.id, 'go');

      const state = useStateStore.getState();
      expect(state.diagram.transitions).toHaveLength(1);
      expect(state.edges).toHaveLength(1);

      const transition = state.diagram.transitions[0];
      expect(transition.from).toBe(stateA.id);
      expect(transition.to).toBe(stateB.id);
      expect(transition.label).toBe('go');

      const edge = state.edges[0];
      expect(edge.source).toBe(stateA.id);
      expect(edge.target).toBe(stateB.id);
      expect(edge.type).toBe('transition');
      expect(edge.data?.label).toBe('go');
    });

    it('should add transition without label', () => {
      useStateStore.getState().addState('normal', 'A', { x: 0, y: 0 });
      useStateStore.getState().addState('normal', 'B', { x: 100, y: 0 });

      const statesAfterAdd = useStateStore.getState().diagram.states;
      const stateA = statesAfterAdd[0];
      const stateB = statesAfterAdd[1];

      useStateStore.getState().addTransition(stateA.id, stateB.id);

      const state = useStateStore.getState();
      const transition = state.diagram.transitions[0];
      expect(transition.label).toBeUndefined();
    });

    it('should push history when adding transition', () => {
      useStateStore.getState().addState('normal', 'A', { x: 0, y: 0 });
      useStateStore.getState().addState('normal', 'B', { x: 100, y: 0 });

      const statesAfterAdd = useStateStore.getState().diagram.states;
      const stateA = statesAfterAdd[0];
      const stateB = statesAfterAdd[1];

      const beforeHistory = useStateStore.getState().history.length;

      useStateStore.getState().addTransition(stateA.id, stateB.id);

      const afterHistory = useStateStore.getState().history.length;
      expect(afterHistory).toBe(beforeHistory + 1);
    });
  });

  describe('addNote', () => {
    it('should add note to state with correct position offset', () => {
      useStateStore.getState().addState('normal', 'A', { x: 100, y: 200 });
      const stateA = useStateStore.getState().diagram.states[0];

      useStateStore.getState().addNote(stateA.id, 'Important', 'right');

      const state = useStateStore.getState();
      expect(state.diagram.notes).toHaveLength(1);

      const note = state.diagram.notes[0];
      expect(note.text).toBe('Important');
      expect(note.position).toBe('right');
      expect(note.stateId).toBe(stateA.id);

      const noteNode = state.nodes.find((n) => n.type === 'stateNote' && n.id === note.id);
      expect(noteNode).toBeDefined();
      expect(noteNode?.position.x).toBe(100 + 200);
      expect(noteNode?.position.y).toBe(200);
    });

    it('should add note with left position', () => {
      useStateStore.getState().addState('normal', 'A', { x: 100, y: 200 });
      const stateA = useStateStore.getState().diagram.states[0];

      useStateStore.getState().addNote(stateA.id, 'Note', 'left');

      const state = useStateStore.getState();
      const note = state.diagram.notes[0];
      const noteNode = state.nodes.find((n) => n.type === 'stateNote' && n.id === note.id);

      expect(noteNode?.position.x).toBe(100 - 200);
      expect(noteNode?.position.y).toBe(200);
    });

    it('should push history when adding note', () => {
      useStateStore.getState().addState('normal', 'A', { x: 0, y: 0 });
      const stateA = useStateStore.getState().diagram.states[0];

      const beforeHistory = useStateStore.getState().history.length;

      useStateStore.getState().addNote(stateA.id, 'Test', 'right');

      const afterHistory = useStateStore.getState().history.length;
      expect(afterHistory).toBe(beforeHistory + 1);
    });
  });

  describe('Undo/Redo', () => {
    it('should not undo before history start', () => {
      const beforeState = useStateStore.getState();
      useStateStore.getState().undo();
      const afterState = useStateStore.getState();

      expect(afterState.diagram).toEqual(beforeState.diagram);
    });

    it('should not redo after history end', () => {
      useStateStore.getState().addState('normal', 'A', { x: 0, y: 0 });
      const beforeState = useStateStore.getState();

      useStateStore.getState().redo();
      const afterState = useStateStore.getState();

      expect(afterState.diagram).toEqual(beforeState.diagram);
    });
  });

  describe('toMermaid', () => {
    it('should generate valid mermaid code from diagram', () => {
      useStateStore.getState().addState('normal', 'Active', { x: 0, y: 0 });
      useStateStore.getState().addState('normal', 'Inactive', { x: 100, y: 0 });

      const stateActive = useStateStore.getState().diagram.states[0];
      const stateInactive = useStateStore.getState().diagram.states[1];

      useStateStore.getState().addTransition(stateActive.id, stateInactive.id, 'disable');

      const mermaid = useStateStore.getState().toMermaid();

      expect(mermaid).toContain('stateDiagram-v2');
      expect(mermaid).toContain('Active');
      expect(mermaid).toContain('Inactive');
      expect(mermaid).toContain('disable');
    });

    it('should round-trip: parse -> toMermaid -> parse', () => {
      const originalCode = `stateDiagram-v2
  [*] --> Active
  Active --> Inactive
  Inactive --> [*]`;

      useStateStore.getState().loadFromMermaid(originalCode);
      const firstStates = useStateStore.getState().diagram.states.length;
      const firstTransitions = useStateStore.getState().diagram.transitions.length;

      const generatedMermaid = useStateStore.getState().toMermaid();

      const initialDiagram = {
        type: 'state' as const,
        states: [],
        transitions: [],
        notes: [],
        direction: 'TB' as const,
        classDefs: [],
        classAssignments: [],
      };
      useStateStore.setState({
        diagram: initialDiagram,
        nodes: [],
        edges: [],
        selectedNodeId: null,
        selectedEdgeId: null,
        selectedEdgeIds: [],
        theme: 'dark',
        history: [initialDiagram],
        historyIndex: 0,
      });

      useStateStore.getState().loadFromMermaid(generatedMermaid);
      const secondStates = useStateStore.getState().diagram.states.length;
      const secondTransitions = useStateStore.getState().diagram.transitions.length;

      expect(secondStates).toBe(firstStates);
      expect(secondTransitions).toBe(firstTransitions);
    });
  });

  describe('Complex workflows', () => {
    it('should handle multi-step workflow: add states, transitions, notes', () => {
      useStateStore.getState().addState('normal', 'Start', { x: 0, y: 0 });
      useStateStore.getState().addState('normal', 'Process', { x: 100, y: 0 });
      useStateStore.getState().addState('normal', 'End', { x: 200, y: 0 });

      const statesAfterAdd = useStateStore.getState().diagram.states;
      const states = statesAfterAdd;
      useStateStore.getState().addTransition(states[0].id, states[1].id);
      useStateStore.getState().addTransition(states[1].id, states[2].id);

      useStateStore.getState().addNote(states[1].id, 'Processing...', 'right');

      expect(useStateStore.getState().diagram.states.length).toBeGreaterThanOrEqual(3);
      expect(useStateStore.getState().diagram.transitions.length).toBeGreaterThanOrEqual(2);
      expect(useStateStore.getState().diagram.notes).toHaveLength(1);
    });
  });
});
