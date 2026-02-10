import { describe, it, expect } from 'vitest';
import { SequenceAdapter } from '@/webview/diagrams/sequence/adapter';
import { FlowchartAdapter } from '@/webview/diagrams/flowchart/adapter';
import { StateDiagramAdapter } from '@/webview/diagrams/stateDiagram/adapter';

// ============================================================================
// SEQUENCE DIAGRAM TESTS
// ============================================================================

describe('Adapter Pipeline - Sequence Diagram', () => {
  it('should parse basic sequence diagram and generate correct nodes and edges', () => {
    const mermaidCode = `sequenceDiagram
  participant Alice
  participant Bob
  Alice->>Bob: Hello Bob!
  Bob-->>Alice: Hi Alice!`;

    // Parse
    const state = SequenceAdapter.parse(mermaidCode);
    
    expect(state.type).toBe('sequence');
    expect(state.participants).toHaveLength(2);
    expect(state.messages).toHaveLength(2);
    
    // stateToNodes
    const nodes = SequenceAdapter.stateToNodes(state);
    
    // Should have: 2 participants + 2 timelines + 0 notes + 0 blocks = 4 nodes
    expect(nodes.length).toBe(4);
    
    // Verify participant nodes
    const participantNodes = nodes.filter(n => n.type === 'participant');
    expect(participantNodes).toHaveLength(2);
    expect(participantNodes[0].data.label).toBe('Alice');
    expect(participantNodes[1].data.label).toBe('Bob');
    
    // Verify timeline nodes
    const timelineNodes = nodes.filter(n => n.type === 'timeline');
    expect(timelineNodes).toHaveLength(2);
    
    // stateToEdges
    const edges = SequenceAdapter.stateToEdges(state);
    
    // Should have 2 message edges
    expect(edges).toHaveLength(2);
    expect(edges[0].type).toBe('message');
    expect(edges[0].data?.text).toBe('Hello Bob!');
    expect(edges[1].type).toBe('message');
    expect(edges[1].data?.text).toBe('Hi Alice!');
    
    // Generate back to Mermaid
    const regenerated = SequenceAdapter.generate(state);
    expect(regenerated).toContain('sequenceDiagram');
    expect(regenerated).toContain('Alice');
    expect(regenerated).toContain('Bob');
    expect(regenerated).toContain('Hello Bob!');
  });

  it('should handle sequence diagram with notes', () => {
    const mermaidCode = `sequenceDiagram
  participant A
  participant B
  A->>B: Message
  Note left of A: Left note
  Note right of B: Right note
  Note over A,B: Over note`;

    const state = SequenceAdapter.parse(mermaidCode);
    
    expect(state.notes).toHaveLength(3);
    
    const nodes = SequenceAdapter.stateToNodes(state);
    
    // 2 participants + 2 timelines + 3 notes = 7 nodes
    expect(nodes.length).toBe(7);
    
    const noteNodes = nodes.filter(n => n.type === 'note');
    expect(noteNodes).toHaveLength(3);
    expect(noteNodes[0].data.text).toBe('Left note');
    expect(noteNodes[1].data.text).toBe('Right note');
    expect(noteNodes[2].data.text).toBe('Over note');
  });

  it('should handle sequence diagram with blocks (loop/alt/opt)', () => {
    const mermaidCode = `sequenceDiagram
  participant Alice
  participant Bob
  loop Every minute
    Alice->>Bob: Check status
  end
  alt Successful case
    Bob-->>Alice: OK
  else Failure
    Bob-->>Alice: FAIL
  end
  opt Extra response
    Alice->>Bob: Thanks!
  end`;

    const state = SequenceAdapter.parse(mermaidCode);
    
    expect(state.blocks.length).toBeGreaterThan(0);
    
    const nodes = SequenceAdapter.stateToNodes(state);
    
    const blockNodes = nodes.filter(n => n.type === 'block');
    expect(blockNodes.length).toBeGreaterThan(0);
    
    const blockTypes = blockNodes.map(n => n.data.blockType);
    expect(blockTypes).toContain('loop');
  });

  it('should round-trip sequence diagram: parse -> nodes/edges -> generate -> parse', () => {
    const original = `sequenceDiagram
  participant User
  participant API
  User->>+API: Request
  API-->>-User: Response`;

    // First parse
    const state1 = SequenceAdapter.parse(original);
    
    // Generate
    const generated = SequenceAdapter.generate(state1);
    
    // Parse generated
    const state2 = SequenceAdapter.parse(generated);
    
    // Compare key data
    expect(state2.participants).toHaveLength(state1.participants.length);
    expect(state2.messages).toHaveLength(state1.messages.length);
    expect(state2.participants[0].name).toBe(state1.participants[0].name);
    expect(state2.participants[1].name).toBe(state1.participants[1].name);
  });

  it('should detect sequence diagram correctly', () => {
    const sequenceCode = 'sequenceDiagram\nparticipant A\nA->>B: msg';
    const flowchartCode = 'flowchart TD\nA[Start]';
    const stateCode = 'stateDiagram-v2\n[*] --> A';
    
    expect(SequenceAdapter.detect(sequenceCode)).toBe(true);
    expect(SequenceAdapter.detect(flowchartCode)).toBe(false);
    expect(SequenceAdapter.detect(stateCode)).toBe(false);
  });
});

