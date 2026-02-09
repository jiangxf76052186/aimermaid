import type { Node, Edge } from '@xyflow/react';
import type { DiagramAdapter, SequenceDiagram } from '@shared/types';
import { ParticipantNode, TimelineNode, NoteNode, BlockNode } from './nodes';
import { MessageEdge } from './edges';
import { parseMermaidSequence, generateMermaidSequence } from './utils';
import { SequenceToolbar, SequencePropertyPanel } from './components';

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
  if (index === -1) return 80;
  return 80 + index * MESSAGE_SPACING;
}

function calculateTimelineHeight(diagram: SequenceDiagram): number {
  const eventCount = diagram.messages.length + diagram.notes.length;
  return Math.max(TIMELINE_MIN_HEIGHT, eventCount * MESSAGE_SPACING + TIMELINE_PADDING);
}

function stateToNodes(diagram: SequenceDiagram): Node[] {
  const nodes: Node[] = [];
  const timelineHeight = calculateTimelineHeight(diagram);
  
  const sortedParticipants = [...diagram.participants].sort((a, b) => a.order - b.order);
  const participantPositions = new Map<string, number>();
  sortedParticipants.forEach((p, index) => {
    participantPositions.set(p.id, index);
  });

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
    
    nodes.push({
      id: `${p.id}_timeline`,
      type: 'timeline',
      position: { x: index * PARTICIPANT_GAP + 50 + PARTICIPANT_WIDTH / 2 - 1, y: PARTICIPANT_Y + PARTICIPANT_HEIGHT },
      data: { 
        participantId: p.id, 
        height: timelineHeight,
        activations: [],
      },
      draggable: false,
      selectable: false,
    });
  });

  diagram.notes.forEach((note) => {
    const y = MESSAGE_BASE_Y + getEventY(note.order, diagram);
    let x = 0;
    
    if (note.participantIds.length > 0) {
      const firstP = sortedParticipants.find(p => p.id === note.participantIds[0]);
      if (firstP) {
        const firstIndex = sortedParticipants.indexOf(firstP);
        const baseX = firstIndex * PARTICIPANT_GAP + 50;
        
        switch (note.position) {
          case 'left': x = baseX + NOTE_OFFSET_LEFT; break;
          case 'right': x = baseX + NOTE_OFFSET_RIGHT; break;
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

  diagram.blocks.forEach((block) => {
    const allMessageIds = [...block.messageIds];
    const messages = allMessageIds.map(id => diagram.messages.find(m => m.id === id)).filter(Boolean);
    
    let x = 50, y = PARTICIPANT_Y + PARTICIPANT_HEIGHT + 50, width = PARTICIPANT_GAP + PARTICIPANT_WIDTH, height = 80;
    
    if (messages.length > 0) {
      const allParticipantIds = new Set<string>();
      messages.forEach(m => {
        if (m) {
          allParticipantIds.add(m.from);
          allParticipantIds.add(m.to);
        }
      });
      
      const positions = [...allParticipantIds].map(id => participantPositions.get(id) ?? 0);
      const minPos = Math.min(...positions);
      const maxPos = Math.max(...positions);
      
      const allOrders = messages.map(m => m?.order ?? 0);
      const minOrder = Math.min(...allOrders);
      const maxOrder = Math.max(...allOrders);
      
      x = minPos * PARTICIPANT_GAP + 50 - BLOCK_PADDING;
      y = MESSAGE_BASE_Y + getEventY(minOrder, diagram) - BLOCK_PADDING;
      width = (maxPos - minPos) * PARTICIPANT_GAP + PARTICIPANT_WIDTH + BLOCK_PADDING * 2;
      height = (maxOrder - minOrder + 1) * MESSAGE_SPACING + BLOCK_PADDING * 2;
    }
    
    nodes.push({
      id: block.id,
      type: 'block',
      position: { x, y },
      style: { width, height },
      data: { blockType: block.type, label: block.label },
      draggable: true,
      selectable: true,
      zIndex: -1,
    });
  });
  
  return nodes;
}

function stateToEdges(diagram: SequenceDiagram): Edge[] {
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

export const SequenceAdapter: DiagramAdapter<SequenceDiagram> = {
  type: 'sequence',
  name: '时序图',
  
  parse: parseMermaidSequence,
  generate: generateMermaidSequence,
  
  detect: (code: string) => {
    const firstLine = code.trim().split('\n')[0].toLowerCase().trim();
    return firstLine.startsWith('sequencediagram');
  },
  
  nodeTypes: {
    participant: ParticipantNode,
    timeline: TimelineNode,
    note: NoteNode,
    block: BlockNode,
  },
  
  edgeTypes: {
    message: MessageEdge,
  },
  
  Toolbar: SequenceToolbar,
  PropertyPanel: SequencePropertyPanel,
  
  stateToNodes,
  stateToEdges,
  
  createInitialState: () => ({
    type: 'sequence',
    participants: [],
    messages: [],
    notes: [],
    activations: [],
    blocks: [],
  }),
};
