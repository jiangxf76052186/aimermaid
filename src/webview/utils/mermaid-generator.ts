import { SequenceDiagram, Message, Note, Participant, Block } from '@shared/types';
import { MESSAGE_TYPE_SYMBOLS } from '@shared/constants';

export function generateMermaidSequence(diagram: SequenceDiagram): string {
  const lines: string[] = ['sequenceDiagram'];

  const sortedParticipants = [...diagram.participants].sort((a, b) => a.order - b.order);
  for (const p of sortedParticipants) {
    const typeStr = p.type === 'actor' ? 'actor' : 'participant';
    if (p.alias) {
      lines.push(`    ${typeStr} ${p.name} as "${p.alias}"`);
    } else {
      lines.push(`    ${typeStr} ${p.name}`);
    }
  }

  const participantById = new Map<string, Participant>();
  for (const p of diagram.participants) {
    participantById.set(p.id, p);
  }

  type OrderedItem = { order: number; render: () => string };
  const orderedItems: OrderedItem[] = [];

  for (const msg of diagram.messages) {
    const isInBlock = diagram.blocks?.some(
      (block) => block.messageIds.includes(msg.id) || isMessageInChildren(block, msg.id)
    );
    if (!isInBlock) {
      orderedItems.push({
        order: msg.order,
        render: () => renderMessage(msg, participantById),
      });
    }
  }

  for (const note of diagram.notes) {
    const isInBlock = diagram.blocks?.some(
      (block) => block.messageIds.includes(note.id) || isNoteInChildren(block, note.id)
    );
    if (!isInBlock) {
      orderedItems.push({
        order: note.order,
        render: () => renderNote(note, participantById),
      });
    }
  }

  if (diagram.blocks && diagram.blocks.length > 0) {
    for (const block of diagram.blocks) {
      // 跳过空 Block（没有任何消息或子块），避免 Mermaid 渲染器崩溃
      const allMessageIds = getAllBlockMessageIds(block);
      if (allMessageIds.length === 0) {
        continue;
      }
      const blockLines = renderBlock(block, diagram, participantById, 4);
      orderedItems.push({
        order: getBlockOrder(block, diagram),
        render: () => blockLines.join('\n'),
      });
    }
  }

  orderedItems.sort((a, b) => a.order - b.order);
  for (const item of orderedItems) {
    lines.push(item.render());
  }

  return lines.join('\n');
}

function renderMessage(msg: Message, participantById: Map<string, Participant>, indent: number = 4): string {
  const fromName = participantById.get(msg.from)?.name ?? msg.from;
  const toName = participantById.get(msg.to)?.name ?? msg.to;
  let arrow = MESSAGE_TYPE_SYMBOLS[msg.type] ?? '->>';

  if (msg.activateTarget) {
    arrow = arrow + '+';
  } else if (msg.deactivateTarget) {
    arrow = arrow + '-';
  }

  const spaces = ' '.repeat(indent);
  return `${spaces}${fromName}${arrow}${toName}: ${msg.text}`;
}

function renderNote(note: Note, participantById: Map<string, Participant>, indent: number = 4): string {
  const participantNames = note.participantIds
    .map((id) => participantById.get(id)?.name ?? id)
    .join(', ');
  let positionStr: string;
  switch (note.position) {
    case 'left':
      positionStr = 'left of';
      break;
    case 'right':
      positionStr = 'right of';
      break;
    default:
      positionStr = 'over';
  }
  const spaces = ' '.repeat(indent);
  return `${spaces}Note ${positionStr} ${participantNames}: ${note.text}`;
}

function isMessageInChildren(block: Block, messageId: string): boolean {
  if (block.children) {
    for (const child of block.children) {
      if (child.messageIds.includes(messageId) || isMessageInChildren(child, messageId)) {
        return true;
      }
    }
  }
  return false;
}

function isNoteInChildren(block: Block, noteId: string): boolean {
  if (block.children) {
    for (const child of block.children) {
      if (child.messageIds.includes(noteId) || isNoteInChildren(child, noteId)) {
        return true;
      }
    }
  }
  return false;
}

function getBlockOrder(block: Block, diagram: SequenceDiagram): number {
  const allIds = getAllBlockMessageIds(block);
  let minOrder = Infinity;
  
  for (const id of allIds) {
    const msg = diagram.messages.find(m => m.id === id);
    if (msg && msg.order < minOrder) {
      minOrder = msg.order;
    }
    const note = diagram.notes.find(n => n.id === id);
    if (note && note.order < minOrder) {
      minOrder = note.order;
    }
  }
  
  if (minOrder === Infinity) {
    const maxOrder = Math.max(
      ...diagram.messages.map(m => m.order),
      ...diagram.notes.map(n => n.order),
      -1
    );
    return maxOrder + 1;
  }
  
  return minOrder;
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

function renderBlock(
  block: Block,
  diagram: SequenceDiagram,
  participantById: Map<string, Participant>,
  indent: number = 4
): string[] {
  const lines: string[] = [];
  const spaces = ' '.repeat(indent);

  if (block.type === 'else') {
    lines.push(`${spaces}else ${block.label || ''}`.trimEnd());
  } else {
    const label = block.label ? ` ${block.label}` : '';
    lines.push(`${spaces}${block.type}${label}`);
  }

  type ContentItem = { order: number; render: () => string[] };
  const contentItems: ContentItem[] = [];

  for (const msgId of block.messageIds) {
    const msg = diagram.messages.find(m => m.id === msgId);
    if (msg) {
      contentItems.push({
        order: msg.order,
        render: () => [renderMessage(msg, participantById, indent + 4)],
      });
    }
    const note = diagram.notes.find(n => n.id === msgId);
    if (note) {
      contentItems.push({
        order: note.order,
        render: () => [renderNote(note, participantById, indent + 4)],
      });
    }
  }

  if (block.children) {
    for (const child of block.children) {
      if (child.type === 'else') {
        contentItems.push({
          order: getBlockOrder(child, diagram),
          render: () => renderBlock(child, diagram, participantById, indent),
        });
      } else {
        contentItems.push({
          order: getBlockOrder(child, diagram),
          render: () => renderBlock(child, diagram, participantById, indent + 4),
        });
      }
    }
  }

  contentItems.sort((a, b) => a.order - b.order);
  for (const item of contentItems) {
    lines.push(...item.render());
  }

  if (block.type !== 'else') {
    lines.push(`${spaces}end`);
  }

  return lines;
}