// ============================================================================
// FLOWCHART TESTS
// ============================================================================

describe('Adapter Pipeline - Flowchart', () => {
  it('should parse basic flowchart and generate correct nodes and edges', () => {
    const mermaidCode = `flowchart TD
  A[Start]
  B[Process]
  C{Decision}
  D[End]
  A --> B
  B --> C
  C -->|Yes| D
  C -->|No| B`;

    // Parse
    const state = FlowchartAdapter.parse(mermaidCode);
    
    expect(state.type).toBe('flowchart');
    expect(state.nodes).toHaveLength(4);
    expect(state.edges).toHaveLength(4);
    
    // stateToNodes
    const nodes = FlowchartAdapter.stateToNodes(state);
    
    // Should have 4 shape nodes
    const shapeNodes = nodes.filter(n => n.type === 'shape');
    expect(shapeNodes).toHaveLength(4);
    expect(shapeNodes[0].data.label).toBe('Start');
    expect(shapeNodes[1].data.label).toBe('Process');
    expect(shapeNodes[2].data.label).toBe('Decision');
    expect(shapeNodes[3].data.label).toBe('End');
    
    // stateToEdges
    const edges = FlowchartAdapter.stateToEdges(state);
    
    // Should have 4 flow edges
    expect(edges).toHaveLength(4);
    expect(edges[0].type).toBe('flow');
    expect(edges[2].data?.text).toBe('Yes');
    expect(edges[3].data?.text).toBe('No');
    
    // Generate back to Mermaid
    const regenerated = FlowchartAdapter.generate(state);
    expect(regenerated).toContain('flowchart');
    expect(regenerated).toContain('Start');
    expect(regenerated).toContain('Process');
  });

  it('should handle flowchart with subgraphs', () => {
    const mermaidCode = `flowchart TD
  subgraph sg1["Group A"]
    A[Node A1]
    B[Node A2]
  end
  subgraph sg2["Group B"]
    C[Node B1]
  end
  A --> C
  B --> C`;

    const state = FlowchartAdapter.parse(mermaidCode);
    
    expect(state.subgraphs.length).toBeGreaterThan(0);
    
    const nodes = FlowchartAdapter.stateToNodes(state);
    
    const subgraphNodes = nodes.filter(n => n.type === 'subgraph');
    expect(subgraphNodes.length).toBeGreaterThan(0);
    
    const shapeNodes = nodes.filter(n => n.type === 'shape');
    expect(shapeNodes.length).toBeGreaterThanOrEqual(3);
  });

  it('should handle various node shapes', () => {
    const mermaidCode = `flowchart TD
  A[Rectangle]
  B(Rounded)
  C([Stadium])
  D{Diamond}
  E[[Subroutine]]
  A --> B --> C --> D --> E`;

    const state = FlowchartAdapter.parse(mermaidCode);
    
    expect(state.nodes.length).toBeGreaterThanOrEqual(5);
    
    const nodes = FlowchartAdapter.stateToNodes(state);
    const shapeNodes = nodes.filter(n => n.type === 'shape');
    
    expect(shapeNodes.length).toBeGreaterThanOrEqual(5);
    
    const shapes = shapeNodes.map(n => n.data.shape);
    expect(shapes).toContain('rect');
    expect(shapes).toContain('rounded');
  });

  it('should round-trip flowchart: parse -> nodes/edges -> generate -> parse', () => {
    const original = `flowchart LR
  A[Start] --> B[End]`;

    const state1 = FlowchartAdapter.parse(original);
    const generated = FlowchartAdapter.generate(state1);
    const state2 = FlowchartAdapter.parse(generated);
    
    expect(state2.nodes).toHaveLength(state1.nodes.length);
    expect(state2.edges).toHaveLength(state1.edges.length);
    expect(state2.nodes[0].text).toBe(state1.nodes[0].text);
  });

  it('should detect flowchart correctly', () => {
    const flowchartCode = 'flowchart TD\nA[Start]';
    const sequenceCode = 'sequenceDiagram\nparticipant A';
    const stateCode = 'stateDiagram-v2\n[*] --> A';
    
    expect(FlowchartAdapter.detect(flowchartCode)).toBe(true);
    expect(FlowchartAdapter.detect(sequenceCode)).toBe(false);
    expect(FlowchartAdapter.detect(stateCode)).toBe(false);
  });
});

