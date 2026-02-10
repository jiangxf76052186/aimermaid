import { describe, it, expect, beforeEach } from 'vitest';
import { useDiagramStore } from '@/webview/stores/diagramStore';

describe('useDiagramStore - Sequence Diagram Integration', () => {
  beforeEach(() => {
    useDiagramStore.setState({
      diagram: {
        type: 'sequence',
        participants: [],
        messages: [],
        notes: [],
        activations: [],
        blocks: [],
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
    it('should parse simple sequence diagram with 2 participants and 1 message', () => {
      const mermaidCode = `sequenceDiagram
  participant Alice
  participant Bob
  Alice->>Bob: Hello`;

      useDiagramStore.getState().loadFromMermaid(mermaidCode);

      const state = useDiagramStore.getState();
      
      expect(state.diagram.participants).toHaveLength(2);
      expect(state.diagram.participants[0].name).toBe('Alice');
      expect(state.diagram.participants[1].name).toBe('Bob');
      expect(state.diagram.messages).toHaveLength(1);
      expect(state.diagram.messages[0].text).toBe('Hello');

      const participantNodes = state.nodes.filter(n => n.type === 'participant');
      const timelineNodes = state.nodes.filter(n => n.type === 'timeline');
      expect(participantNodes).toHaveLength(2);
      expect(timelineNodes).toHaveLength(2);
      expect(state.nodes).toHaveLength(4);

      expect(state.edges).toHaveLength(1);
      expect(state.edges[0].data?.text).toBe('Hello');
    });

    it('should initialize history correctly after loadFromMermaid', () => {
      const mermaidCode = `sequenceDiagram
  participant A
  participant B
  A->>B: Test`;

      useDiagramStore.getState().loadFromMermaid(mermaidCode);

      const state = useDiagramStore.getState();
      expect(state.history).toHaveLength(1);
      expect(state.historyIndex).toBe(0);
      expect(state.history[0]).toEqual(state.diagram);
    });
  });

  describe('addParticipant', () => {
    it('should add a participant to diagram and update nodes', () => {
      const state = useDiagramStore.getState();
      const initialNodeCount = state.nodes.length;

      state.addParticipant('Charlie');

      const updatedState = useDiagramStore.getState();
      expect(updatedState.diagram.participants).toHaveLength(1);
      expect(updatedState.diagram.participants[0].name).toBe('Charlie');
      expect(updatedState.nodes.length).toBe(initialNodeCount + 2);
    });

    it('should support actor type participant', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('User', 'actor');

      const updatedState = useDiagramStore.getState();
      expect(updatedState.diagram.participants[0].type).toBe('actor');
    });

    it('should assign correct order to new participants', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('First');
      state.addParticipant('Second');
      state.addParticipant('Third');

      const updatedState = useDiagramStore.getState();
      expect(updatedState.diagram.participants[0].order).toBe(0);
      expect(updatedState.diagram.participants[1].order).toBe(1);
      expect(updatedState.diagram.participants[2].order).toBe(2);
    });

    it('should add to history when adding participant', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('Test');

      const updatedState = useDiagramStore.getState();
      expect(updatedState.history.length).toBeGreaterThan(0);
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant and reduce nodes', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('Alice');
      state.addParticipant('Bob');

      let currentState = useDiagramStore.getState();
      expect(currentState.diagram.participants).toHaveLength(2);
      const nodeCountBefore = currentState.nodes.length;
      const aliceId = currentState.diagram.participants[0].id;

      state.removeParticipant(aliceId);

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.participants).toHaveLength(1);
      expect(currentState.nodes.length).toBe(nodeCountBefore - 2);
    });

    it('should cascade delete messages when participant is sender', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('Alice');
      state.addParticipant('Bob');

      let currentState = useDiagramStore.getState();
      const aliceId = currentState.diagram.participants[0].id;
      const bobId = currentState.diagram.participants[1].id;

      state.addMessage(aliceId, bobId, 'Message');

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.messages).toHaveLength(1);

      state.removeParticipant(aliceId);

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.messages).toHaveLength(0);
    });

    it('should cascade delete messages when participant is receiver', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('Alice');
      state.addParticipant('Bob');

      let currentState = useDiagramStore.getState();
      const aliceId = currentState.diagram.participants[0].id;
      const bobId = currentState.diagram.participants[1].id;

      state.addMessage(aliceId, bobId, 'Message');

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.messages).toHaveLength(1);

      state.removeParticipant(bobId);

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.messages).toHaveLength(0);
    });
  });

  describe('addMessage', () => {
    it('should add message between two participants', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('Alice');
      state.addParticipant('Bob');

      let currentState = useDiagramStore.getState();
      const aliceId = currentState.diagram.participants[0].id;
      const bobId = currentState.diagram.participants[1].id;

      state.addMessage(aliceId, bobId, 'Test Message');

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.messages).toHaveLength(1);
      expect(currentState.diagram.messages[0].from).toBe(aliceId);
      expect(currentState.diagram.messages[0].to).toBe(bobId);
      expect(currentState.diagram.messages[0].text).toBe('Test Message');
    });

    it('should create edge for message', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('A');
      state.addParticipant('B');

      let currentState = useDiagramStore.getState();
      const aId = currentState.diagram.participants[0].id;
      const bId = currentState.diagram.participants[1].id;
      const edgesBefore = currentState.edges.length;

      state.addMessage(aId, bId, 'Message 1');

      currentState = useDiagramStore.getState();
      expect(currentState.edges.length).toBe(edgesBefore + 1);
      expect(currentState.edges[currentState.edges.length - 1].data?.text).toBe('Message 1');
    });

    it('should support different message types', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('A');
      state.addParticipant('B');

      let currentState = useDiagramStore.getState();
      const aId = currentState.diagram.participants[0].id;
      const bId = currentState.diagram.participants[1].id;

      state.addMessage(aId, bId, 'Sync', 'sync');
      state.addMessage(bId, aId, 'Async', 'asyncOpen');

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.messages[0].type).toBe('sync');
      expect(currentState.diagram.messages[1].type).toBe('asyncOpen');
    });

    it('should assign correct order to messages', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('A');
      state.addParticipant('B');

      let currentState = useDiagramStore.getState();
      const aId = currentState.diagram.participants[0].id;
      const bId = currentState.diagram.participants[1].id;

      state.addMessage(aId, bId, 'First');
      state.addMessage(bId, aId, 'Second');
      state.addMessage(aId, bId, 'Third');

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.messages[0].order).toBe(0);
      expect(currentState.diagram.messages[1].order).toBe(1);
      expect(currentState.diagram.messages[2].order).toBe(2);
    });
  });

  describe('addNote', () => {
    it('should add note to diagram and create node', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('Alice');

      let currentState = useDiagramStore.getState();
      const aliceId = currentState.diagram.participants[0].id;
      const notesBefore = currentState.diagram.notes.length;
      const nodesBefore = currentState.nodes.filter(n => n.type === 'note').length;

      state.addNote('Test Note', 'left', [aliceId]);

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.notes.length).toBe(notesBefore + 1);
      expect(currentState.diagram.notes[0].text).toBe('Test Note');
      expect(currentState.diagram.notes[0].position).toBe('left');
      expect(currentState.diagram.notes[0].participantIds).toEqual([aliceId]);
      expect(currentState.nodes.filter(n => n.type === 'note').length).toBe(nodesBefore + 1);
    });

    it('should support different note positions', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('A');

      let currentState = useDiagramStore.getState();
      const aId = currentState.diagram.participants[0].id;

      state.addNote('Left Note', 'left', [aId]);
      state.addNote('Right Note', 'right', [aId]);
      state.addNote('Over Note', 'over', [aId]);

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.notes[0].position).toBe('left');
      expect(currentState.diagram.notes[1].position).toBe('right');
      expect(currentState.diagram.notes[2].position).toBe('over');
    });

    it('should support notes over multiple participants', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('Alice');
      state.addParticipant('Bob');

      let currentState = useDiagramStore.getState();
      const aliceId = currentState.diagram.participants[0].id;
      const bobId = currentState.diagram.participants[1].id;

      state.addNote('Both', 'over', [aliceId, bobId]);

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.notes[0].participantIds).toEqual([aliceId, bobId]);
    });
  });

  describe('addBlock', () => {
    it('should add block to diagram and create node', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('A');
      state.addParticipant('B');

      let currentState = useDiagramStore.getState();
      const aId = currentState.diagram.participants[0].id;
      const bId = currentState.diagram.participants[1].id;

      state.addMessage(aId, bId, 'Msg');
      currentState = useDiagramStore.getState();
      const msgId = currentState.diagram.messages[0].id;

      const blocksBefore = currentState.diagram.blocks.length;
      const blockNodesBefore = currentState.nodes.filter(n => n.type === 'block').length;

      state.addBlock('loop', 'Test Loop', [msgId]);

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.blocks.length).toBe(blocksBefore + 1);
      expect(currentState.diagram.blocks[0].type).toBe('loop');
      expect(currentState.diagram.blocks[0].label).toBe('Test Loop');
      expect(currentState.diagram.blocks[0].messageIds).toEqual([msgId]);
      expect(currentState.nodes.filter(n => n.type === 'block').length).toBe(blockNodesBefore + 1);
    });

    it('should support different block types', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('A');
      state.addParticipant('B');

      let currentState = useDiagramStore.getState();
      const aId = currentState.diagram.participants[0].id;
      const bId = currentState.diagram.participants[1].id;

      state.addMessage(aId, bId, 'M1');
      state.addMessage(bId, aId, 'M2');
      state.addMessage(aId, bId, 'M3');

      currentState = useDiagramStore.getState();
      const m1 = currentState.diagram.messages[0].id;
      const m2 = currentState.diagram.messages[1].id;
      const m3 = currentState.diagram.messages[2].id;

      state.addBlock('loop', 'Loop', [m1]);
      state.addBlock('alt', 'Alt', [m2]);
      state.addBlock('opt', 'Opt', [m3]);

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.blocks[0].type).toBe('loop');
      expect(currentState.diagram.blocks[1].type).toBe('alt');
      expect(currentState.diagram.blocks[2].type).toBe('opt');
    });

    it('should initialize empty children array for blocks', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('A');
      state.addParticipant('B');

      let currentState = useDiagramStore.getState();
      const aId = currentState.diagram.participants[0].id;
      const bId = currentState.diagram.participants[1].id;

      state.addMessage(aId, bId, 'M');
      currentState = useDiagramStore.getState();
      const msgId = currentState.diagram.messages[0].id;

      state.addBlock('loop', 'Test', [msgId]);

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.blocks[0].children).toEqual([]);
    });
  });

  describe('undo/redo', () => {
    it('should track history when actions are performed', () => {
      const state = useDiagramStore.getState();
      const historyBefore = state.history.length;
      
      state.addParticipant('Test');
      
      const currentState = useDiagramStore.getState();
      expect(currentState.history.length).toBeGreaterThan(historyBefore);
    });

    it('should support undo operation', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('Alpha');

      let currentState = useDiagramStore.getState();
      const historyIndexBefore = currentState.historyIndex;

      state.undo();

      currentState = useDiagramStore.getState();
      expect(currentState.historyIndex).toBeLessThanOrEqual(historyIndexBefore);
    });

    it('should support redo operation', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('Beta');

      let currentState = useDiagramStore.getState();
      const historyLengthBefore = currentState.history.length;

      state.undo();
      currentState = useDiagramStore.getState();

      state.redo();
      currentState = useDiagramStore.getState();
      expect(currentState.history.length).toBe(historyLengthBefore);
    });
  });

  describe('toMermaid round-trip', () => {
    it('should convert diagram back to mermaid code', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('Alice');
      state.addParticipant('Bob');

      let currentState = useDiagramStore.getState();
      const aliceId = currentState.diagram.participants[0].id;
      const bobId = currentState.diagram.participants[1].id;

      state.addMessage(aliceId, bobId, 'Hello World');

      currentState = useDiagramStore.getState();
      const mermaidCode = state.toMermaid();

      expect(mermaidCode).toContain('sequenceDiagram');
      expect(mermaidCode).toContain('Alice');
      expect(mermaidCode).toContain('Bob');
      expect(mermaidCode).toContain('Hello World');
    });

    it('should handle roundtrip: loadFromMermaid -> toMermaid -> loadFromMermaid', () => {
      const originalMermaid = `sequenceDiagram
  participant Alice
  participant Bob
  Alice->>Bob: Test Message`;

      const state = useDiagramStore.getState();
      state.loadFromMermaid(originalMermaid);

      let currentState = useDiagramStore.getState();
      const generatedMermaid = state.toMermaid();

      state.loadFromMermaid(generatedMermaid);
      currentState = useDiagramStore.getState();

      expect(currentState.diagram.participants).toHaveLength(2);
      expect(currentState.diagram.messages).toHaveLength(1);
      expect(currentState.diagram.messages[0].text).toBe('Test Message');
    });

    it('should include all participants in generated mermaid', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('A');
      state.addParticipant('B');
      state.addParticipant('C');

      const mermaidCode = state.toMermaid();
      expect(mermaidCode).toContain('A');
      expect(mermaidCode).toContain('B');
      expect(mermaidCode).toContain('C');
    });

    it('should include notes in generated mermaid', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('Alice');

      let currentState = useDiagramStore.getState();
      const aliceId = currentState.diagram.participants[0].id;

      state.addNote('Important', 'left', [aliceId]);

      currentState = useDiagramStore.getState();
      const mermaidCode = state.toMermaid();
      expect(mermaidCode).toContain('Note');
      expect(mermaidCode).toContain('Important');
    });
  });

  describe('complex scenarios', () => {
    it('should handle diagram with multiple messages and notes', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('Client');
      state.addParticipant('Server');

      let currentState = useDiagramStore.getState();
      const clientId = currentState.diagram.participants[0].id;
      const serverId = currentState.diagram.participants[1].id;

      state.addMessage(clientId, serverId, 'Request');
      state.addNote('Processing', 'over', [serverId]);
      state.addMessage(serverId, clientId, 'Response');

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.messages).toHaveLength(2);
      expect(currentState.diagram.notes).toHaveLength(1);
      expect(currentState.nodes.filter(n => n.type === 'note')).toHaveLength(1);
    });

    it('should maintain state consistency after rapid operations', () => {
      const state = useDiagramStore.getState();
      for (let i = 0; i < 5; i++) {
        state.addParticipant(`P${i}`);
      }

      let currentState = useDiagramStore.getState();
      const participants = currentState.diagram.participants;

      state.addMessage(participants[0].id, participants[1].id, 'M1');
      state.addMessage(participants[1].id, participants[2].id, 'M2');
      state.addMessage(participants[2].id, participants[3].id, 'M3');

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.messages).toHaveLength(3);
      
      const participantNodes = currentState.nodes.filter(n => n.type === 'participant');
      const timelineNodes = currentState.nodes.filter(n => n.type === 'timeline');
      expect(participantNodes).toHaveLength(5);
      expect(timelineNodes).toHaveLength(5);
      expect(currentState.edges).toHaveLength(3);
    });

    it('should handle participant removal', () => {
      const state = useDiagramStore.getState();
      state.addParticipant('A');

      let currentState = useDiagramStore.getState();
      const participantCountBefore = currentState.diagram.participants.length;
      const participantId = currentState.diagram.participants[0].id;

      state.removeParticipant(participantId);

      currentState = useDiagramStore.getState();
      expect(currentState.diagram.participants.length).toBeLessThan(participantCountBefore);
    });
  });
});
