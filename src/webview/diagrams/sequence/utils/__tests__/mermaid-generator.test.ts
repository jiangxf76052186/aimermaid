import { describe, it, expect } from 'vitest';
import { generateMermaidSequence } from '../mermaid-generator';
import { parseMermaidSequence } from '../mermaid-parser';
import { SequenceDiagram } from '@shared/types';
import { MESSAGE_TYPE_SYMBOLS } from '@shared/constants';

describe('mermaid-generator', () => {
  it('应该生成基本的 sequenceDiagram', () => {
    const diagram: SequenceDiagram = {
      type: 'sequence',
      participants: [
        { id: 'p1', name: 'A', type: 'participant', order: 0 },
        { id: 'p2', name: 'B', type: 'participant', order: 1 },
      ],
      messages: [
        { id: 'm1', from: 'p1', to: 'p2', text: 'Hello', type: 'sync', order: 0 },
      ],
      notes: [],
      activations: [],
      blocks: [],
    };
    const code = generateMermaidSequence(diagram);
    expect(code).toContain('sequenceDiagram');
    expect(code).toContain('participant A');
    expect(code).toContain('participant B');
    expect(code).toContain('A->>B: Hello');
  });

  it('应该生成 actor 类型', () => {
    const diagram: SequenceDiagram = {
      type: 'sequence',
      participants: [
        { id: 'p1', name: 'A', type: 'actor', order: 0 },
      ],
      messages: [],
      notes: [],
      activations: [],
      blocks: [],
    };
    const code = generateMermaidSequence(diagram);
    expect(code).toContain('actor A');
  });

  it('应该生成 alias', () => {
    const diagram: SequenceDiagram = {
      type: 'sequence',
      participants: [
        { id: 'p1', name: 'A', alias: 'Alice', type: 'participant', order: 0 },
      ],
      messages: [],
      notes: [],
      activations: [],
      blocks: [],
    };
    const code = generateMermaidSequence(diagram);
    expect(code).toContain('participant A as "Alice"');
  });

  it('应该生成所有 6 种箭头类型', () => {
    const diagram: SequenceDiagram = {
      type: 'sequence',
      participants: [
        { id: 'p1', name: 'A', type: 'participant', order: 0 },
        { id: 'p2', name: 'B', type: 'participant', order: 1 },
      ],
      messages: [
        { id: 'm1', from: 'p1', to: 'p2', text: 'sync', type: 'sync', order: 0 },
        { id: 'm2', from: 'p1', to: 'p2', text: 'syncDotted', type: 'syncDotted', order: 1 },
        { id: 'm3', from: 'p1', to: 'p2', text: 'asyncOpen', type: 'asyncOpen', order: 2 },
        { id: 'm4', from: 'p1', to: 'p2', text: 'asyncDotted', type: 'asyncDotted', order: 3 },
        { id: 'm5', from: 'p1', to: 'p2', text: 'syncCross', type: 'syncCross', order: 4 },
        { id: 'm6', from: 'p1', to: 'p2', text: 'syncDottedCross', type: 'syncDottedCross', order: 5 },
      ],
      notes: [],
      activations: [],
      blocks: [],
    };
    const code = generateMermaidSequence(diagram);
    expect(code).toContain(`A${MESSAGE_TYPE_SYMBOLS['sync']}B: sync`);
    expect(code).toContain(`A${MESSAGE_TYPE_SYMBOLS['syncDotted']}B: syncDotted`);
    expect(code).toContain(`A${MESSAGE_TYPE_SYMBOLS['asyncOpen']}B: asyncOpen`);
    expect(code).toContain(`A${MESSAGE_TYPE_SYMBOLS['asyncDotted']}B: asyncDotted`);
    expect(code).toContain(`A${MESSAGE_TYPE_SYMBOLS['syncCross']}B: syncCross`);
    expect(code).toContain(`A${MESSAGE_TYPE_SYMBOLS['syncDottedCross']}B: syncDottedCross`);
  });

  it('应该生成激活/停用标记', () => {
    const diagram: SequenceDiagram = {
      type: 'sequence',
      participants: [
        { id: 'p1', name: 'A', type: 'participant', order: 0 },
        { id: 'p2', name: 'B', type: 'participant', order: 1 },
      ],
      messages: [
        { id: 'm1', from: 'p1', to: 'p2', text: 'Activate', type: 'sync', order: 0, activateTarget: true },
        { id: 'm2', from: 'p2', to: 'p1', text: 'Deactivate', type: 'syncDotted', order: 1, deactivateTarget: true },
      ],
      notes: [],
      activations: [],
      blocks: [],
    };
    const code = generateMermaidSequence(diagram);
    expect(code).toContain('A->>+B: Activate');
    expect(code).toContain('B-->>-A: Deactivate');
  });

  it('应该生成 Note (left of, right of, over)', () => {
    const diagram: SequenceDiagram = {
      type: 'sequence',
      participants: [
        { id: 'p1', name: 'A', type: 'participant', order: 0 },
      ],
      messages: [],
      notes: [
        { id: 'n1', text: 'Left', position: 'left', participantIds: ['p1'], order: 0 },
        { id: 'n2', text: 'Right', position: 'right', participantIds: ['p1'], order: 1 },
        { id: 'n3', text: 'Over', position: 'over', participantIds: ['p1'], order: 2 },
      ],
      activations: [],
      blocks: [],
    };
    const code = generateMermaidSequence(diagram);
    expect(code).toContain('Note left of A: Left');
    expect(code).toContain('Note right of A: Right');
    expect(code).toContain('Note over A: Over');
  });

  it('应该生成 Block: loop, opt, alt/else', () => {
    const diagram: SequenceDiagram = {
      type: 'sequence',
      participants: [
        { id: 'p1', name: 'A', type: 'participant', order: 0 },
        { id: 'p2', name: 'B', type: 'participant', order: 1 },
      ],
      messages: [
        { id: 'm1', from: 'p1', to: 'p2', text: 'msg1', type: 'sync', order: 0 },
        { id: 'm2', from: 'p1', to: 'p2', text: 'msg2', type: 'sync', order: 1 },
        { id: 'm3', from: 'p1', to: 'p2', text: 'msg3', type: 'sync', order: 2 },
      ],
      notes: [],
      activations: [],
      blocks: [
        {
          id: 'b1',
          type: 'loop',
          label: 'Loop',
          messageIds: ['m1'],
          children: [],
        },
        {
          id: 'b2',
          type: 'alt',
          label: 'Alt',
          messageIds: ['m2'],
          children: [
            {
              id: 'b2_else',
              type: 'else',
              label: 'Else',
              messageIds: ['m3'],
              children: [],
            },
          ],
        },
      ],
    };
    const code = generateMermaidSequence(diagram);
    expect(code).toMatch(/loop Loop\s+A->>B: msg1\s+end/);
    expect(code).toMatch(/alt Alt\s+A->>B: msg2\s+else Else\s+A->>B: msg3\s+end/);
  });

  it('应该生成嵌套 Block', () => {
    const diagram: SequenceDiagram = {
      type: 'sequence',
      participants: [
        { id: 'p1', name: 'A', type: 'participant', order: 0 },
        { id: 'p2', name: 'B', type: 'participant', order: 1 },
      ],
      messages: [
        { id: 'm1', from: 'p1', to: 'p2', text: 'msg1', type: 'sync', order: 0 },
      ],
      notes: [],
      activations: [],
      blocks: [
        {
          id: 'b1',
          type: 'loop',
          label: 'Outer',
          messageIds: [],
          children: [
            {
              id: 'b2',
              type: 'opt',
              label: 'Inner',
              messageIds: ['m1'],
              children: [],
            },
          ],
        },
      ],
    };
    const code = generateMermaidSequence(diagram);
    expect(code).toMatch(/loop Outer\s+opt Inner\s+A->>B: msg1\s+end\s+end/);
  });

  it('应该跳过空 Block', () => {
    const diagram: SequenceDiagram = {
      type: 'sequence',
      participants: [],
      messages: [],
      notes: [],
      activations: [],
      blocks: [
        {
          id: 'b1',
          type: 'loop',
          label: 'Empty',
          messageIds: [],
          children: [],
        },
      ],
    };
    const code = generateMermaidSequence(diagram);
    expect(code).not.toContain('loop Empty');
  });

  it('往返一致性测试 (parse -> generate -> parse)', () => {
    const originalCode = `sequenceDiagram
    participant A
    participant B
    A->>B: Hello
    loop Check
        B-->>A: Response
    end`;
    
    const diagram1 = parseMermaidSequence(originalCode);
    const generatedCode = generateMermaidSequence(diagram1);
    const diagram2 = parseMermaidSequence(generatedCode);

    expect(diagram2.participants).toHaveLength(diagram1.participants.length);
    expect(diagram2.messages).toHaveLength(diagram1.messages.length);
    expect(diagram2.blocks).toHaveLength(diagram1.blocks.length);
    
    expect(diagram2.messages[0].text).toBe(diagram1.messages[0].text);
    expect(diagram2.messages[1].text).toBe(diagram1.messages[1].text);
    
    expect(diagram2.blocks[0].label).toBe(diagram1.blocks[0].label);
  });
});