// ============================================================================
// STATE DIAGRAM TESTS
// ============================================================================

describe('Adapter Pipeline - State Diagram', () => {
  it('should parse basic state diagram and generate correct nodes and edges', () => {
    const mermaidCode = `stateDiagram-v2
  [*] --> Active
  Active --> Inactive
  Inactive --> [*]
  Active --> Error
  Error --> Inactive`;

    // Parse
    const state = StateDiagramAdapter.parse(mermaidCode);
    
    expect(state.type).toBe('state');
    expect(state.states.length).toBeGreaterThan(0);
    expect(state.transitions.length).toBeGreaterThan(0);
    
    // stateToNodes
    const nodes = StateDiagramAdapter.stateToNodes(state);
    
    // Should have start/end nodes and state nodes
    const startEndNodes = nodes.filter(n => n.type === 'startEnd');
    const stateNodes = nodes.filter(n => n.type === 'stateNode');
    
    expect(startEndNodes.length).toBeGreaterThan(0);
    expect(stateNodes.length).toBeGreaterThan(0);
    
    // stateToEdges
    const edges = StateDiagramAdapter.stateToEdges(state);
    
    // Should have transition edges
    expect(edges.length).toBeGreaterThan(0);
    expect(edges[0].type).toBe('transition');
    
    // Generate back to Mermaid
    const regenerated = StateDiagramAdapter.generate(state);
    expect(regenerated).toContain('stateDiagram');
  });

  it('should handle state diagram with choice nodes', () => {
    const mermaidCode = `stateDiagram-v2
  [*] --> Check
  Check --> Choice1
  state Choice1 <<choice>>
  Choice1 --> Success
  Choice1 --> Failure
  Success --> [*]
  Failure --> [*]`;

    const state = StateDiagramAdapter.parse(mermaidCode);
    
    const nodes = StateDiagramAdapter.stateToNodes(state);
    const choiceNodes = nodes.filter(n => n.type === 'choice');
    
    expect(choiceNodes.length).toBeGreaterThan(0);
  });

  it('should handle state diagram with fork/join', () => {
    const mermaidCode = `stateDiagram-v2
  [*] --> Fork1
  state Fork1 <<fork>>
  Fork1 --> StateA
  Fork1 --> StateB
  StateA --> Join1
  StateB --> Join1
  state Join1 <<join>>
  Join1 --> [*]`;

    const state = StateDiagramAdapter.parse(mermaidCode);
    
    const nodes = StateDiagramAdapter.stateToNodes(state);
    const forkJoinNodes = nodes.filter(n => n.type === 'forkJoin');
    
    expect(forkJoinNodes.length).toBeGreaterThan(0);
  });

  it('should handle composite states', () => {
    const mermaidCode = `stateDiagram-v2
  [*] --> Active
  state Active {
    [*] --> Inner1
    Inner1 --> Inner2
    Inner2 --> [*]
  }
  Active --> Done
  Done --> [*]`;

    const state = StateDiagramAdapter.parse(mermaidCode);
    
    const nodes = StateDiagramAdapter.stateToNodes(state);
    const compositeNodes = nodes.filter(n => n.type === 'composite');
    
    expect(compositeNodes.length).toBeGreaterThan(0);
  });

  it('should handle state diagram with notes', () => {
    const mermaidCode = `stateDiagram-v2
  [*] --> Active
  Active --> Inactive
  note right of Active : This is a note
  Inactive --> [*]`;

    const state = StateDiagramAdapter.parse(mermaidCode);
    
    expect(state.notes.length).toBeGreaterThan(0);
    
    const nodes = StateDiagramAdapter.stateToNodes(state);
    const noteNodes = nodes.filter(n => n.type === 'stateNote');
    
    expect(noteNodes.length).toBeGreaterThan(0);
  });

  it('should round-trip state diagram: parse -> nodes/edges -> generate -> parse', () => {
    const original = `stateDiagram-v2
  [*] --> S1
  S1 --> S2
  S2 --> [*]`;

    const state1 = StateDiagramAdapter.parse(original);
    const generated = StateDiagramAdapter.generate(state1);
    const state2 = StateDiagramAdapter.parse(generated);
    
    expect(state2.states.length).toBe(state1.states.length);
    expect(state2.transitions.length).toBe(state1.transitions.length);
  });

  it('should detect state diagram correctly', () => {
    const stateCode = 'stateDiagram-v2\n[*] --> A';
    const sequenceCode = 'sequenceDiagram\nparticipant A';
    const flowchartCode = 'flowchart TD\nA[Start]';
    
    expect(StateDiagramAdapter.detect(stateCode)).toBe(true);
    expect(StateDiagramAdapter.detect(sequenceCode)).toBe(false);
    expect(StateDiagramAdapter.detect(flowchartCode)).toBe(false);
  });
});

