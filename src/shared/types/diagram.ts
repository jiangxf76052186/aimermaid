import type { Node, Edge } from '@xyflow/react';
import type React from 'react';

/**
 * 支持的图表类型
 */
export type DiagramType = 'sequence' | 'flowchart' | 'class' | 'state' | 'er' | 'unknown';

/**
 * 基础图表状态接口 - 所有图表类型都必须实现
 */
export interface BaseDiagramState {
  type: DiagramType;
}

/**
 * 图表适配器接口 - 每种图表类型需要实现此接口
 * 
 * @template TState - 图表特定的状态类型，必须扩展 BaseDiagramState
 */
export interface DiagramAdapter<TState extends BaseDiagramState = BaseDiagramState> {
  /** 图表类型标识 */
  type: DiagramType;
  
  /** 显示名称，如 "时序图" */
  name: string;
  
  /** 将 Mermaid 代码解析为内部状态 */
  parse: (code: string) => TState;
  
  /** 将内部状态生成为 Mermaid 代码 */
  generate: (state: TState) => string;
  
  /** 检测给定代码是否属于该图表类型 */
  detect: (code: string) => boolean;
  
  /** React Flow 自定义节点类型映射 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodeTypes: Record<string, React.ComponentType<any>>;
  
  /** React Flow 自定义边类型映射 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edgeTypes: Record<string, React.ComponentType<any>>;
  
  /** 图表专用工具栏组件 */
  Toolbar: React.ComponentType;
  
  /** 图表专用属性面板组件 */
  PropertyPanel: React.ComponentType;
  
  /** 将图表状态转换为 React Flow 节点 */
  stateToNodes: (state: TState) => Node[];
  
  /** 将图表状态转换为 React Flow 边 */
  stateToEdges: (state: TState) => Edge[];
  
  /** 创建初始空状态 */
  createInitialState: () => TState;
}
