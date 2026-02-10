export type { DiagramAdapter, BaseDiagramState } from './types/diagram';
export type {
  Direction,
  NodeShape,
  EdgeType,
  FlowNode,
  FlowEdge,
  Subgraph,
  ClassDef,
  FlowchartDiagram,
} from './types/flowchart';
export type {
  StateType,
  DiagramDirection,
  NotePosition as StateNotePosition,
  State,
  Transition,
  StateNote,
  StateClassDef,
  StateClassAssignment,
  StateDiagram,
} from './types/stateDiagram';

export type MessageType =
  | 'sync'
  | 'syncDotted'
  | 'asyncOpen'
  | 'asyncDotted'
  | 'syncCross'
  | 'syncDottedCross';

export type ParticipantType = 'participant' | 'actor';

export type NotePosition = 'left' | 'right' | 'over';

export type BlockType = 'loop' | 'alt' | 'else' | 'opt' | 'par' | 'critical' | 'break';

export interface Participant {
  id: string;
  name: string;
  alias?: string;
  type: ParticipantType;
  order: number;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  type: MessageType;
  order: number;
  activateTarget?: boolean;
  deactivateTarget?: boolean;
}

export interface Note {
  id: string;
  text: string;
  position: NotePosition;
  participantIds: string[];
  order: number;
}

export interface Activation {
  id: string;
  participantId: string;
  startMessageId: string;
  endMessageId: string;
}

export interface Block {
  id: string;
  type: BlockType;
  label: string;
  messageIds: string[];
  children?: Block[];
  width?: number;
  height?: number;
}

export interface SequenceDiagram {
  type: 'sequence';
  participants: Participant[];
  messages: Message[];
  notes: Note[];
  activations: Activation[];
  blocks: Block[];
}

import type { DiagramType as DT } from './types/diagram';
export type { DT as DiagramType };

export type ExtensionMessage =
  | { type: 'init'; data: { mermaidCode: string; theme: string; diagramType: DT } }
  | { type: 'themeChanged'; data: { theme: string } };

export type WebviewMessage =
  | { type: 'save'; data: { mermaidCode: string } }
  | { type: 'cancel' }
  | { type: 'ready' };

export interface MermaidBlock {
  startLine: number;
  endLine: number;
  content: string;
}