// ============================================================================
// CROSS-ADAPTER CONSISTENCY TESTS
// ============================================================================

describe('Adapter Pipeline - Cross-Adapter Consistency', () => {
  it('should properly separate concerns between adapter types', () => {
    const sequenceCode = 'sequenceDiagram\nparticipant A\nA->>B: msg';
    const flowchartCode = 'flowchart TD\nA[Start]';
    const stateCode = 'stateDiagram-v2\n[*] --> A';
    
    // Each adapter should only detect and parse its own type
    expect(SequenceAdapter.detect(sequenceCode)).toBe(true);
    expect(FlowchartAdapter.detect(sequenceCode)).toBe(false);
    expect(StateDiagramAdapter.detect(sequenceCode)).toBe(false);
    
    expect(FlowchartAdapter.detect(flowchartCode)).toBe(true);
    expect(SequenceAdapter.detect(flowchartCode)).toBe(false);
    expect(StateDiagramAdapter.detect(flowchartCode)).toBe(false);
    
    expect(StateDiagramAdapter.detect(stateCode)).toBe(true);
    expect(SequenceAdapter.detect(stateCode)).toBe(false);
    expect(FlowchartAdapter.detect(stateCode)).toBe(false);
  });

  it('stateToNodes and stateToEdges should return consistent data', () => {
    const sequenceMermaid = `sequenceDiagram
  participant A
  participant B
  A->>B: Message`;
    
    const seqState = SequenceAdapter.parse(sequenceMermaid);
    const nodes = SequenceAdapter.stateToNodes(seqState);
    const edges = SequenceAdapter.stateToEdges(seqState);
    
    // All edge source/target should reference existing nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    edges.forEach(edge => {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    });
  });

  it('should handle initial empty states correctly', () => {
    const sequenceInitial = SequenceAdapter.createInitialState();
    const flowchartInitial = FlowchartAdapter.createInitialState();
    const stateInitial = StateDiagramAdapter.createInitialState();
    
    const seqNodes = SequenceAdapter.stateToNodes(sequenceInitial);
    const flowNodes = FlowchartAdapter.stateToNodes(flowchartInitial);
    const stateNodes = StateDiagramAdapter.stateToNodes(stateInitial);
    
    // Empty states should produce empty node lists
    expect(seqNodes).toHaveLength(0);
    expect(flowNodes).toHaveLength(0);
    expect(stateNodes).toHaveLength(0);
  });

  it('should generate valid mermaid code from all adapter types', () => {
    const sequenceMermaid = `sequenceDiagram
  participant A
  A->>A: Self message`;
    
    const flowchartMermaid = `flowchart TD
  A[Start] --> B[End]`;
    
    const stateMermaid = `stateDiagram-v2
  [*] --> S1
  S1 --> [*]`;
    
    const seqState = SequenceAdapter.parse(sequenceMermaid);
    const flowState = FlowchartAdapter.parse(flowchartMermaid);
    const stateState = StateDiagramAdapter.parse(stateMermaid);
    
    const seqGenerated = SequenceAdapter.generate(seqState);
    const flowGenerated = FlowchartAdapter.generate(flowState);
    const stateGenerated = StateDiagramAdapter.generate(stateState);
    
    // Generated code should be parseable back
    const seqReparsed = SequenceAdapter.parse(seqGenerated);
    const flowReparsed = FlowchartAdapter.parse(flowGenerated);
    const stateReparsed = StateDiagramAdapter.parse(stateGenerated);
    
    expect(seqReparsed.type).toBe('sequence');
    expect(flowReparsed.type).toBe('flowchart');
    expect(stateReparsed.type).toBe('state');
  });
});
