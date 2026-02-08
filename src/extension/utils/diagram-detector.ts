import { DiagramType } from '../../shared/types';

/**
 * 检测 Mermaid 代码的图表类型
 */
export function detectDiagramType(code: string): DiagramType {
  const firstLine = code.trim().split('\n')[0].toLowerCase().trim();
  
  if (firstLine.startsWith('sequencediagram')) return 'sequence';
  if (firstLine.startsWith('graph') || firstLine.startsWith('flowchart')) return 'flowchart';
  if (firstLine.startsWith('classdiagram')) return 'class';
  if (firstLine.startsWith('statediagram')) return 'state';
  if (firstLine.startsWith('erdiagram')) return 'er';
  
  return 'unknown';
}
