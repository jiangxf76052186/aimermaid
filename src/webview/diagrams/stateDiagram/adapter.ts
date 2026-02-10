import type { Node, Edge } from '@xyflow/react';
import type { DiagramAdapter } from '@shared/types/diagram';
import type { StateDiagram } from '@shared/types/stateDiagram';
import StateNode from './nodes/StateNode';
import StartEndNode from './nodes/StartEndNode';
import ChoiceNode from './nodes/ChoiceNode';
import ForkJoinNode from './nodes/ForkJoinNode';
import CompositeStateNode from './nodes/CompositeStateNode';
import StateNoteNode from './nodes/StateNoteNode';
import TransitionEdge from './edges/TransitionEdge';
import { parseStateDiagram } from './utils/state-parser';
import { generateStateDiagram } from './utils/state-generator';
import { StateToolbar } from './components/StateToolbar';
import { StatePropertyPanel } from './components/StatePropertyPanel';

function stateToNodes(diagram: StateDiagram): Node[] {
  const nodes: Node[] = [];

  for (const state of diagram.states) {
    let type: string;
    let data: Record<string, unknown>;

    switch (state.type) {
      case 'start':
      case 'end':
        type = 'startEnd';
        data = { stateType: state.type };
        break;
      case 'choice':
        type = 'choice';
        data = { name: state.name, stateType: 'choice' };
        break;
      case 'fork':
      case 'join':
        type = 'forkJoin';
        data = { name: state.name, stateType: state.type };
        break;
      case 'composite':
        type = 'composite';
        data = { name: state.name, description: state.description, stateType: 'composite' };
        break;
      default:
        type = 'stateNode';
        data = { name: state.name, description: state.description, stateType: 'normal' };
        break;
    }

    nodes.push({
      id: state.id,
      type,
      position: state.position,
      data,
      style: {
        width: state.width,
        height: state.height,
      },
      parentId: state.parentId,
      draggable: true,
    });
  }

  for (const note of diagram.notes) {
    const associatedState = diagram.states.find((s) => s.id === note.stateId);
    const offsetX = note.position === 'right' ? 200 : -200;
    const basePosition = associatedState?.position || { x: 0, y: 0 };

    nodes.push({
      id: note.id,
      type: 'stateNote',
      position: {
        x: basePosition.x + offsetX,
        y: basePosition.y,
      },
      data: {
        text: note.text,
        position: note.position,
        stateId: note.stateId,
      },
      draggable: true,
    });
  }

  return nodes;
}

function stateToEdges(diagram: StateDiagram): Edge[] {
  return diagram.transitions.map((transition) => ({
    id: transition.id,
    source: transition.from,
    target: transition.to,
    type: 'transition',
    data: {
      label: transition.label,
    },
  }));
}

export const StateDiagramAdapter: DiagramAdapter<StateDiagram> = {
  type: 'state',
  name: '状态图',

  parse: parseStateDiagram,
  generate: generateStateDiagram,

  detect: (code: string) => {
    const firstLine = code.trim().split('\n')[0].toLowerCase().trim();
    return firstLine.startsWith('statediagram');
  },

  nodeTypes: {
    stateNode: StateNode,
    startEnd: StartEndNode,
    choice: ChoiceNode,
    forkJoin: ForkJoinNode,
    composite: CompositeStateNode,
    stateNote: StateNoteNode,
  },

  edgeTypes: {
    transition: TransitionEdge,
  },

  Toolbar: StateToolbar,
  PropertyPanel: StatePropertyPanel,

  stateToNodes,
  stateToEdges,

  createInitialState: () => ({
    type: 'state',
    states: [],
    transitions: [],
    notes: [],
    direction: 'TB',
    classDefs: [],
    classAssignments: [],
  }),
};
