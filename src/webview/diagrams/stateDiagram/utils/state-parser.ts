import type {
  StateDiagram,
  State,
  StateNote,
  StateType,
  DiagramDirection,
  NotePosition,
} from '@shared/types/stateDiagram';

export function parseStateDiagram(code: string): StateDiagram {
  const lines = code
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%'));

  const diagram: StateDiagram = {
    type: 'state',
    direction: 'TB',
    states: [],
    transitions: [],
    notes: [],
    classDefs: [],
    classAssignments: [],
  };

  const stateMap = new Map<string, State>();
  
  let startCount = 0;
  let endCount = 0;
  let transitionCount = 0;
  let noteCount = 0;

  const parentStack: string[] = [];
  let currentParentId: string | undefined = undefined;

  let inMultiLineNote = false;
  let currentNote: Partial<StateNote> | null = null;

  const getOrCreateState = (name: string, type: StateType = 'normal', description?: string): State => {
    if (name === '[*]') {
      if (type === 'start') {
        const id = `__start__${startCount++}`;
        const state: State = {
          id,
          name: '[*]',
          type: 'start',
          parentId: currentParentId,
          order: diagram.states.length,
          position: { x: 0, y: 0 },
        };
        diagram.states.push(state);
        return state;
      } else {
        const id = `__end__${endCount++}`;
        const state: State = {
          id,
          name: '[*]',
          type: 'end',
          parentId: currentParentId,
          order: diagram.states.length,
          position: { x: 0, y: 0 },
        };
        diagram.states.push(state);
        return state;
      }
    }

    if (stateMap.has(name)) {
      const existingState = stateMap.get(name)!;
      if (description && !existingState.description) {
        existingState.description = description;
      }
      if (type !== 'normal' && existingState.type === 'normal') {
        existingState.type = type;
      }
      if (currentParentId && !existingState.parentId) {
        existingState.parentId = currentParentId;
      }
      return existingState;
    }

    const newState: State = {
      id: name,
      name,
      description: description || name,
      type,
      parentId: currentParentId,
      order: diagram.states.length,
      position: { x: 0, y: 0 },
    };

    stateMap.set(name, newState);
    diagram.states.push(newState);
    return newState;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/^stateDiagram(-v2)?$/)) {
      continue;
    }

    if (inMultiLineNote && currentNote) {
      if (line === 'end note') {
        if (currentNote.id && currentNote.stateId && currentNote.position) {
          diagram.notes.push({
            id: currentNote.id,
            text: currentNote.text || '',
            position: currentNote.position,
            stateId: currentNote.stateId,
            order: diagram.notes.length,
          });
        }
        inMultiLineNote = false;
        currentNote = null;
      } else {
        currentNote.text = currentNote.text ? `${currentNote.text}\n${line}` : line;
      }
      continue;
    }

    const directionMatch = line.match(/^direction\s+(TB|TD|LR|RL|BT)$/);
    if (directionMatch) {
      diagram.direction = directionMatch[1] as DiagramDirection;
      continue;
    }

    if (line === '}') {
      if (parentStack.length > 0) {
        currentParentId = parentStack.pop();
      } else {
        currentParentId = undefined;
      }
      continue;
    }

    const compositeMatch = line.match(/^state\s+(?:"([^"]+)"\s+as\s+)?(\w+)\s*\{$/);
    if (compositeMatch) {
      const description = compositeMatch[1];
      const name = compositeMatch[2];
      
      getOrCreateState(name, 'composite', description);
      
      if (currentParentId !== undefined) {
        parentStack.push(currentParentId);
      }
      currentParentId = name;
      continue;
    }

    const stateDescAsMatch = line.match(/^state\s+"([^"]+)"\s+as\s+(\w+)$/);
    if (stateDescAsMatch) {
      getOrCreateState(stateDescAsMatch[2], 'normal', stateDescAsMatch[1]);
      continue;
    }

    const stateColonMatch = line.match(/^(\w+)\s*:\s*(.+)$/);
    if (stateColonMatch) {
      getOrCreateState(stateColonMatch[1], 'normal', stateColonMatch[2]);
      continue;
    }

    const stateTypeMatch = line.match(/^state\s+(\w+)\s+<<(choice|fork|join)>>$/);
    if (stateTypeMatch) {
      getOrCreateState(stateTypeMatch[1], stateTypeMatch[2] as StateType);
      continue;
    }
    
    const stateSimpleMatch = line.match(/^state\s+(\w+)$/);
    if (stateSimpleMatch) {
      getOrCreateState(stateSimpleMatch[1]);
      continue;
    }

    const transitionMatch = line.match(/^(\[\*\]|\w+)\s*-->\s*(\[\*\]|\w+)(?:\s*:\s*(.+))?$/);
    if (transitionMatch) {
      const fromName = transitionMatch[1];
      const toName = transitionMatch[2];
      const label = transitionMatch[3];

      let fromId: string;
      if (fromName === '[*]') {
        const startState = getOrCreateState('[*]', 'start');
        fromId = startState.id;
      } else {
        const state = getOrCreateState(fromName);
        fromId = state.id;
      }

      let toId: string;
      if (toName === '[*]') {
        const endState = getOrCreateState('[*]', 'end');
        toId = endState.id;
      } else {
        const state = getOrCreateState(toName);
        toId = state.id;
      }

      diagram.transitions.push({
        id: `tr_${fromId}_${toId}_${transitionCount++}`,
        from: fromId,
        to: toId,
        label: label ? label.trim() : undefined,
        order: diagram.transitions.length,
      });
      continue;
    }

    const singleLineNoteMatch = line.match(/^note\s+(left|right)\s+of\s+(\w+)\s*:\s*(.+)$/);
    if (singleLineNoteMatch) {
      const position = singleLineNoteMatch[1] as NotePosition;
      const stateId = singleLineNoteMatch[2];
      const text = singleLineNoteMatch[3];

      getOrCreateState(stateId);

      diagram.notes.push({
        id: `note_${noteCount++}`,
        text: text.trim(),
        position,
        stateId,
        order: diagram.notes.length,
      });
      continue;
    }

    const multiLineNoteStartMatch = line.match(/^note\s+(left|right)\s+of\s+(\w+)$/);
    if (multiLineNoteStartMatch) {
      const position = multiLineNoteStartMatch[1] as NotePosition;
      const stateId = multiLineNoteStartMatch[2];
      
      getOrCreateState(stateId);

      inMultiLineNote = true;
      currentNote = {
        id: `note_${noteCount++}`,
        position,
        stateId,
        text: '',
      };
      continue;
    }

    const classDefMatch = line.match(/^classDef\s+(\w+)\s+(.+)$/);
    if (classDefMatch) {
      const name = classDefMatch[1];
      const stylesStr = classDefMatch[2];
      const properties: Record<string, string> = {};
      
      stylesStr.split(',').forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
          properties[key] = value;
        }
      });

      diagram.classDefs.push({
        name,
        properties,
      });
      continue;
    }

    const classApplyMatch = line.match(/^class\s+(\w+)\s+(\w+)$/);
    if (classApplyMatch) {
      diagram.classAssignments.push({
        stateId: classApplyMatch[1],
        className: classApplyMatch[2],
      });
      continue;
    }
  }

  layoutStates(diagram.states);

  return diagram;
}

function layoutStates(states: State[]) {
  const COL_WIDTH = 250;
  const ROW_HEIGHT = 150;
  const COLS = 4;

  const topLevelStates = states.filter(s => !s.parentId);
  
  topLevelStates.forEach((state, index) => {
    const row = Math.floor(index / COLS);
    const col = index % COLS;
    state.position = {
      x: col * COL_WIDTH + 50,
      y: row * ROW_HEIGHT + 50,
    };
  });

  const compositeStates = states.filter(s => s.type === 'composite');
  compositeStates.forEach(parent => {
    const children = states.filter(s => s.parentId === parent.id);
    children.forEach((child, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      child.position = {
        x: col * COL_WIDTH + 50,
        y: row * ROW_HEIGHT + 50,
      };
    });
  });
}
