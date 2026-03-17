import { describe, it, expect, beforeEach } from 'vitest';
import { useFlowchartStore } from '@/webview/diagrams/flowchart/store';

describe('useFlowchartStore', () => {
  beforeEach(() => {
    useFlowchartStore.setState({
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
    });
  });

  describe('loadFromMermaid', () => {
    it('should parse simple flowchart with nodes and edges', () => {
      const mermaidCode = `flowchart TD
        A[Start]
        B[Process]
        C{Decision}
        A --> B
        B --> C`;

      const store = useFlowchartStore.getState();
      store.loadFromMermaid(mermaidCode);

      const state = useFlowchartStore.getState();
      expect(state.diagram.nodes).toHaveLength(3);
      expect(state.diagram.edges).toHaveLength(2);
      expect(state.nodes).toHaveLength(3);
      expect(state.edges).toHaveLength(2);
    });

    it('should set correct diagram direction from mermaid code', () => {
      const mermaidCode = `flowchart LR
        A[Start] --> B[End]`;

      const store = useFlowchartStore.getState();
      store.loadFromMermaid(mermaidCode);

      const state = useFlowchartStore.getState();
      expect(state.diagram.direction).toBe('LR');
    });

    it('should initialize history with parsed diagram', () => {
      const mermaidCode = `flowchart TD
        A[Start] --> B[Process]`;

      const store = useFlowchartStore.getState();
      store.loadFromMermaid(mermaidCode);

      const state = useFlowchartStore.getState();
      expect(state.history).toHaveLength(1);
      expect(state.historyIndex).toBe(0);
    });

    it('should parse different node shapes', () => {
      const mermaidCode = `flowchart TD
        A[Rectangle]
        B(Rounded)
        C{Diamond}
        D((Circle))`;

      const store = useFlowchartStore.getState();
      store.loadFromMermaid(mermaidCode);

      const state = useFlowchartStore.getState();
      expect(state.diagram.nodes).toHaveLength(4);
      expect(state.diagram.nodes[0].shape).toBe('rect');
      expect(state.diagram.nodes[1].shape).toBe('rounded');
      expect(state.diagram.nodes[2].shape).toBe('diamond');
      expect(state.diagram.nodes[3].shape).toBe('circle');
    });

    it('should parse edges with text labels', () => {
      const mermaidCode = `flowchart TD
        A[Start]
        B[End]
        A -->|Go| B`;

      const store = useFlowchartStore.getState();
      store.loadFromMermaid(mermaidCode);

      const state = useFlowchartStore.getState();
      expect(state.diagram.edges).toHaveLength(1);
      expect(state.diagram.edges[0].text).toBe('Go');
    });
  });

  describe('addNode', () => {
    it('should add a new node to diagram', () => {
      const store = useFlowchartStore.getState();
      const initialCount = store.diagram.nodes.length;

      store.addNode('rect', 'New Node', { x: 100, y: 100 });

      const state = useFlowchartStore.getState();
      expect(state.diagram.nodes).toHaveLength(initialCount + 1);
      expect(state.nodes).toHaveLength(initialCount + 1);
    });

    it('should create node with correct properties', () => {
      const store = useFlowchartStore.getState();
      store.addNode('circle', 'Test', { x: 50, y: 50 });

      const state = useFlowchartStore.getState();
      const newNode = state.diagram.nodes[0];
      expect(newNode.text).toBe('Test');
      expect(newNode.shape).toBe('circle');
      expect(newNode.position).toEqual({ x: 50, y: 50 });
    });

    it('should update history when adding node', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });

      const state = useFlowchartStore.getState();
      expect(state.history.length).toBeGreaterThan(0);
    });

    it('should map node to React Flow node with correct type', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });

      const state = useFlowchartStore.getState();
      const reactFlowNode = state.nodes[0];
      expect(reactFlowNode.type).toBe('shape');
      expect(reactFlowNode.data.label).toBe('Node1');
    });
  });

  describe('removeNode', () => {
    it('should cascade delete edges connected to removed node', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });
      store.addNode('rect', 'Node2', { x: 100, y: 100 });

      let state = useFlowchartStore.getState();
      const node1Id = state.diagram.nodes[0].id;
      const node2Id = state.diagram.nodes[1].id;

      store.addEdge(node1Id, node2Id);
      state = useFlowchartStore.getState();
      expect(state.diagram.edges).toHaveLength(1);

      store.removeNode(node1Id);
      state = useFlowchartStore.getState();
      expect(state.diagram.edges).toHaveLength(0);
    });

    it('should cascade delete edges where node is target', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });
      store.addNode('rect', 'Node2', { x: 100, y: 100 });
      store.addNode('rect', 'Node3', { x: 200, y: 200 });

      let state = useFlowchartStore.getState();
      const node1Id = state.diagram.nodes[0].id;
      const node2Id = state.diagram.nodes[1].id;
      const node3Id = state.diagram.nodes[2].id;

      store.addEdge(node1Id, node2Id);
      store.addEdge(node3Id, node2Id);

      state = useFlowchartStore.getState();
      expect(state.diagram.edges).toHaveLength(2);

      store.removeNode(node2Id);
      state = useFlowchartStore.getState();
      expect(state.diagram.edges).toHaveLength(0);
    });

    it('should update history when removing node', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });

      let state = useFlowchartStore.getState();
      const nodeId = state.diagram.nodes[0].id;
      const historyLengthBefore = state.history.length;

      store.removeNode(nodeId);

      state = useFlowchartStore.getState();
      expect(state.history.length).toBeGreaterThan(historyLengthBefore);
    });
  });

  describe('addEdge', () => {
    it('should add edge between two nodes', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });
      store.addNode('rect', 'Node2', { x: 100, y: 100 });

      let state = useFlowchartStore.getState();
      const node1Id = state.diagram.nodes[0].id;
      const node2Id = state.diagram.nodes[1].id;

      store.addEdge(node1Id, node2Id);

      state = useFlowchartStore.getState();
      expect(state.diagram.edges).toHaveLength(1);
      expect(state.edges).toHaveLength(1);
    });

    it('should create edge with correct type and text', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });
      store.addNode('rect', 'Node2', { x: 100, y: 100 });

      let state = useFlowchartStore.getState();
      const node1Id = state.diagram.nodes[0].id;
      const node2Id = state.diagram.nodes[1].id;

      store.addEdge(node1Id, node2Id, 'dotted-arrow', 'label');

      state = useFlowchartStore.getState();
      const edge = state.diagram.edges[0];
      expect(edge.type).toBe('dotted-arrow');
      expect(edge.text).toBe('label');
    });

    it('should default to arrow type if not specified', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });
      store.addNode('rect', 'Node2', { x: 100, y: 100 });

      let state = useFlowchartStore.getState();
      const node1Id = state.diagram.nodes[0].id;
      const node2Id = state.diagram.nodes[1].id;

      store.addEdge(node1Id, node2Id);

      state = useFlowchartStore.getState();
      expect(state.diagram.edges[0].type).toBe('arrow');
    });

    it('should map edge to React Flow edge with correct type', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });
      store.addNode('rect', 'Node2', { x: 100, y: 100 });

      let state = useFlowchartStore.getState();
      const node1Id = state.diagram.nodes[0].id;
      const node2Id = state.diagram.nodes[1].id;

      store.addEdge(node1Id, node2Id);

      state = useFlowchartStore.getState();
      const reactFlowEdge = state.edges[0];
      expect(reactFlowEdge.type).toBe('flow');
      expect(reactFlowEdge.source).toBe(node1Id);
      expect(reactFlowEdge.target).toBe(node2Id);
    });

    it('should update history when adding edge', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });
      store.addNode('rect', 'Node2', { x: 100, y: 100 });

      let state = useFlowchartStore.getState();
      const historyLengthBefore = state.history.length;
      const node1Id = state.diagram.nodes[0].id;
      const node2Id = state.diagram.nodes[1].id;

      store.addEdge(node1Id, node2Id);

      state = useFlowchartStore.getState();
      expect(state.history.length).toBeGreaterThan(historyLengthBefore);
    });
  });

  describe('addSubgraph', () => {
    it('should add a new subgraph', () => {
      const store = useFlowchartStore.getState();
      store.addSubgraph('My Subgraph');

      const state = useFlowchartStore.getState();
      expect(state.diagram.subgraphs).toHaveLength(1);
      expect(state.diagram.subgraphs[0].title).toBe('My Subgraph');
    });

    it('should create subgraph with empty nodeIds', () => {
      const store = useFlowchartStore.getState();
      store.addSubgraph('Sub');

      const state = useFlowchartStore.getState();
      const subgraph = state.diagram.subgraphs[0];
      expect(subgraph.nodeIds).toEqual([]);
    });

    it('should update history when adding subgraph', () => {
      const store = useFlowchartStore.getState();
      const historyLengthBefore = store.history.length;

      store.addSubgraph('New Subgraph');

      const state = useFlowchartStore.getState();
      expect(state.history.length).toBeGreaterThan(historyLengthBefore);
    });
  });

  describe('undo and redo', () => {
    it('should undo node addition', () => {
      const store = useFlowchartStore.getState();
      store.loadFromMermaid(`flowchart TD
        A[Start]`);

      let state = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });

      state = useFlowchartStore.getState();
      expect(state.diagram.nodes.length).toBeGreaterThan(1);

      store.undo();

      state = useFlowchartStore.getState();
      expect(state.diagram.nodes.length).toBe(1);
    });

    it('should redo after undo', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });

      let state = useFlowchartStore.getState();
      const nodesBefore = state.diagram.nodes.length;

      store.undo();
      store.redo();

      state = useFlowchartStore.getState();
      expect(state.diagram.nodes).toHaveLength(nodesBefore);
    });

    it('should not undo beyond history start', () => {
      const store = useFlowchartStore.getState();
      const initialNodeCount = store.diagram.nodes.length;

      store.undo();

      const state = useFlowchartStore.getState();
      expect(state.diagram.nodes).toHaveLength(initialNodeCount);
    });

    it('should not redo beyond history end', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });

      let state = useFlowchartStore.getState();
      const nodeCount = state.diagram.nodes.length;

      store.redo();

      state = useFlowchartStore.getState();
      expect(state.diagram.nodes).toHaveLength(nodeCount);
    });

    it('should clear redo history when new action after undo', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });
      store.addNode('rect', 'Node2', { x: 100, y: 100 });

      let state = useFlowchartStore.getState();
      const historyLength = state.history.length;

      store.undo();
      store.addNode('rect', 'Node3', { x: 200, y: 200 });

      state = useFlowchartStore.getState();
      expect(state.history.length).toBeLessThan(historyLength + 1);
    });
  });

  describe('toMermaid', () => {
    it('should generate valid mermaid code', () => {
      const mermaidCode = `flowchart TD
        A[Start] --> B[Process]
        B --> C{Decision}`;

      const store = useFlowchartStore.getState();
      store.loadFromMermaid(mermaidCode);

      const generated = store.toMermaid();
      expect(generated).toBeDefined();
      expect(generated).toContain('flowchart');
    });

    it('should preserve diagram direction in generated code', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Start', { x: 0, y: 0 });

      useFlowchartStore.setState({ diagram: { ...store.diagram, direction: 'LR' } });
      store.pushHistory();

      const generated = useFlowchartStore.getState().toMermaid();
      expect(generated).toContain('LR');
    });

    it('should round-trip: parse -> generate -> parse', () => {
      const originalCode = `flowchart TD
        A[Start] --> B[Process]
        B --> C[End]`;

      const store = useFlowchartStore.getState();
      store.loadFromMermaid(originalCode);

      const generated = store.toMermaid();
      const state = useFlowchartStore.getState();
      const originalNodeCount = state.diagram.nodes.length;

      // Reset and load generated code
      useFlowchartStore.setState({
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
      });

      const store2 = useFlowchartStore.getState();
      store2.loadFromMermaid(generated);

      const state2 = useFlowchartStore.getState();
      expect(state2.diagram.nodes).toHaveLength(originalNodeCount);
      expect(state2.diagram.edges.length).toBeGreaterThan(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex workflow creation', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Start', { x: 0, y: 0 });
      store.addNode('rect', 'Process', { x: 100, y: 0 });
      store.addNode('diamond', 'Decision', { x: 200, y: 0 });
      store.addNode('rect', 'End', { x: 300, y: 0 });

      let state = useFlowchartStore.getState();
      const nodes = state.diagram.nodes;

      store.addEdge(nodes[0].id, nodes[1].id);
      store.addEdge(nodes[1].id, nodes[2].id);
      store.addEdge(nodes[2].id, nodes[3].id);

      state = useFlowchartStore.getState();
      expect(state.diagram.nodes).toHaveLength(4);
      expect(state.diagram.edges).toHaveLength(3);

      const mermaid = store.toMermaid();
      expect(mermaid).toContain('Start');
      expect(mermaid).toContain('Process');
      expect(mermaid).toContain('Decision');
      expect(mermaid).toContain('End');
    });

    it('should maintain data consistency across operations', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'A', { x: 0, y: 0 });
      store.addNode('rect', 'B', { x: 100, y: 0 });

      let state = useFlowchartStore.getState();
      const nodeAId = state.diagram.nodes[0].id;
      const nodeBId = state.diagram.nodes[1].id;

      store.addEdge(nodeAId, nodeBId);

      state = useFlowchartStore.getState();
      expect(state.diagram.edges[0].from).toBe(nodeAId);
      expect(state.diagram.edges[0].to).toBe(nodeBId);
      expect(state.edges[0].source).toBe(nodeAId);
      expect(state.edges[0].target).toBe(nodeBId);
    });

    it('should maintain history consistency through multiple edits', () => {
      const store = useFlowchartStore.getState();
      store.addNode('rect', 'Node1', { x: 0, y: 0 });

      let state = useFlowchartStore.getState();
      const historyCountBefore = state.history.length;
      const indexBefore = state.historyIndex;

      store.addNode('rect', 'Node2', { x: 100, y: 100 });

      state = useFlowchartStore.getState();
      expect(state.history.length).toBe(historyCountBefore + 1);
      expect(state.historyIndex).toBe(indexBefore + 1);

      store.undo();
      state = useFlowchartStore.getState();
      expect(state.historyIndex).toBe(indexBefore);

      store.redo();
      state = useFlowchartStore.getState();
      expect(state.historyIndex).toBe(indexBefore + 1);
    });
  });
});
