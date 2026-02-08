import { parseMermaidSequence } from './src/webview/utils/mermaid-parser';
import { generateMermaidSequence } from './src/webview/utils/mermaid-generator';

// 模拟用户扩大 loop 后，但 block.messageIds 变空的情况
const diagram = {
  participants: [
    { id: "p_0", name: "A", type: "participant" as const, order: 0 },
    { id: "p_1", name: "B", type: "participant" as const, order: 1 },
    { id: "p_2", name: "Service3", type: "participant" as const, order: 2 }
  ],
  messages: [
    { id: "m_0", from: "p_0", to: "p_1", text: "call1", type: "sync" as const, order: 0, activateTarget: false, deactivateTarget: false },
    { id: "m_1", from: "p_0", to: "p_1", text: "call2", type: "sync" as const, order: 1, activateTarget: false, deactivateTarget: false },
    { id: "m_2", from: "p_0", to: "p_1", text: "call3", type: "sync" as const, order: 2, activateTarget: false, deactivateTarget: false }
  ],
  notes: [],
  activations: [],
  blocks: [
    {
      id: "b_0",
      type: "loop" as const,
      label: "condition",
      messageIds: [],  // EMPTY! 模拟 block resize 后 messageIds 被清空
      children: []
    }
  ]
};

console.log('=== DIAGRAM WITH EMPTY BLOCK ===');
console.log(JSON.stringify(diagram, null, 2));

const output = generateMermaidSequence(diagram);
console.log('\n=== OUTPUT ===');
console.log(output);
