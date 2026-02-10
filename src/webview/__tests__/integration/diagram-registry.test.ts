import { describe, it, expect } from 'vitest';
import '@/webview/core/initAdapters';
import { DiagramRegistry } from '@/webview/core/registry/DiagramRegistry';
import { SequenceAdapter } from '@/webview/diagrams/sequence/adapter';
import { FlowchartAdapter } from '@/webview/diagrams/flowchart/adapter';
import { StateDiagramAdapter } from '@/webview/diagrams/stateDiagram/adapter';

describe('DiagramRegistry', () => {
  describe('initAdapters', () => {
    it('should load all three adapters correctly', () => {
      const types = DiagramRegistry.getAllTypes();
      expect(types).toContain('sequence');
      expect(types).toContain('flowchart');
      expect(types).toContain('state');
    });

    it('should have exactly 3 registered types', () => {
      const types = DiagramRegistry.getAllTypes();
      expect(types).toHaveLength(3);
    });

    it('should return ["sequence", "flowchart", "state"] from getAllTypes', () => {
      const types = DiagramRegistry.getAllTypes().sort();
      expect(types).toEqual(['flowchart', 'sequence', 'state']);
    });
  });

  describe('detect', () => {
    it('should detect sequence diagram from mermaid code', () => {
      const sequenceCode = 'sequenceDiagram\n  Alice->Bob: Hello Bob, how are you?';
      expect(DiagramRegistry.detect(sequenceCode)).toBe('sequence');
    });

    it('should detect flowchart from mermaid code', () => {
      const flowchartCode = 'flowchart TD\n  A[Start] --> B[End]';
      expect(DiagramRegistry.detect(flowchartCode)).toBe('flowchart');
    });

    it('should detect state diagram from mermaid code', () => {
      const stateDiagramCode = 'stateDiagram-v2\n  [*] --> State1\n  State1 --> [*]';
      expect(DiagramRegistry.detect(stateDiagramCode)).toBe('state');
    });

    it('should return "unknown" for unknown diagram type', () => {
      const unknownCode = 'gantt\n  task : 2024-01-01, 30d';
      expect(DiagramRegistry.detect(unknownCode)).toBe('unknown');
    });

    it('should handle case-insensitive detection for sequence', () => {
      const sequenceCode = 'SEQUENCEDIAGRAM\n  Alice->Bob: Hello';
      expect(DiagramRegistry.detect(sequenceCode)).toBe('sequence');
    });
  });

  describe('get', () => {
    it('should return SequenceAdapter for "sequence" type', () => {
      const adapter = DiagramRegistry.get('sequence');
      expect(adapter).toBeDefined();
      expect(adapter?.type).toBe('sequence');
    });

    it('should return FlowchartAdapter for "flowchart" type', () => {
      const adapter = DiagramRegistry.get('flowchart');
      expect(adapter).toBeDefined();
      expect(adapter?.type).toBe('flowchart');
    });

    it('should return StateDiagramAdapter for "state" type', () => {
      const adapter = DiagramRegistry.get('state');
      expect(adapter).toBeDefined();
      expect(adapter?.type).toBe('state');
    });

    it('should return undefined for unknown type', () => {
      const adapter = DiagramRegistry.get('unknown' as any);
      expect(adapter).toBeUndefined();
    });
  });

  describe('getOrDefault', () => {
    it('should return default adapter for unknown type', () => {
      const adapter = DiagramRegistry.getOrDefault('unknown' as any);
      expect(adapter).toBeDefined();
      expect(adapter.type).toBe('sequence');
    });

    it('should return the requested adapter if it exists', () => {
      const adapter = DiagramRegistry.getOrDefault('flowchart');
      expect(adapter).toBeDefined();
      expect(adapter.type).toBe('flowchart');
    });

    it('should return sequence adapter as default', () => {
      const adapter = DiagramRegistry.getOrDefault('nonexistent' as any);
      expect(adapter.type).toBe('sequence');
    });
  });

  describe('adapter instances', () => {
    it('SequenceAdapter should have correct properties', () => {
      expect(SequenceAdapter.type).toBe('sequence');
      expect(SequenceAdapter.name).toBe('时序图');
      expect(typeof SequenceAdapter.detect).toBe('function');
      expect(typeof SequenceAdapter.parse).toBe('function');
      expect(typeof SequenceAdapter.generate).toBe('function');
    });

    it('FlowchartAdapter should have correct properties', () => {
      expect(FlowchartAdapter.type).toBe('flowchart');
      expect(FlowchartAdapter.name).toBe('流程图');
      expect(typeof FlowchartAdapter.detect).toBe('function');
      expect(typeof FlowchartAdapter.parse).toBe('function');
      expect(typeof FlowchartAdapter.generate).toBe('function');
    });

    it('StateDiagramAdapter should have correct properties', () => {
      expect(StateDiagramAdapter.type).toBe('state');
      expect(StateDiagramAdapter.name).toBe('状态图');
      expect(typeof StateDiagramAdapter.detect).toBe('function');
      expect(typeof StateDiagramAdapter.parse).toBe('function');
      expect(typeof StateDiagramAdapter.generate).toBe('function');
    });
  });
});
