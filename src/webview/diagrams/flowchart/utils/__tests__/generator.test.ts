import { describe, it, expect } from 'vitest';
import { generateFlowchart } from '../generator';
import { parseFlowchart } from '../parser';
import type { FlowchartDiagram, NodeShape, EdgeType } from '@shared/types/flowchart';

describe('Flowchart Generator', () => {
  const createBaseDiagram = (): FlowchartDiagram => ({
    type: 'flowchart',
    direction: 'TB',
    nodes: [],
    edges: [],
    subgraphs: [],
    classDefs: [],
  });

  describe('Basic Generation', () => {
    it('should generate basic flowchart with direction', () => {
      const diagram = createBaseDiagram();
      diagram.direction = 'LR';
      
      const code = generateFlowchart(diagram);
      expect(code).toContain('flowchart LR');
    });

    it('should generate nodes', () => {
      const diagram = createBaseDiagram();
      diagram.nodes.push(
        { id: 'A', text: 'Node A', shape: 'rect', position: { x: 0, y: 0 } },
        { id: 'B', text: 'Node B', shape: 'rounded', position: { x: 0, y: 0 } }
      );

      const code = generateFlowchart(diagram);
      expect(code).toContain('A["Node A"]');
      expect(code).toContain('B("Node B")');
    });

    it('should generate edges', () => {
      const diagram = createBaseDiagram();
      diagram.nodes.push(
        { id: 'A', text: 'A', shape: 'rect', position: { x: 0, y: 0 } },
        { id: 'B', text: 'B', shape: 'rect', position: { x: 0, y: 0 } }
      );
      diagram.edges.push({
        id: 'e1',
        from: 'A',
        to: 'B',
        type: 'arrow',
      });

      const code = generateFlowchart(diagram);
      expect(code).toContain('A --> B');
    });
  });

  describe('Node Shape Generation', () => {
    const shapes: { shape: NodeShape; expectedPattern: RegExp }[] = [
      { shape: 'rect', expectedPattern: /A\["Text"\]/ },
      { shape: 'rounded', expectedPattern: /A\("Text"\)/ },
      { shape: 'diamond', expectedPattern: /A\{"Text"\}/ },
      { shape: 'circle', expectedPattern: /A\(\("Text"\)\)/ },
      { shape: 'double-circle', expectedPattern: /A\(\(\("Text"\)\)\)/ },
      { shape: 'cylinder', expectedPattern: /A\[\("Text"\)\]/ },
      { shape: 'subprocess', expectedPattern: /A\[\["Text"\]\]/ },
      { shape: 'hexagon', expectedPattern: /A\{\{"Text"\}\}/ },
      { shape: 'asymmetric', expectedPattern: /A>"Text"\]/ },
      { shape: 'trapezoid', expectedPattern: /A\[\/\\"Text"\\\]/ },
      { shape: 'trapezoid-alt', expectedPattern: /A\[\\\/"Text"\/\]/ },
      { shape: 'parallelogram', expectedPattern: /A\[\/"Text"\/\]/ },
      { shape: 'parallelogram-alt', expectedPattern: /A\[\\"Text"\\\]/ },
    ];

    shapes.forEach(({ shape, expectedPattern }) => {
      it(`should generate ${shape} shape`, () => {
        const diagram = createBaseDiagram();
        diagram.nodes.push({
          id: 'A',
          text: 'Text',
          shape,
          position: { x: 0, y: 0 },
        });

        const code = generateFlowchart(diagram);
        expect(code).toMatch(expectedPattern);
      });
    });
  });

  describe('Edge Generation', () => {
    const edgeTypes: { type: EdgeType; expectedSymbol: string }[] = [
      { type: 'arrow', expectedSymbol: '-->' },
      { type: 'open', expectedSymbol: '---' },
      { type: 'dotted-arrow', expectedSymbol: '-.->' },
      { type: 'dotted-open', expectedSymbol: '-.-' },
      { type: 'thick-arrow', expectedSymbol: '==>' },
      { type: 'thick-open', expectedSymbol: '===' },
      { type: 'invisible', expectedSymbol: '~~~' },
    ];

    edgeTypes.forEach(({ type, expectedSymbol }) => {
      it(`should generate ${type} edge`, () => {
        const diagram = createBaseDiagram();
        diagram.nodes.push(
          { id: 'A', text: 'A', shape: 'rect', position: { x: 0, y: 0 } },
          { id: 'B', text: 'B', shape: 'rect', position: { x: 0, y: 0 } }
        );
        diagram.edges.push({
          id: 'e1',
          from: 'A',
          to: 'B',
          type,
        });

        const code = generateFlowchart(diagram);
        expect(code).toContain(`A ${expectedSymbol} B`);
      });
    });

    it('should generate edge with text', () => {
      const diagram = createBaseDiagram();
      diagram.nodes.push(
        { id: 'A', text: 'A', shape: 'rect', position: { x: 0, y: 0 } },
        { id: 'B', text: 'B', shape: 'rect', position: { x: 0, y: 0 } }
      );
      diagram.edges.push({
        id: 'e1',
        from: 'A',
        to: 'B',
        type: 'arrow',
        text: 'label',
      });

      const code = generateFlowchart(diagram);
      expect(code).toContain('A -->|"label"| B');
    });

    it('should generate edge with length', () => {
      const diagram = createBaseDiagram();
      diagram.nodes.push(
        { id: 'A', text: 'A', shape: 'rect', position: { x: 0, y: 0 } },
        { id: 'B', text: 'B', shape: 'rect', position: { x: 0, y: 0 } }
      );
      diagram.edges.push({
        id: 'e1',
        from: 'A',
        to: 'B',
        type: 'arrow',
        length: 2,
      });

      const code = generateFlowchart(diagram);
      expect(code).toContain('A ---> B');
    });
  });

  describe('Subgraph Generation', () => {
    it('should generate subgraph', () => {
      const diagram = createBaseDiagram();
      diagram.nodes.push(
        { id: 'A', text: 'A', shape: 'rect', position: { x: 0, y: 0 } }
      );
      diagram.subgraphs.push({
        id: 'sub1',
        title: 'Subgraph 1',
        nodeIds: ['A'],
      });

      const code = generateFlowchart(diagram);
      expect(code).toContain('subgraph sub1["Subgraph 1"]');
      expect(code).toContain('    A["A"]');
      expect(code).toContain('end');
    });

    it('should generate subgraph with direction', () => {
      const diagram = createBaseDiagram();
      diagram.subgraphs.push({
        id: 'sub1',
        title: 'Subgraph 1',
        nodeIds: [],
        direction: 'BT',
      });

      const code = generateFlowchart(diagram);
      expect(code).toContain('direction BT');
    });
  });

  describe('ClassDef and Class Application', () => {
    it('should generate classDef', () => {
      const diagram = createBaseDiagram();
      diagram.classDefs.push({
        name: 'myClass',
        styles: { fill: '#f9f', stroke: '#333' },
      });

      const code = generateFlowchart(diagram);
      expect(code).toContain('classDef myClass fill:#f9f,stroke:#333');
    });

    it('should generate class application', () => {
      const diagram = createBaseDiagram();
      diagram.nodes.push(
        { id: 'A', text: 'A', shape: 'rect', position: { x: 0, y: 0 }, classes: ['myClass'] },
        { id: 'B', text: 'B', shape: 'rect', position: { x: 0, y: 0 }, classes: ['myClass'] }
      );

      const code = generateFlowchart(diagram);
      expect(code).toContain('class A,B myClass');
    });
  });

  describe('Special Characters', () => {
    it('should escape special characters in node text', () => {
      const diagram = createBaseDiagram();
      diagram.nodes.push({
        id: 'A',
        text: 'Text with "quotes" and [brackets]',
        shape: 'rect',
        position: { x: 0, y: 0 },
      });

      const code = generateFlowchart(diagram);
      expect(code).toContain('A["Text with &quot;quotes&quot; and &#91;brackets&#93;"]');
    });
  });

  describe('Round Trip Consistency', () => {
    it('should maintain structure after parse -> generate -> parse', () => {
      const originalCode = `flowchart TB
    subgraph one["One"]
        direction BT
        A["Node A"]
    end
    B("Node B")
    A -->|text| B
    classDef red fill:#f00
    class A red`;

      const firstParse = parseFlowchart(originalCode);
      const generatedCode = generateFlowchart(firstParse);
      const secondParse = parseFlowchart(generatedCode);

      expect(secondParse.direction).toBe(firstParse.direction);
      expect(secondParse.nodes).toHaveLength(firstParse.nodes.length);
      expect(secondParse.edges).toHaveLength(firstParse.edges.length);
      expect(secondParse.subgraphs).toHaveLength(firstParse.subgraphs.length);
      expect(secondParse.classDefs).toHaveLength(firstParse.classDefs.length);

      const nodeA1 = firstParse.nodes.find(n => n.id === 'A');
      const nodeA2 = secondParse.nodes.find(n => n.id === 'A');
      expect(nodeA2?.text).toBe(nodeA1?.text);
      expect(nodeA2?.shape).toBe(nodeA1?.shape);
      expect(nodeA2?.classes).toEqual(nodeA1?.classes);

      const edge1 = firstParse.edges[0];
      const edge2 = secondParse.edges[0];
      expect(edge2.from).toBe(edge1.from);
      expect(edge2.to).toBe(edge1.to);
      expect(edge2.text).toBe(edge1.text);
      expect(edge2.type).toBe(edge1.type);
    });
  });
});
