import {
  SequenceDiagram,
  Participant,
  Message,
  Note,
  Block,
  BlockType,
  MessageType,
  ParticipantType,
  NotePosition,
  Activation,
} from '@shared/types';
import { SYMBOL_TO_MESSAGE_TYPE } from '@shared/constants';

const BLOCK_START_REGEX = /^(loop|alt|opt|par|critical|break)\b\s*(.*)$/i;
const BLOCK_ELSE_REGEX = /^else\s*(.*)?$/i;
const BLOCK_END_REGEX = /^end$/i;
const MESSAGE_REGEX = /^(\w+)(-->>|-->|--\)|--x|->>|->|-\)|-x)(\+|-)?(\w+)\s*:\s*(.*)$/;
const NOTE_REGEX = /^Note\s+(left of|right of|over)\s+(\w+(?:,\s*\w+)?)\s*:\s*(.*)$/i;

interface ParseContext {
  lines: string[];
  diagram: SequenceDiagram;
  participantMap: Map<string, Participant>;
  messageOrder: { value: number };
  getOrCreateParticipant: (name: string, type?: ParticipantType) => Participant;
}

function parseMessageLine(ctx: ParseContext, line: string): Message | null {
  const match = line.match(MESSAGE_REGEX);
  if (!match) return null;

  const [, from, arrow, activationFlag, to, text] = match;
  const fromP = ctx.getOrCreateParticipant(from);
  const toP = ctx.getOrCreateParticipant(to);

  const msgType: MessageType = (SYMBOL_TO_MESSAGE_TYPE[arrow] as MessageType) || 'sync';

  const message: Message = {
    id: `m_${ctx.messageOrder.value}`,
    from: fromP.id,
    to: toP.id,
    text,
    type: msgType,
    order: ctx.messageOrder.value++,
    activateTarget: activationFlag === '+',
    deactivateTarget: activationFlag === '-',
  };
  ctx.diagram.messages.push(message);
  return message;
}

function parseNoteLine(ctx: ParseContext, line: string): Note | null {
  const match = line.match(NOTE_REGEX);
  if (!match) return null;

  const [, positionStr, participantsStr, text] = match;
  let position: NotePosition = 'over';
  if (positionStr === 'left of') position = 'left';
  else if (positionStr === 'right of') position = 'right';

  const participantNames = participantsStr.split(',').map((s) => s.trim());
  const participantIds = participantNames.map((name) => ctx.getOrCreateParticipant(name).id);

  const note: Note = {
    id: `n_${ctx.diagram.notes.length}`,
    text,
    position,
    participantIds,
    order: ctx.messageOrder.value++,
  };
  ctx.diagram.notes.push(note);
  return note;
}

function parseBlock(
  ctx: ParseContext,
  startIndex: number,
  parentId?: string
): { block: Block; endIndex: number } | null {
  const line = ctx.lines[startIndex];
  const startMatch = line.match(BLOCK_START_REGEX);
  if (!startMatch) return null;

  const [, typeStr, label = ''] = startMatch;
  const blockType = typeStr.toLowerCase() as BlockType;
  const blockId = parentId ? `${parentId}_b${ctx.diagram.blocks.length}` : `b_${ctx.diagram.blocks.length}`;

  const block: Block = {
    id: blockId,
    type: blockType,
    label: label.trim(),
    messageIds: [],
    children: [],
  };

  let i = startIndex + 1;
  while (i < ctx.lines.length) {
    const currentLine = ctx.lines[i];

    // End of current block
    if (BLOCK_END_REGEX.test(currentLine)) {
      i++;
      break;
    }

    // Else branch in alt block
    if (BLOCK_ELSE_REGEX.test(currentLine) && blockType === 'alt') {
      const elseMatch = currentLine.match(BLOCK_ELSE_REGEX);
      if (elseMatch) {
        const elseLabel = elseMatch[1] || '';
        const elseBlock: Block = {
          id: `${blockId}_else`,
          type: 'else',
          label: elseLabel.trim(),
          messageIds: [],
          children: [],
        };
        i++;
        // Parse content until end or another else
        while (i < ctx.lines.length && !BLOCK_END_REGEX.test(ctx.lines[i]) && !BLOCK_ELSE_REGEX.test(ctx.lines[i])) {
          const elseLine = ctx.lines[i];
          
          // Check for nested blocks
          const nestedResult = parseBlock(ctx, i, elseBlock.id);
          if (nestedResult) {
            elseBlock.children?.push(nestedResult.block);
            i = nestedResult.endIndex;
            continue;
          }

          // Check for messages
          const msg = parseMessageLine(ctx, elseLine);
          if (msg) {
            elseBlock.messageIds.push(msg.id);
            i++;
            continue;
          }

          // Check for notes
          const note = parseNoteLine(ctx, elseLine);
          if (note) {
            elseBlock.messageIds.push(note.id);
            i++;
            continue;
          }

          i++;
        }
        block.children?.push(elseBlock);
        continue;
      }
    }

    // Check for nested blocks
    const nestedResult = parseBlock(ctx, i, blockId);
    if (nestedResult) {
      block.children?.push(nestedResult.block);
      i = nestedResult.endIndex;
      continue;
    }

    // Check for messages
    const msg = parseMessageLine(ctx, currentLine);
    if (msg) {
      block.messageIds.push(msg.id);
      i++;
      continue;
    }

    // Check for notes
    const note = parseNoteLine(ctx, currentLine);
    if (note) {
      block.messageIds.push(note.id);
      i++;
      continue;
    }

    i++;
  }

  return { block, endIndex: i };
}

