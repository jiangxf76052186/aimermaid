import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false });

const code = `sequenceDiagram
    participant A
    participant B
    participant Service3
    A->>B: call1
    A->>B: call2
    A->>B: call3
    loop condition
    end`;

console.log('Testing mermaid code:');
console.log(code);
console.log('---');

try {
  const result = await mermaid.parse(code);
  console.log('Parse result:', result);
} catch (e) {
  console.log('Parse error:', e);
}
