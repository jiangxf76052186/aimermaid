import type { DiagramType } from '@shared/types';
import { useDiagramStore } from '../stores/diagramStore';
import { useFlowchartStore } from '../diagrams/flowchart/store';
import { useStateStore } from '../diagrams/stateDiagram/store';

/**
 * 根据图表类型获取对应的 store hook
 * 返回统一接口的 store，支持 loadFromMermaid, toMermaid, setTheme 等操作
 * 
 * @param diagramType - 图表类型
 * @returns 对应的 store hook 函数
 * 
 * @example
 * const store = getActiveStore('sequence');
 * store().loadFromMermaid(code);
 */
export function getActiveStore(diagramType: DiagramType) {
  switch (diagramType) {
    case 'flowchart':
      return useFlowchartStore;
    case 'state':
      return useStateStore;
    default:
      return useDiagramStore;
  }
}
