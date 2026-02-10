import { describe, it, expect } from 'vitest';
import { generateStateDiagram } from '../state-generator';
import { parseStateDiagram } from '../state-parser';
import type { StateDiagram } from '@shared/types/stateDiagram';

describe('state-generator', () => {
  const createBaseDiagram = (): StateDiagram => ({
    type: 'state',
    direction: 'TB',
    states: [],
    transitions: [],
    notes: [],
    classDefs: [],
    classAssignments: [],
  });

  it('应该生成基本的 stateDiagram-v2 头部', () => {
    const diagram = createBaseDiagram();
    const code = generateStateDiagram(diagram);
    expect(code).toContain('stateDiagram-v2');
  });

  it('如果不是 TB，应该生成方向', () => {
    const diagram = createBaseDiagram();
    diagram.direction = 'LR';
    const code = generateStateDiagram(diagram);
    expect(code).toContain('direction LR');
  });

  it('如果是 TB，不应该生成方向', () => {
    const diagram = createBaseDiagram();
    diagram.direction = 'TB';
    const code = generateStateDiagram(diagram);
    expect(code).not.toContain('direction TB');
  });

  it('应该生成普通状态', () => {
    const diagram = createBaseDiagram();
    diagram.states.push({
      id: 'State1',
      name: 'State1',
      type: 'normal',
      order: 0,
      position: { x: 0, y: 0 },
    });
    const code = generateStateDiagram(diagram);
    expect(code).toContain('state State1');
  });

  it('应该生成带描述的状态', () => {
    const diagram = createBaseDiagram();
    diagram.states.push({
      id: 'State1',
      name: 'State1',
      description: 'Description',
      type: 'normal',
      order: 0,
      position: { x: 0, y: 0 },
    });
    const code = generateStateDiagram(diagram);
    expect(code).toContain('state "Description" as State1');
  });

  it('应该生成 choice/fork/join 状态', () => {
    const diagram = createBaseDiagram();
    diagram.states.push(
      { id: 'c1', name: 'c1', type: 'choice', order: 0, position: { x: 0, y: 0 } },
      { id: 'f1', name: 'f1', type: 'fork', order: 1, position: { x: 0, y: 0 } },
      { id: 'j1', name: 'j1', type: 'join', order: 2, position: { x: 0, y: 0 } }
    );
    const code = generateStateDiagram(diagram);
    expect(code).toContain('state c1 <<choice>>');
    expect(code).toContain('state f1 <<fork>>');
    expect(code).toContain('state j1 <<join>>');
  });

  it('应该生成复合状态', () => {
    const diagram = createBaseDiagram();
    diagram.states.push(
      { id: 'Parent', name: 'Parent', type: 'composite', order: 0, position: { x: 0, y: 0 } },
      { id: 'Child', name: 'Child', type: 'normal', parentId: 'Parent', order: 0, position: { x: 0, y: 0 } }
    );
    const code = generateStateDiagram(diagram);
    expect(code).toContain('state Parent {');
    expect(code).toContain('state Child');
    expect(code).toContain('}');
  });

  it('应该生成转换', () => {
    const diagram = createBaseDiagram();
    diagram.states.push(
      { id: 'State1', name: 'State1', type: 'normal', order: 0, position: { x: 0, y: 0 } },
      { id: 'State2', name: 'State2', type: 'normal', order: 1, position: { x: 0, y: 0 } }
    );
    diagram.transitions.push({
      id: 't1',
      from: 'State1',
      to: 'State2',
      order: 0,
    });
    const code = generateStateDiagram(diagram);
    expect(code).toContain('State1 --> State2');
  });

  it('应该生成带标签的转换', () => {
    const diagram = createBaseDiagram();
    diagram.states.push(
      { id: 'State1', name: 'State1', type: 'normal', order: 0, position: { x: 0, y: 0 } },
      { id: 'State2', name: 'State2', type: 'normal', order: 1, position: { x: 0, y: 0 } }
    );
    diagram.transitions.push({
      id: 't1',
      from: 'State1',
      to: 'State2',
      label: 'label',
      order: 0,
    });
    const code = generateStateDiagram(diagram);
    expect(code).toContain('State1 --> State2 : label');
  });

  it('应该在转换中生成开始/结束状态', () => {
    const diagram = createBaseDiagram();
    diagram.states.push(
      { id: 'start1', name: '[*]', type: 'start', order: 0, position: { x: 0, y: 0 } },
      { id: 'State1', name: 'State1', type: 'normal', order: 1, position: { x: 0, y: 0 } },
      { id: 'end1', name: '[*]', type: 'end', order: 2, position: { x: 0, y: 0 } }
    );
    diagram.transitions.push(
      { id: 't1', from: 'start1', to: 'State1', order: 0 },
      { id: 't2', from: 'State1', to: 'end1', order: 1 }
    );
    const code = generateStateDiagram(diagram);
    expect(code).toContain('[*] --> State1');
    expect(code).toContain('State1 --> [*]');
  });

  it('应该生成单行注释', () => {
    const diagram = createBaseDiagram();
    diagram.states.push({ id: 'State1', name: 'State1', type: 'normal', order: 0, position: { x: 0, y: 0 } });
    diagram.notes.push({
      id: 'n1',
      text: 'text',
      position: 'left',
      stateId: 'State1',
      order: 0,
    });
    const code = generateStateDiagram(diagram);
    expect(code).toContain('note left of State1 : text');
  });

  it('应该生成多行注释', () => {
    const diagram = createBaseDiagram();
    diagram.states.push({ id: 'State1', name: 'State1', type: 'normal', order: 0, position: { x: 0, y: 0 } });
    diagram.notes.push({
      id: 'n1',
      text: 'Line 1\nLine 2',
      position: 'right',
      stateId: 'State1',
      order: 0,
    });
    const code = generateStateDiagram(diagram);
    expect(code).toContain('note right of State1');
    expect(code).toContain('Line 1');
    expect(code).toContain('Line 2');
    expect(code).toContain('end note');
  });

  it('应该生成 classDef', () => {
    const diagram = createBaseDiagram();
    diagram.classDefs.push({
      name: 'className',
      properties: { fill: '#f9f', stroke: '#333' },
    });
    const code = generateStateDiagram(diagram);
    expect(code).toContain('classDef className fill:#f9f,stroke:#333');
  });

  it('应该生成 class 应用', () => {
    const diagram = createBaseDiagram();
    diagram.states.push({ id: 'State1', name: 'State1', type: 'normal', order: 0, position: { x: 0, y: 0 } });
    diagram.classAssignments.push({
      stateId: 'State1',
      className: 'className',
    });
    const code = generateStateDiagram(diagram);
    expect(code).toContain('class State1 className');
  });

  it('应该在往返转换后保持一致性', () => {
    const originalCode = `stateDiagram-v2
    direction LR
    state "Description" as State1
    state Composite {
        state Inner
    }
    [*] --> State1
    State1 --> Composite : label
    note right of State1 : note text
    classDef myClass fill:#f00
    class State1 myClass`;

    const parsed = parseStateDiagram(originalCode);
    const generated = generateStateDiagram(parsed);
    const reparsed = parseStateDiagram(generated);

    expect(reparsed.direction).toBe(parsed.direction);
    expect(reparsed.states.length).toBe(parsed.states.length);
    expect(reparsed.transitions.length).toBe(parsed.transitions.length);
    expect(reparsed.notes.length).toBe(parsed.notes.length);
    expect(reparsed.classDefs).toEqual(parsed.classDefs);
    expect(reparsed.classAssignments).toEqual(parsed.classAssignments);
  });
});
