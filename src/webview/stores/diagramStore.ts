import { create } from 'zustand';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import { SequenceDiagram, Participant, Message, MessageType, Note, NotePosition, Block, BlockType } from '@shared/types';
import { parseMermaidSequence } from '../utils/mermaid-parser';
import { generateMermaidSequence } from '../utils/mermaid-generator';

export interface DiagramState {
  diagram: SequenceDiagram;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedEdgeIds: string[];
  theme: 'light' | 'dark';
  history: SequenceDiagram[];
  historyIndex: number;
}

export interface DiagramActions {
  loadFromMermaid: (code: string) => void;
  toMermaid: () => string;
  recalculateAllBlockContents: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  addParticipant: (name: string, type?: 'participant' | 'actor') => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  removeParticipant: (id: string) => void;
  
  addMessage: (from: string, to: string, text: string, type?: MessageType) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  moveMessageUp: (id: string) => void;
  moveMessageDown: (id: string) => void;
  
  addNote: (text: string, position: NotePosition, participantIds: string[], parentBlockId?: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;

  addBlock: (type: BlockType, label: string, messageIds: string[], parentBlockId?: string) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  getSelectedBlockId: () => string | null;
  syncBlockContents: (blockId: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  
  bringToFront: (nodeId: string) => void;
  sendToBack: (nodeId: string) => void;
  
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: (nodeId: string, x: number, y?: number, width?: number, height?: number) => void;
  
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  setSelectedEdges: (ids: string[]) => void;
  clearEdgeSelection: () => void;
  deleteSelected: () => void;
  
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

const PARTICIPANT_WIDTH = 100;
const PARTICIPANT_HEIGHT = 60;
const PARTICIPANT_GAP = 180;
const PARTICIPANT_Y = 50;
const MESSAGE_SPACING = 50;
const TIMELINE_MIN_HEIGHT = 100;
const TIMELINE_PADDING = 50;
const BLOCK_PADDING = 20;
const NOTE_OFFSET_LEFT = -140;
const NOTE_OFFSET_RIGHT = 80;
const MESSAGE_BASE_Y = PARTICIPANT_Y + PARTICIPANT_HEIGHT / 2;

function getEventY(order: number, diagram: SequenceDiagram): number {
  const allEvents = [
    ...diagram.messages.map(m => ({ id: m.id, order: m.order })),
    ...diagram.notes.map(n => ({ id: n.id, order: n.order }))
  ].sort((a, b) => a.order - b.order);
  
  const index = allEvents.findIndex(e => e.order === order);
  if (index === -1) {
    return 80;
  }
  return 80 + index * MESSAGE_SPACING;
}

function calculateTimelineHeight(diagram: SequenceDiagram): number {
  const eventCount = diagram.messages.length + diagram.notes.length;
  return Math.max(TIMELINE_MIN_HEIGHT, eventCount * MESSAGE_SPACING + TIMELINE_PADDING);
}

function diagramToNodes(diagram: SequenceDiagram): Node[] {
  console.log('[AIMermaid] ⚠️ diagramToNodes CALLED - Block nodes will be recalculated!');
  console.trace('[AIMermaid] diagramToNodes call stack');
  const nodes: Node[] = [];
  const timelineHeight = calculateTimelineHeight(diagram);
  
  const sortedParticipants = [...diagram.participants].sort((a, b) => a.order - b.order);
  const participantPositions = new Map<string, number>();
  sortedParticipants.forEach((p, index) => {
    participantPositions.set(p.id, index);
  });

  const activationRanges = calculateActivationRanges(diagram);

  sortedParticipants.forEach((p, index) => {
    nodes.push({
      id: p.id,
      type: 'participant',
      position: { x: index * PARTICIPANT_GAP + 50, y: PARTICIPANT_Y },
      data: { 
        label: p.alias || p.name,
        name: p.name,
        participantType: p.type,
      },
      draggable: true,
    });
    
    const participantActivations = activationRanges.get(p.id) || [];
    
    nodes.push({
      id: `${p.id}_timeline`,
      type: 'timeline',
      position: { x: index * PARTICIPANT_GAP + 50 + PARTICIPANT_WIDTH / 2 - 1, y: PARTICIPANT_Y + PARTICIPANT_HEIGHT },
      data: { 
        participantId: p.id, 
        height: timelineHeight,
        activations: participantActivations,
      },
      draggable: false,
      selectable: false,
    });
  });

  const messageBaseY = MESSAGE_BASE_Y;
  
  diagram.notes.forEach((note) => {
    const y = messageBaseY + getEventY(note.order, diagram);
    let x = 0;
    
    if (note.participantIds.length > 0) {
      const firstP = sortedParticipants.find(p => p.id === note.participantIds[0]);
      if (firstP) {
        const firstIndex = sortedParticipants.indexOf(firstP);
        const baseX = firstIndex * PARTICIPANT_GAP + 50;
        
        switch (note.position) {
          case 'left':
            x = baseX + NOTE_OFFSET_LEFT;
            break;
          case 'right':
            x = baseX + NOTE_OFFSET_RIGHT;
            break;
          case 'over':
          default:
            if (note.participantIds.length > 1) {
              const lastP = sortedParticipants.find(p => p.id === note.participantIds[note.participantIds.length - 1]);
              if (lastP) {
                const lastIndex = sortedParticipants.indexOf(lastP);
                x = (firstIndex + lastIndex) / 2 * PARTICIPANT_GAP + 50 - 40;
              }
            } else {
              x = baseX - 40;
            }
            break;
        }
      }
    }

    nodes.push({
      id: note.id,
      type: 'note',
      position: { x, y },
      data: { 
        text: note.text,
        notePosition: note.position,
        participantIds: note.participantIds
      },
    });
  });

  const addBlockNodes = (blocks: Block[]) => {
    blocks.forEach((block) => {
      const blockNode = createBlockNode(block, diagram, participantPositions);
      if (blockNode) {
        nodes.push(blockNode);
      }
      if (block.children && block.children.length > 0) {
        addBlockNodes(block.children);
      }
    });
  };
  addBlockNodes(diagram.blocks);
  
  return nodes;
}

function calculateActivationRanges(diagram: SequenceDiagram): Map<string, { startY: number; endY: number }[]> {
  const ranges = new Map<string, { startY: number; endY: number }[]>();
  
  for (const activation of diagram.activations) {
    const startMsg = diagram.messages.find(m => m.id === activation.startMessageId);
    const endMsg = diagram.messages.find(m => m.id === activation.endMessageId);
    
    if (startMsg && endMsg) {
      const startY = getEventY(startMsg.order, diagram);
      const endY = getEventY(endMsg.order, diagram);
      
      const existing = ranges.get(activation.participantId) || [];
      existing.push({ startY, endY });
      ranges.set(activation.participantId, existing);
    }
  }
  
  return ranges;
}

function createBlockNode(
  block: Block, 
  diagram: SequenceDiagram, 
  participantPositions: Map<string, number>
): Node | null {
  const allMessageIds = getAllBlockMessageIds(block);
  const messageBaseY = MESSAGE_BASE_Y;

  const messages = allMessageIds
    .map(id => diagram.messages.find(m => m.id === id))
    .filter((m): m is Message => m !== undefined);

  const notes = allMessageIds
    .map(id => diagram.notes.find(n => n.id === id))
    .filter((n): n is Note => n !== undefined);

  let x: number, y: number, width: number, height: number;

  if (messages.length === 0 && notes.length === 0) {
    x = 50;
    y = PARTICIPANT_Y + PARTICIPANT_HEIGHT + 50;
    width = PARTICIPANT_GAP + PARTICIPANT_WIDTH;
    height = 80;
  } else {
    const allParticipantIds = new Set<string>();
    messages.forEach(m => {
      allParticipantIds.add(m.from);
      allParticipantIds.add(m.to);
    });
    notes.forEach(n => {
      n.participantIds.forEach(id => allParticipantIds.add(id));
    });

    const positions = [...allParticipantIds]
      .map(id => participantPositions.get(id) ?? 0);
    
    const minPos = Math.min(...positions);
    const maxPos = Math.max(...positions);

    const allOrders = [
      ...messages.map(m => m.order),
      ...notes.map(n => n.order),
    ];
    const minOrder = Math.min(...allOrders);
    const maxOrder = Math.max(...allOrders);

    x = minPos * PARTICIPANT_GAP + 50 - BLOCK_PADDING;
    y = messageBaseY + getEventY(minOrder, diagram) - BLOCK_PADDING;
    width = (maxPos - minPos) * PARTICIPANT_GAP + PARTICIPANT_WIDTH + BLOCK_PADDING * 2;
    height = (maxOrder - minOrder + 1) * MESSAGE_SPACING + BLOCK_PADDING * 2;
  }

  return {
    id: block.id,
    type: 'block',
    position: { x, y },
    style: { width, height },
    data: {
      blockType: block.type,
      label: block.label,
    },
    draggable: true,
    selectable: true,
    zIndex: -1,
  };
}

function getAllBlockMessageIds(block: Block): string[] {
  const ids = [...block.messageIds];
  if (block.children) {
    for (const child of block.children) {
      ids.push(...getAllBlockMessageIds(child));
    }
  }
  return ids;
}

function addToBlock(blocks: Block[], parentBlockId: string, itemId: string): Block[] {
  return blocks.map(block => {
    if (block.id === parentBlockId) {
      return {
        ...block,
        messageIds: [...block.messageIds, itemId],
      };
    }
    if (block.children && block.children.length > 0) {
      return {
        ...block,
        children: addToBlock(block.children, parentBlockId, itemId),
      };
    }
    return block;
  });
}

function addChildBlockToParent(blocks: Block[], parentBlockId: string, childBlock: Block): Block[] {
  return blocks.map(block => {
    if (block.id === parentBlockId) {
      return {
        ...block,
        children: [...(block.children || []), childBlock],
      };
    }
    if (block.children && block.children.length > 0) {
      return {
        ...block,
        children: addChildBlockToParent(block.children, parentBlockId, childBlock),
      };
    }
    return block;
  });
}

function diagramToEdges(diagram: SequenceDiagram): Edge[] {
  const edges: Edge[] = [];
  const participantPositions = new Map<string, number>();
  
  const sortedParticipants = [...diagram.participants].sort((a, b) => a.order - b.order);
  sortedParticipants.forEach((p, index) => {
    participantPositions.set(p.id, index);
  });
  
  const sortedMessages = [...diagram.messages].sort((a, b) => a.order - b.order);
  sortedMessages.forEach((msg) => {
    const fromPos = participantPositions.get(msg.from) ?? 0;
    const toPos = participantPositions.get(msg.to) ?? 0;
    const isLeftToRight = fromPos <= toPos;
    
    edges.push({
      id: msg.id,
      source: msg.from,
      target: msg.to,
      sourceHandle: isLeftToRight ? 'source-right' : 'source-left',
      targetHandle: isLeftToRight ? 'target-left' : 'target-right',
      type: 'message',
      data: {
        text: msg.text,
        messageType: msg.type,
        order: msg.order,
        yOffset: getEventY(msg.order, diagram),
      },
      animated: msg.type.includes('Dotted'),
    });
  });
  
  return edges;
}

export const useDiagramStore = create<DiagramState & DiagramActions>((set, get) => ({
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

  loadFromMermaid: (code: string) => {
    console.log('[AIMermaid] Loading mermaid code:', code);
    const diagram = parseMermaidSequence(code);
    console.log('[AIMermaid] Parsed diagram:', JSON.stringify(diagram, null, 2));
    const nodes = diagramToNodes(diagram);
    console.log('[AIMermaid] Generated nodes:', nodes.length, nodes);
    const edges = diagramToEdges(diagram);
    console.log('[AIMermaid] Generated edges:', edges.length, edges);
    set({ diagram, nodes, edges, history: [diagram], historyIndex: 0 });
  },

  toMermaid: () => {
    return generateMermaidSequence(get().diagram);
  },

  recalculateAllBlockContents: () => {
    const { diagram, nodes } = get();
    if (diagram.blocks.length === 0) return;

    const blockNodes = nodes.filter(n => n.type === 'block');
    if (blockNodes.length === 0) return;

    console.log('[AIMermaid] recalculateAllBlockContents:');
    console.log('[AIMermaid] - blocks:', diagram.blocks.length);
    console.log('[AIMermaid] - blockNodes:', blockNodes.map(n => ({ id: n.id, y: n.position.y, style: n.style, measured: n.measured })));
    console.log('[AIMermaid] - messages:', diagram.messages.map(m => ({ id: m.id, order: m.order, y: getEventY(m.order, diagram) })));

    const messageBaseY = MESSAGE_BASE_Y;

    const recalcBlock = (block: Block): Block => {
      const blockNode = blockNodes.find(n => n.id === block.id);
      if (!blockNode) {
        console.log('[AIMermaid] Block node not found:', block.id);
        return block;
      }

      const blockTop = blockNode.position.y;
      const blockHeight = (typeof blockNode.style?.height === 'number' ? blockNode.style.height : blockNode.measured?.height) || 100;
      const blockBottom = blockTop + blockHeight;

      console.log('[AIMermaid] Block bounds:', { id: block.id, top: blockTop, height: blockHeight, bottom: blockBottom });

      const coveredIds: string[] = [];

      for (const msg of diagram.messages) {
        const msgAbsoluteY = messageBaseY + getEventY(msg.order, diagram);
        console.log('[AIMermaid] Message check:', { id: msg.id, y: msgAbsoluteY, inBounds: msgAbsoluteY > blockTop && msgAbsoluteY < blockBottom });
        if (msgAbsoluteY > blockTop && msgAbsoluteY < blockBottom) {
          coveredIds.push(msg.id);
        }
      }

      for (const note of diagram.notes) {
        const noteNode = nodes.find(n => n.id === note.id && n.type === 'note');
        if (noteNode) {
          const noteY = noteNode.position.y;
          if (noteY > blockTop && noteY < blockBottom) {
            coveredIds.push(note.id);
          }
        }
      }

      console.log('[AIMermaid] Covered IDs:', coveredIds);

      const newChildren = block.children ? block.children.map(recalcBlock) : undefined;
      
      if (newChildren) {
        for (const child of newChildren) {
          for (const childMsgId of child.messageIds) {
            const idx = coveredIds.indexOf(childMsgId);
            if (idx !== -1) {
              coveredIds.splice(idx, 1);
            }
          }
        }
      }

      return { ...block, messageIds: coveredIds, children: newChildren };
    };

    const newBlocks = diagram.blocks.map(recalcBlock);
    console.log('[AIMermaid] New blocks:', JSON.stringify(newBlocks, null, 2));
    
    const newDiagram = { ...diagram, blocks: newBlocks };
    set({
      diagram: newDiagram,
    });
  },

  setTheme: (theme) => set({ theme }),

  addParticipant: (name, type = 'participant') => {
    const { diagram, pushHistory } = get();
    pushHistory();
    
    const newParticipant: Participant = {
      id: `p_${Date.now()}`,
      name,
      type,
      order: diagram.participants.length,
    };
    
    const newDiagram = {
      ...diagram,
      participants: [...diagram.participants, newParticipant],
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  updateParticipant: (id, updates) => {
    const { diagram, pushHistory } = get();
    pushHistory();
    
    const newDiagram = {
      ...diagram,
      participants: diagram.participants.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  removeParticipant: (id) => {
    const { diagram, pushHistory } = get();
    pushHistory();
    
    const newDiagram = {
      ...diagram,
      participants: diagram.participants.filter((p) => p.id !== id),
      messages: diagram.messages.filter((m) => m.from !== id && m.to !== id),
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  addMessage: (from, to, text, type = 'sync') => {
    const { diagram, pushHistory } = get();
    pushHistory();
    
    const newMessage: Message = {
      id: `m_${Date.now()}`,
      from,
      to,
      text,
      type,
      order: diagram.messages.length,
    };
    
    const newDiagram = {
      ...diagram,
      messages: [...diagram.messages, newMessage],
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  updateMessage: (id, updates) => {
    const { diagram, pushHistory } = get();
    pushHistory();
    
    const newDiagram = {
      ...diagram,
      messages: diagram.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  removeMessage: (id) => {
    const { diagram, pushHistory } = get();
    pushHistory();
    
    const newDiagram = {
      ...diagram,
      messages: diagram.messages.filter((m) => m.id !== id),
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  moveMessageUp: (id) => {
    const { diagram, pushHistory } = get();
    const sortedMessages = [...diagram.messages].sort((a, b) => a.order - b.order);
    const index = sortedMessages.findIndex(m => m.id === id);
    if (index <= 0) return;

    pushHistory();
    const prevMsg = sortedMessages[index - 1];
    const currMsg = sortedMessages[index];
    
    const newDiagram = {
      ...diagram,
      messages: diagram.messages.map(m => {
        if (m.id === currMsg.id) return { ...m, order: prevMsg.order };
        if (m.id === prevMsg.id) return { ...m, order: currMsg.order };
        return m;
      }),
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  moveMessageDown: (id) => {
    const { diagram, pushHistory } = get();
    const sortedMessages = [...diagram.messages].sort((a, b) => a.order - b.order);
    const index = sortedMessages.findIndex(m => m.id === id);
    if (index < 0 || index >= sortedMessages.length - 1) return;

    pushHistory();
    const nextMsg = sortedMessages[index + 1];
    const currMsg = sortedMessages[index];
    
    const newDiagram = {
      ...diagram,
      messages: diagram.messages.map(m => {
        if (m.id === currMsg.id) return { ...m, order: nextMsg.order };
        if (m.id === nextMsg.id) return { ...m, order: currMsg.order };
        return m;
      }),
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  addNote: (text, position, participantIds, parentBlockId) => {
    const { diagram, pushHistory } = get();
    pushHistory();
    
    const maxOrder = Math.max(
      ...diagram.messages.map(m => m.order),
      ...diagram.notes.map(n => n.order),
      -1
    );
    
    const newNote: Note = {
      id: `n_${Date.now()}`,
      text,
      position,
      participantIds,
      order: maxOrder + 1,
    };
    
    let newBlocks = diagram.blocks;
    if (parentBlockId) {
      newBlocks = addToBlock(diagram.blocks, parentBlockId, newNote.id);
    }
    
    const newDiagram = {
      ...diagram,
      notes: [...diagram.notes, newNote],
      blocks: newBlocks,
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  updateNote: (id, updates) => {
    const { diagram, pushHistory } = get();
    pushHistory();
    
    const newDiagram = {
      ...diagram,
      notes: diagram.notes.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      ),
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
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
      edges: diagramToEdges(newDiagram),
    });
  },

  addBlock: (type, label, messageIds, parentBlockId) => {
    const { diagram, pushHistory } = get();
    pushHistory();
    
    const newBlock: Block = {
      id: `b_${Date.now()}`,
      type,
      label,
      messageIds,
      children: [],
    };
    
    let newBlocks: Block[];
    if (parentBlockId) {
      newBlocks = addChildBlockToParent(diagram.blocks, parentBlockId, newBlock);
    } else {
      newBlocks = [...diagram.blocks, newBlock];
    }
    
    const newDiagram = {
      ...diagram,
      blocks: newBlocks,
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  updateBlock: (id, updates) => {
    const { diagram, pushHistory } = get();
    pushHistory();
    
    const newDiagram = {
      ...diagram,
      blocks: diagram.blocks.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  removeBlock: (id) => {
    const { diagram, pushHistory } = get();
    pushHistory();
    
    const newDiagram = {
      ...diagram,
      blocks: diagram.blocks.filter((b) => b.id !== id),
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  onNodesChange: (changes) => {
    const { nodes: currentNodes, diagram } = get();
    const newNodes = applyNodeChanges(changes, currentNodes);
    
    let diagramUpdated = false;
    let newDiagram = diagram;
    
    changes.forEach(change => {
      if (change.type === 'position' && 'position' in change && change.position) {
        const participantNode = currentNodes.find(n => n.id === change.id && n.type === 'participant');
        if (participantNode) {
          const timelineId = `${change.id}_timeline`;
          const timelineIdx = newNodes.findIndex(n => n.id === timelineId);
          if (timelineIdx !== -1) {
            const PARTICIPANT_WIDTH = 120;
            const PARTICIPANT_HEIGHT = 60;
            newNodes[timelineIdx] = {
              ...newNodes[timelineIdx],
              position: {
                x: change.position.x + PARTICIPANT_WIDTH / 2 - 1,
                y: change.position.y + PARTICIPANT_HEIGHT,
              },
            };
          }
        }
      }
      
      if (change.type === 'dimensions' && 'dimensions' in change && change.dimensions) {
        const blockNode = currentNodes.find(n => n.id === change.id && n.type === 'block');
        if (blockNode && change.dimensions) {
          const { width, height } = change.dimensions;
          newDiagram = {
            ...newDiagram,
            blocks: newDiagram.blocks.map(b => 
              b.id === change.id ? { ...b, width, height } : b
            ),
          };
          diagramUpdated = true;
        }
      }
    });
    
    if (diagramUpdated) {
      set({ nodes: newNodes, diagram: newDiagram });
    } else {
      set({ nodes: newNodes });
    }
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    console.log('[Debug] onConnect:', connection);
    if (connection.source && connection.target) {
      // 交换 source 和 target：用户拖动的终点作为消息发送方，起点作为接收方
      // 这样箭头方向符合拖动方向（从拖动终点指向拖动起点 → 箭头指向拖动起点）
      get().addMessage(connection.target, connection.source, 'New Message');
    }
  },

  onNodeDragStop: (nodeId, x, y, width, height) => {
    const { diagram, nodes, pushHistory, syncBlockContents } = get();
    
    const blockNode = nodes.find(n => n.id === nodeId && n.type === 'block');
    if (blockNode && y !== undefined && width !== undefined && height !== undefined) {
      syncBlockContents(nodeId, { x, y, width, height });
      return;
    }
    
    const participant = diagram.participants.find(p => p.id === nodeId);
    if (!participant) return;

    const participantNodes = nodes
      .filter(n => n.type === 'participant')
      .map(n => ({ id: n.id, x: n.id === nodeId ? x : n.position.x }))
      .sort((a, b) => a.x - b.x);

    const newOrders = new Map<string, number>();
    participantNodes.forEach((n, idx) => newOrders.set(n.id, idx));

    const orderChanged = diagram.participants.some(p => p.order !== newOrders.get(p.id));
    if (!orderChanged) return;

    pushHistory();
    const newDiagram = {
      ...diagram,
      participants: diagram.participants.map(p => ({
        ...p,
        order: newOrders.get(p.id) ?? p.order,
      })),
    };

    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
    });
  },

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setSelectedEdges: (ids) => set({ selectedEdgeIds: ids }),
  clearEdgeSelection: () => set({ selectedEdgeIds: [] }),

  deleteSelected: () => {
    const { diagram, selectedNodeId, selectedEdgeId, nodes, pushHistory } = get();
    
    if (selectedEdgeId) {
      const message = diagram.messages.find(m => m.id === selectedEdgeId);
      if (message) {
        pushHistory();
        const newDiagram = {
          ...diagram,
          messages: diagram.messages.filter(m => m.id !== selectedEdgeId),
          blocks: diagram.blocks.map(b => ({
            ...b,
            messageIds: b.messageIds.filter(id => id !== selectedEdgeId),
          })),
        };
        set({
          diagram: newDiagram,
          nodes: diagramToNodes(newDiagram),
          edges: diagramToEdges(newDiagram),
          selectedEdgeId: null,
        });
        return;
      }
    }
    
    if (selectedNodeId) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (!node) return;
      
      pushHistory();
      
      if (node.type === 'participant') {
        const newDiagram = {
          ...diagram,
          participants: diagram.participants.filter(p => p.id !== selectedNodeId),
          messages: diagram.messages.filter(m => m.from !== selectedNodeId && m.to !== selectedNodeId),
          notes: diagram.notes.filter(n => !n.participantIds.includes(selectedNodeId)),
        };
        set({
          diagram: newDiagram,
          nodes: diagramToNodes(newDiagram),
          edges: diagramToEdges(newDiagram),
          selectedNodeId: null,
        });
      } else if (node.type === 'note') {
        const newDiagram = {
          ...diagram,
          notes: diagram.notes.filter(n => n.id !== selectedNodeId),
        };
        set({
          diagram: newDiagram,
          nodes: diagramToNodes(newDiagram),
          edges: diagramToEdges(newDiagram),
          selectedNodeId: null,
        });
      } else if (node.type === 'block') {
        const newDiagram = {
          ...diagram,
          blocks: diagram.blocks.filter(b => b.id !== selectedNodeId),
        };
        set({
          diagram: newDiagram,
          nodes: diagramToNodes(newDiagram),
          edges: diagramToEdges(newDiagram),
          selectedNodeId: null,
        });
      }
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

  getSelectedBlockId: () => {
    const { selectedNodeId, nodes } = get();
    if (!selectedNodeId) return null;
    const node = nodes.find(n => n.id === selectedNodeId);
    if (node && node.type === 'block') {
      return selectedNodeId;
    }
    return null;
  },

  syncBlockContents: (blockId, bounds) => {
    const { diagram, nodes, pushHistory } = get();
    const block = diagram.blocks.find(b => b.id === blockId);
    if (!block) return;

    const messageBaseY = MESSAGE_BASE_Y;

    console.log('[AIMermaid] syncBlockContents:', { blockId, bounds, messageBaseY });
    console.log('[AIMermaid] Messages:', diagram.messages.map(m => ({ 
      id: m.id, 
      order: m.order, 
      relativeY: getEventY(m.order, diagram),
      absoluteY: messageBaseY + getEventY(m.order, diagram)
    })));

    const noteNodes = nodes.filter(n => n.type === 'note');
    const coveredIds: string[] = [];

    for (const msg of diagram.messages) {
      const msgAbsoluteY = messageBaseY + getEventY(msg.order, diagram);
      const inBounds = msgAbsoluteY > bounds.y && msgAbsoluteY < bounds.y + bounds.height;
      console.log('[AIMermaid] Check msg:', { id: msg.id, msgAbsoluteY, boundsY: bounds.y, boundsBottom: bounds.y + bounds.height, inBounds });
      if (inBounds) {
        coveredIds.push(msg.id);
      }
    }

    for (const note of diagram.notes) {
      const noteNode = noteNodes.find(n => n.id === note.id);
      if (noteNode) {
        const noteY = noteNode.position.y;
        if (noteY > bounds.y && noteY < bounds.y + bounds.height) {
          coveredIds.push(note.id);
        }
      }
    }

    console.log('[AIMermaid] Covered IDs:', coveredIds);

    const currentIds = [...block.messageIds].sort();
    const newIds = [...coveredIds].sort();
    const messageIdsChanged = JSON.stringify(currentIds) !== JSON.stringify(newIds);

    // 同步 bounds 到 nodes 数组，保留用户拖拽/resize 后的尺寸
    const newNodes = nodes.map(n =>
      n.id === blockId
        ? {
            ...n,
            position: { x: bounds.x, y: bounds.y },
            style: { ...n.style, width: bounds.width, height: bounds.height },
          }
        : n
    );

    if (messageIdsChanged) {
      pushHistory();
      const newDiagram = {
        ...diagram,
        blocks: diagram.blocks.map(b =>
          b.id === blockId ? { ...b, messageIds: coveredIds } : b
        ),
      };
      set({
        diagram: newDiagram,
        nodes: newNodes,
      });
    } else {
      set({ nodes: newNodes });
    }
  },

  bringToFront: (nodeId) => {
    const { nodes } = get();
    const maxZ = Math.max(...nodes.map(n => n.zIndex ?? 0), 0);
    set({
      nodes: nodes.map(n => n.id === nodeId 
        ? { ...n, zIndex: maxZ + 1, selected: false } 
        : n
      ),
      selectedNodeId: null,
    });
  },

  sendToBack: (nodeId) => {
    const { nodes } = get();
    const minZ = Math.min(...nodes.map(n => n.zIndex ?? 0), 0);
    set({
      nodes: nodes.map(n => n.id === nodeId 
        ? { ...n, zIndex: minZ - 1, selected: false } 
        : n
      ),
      selectedNodeId: null,
    });
  },
}));
