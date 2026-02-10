import { describe, it, expect } from 'vitest';
import { parseFlowchart } from '../parser';
import type { NodeShape, EdgeType } from '@shared/types/flowchart';

describe('Flowchart Parser', () => {
  describe('Direction Parsing', () => {
    it('should parse TB direction', () => {
      const code = 'flowchart TB';
      const diagram = parseFlowchart(code);
      expect(diagram.direction).toBe('TB');
    });

    it('should parse TD direction', () => {
      const code = 'flowchart TD';
      const diagram = parseFlowchart(code);
      expect(diagram.direction).toBe('TD');
    });

    it('should parse BT direction', () => {
      const code = 'flowchart BT';
      const diagram = parseFlowchart(code);
      expect(diagram.direction).toBe('BT');
    });

    it('should parse RL direction', () => {
      const code = 'flowchart RL';
      const diagram = parseFlowchart(code);
      expect(diagram.direction).toBe('RL');
    });

    it('should parse LR direction', () => {
      const code = 'flowchart LR';
      const diagram = parseFlowchart(code);
      expect(diagram.direction).toBe('LR');
    });

    it('should default to TB if no direction specified', () => {
      const code = 'A --> B';
      const diagram = parseFlowchart(code);
      expect(diagram.direction).toBe('TB');
    });
  });

  describe('Node Shape Detection', () => {
    const testCases: { code: string; expectedShape: NodeShape; expectedText: string }[] = [
      { code: 'A[Rect]', expectedShape: 'rect', expectedText: 'Rect' },
      { code: 'B(Rounded)', expectedShape: 'rounded', expectedText: 'Rounded' },
      { code: 'C{Diamond}', expectedShape: 'diamond', expectedText: 'Diamond' },
      { code: 'D((Circle))', expectedShape: 'circle', expectedText: 'Circle' },
      { code: 'E(((DoubleCircle)))', expectedShape: 'double-circle', expectedText: 'DoubleCircle' },
      { code: 'F[(Cylinder)]', expectedShape: 'cylinder', expectedText: 'Cylinder' },
      { code: 'G[[Subprocess]]', expectedShape: 'subprocess', expectedText: 'Subprocess' },
      { code: 'H{{Hexagon}}', expectedShape: 'hexagon', expectedText: 'Hexagon' },
      { code: 'I>Asymmetric]', expectedShape: 'asymmetric', expectedText: 'Asymmetric' },
      { code: 'J[/Trapezoid\\]', expectedShape: 'trapezoid', expectedText: 'Trapezoid' },
      { code: 'K[\\TrapezoidAlt/]', expectedShape: 'trapezoid-alt', expectedText: 'TrapezoidAlt' },
      { code: 'L[/Parallelogram/]', expectedShape: 'parallelogram', expectedText: 'Parallelogram' },
      { code: 'M[\\ParallelogramAlt\\]', expectedShape: 'parallelogram-alt', expectedText: 'ParallelogramAlt' },
    ];

    testCases.forEach(({ code, expectedShape, expectedText }) => {
      it(`should parse ${expectedShape} shape: ${code}`, () => {
        const diagram = parseFlowchart(code);
        expect(diagram.nodes).toHaveLength(1);
        expect(diagram.nodes[0].shape).toBe(expectedShape);
        expect(diagram.nodes[0].text).toBe(expectedText);
      });
    });

    it('should handle nodes with spaces in text', () => {
      const code = 'A[Node with spaces]';
      const diagram = parseFlowchart(code);
      expect(diagram.nodes[0].text).toBe('Node with spaces');
    });
    
    it('should handle nodes with special characters in text', () => {
        const code = 'A[Node "with" quotes]';
        const diagram = parseFlowchart(code);
        expect(diagram.nodes[0].text).toBe('Node "with" quotes');
    });
  });

  describe('Edge Parsing', () => {
    const edgeTypes: { symbol: string; type: EdgeType }[] = [
      { symbol: '-->', type: 'arrow' },
      { symbol: '---', type: 'open' },
      { symbol: '-.->', type: 'dotted-arrow' },
      { symbol: '-.-', type: 'dotted-open' },
      { symbol: '==>', type: 'thick-arrow' },
      { symbol: '===', type: 'thick-open' },
      { symbol: '~~~', type: 'invisible' },
    ];

    edgeTypes.forEach(({ symbol, type }) => {
      it(`should parse ${type} edge: ${symbol}`, () => {
        const code = `A ${symbol} B`;
        const diagram = parseFlowchart(code);
        expect(diagram.edges).toHaveLength(1);
        expect(diagram.edges[0].from).toBe('A');
        expect(diagram.edges[0].to).toBe('B');
        expect(diagram.edges[0].type).toBe(type);
      });
    });

    it('should parse edge with text in pipes |text|', () => {
      const code = 'A -->|text label| B';
      const diagram = parseFlowchart(code);
      expect(diagram.edges[0].text).toBe('text label');
    });

    it('should parse edge with text after colon : text', () => {
      const code = 'A --> B: text label';
      const diagram = parseFlowchart(code);
      expect(diagram.edges[0].text).toBe('text label');
    });
    
    it('should parse edge with text after colon with spaces', () => {
        const code = 'A --> B : text label';
        const diagram = parseFlowchart(code);
        expect(diagram.edges[0].text).toBe('text label');
    });
  });

  describe('Subgraph Parsing', () => {
    it('should parse simple subgraph', () => {
      const code = `
        subgraph one
          A --> B
        end
      `;
      const diagram = parseFlowchart(code);
      expect(diagram.subgraphs).toHaveLength(1);
      expect(diagram.subgraphs[0].id).toBe('one');
      expect(diagram.subgraphs[0].nodeIds).toContain('A');
      expect(diagram.subgraphs[0].nodeIds).toContain('B');
    });

    it('should parse subgraph with title', () => {
      const code = `
        subgraph one [Title One]
          A
        end
      `;
      const diagram = parseFlowchart(code);
      expect(diagram.subgraphs[0].title).toBe('Title One');
    });
    
    it('should parse subgraph with quoted title', () => {
        const code = `
          subgraph one ["Title One"]
            A
          end
        `;
        const diagram = parseFlowchart(code);
        expect(diagram.subgraphs[0].title).toBe('Title One');
    });

    it('should parse nested subgraphs', () => {
      const code = `
        subgraph outer
          subgraph inner
            A
          end
          B
        end
      `;
      const diagram = parseFlowchart(code);
      expect(diagram.subgraphs).toHaveLength(2);
      const outer = diagram.subgraphs.find(s => s.id === 'outer');
      const inner = diagram.subgraphs.find(s => s.id === 'inner');
      
      expect(outer).toBeDefined();
      expect(inner).toBeDefined();
      
      expect(inner?.nodeIds).toContain('A');
      expect(outer?.nodeIds).toContain('B');
    });

    it('should parse direction override in subgraph', () => {
      const code = `
        subgraph one
          direction BT
          A --> B
        end
      `;
      const diagram = parseFlowchart(code);
      expect(diagram.subgraphs[0].direction).toBe('BT');
    });
  });

  describe('ClassDef and Class Application', () => {
    it('should parse classDef', () => {
      const code = 'classDef className fill:#f9f,stroke:#333,stroke-width:4px';
      const diagram = parseFlowchart(code);
      expect(diagram.classDefs).toHaveLength(1);
      expect(diagram.classDefs[0].name).toBe('className');
      expect(diagram.classDefs[0].styles).toEqual({
        fill: '#f9f',
        stroke: '#333',
        'stroke-width': '4px',
      });
    });

    it('should apply class to nodes', () => {
      const code = `
        A[Node A]
        B[Node B]
        class A,B className
      `;
      const diagram = parseFlowchart(code);
      const nodeA = diagram.nodes.find(n => n.id === 'A');
      const nodeB = diagram.nodes.find(n => n.id === 'B');
      
      expect(nodeA?.classes).toContain('className');
      expect(nodeB?.classes).toContain('className');
    });
  });

  describe('Comments', () => {
    it('should ignore comments', () => {
      const code = `
        %% This is a comment
        A --> B
      `;
      const diagram = parseFlowchart(code);
      expect(diagram.nodes).toHaveLength(2);
      expect(diagram.edges).toHaveLength(1);
    });
  });
});
