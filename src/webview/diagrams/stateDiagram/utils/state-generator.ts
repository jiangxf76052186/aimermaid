import type {
  StateDiagram,
} from '@shared/types/stateDiagram';

export function generateStateDiagram(diagram: StateDiagram): string {
  const lines: string[] = [];
  lines.push('stateDiagram-v2');

  if (diagram.direction && diagram.direction !== 'TB') {
    lines.push(`    direction ${diagram.direction}`);
  }

  const getStateName = (id: string): string => {
    const state = diagram.states.find((s) => s.id === id);
    if (!state) return id;
    if (state.type === 'start' || state.type === 'end') return '[*]';
    return state.name;
  };

  const generateStates = (parentId: string | undefined, indentLevel: number) => {
    const indent = '    '.repeat(indentLevel);
    
    const states = diagram.states.filter(s => s.parentId === parentId);
    
    states.sort((a, b) => a.order - b.order);

    for (const state of states) {
      if (state.type === 'start' || state.type === 'end') continue;

      if (state.type === 'composite') {
        if (state.description && state.description !== state.name) {
          lines.push(`${indent}state "${state.description}" as ${state.name} {`);
        } else {
          lines.push(`${indent}state ${state.name} {`);
        }
        
        generateStates(state.id, indentLevel + 1);
        
        lines.push(`${indent}}`);
      } else if (state.type === 'choice') {
        lines.push(`${indent}state ${state.name} <<choice>>`);
      } else if (state.type === 'fork') {
        lines.push(`${indent}state ${state.name} <<fork>>`);
      } else if (state.type === 'join') {
        lines.push(`${indent}state ${state.name} <<join>>`);
      } else {
        if (state.description && state.description !== state.name) {
          lines.push(`${indent}state "${state.description}" as ${state.name}`);
        } else {
          lines.push(`${indent}state ${state.name}`);
        }
      }

      const stateNotes = diagram.notes.filter(n => n.stateId === state.id);
      for (const note of stateNotes) {
        if (note.text.includes('\n')) {
          lines.push(`${indent}note ${note.position} of ${state.name}`);
          note.text.split('\n').forEach(l => lines.push(`${indent}    ${l}`));
          lines.push(`${indent}end note`);
        } else {
          lines.push(`${indent}note ${note.position} of ${state.name} : ${note.text}`);
        }
      }
    }
  };

  generateStates(undefined, 1);

  for (const transition of diagram.transitions) {
    const fromName = getStateName(transition.from);
    const toName = getStateName(transition.to);
    const label = transition.label ? ` : ${transition.label}` : '';
    
    lines.push(`    ${fromName} --> ${toName}${label}`);
  }

  for (const def of diagram.classDefs) {
    const styles = Object.entries(def.properties)
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    lines.push(`    classDef ${def.name} ${styles}`);
  }

  for (const assignment of diagram.classAssignments) {
    const stateName = getStateName(assignment.stateId);
    if (stateName !== '[*]') {
      lines.push(`    class ${stateName} ${assignment.className}`);
    }
  }

  return lines.join('\n');
}
