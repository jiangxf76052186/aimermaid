import { describe, it, expect } from 'vitest';
import { parseMermaidSequence } from '../mermaid-parser';
import { SYMBOL_TO_MESSAGE_TYPE } from '@shared/constants';

describe('mermaid-parser', () => {
  it('应该解析基本的 sequenceDiagram 头部', () => {
    const code = `
      sequenceDiagram
      participant A
      participant B
      A->>B: Hello
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.type).toBe('sequence');
    expect(diagram.participants).toHaveLength(2);
    expect(diagram.messages).toHaveLength(1);
  });

  it('应该解析 participant 声明（含 alias）', () => {
    const code = `
      sequenceDiagram
      participant A
      participant B as "Bob"
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.participants).toHaveLength(2);
    expect(diagram.participants[0]).toMatchObject({ name: 'A', type: 'participant' });
    expect(diagram.participants[1]).toMatchObject({ name: 'B', alias: 'Bob', type: 'participant' });
  });

  it('应该解析 actor 声明', () => {
    const code = `
      sequenceDiagram
      actor A
      actor B as "Bob"
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.participants).toHaveLength(2);
    expect(diagram.participants[0]).toMatchObject({ name: 'A', type: 'actor' });
    expect(diagram.participants[1]).toMatchObject({ name: 'B', alias: 'Bob', type: 'actor' });
  });

  it('应该解析所有 6 种箭头类型的消息', () => {
    const code = `
      sequenceDiagram
      A->>B: sync
      A-->>B: syncDotted
      A-)B: asyncOpen
      A--)B: asyncDotted
      A-xB: syncCross
      A--xB: syncDottedCross
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.messages).toHaveLength(6);
    expect(diagram.messages[0].type).toBe(SYMBOL_TO_MESSAGE_TYPE['->>']);
    expect(diagram.messages[1].type).toBe(SYMBOL_TO_MESSAGE_TYPE['-->>']);
    expect(diagram.messages[2].type).toBe(SYMBOL_TO_MESSAGE_TYPE['-)']);
    expect(diagram.messages[3].type).toBe(SYMBOL_TO_MESSAGE_TYPE['--)']);
    expect(diagram.messages[4].type).toBe(SYMBOL_TO_MESSAGE_TYPE['-x']);
    expect(diagram.messages[5].type).toBe(SYMBOL_TO_MESSAGE_TYPE['--x']);
  });

  it('应该解析激活/停用标记 (+/-)', () => {
    const code = `
      sequenceDiagram
      A->>+B: Activate
      B->>-A: Deactivate
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.messages).toHaveLength(2);
    expect(diagram.messages[0].activateTarget).toBe(true);
    expect(diagram.messages[1].deactivateTarget).toBe(true);
  });

  it('应该解析 Note (left of, right of, over)', () => {
    const code = `
      sequenceDiagram
      Note left of A: Left Note
      Note right of A: Right Note
      Note over A: Over Note
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.notes).toHaveLength(3);
    expect(diagram.notes[0]).toMatchObject({ position: 'left', text: 'Left Note' });
    expect(diagram.notes[1]).toMatchObject({ position: 'right', text: 'Right Note' });
    expect(diagram.notes[2]).toMatchObject({ position: 'over', text: 'Over Note' });
  });

  it('应该解析 Note over 多个参与者', () => {
    const code = `
      sequenceDiagram
      Note over A,B: Multi Note
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.notes).toHaveLength(1);
    expect(diagram.notes[0].participantIds).toHaveLength(2);
    expect(diagram.participants).toHaveLength(2);
  });

  it('应该解析 Block: loop, opt, par, critical, break', () => {
    const code = `
      sequenceDiagram
      loop Loop Label
        A->>B: msg1
      end
      opt Opt Label
        A->>B: msg2
      end
      par Par Label
        A->>B: msg3
      end
      critical Critical Label
        A->>B: msg4
      end
      break Break Label
        A->>B: msg5
      end
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.blocks).toHaveLength(5);
    expect(diagram.blocks[0].type).toBe('loop');
    expect(diagram.blocks[0].label).toBe('Loop Label');
    expect(diagram.blocks[1].type).toBe('opt');
    expect(diagram.blocks[2].type).toBe('par');
    expect(diagram.blocks[3].type).toBe('critical');
    expect(diagram.blocks[4].type).toBe('break');
  });

  it('应该解析 alt/else Block', () => {
    const code = `
      sequenceDiagram
      alt Case 1
        A->>B: msg1
      else Case 2
        A->>B: msg2
      end
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.blocks).toHaveLength(1);
    const altBlock = diagram.blocks[0];
    expect(altBlock.type).toBe('alt');
    expect(altBlock.label).toBe('Case 1');
    expect(altBlock.children).toHaveLength(1);
    expect(altBlock.children![0].type).toBe('else');
    expect(altBlock.children![0].label).toBe('Case 2');
  });

  it('应该解析嵌套 Block', () => {
    const code = `
      sequenceDiagram
      loop Outer
        opt Inner
          A->>B: msg
        end
      end
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.blocks).toHaveLength(1);
    expect(diagram.blocks[0].type).toBe('loop');
    expect(diagram.blocks[0].children).toHaveLength(1);
    expect(diagram.blocks[0].children![0].type).toBe('opt');
  });

  it('应该过滤空行和注释', () => {
    const code = `
      sequenceDiagram
      % This is a comment
      
      A->>B: msg
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.messages).toHaveLength(1);
  });

  it('应该自动创建未声明的参与者', () => {
    const code = `
      sequenceDiagram
      A->>B: msg
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.participants).toHaveLength(2);
    expect(diagram.participants[0].name).toBe('A');
    expect(diagram.participants[1].name).toBe('B');
  });

  it('应该正确计算 activation', () => {
    const code = `
      sequenceDiagram
      A->>+B: Activate
      C->>-B: Deactivate
    `;
    const diagram = parseMermaidSequence(code);
    expect(diagram.activations).toHaveLength(1);
    expect(diagram.activations[0].participantId).toBe(diagram.participants[1].id);
    expect(diagram.activations[0].startMessageId).toBe(diagram.messages[0].id);
    expect(diagram.activations[0].endMessageId).toBe(diagram.messages[1].id);
  });
});