function computeActivations(diagram: SequenceDiagram): Activation[] {
  const activations: Activation[] = [];
  const activationStack: Map<string, string[]> = new Map();

  const sortedMessages = [...diagram.messages].sort((a, b) => a.order - b.order);

  for (const msg of sortedMessages) {
    if (msg.activateTarget) {
      const stack = activationStack.get(msg.to) || [];
      stack.push(msg.id);
      activationStack.set(msg.to, stack);
    }

    if (msg.deactivateTarget) {
      const stack = activationStack.get(msg.to);
      if (stack && stack.length > 0) {
        const startMsgId = stack.pop()!;
        activations.push({
          id: `act_${activations.length}`,
          participantId: msg.to,
          startMessageId: startMsgId,
          endMessageId: msg.id,
        });
        activationStack.set(msg.to, stack);
      }
    }
  }

  return activations;
}

export function parseMermaidSequence(code: string): SequenceDiagram {
  const lines = code.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('%'));

  const diagram: SequenceDiagram = {
    participants: [],
    messages: [],
    notes: [],
    activations: [],
    blocks: [],
  };

  const messageOrder = { value: 0 };
  const participantMap = new Map<string, Participant>();

  const getOrCreateParticipant = (name: string, type: ParticipantType = 'participant'): Participant => {
    if (!participantMap.has(name)) {
      const participant: Participant = {
        id: `p_${participantMap.size}`,
        name,
        type,
        order: participantMap.size,
      };
      participantMap.set(name, participant);
      diagram.participants.push(participant);
    }
    return participantMap.get(name)!;
  };

  const ctx: ParseContext = {
    lines,
    diagram,
    participantMap,
    messageOrder,
    getOrCreateParticipant,
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line === 'sequenceDiagram') {
      i++;
      continue;
    }

    // Participant declarations
    const participantMatch = line.match(/^(participant|actor)\s+(\w+)(?:\s+as\s+"?([^"]+)"?)?$/);
    if (participantMatch) {
      const [, typeStr, id, alias] = participantMatch;
      const type = typeStr as ParticipantType;
      const participant = getOrCreateParticipant(id, type);
      if (alias) {
        participant.alias = alias;
      }
      i++;
      continue;
    }

    // Blocks
    const blockResult = parseBlock(ctx, i);
    if (blockResult) {
      diagram.blocks.push(blockResult.block);
      i = blockResult.endIndex;
      continue;
    }

    // Standalone messages (outside blocks)
    const msg = parseMessageLine(ctx, line);
    if (msg) {
      i++;
      continue;
    }

    // Standalone notes (outside blocks)
    const note = parseNoteLine(ctx, line);
    if (note) {
      i++;
      continue;
    }

    i++;
  }

  // Compute activations from message flags
  diagram.activations = computeActivations(diagram);

  return diagram;
}
