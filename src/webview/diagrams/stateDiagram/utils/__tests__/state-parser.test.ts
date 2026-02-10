import { describe, it, expect } from 'vitest';
import { parseStateDiagram } from '../state-parser';

describe('state-parser', () => {
  it('应该解析基本的 stateDiagram-v2 声明', () => {
    const code = `stateDiagram-v2`;
    const diagram = parseStateDiagram(code);
    expect(diagram.type).toBe('state');
    expect(diagram.direction).toBe('TB');
  });

  it('应该解析方向声明', () => {
    const code = `
      stateDiagram-v2
      direction LR
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.direction).toBe('LR');
  });

  it('应该解析普通状态声明', () => {
    const code = `
      stateDiagram-v2
      state State1
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.states).toHaveLength(1);
    expect(diagram.states[0].name).toBe('State1');
    expect(diagram.states[0].type).toBe('normal');
  });

  it('应该解析带描述的状态', () => {
    const code = `
      stateDiagram-v2
      state "Description" as State1
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.states[0].name).toBe('State1');
    expect(diagram.states[0].description).toBe('Description');
  });

  it('应该解析带冒号描述的状态', () => {
    const code = `
      stateDiagram-v2
      State1 : Description
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.states[0].name).toBe('State1');
    expect(diagram.states[0].description).toBe('Description');
  });

  it('应该解析开始/结束状态', () => {
    const code = `
      stateDiagram-v2
      [*] --> State1
      State1 --> [*]
    `;
    const diagram = parseStateDiagram(code);
    const startState = diagram.states.find(s => s.type === 'start');
    const endState = diagram.states.find(s => s.type === 'end');
    expect(startState).toBeDefined();
    expect(endState).toBeDefined();
    expect(startState?.id).toMatch(/^__start__\d+$/);
    expect(endState?.id).toMatch(/^__end__\d+$/);
  });

  it('应该解析 choice 节点', () => {
    const code = `
      stateDiagram-v2
      state if_state <<choice>>
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.states[0].type).toBe('choice');
  });

  it('应该解析 fork 节点', () => {
    const code = `
      stateDiagram-v2
      state fork_state <<fork>>
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.states[0].type).toBe('fork');
  });

  it('应该解析 join 节点', () => {
    const code = `
      stateDiagram-v2
      state join_state <<join>>
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.states[0].type).toBe('join');
  });

  it('应该解析复合状态', () => {
    const code = `
      stateDiagram-v2
      state CompositeState {
        state InnerState
      }
    `;
    const diagram = parseStateDiagram(code);
    const compositeState = diagram.states.find(s => s.name === 'CompositeState');
    const innerState = diagram.states.find(s => s.name === 'InnerState');
    expect(compositeState?.type).toBe('composite');
    expect(innerState?.parentId).toBe('CompositeState');
  });

  it('应该解析转换', () => {
    const code = `
      stateDiagram-v2
      State1 --> State2
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.transitions).toHaveLength(1);
    expect(diagram.transitions[0].from).toBe('State1');
    expect(diagram.transitions[0].to).toBe('State2');
  });

  it('应该解析带标签的转换', () => {
    const code = `
      stateDiagram-v2
      State1 --> State2 : label
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.transitions[0].label).toBe('label');
  });

  it('应该解析单行注释', () => {
    const code = `
      stateDiagram-v2
      note left of State1 : text
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.notes).toHaveLength(1);
    expect(diagram.notes[0].text).toBe('text');
    expect(diagram.notes[0].position).toBe('left');
    expect(diagram.notes[0].stateId).toBe('State1');
  });

  it('应该解析多行注释', () => {
    const code = `
      stateDiagram-v2
      note right of State1
        Line 1
        Line 2
      end note
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.notes).toHaveLength(1);
    expect(diagram.notes[0].text).toBe('Line 1\nLine 2');
    expect(diagram.notes[0].position).toBe('right');
  });

  it('应该解析 classDef', () => {
    const code = `
      stateDiagram-v2
      classDef className fill:#f9f,stroke:#333
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.classDefs).toHaveLength(1);
    expect(diagram.classDefs[0].name).toBe('className');
    expect(diagram.classDefs[0].properties).toEqual({ fill: '#f9f', stroke: '#333' });
  });

  it('应该解析 class 应用', () => {
    const code = `
      stateDiagram-v2
      class State1 className
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.classAssignments).toHaveLength(1);
    expect(diagram.classAssignments[0].stateId).toBe('State1');
    expect(diagram.classAssignments[0].className).toBe('className');
  });

  it('应该过滤注释行', () => {
    const code = `
      stateDiagram-v2
      %% This is a comment
      State1 --> State2
    `;
    const diagram = parseStateDiagram(code);
    expect(diagram.transitions).toHaveLength(1);
  });

  it('应该为多个开始/结束状态生成唯一 ID', () => {
    const code = `
      stateDiagram-v2
      [*] --> State1
      State1 --> [*]
      [*] --> State2
      State2 --> [*]
    `;
    const diagram = parseStateDiagram(code);
    const startStates = diagram.states.filter(s => s.type === 'start');
    const endStates = diagram.states.filter(s => s.type === 'end');
    expect(startStates).toHaveLength(2);
    expect(endStates).toHaveLength(2);
    expect(startStates[0].id).not.toBe(startStates[1].id);
    expect(endStates[0].id).not.toBe(endStates[1].id);
  });
});
