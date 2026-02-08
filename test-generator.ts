import { parseMermaidSequence } from './src/webview/utils/mermaid-parser';
import { generateMermaidSequence } from './src/webview/utils/mermaid-generator';

const input = `sequenceDiagram
    participant A
    participant B
    participant Service3
    A->>B: call1
    A->>B: call2
    loop condition
        A->>B: call3
    end`;

console.log('=== INPUT ===');
console.log(input);

const diagram = parseMermaidSequence(input);
console.log('\n=== PARSED DIAGRAM ===');
console.log(JSON.stringify(diagram, null, 2));

const output = generateMermaidSequence(diagram);
console.log('\n=== OUTPUT ===');
console.log(output);
