export const MERMAID_FENCE_START = /^\s*```mermaid\s*$/i;
export const MERMAID_FENCE_END = /^\s*```\s*$/;
export const SEQUENCE_DIAGRAM_START = /^\s*sequenceDiagram\s*$/;

export const MESSAGE_TYPE_SYMBOLS: Record<string, string> = {
  sync: '->>',
  syncDotted: '-->>',
  asyncOpen: '-)',
  asyncDotted: '--)',
  syncCross: '-x',
  syncDottedCross: '--x',
};

export const SYMBOL_TO_MESSAGE_TYPE: Record<string, string> = {
  '->>': 'sync',
  '-->>': 'syncDotted',
  '->': 'sync',
  '-->': 'syncDotted',
  '-)': 'asyncOpen',
  '--)': 'asyncDotted',
  '-x': 'syncCross',
  '--x': 'syncDottedCross',
};
