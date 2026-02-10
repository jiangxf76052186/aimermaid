import { describe, it, expect } from 'vitest';
import { detectDiagramType } from '../../../utils/diagram-detector';

describe('diagram-detector', () => {
  describe('detectDiagramType', () => {
    // 检测 sequenceDiagram
    it('应该检测 sequenceDiagram', () => {
      const code = 'sequenceDiagram\nparticipant A\nparticipant B';
      expect(detectDiagramType(code)).toBe('sequence');
    });

    // 检测 graph/flowchart
    it('应该检测 graph 开头的 flowchart', () => {
      const code = 'graph TD\nA --> B';
      expect(detectDiagramType(code)).toBe('flowchart');
    });

    it('应该检测 flowchart 关键字', () => {
      const code = 'flowchart LR\nA --> B';
      expect(detectDiagramType(code)).toBe('flowchart');
    });

    // 检测 stateDiagram
    it('应该检测 stateDiagram', () => {
      const code = 'stateDiagram\n[*] --> A';
      expect(detectDiagramType(code)).toBe('state');
    });

    // 检测 classDiagram
    it('应该检测 classDiagram', () => {
      const code = 'classDiagram\nclass A';
      expect(detectDiagramType(code)).toBe('class');
    });

    // 检测 erDiagram
    it('应该检测 erDiagram', () => {
      const code = 'erDiagram\nENTITY_A';
      expect(detectDiagramType(code)).toBe('er');
    });

    // 未知类型返回 'unknown'
    it('应该返回 unknown 对于未知类型', () => {
      const code = 'unknownDiagram\nsome content';
      expect(detectDiagramType(code)).toBe('unknown');
    });

    it('应该返回 unknown 对于空内容', () => {
      const code = '';
      expect(detectDiagramType(code)).toBe('unknown');
    });

    // 首行有空白字符的情况
    it('应该处理首行前有空白字符的情况', () => {
      const code = '   sequenceDiagram\nparticipant A';
      expect(detectDiagramType(code)).toBe('sequence');
    });

    it('应该处理首行前有制表符的情况', () => {
      const code = '\t\tgraph TD\nA --> B';
      expect(detectDiagramType(code)).toBe('flowchart');
    });

    it('应该处理首行前有混合空白字符的情况', () => {
      const code = '  \t  classDiagram\nclass A';
      expect(detectDiagramType(code)).toBe('class');
    });

    // 空字符串处理
    it('应该处理仅包含空白字符的字符串', () => {
      const code = '   \n\n\t';
      expect(detectDiagramType(code)).toBe('unknown');
    });

    // 大小写不敏感
    it('应该对大小写不敏感（大写序列图）', () => {
      const code = 'SEQUENCEDIAGRAM\nparticipant A';
      expect(detectDiagramType(code)).toBe('sequence');
    });

    it('应该对大小写不敏感（混合大小写流程图）', () => {
      const code = 'GrApH TD\nA --> B';
      expect(detectDiagramType(code)).toBe('flowchart');
    });

    it('应该对大小写不敏感（大写状态图）', () => {
      const code = 'STATEDIAGRAM\n[*] --> A';
      expect(detectDiagramType(code)).toBe('state');
    });

    // 边界情况
    it('应该处理仅包含关键字的代码', () => {
      const code = 'sequenceDiagram';
      expect(detectDiagramType(code)).toBe('sequence');
    });

    it('应该处理关键字后有空格的情况', () => {
      const code = 'flowchart   \nA --> B';
      expect(detectDiagramType(code)).toBe('flowchart');
    });

    it('应该检测带后缀的 graph（如 graph TB）', () => {
      const code = 'graph TB\nA --> B';
      expect(detectDiagramType(code)).toBe('flowchart');
    });

    it('应该检测带后缀的 flowchart（如 flowchart TB）', () => {
      const code = 'flowchart TB\nA --> B';
      expect(detectDiagramType(code)).toBe('flowchart');
    });
  });
});
