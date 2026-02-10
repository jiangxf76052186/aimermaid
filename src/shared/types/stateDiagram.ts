/**
 * 状态图类型定义
 * State Diagram Type Definitions
 *
 * 基于 Mermaid stateDiagram-v2 语法设计
 * Based on Mermaid stateDiagram-v2 Syntax
 */

// ==================== 基础枚举类型 ====================

/**
 * 状态类型
 * State Types
 */
export type StateType =
  | 'normal'     // 普通状态
  | 'start'      // 开始状态 [*]
  | 'end'        // 结束状态 [*]
  | 'choice'     // 选择节点 <<choice>>
  | 'fork'       // 分叉节点 <<fork>>
  | 'join'       // 汇合节点 <<join>>
  | 'composite'; // 复合状态

/**
 * 图表方向
 * Diagram Direction
 */
export type DiagramDirection = 'TB' | 'TD' | 'LR' | 'RL' | 'BT';

/**
 * 注释位置
 * Note Position
 */
export type NotePosition = 'left' | 'right';

// ==================== 核心数据结构 ====================

/**
 * 状态
 * State
 */
export interface State {
  /** 唯一标识 */
  id: string;
  /** 状态名称 (用于 Mermaid 代码中的 ID) */
  name: string;
  /** 描述文本 (显示用) */
  description?: string;
  /** 状态类型 */
  type: StateType;
  /** 父复合状态 ID (用于嵌套) */
  parentId?: string;
  /** 排列顺序 */
  order: number;
  /** 节点位置坐标 */
  position: { x: number; y: number };
  /** 节点宽度 */
  width?: number;
  /** 节点高度 */
  height?: number;
}

/**
 * 转换 (边)
 * Transition (Edge)
 */
export interface Transition {
  /** 唯一标识 */
  id: string;
  /** 源状态 ID */
  from: string;
  /** 目标状态 ID */
  to: string;
  /** 转换标签 (事件/条件) */
  label?: string;
  /** 定义顺序 */
  order: number;
}

/**
 * 注释
 * State Note
 */
export interface StateNote {
  /** 唯一标识 */
  id: string;
  /** 注释内容 (支持多行) */
  text: string;
  /** 位置 */
  position: NotePosition;
  /** 关联的状态 ID */
  stateId: string;
  /** 排列顺序 */
  order: number;
}

/**
 * 样式定义
 * Class Definition
 */
export interface StateClassDef {
  /** 类名 */
  name: string;
  /** CSS 属性 */
  properties: Record<string, string>;
}

/**
 * 样式应用
 * Class Assignment
 */
export interface StateClassAssignment {
  /** 状态 ID */
  stateId: string;
  /** 类名 */
  className: string;
}

/**
 * 完整状态图
 * Complete State Diagram
 */
export interface StateDiagram {
  /** 图表类型标识 */
  type: 'state';
  /** 所有状态 */
  states: State[];
  /** 所有转换 */
  transitions: Transition[];
  /** 所有注释 */
  notes: StateNote[];
  /** 图表方向 */
  direction: DiagramDirection;
  /** 样式定义 */
  classDefs: StateClassDef[];
  /** 样式应用 */
  classAssignments: StateClassAssignment[];
}

// ==================== React Flow 映射类型 ====================

/**
 * React Flow 状态节点数据
 */
export interface RFStateNodeData {
  /** 状态名称 */
  name: string;
  /** 状态描述 */
  description?: string;
  /** 状态类型 */
  stateType: StateType;
}

/**
 * React Flow 开始/结束节点数据
 */
export interface RFStartEndNodeData {
  /** 节点子类型: 开始 or 结束 */
  stateType: 'start' | 'end';
}

/**
 * React Flow Choice 节点数据
 */
export interface RFChoiceNodeData {
  /** 状态名称 */
  name: string;
  /** 状态类型 */
  stateType: 'choice';
}

/**
 * React Flow Fork/Join 节点数据
 */
export interface RFForkJoinNodeData {
  /** 状态名称 */
  name: string;
  /** 节点子类型: fork or join */
  stateType: 'fork' | 'join';
}

/**
 * React Flow 复合状态节点数据
 */
export interface RFCompositeNodeData {
  /** 状态名称 */
  name: string;
  /** 状态描述 */
  description?: string;
  /** 状态类型 */
  stateType: 'composite';
  /** 是否折叠 */
  collapsed?: boolean;
}

/**
 * React Flow 注释节点数据
 */
export interface RFStateNoteNodeData {
  /** 注释文本 */
  text: string;
  /** 位置 */
  position: NotePosition;
  /** 关联的状态 ID */
  stateId: string;
}

/**
 * React Flow 转换边数据
 */
export interface RFTransitionEdgeData {
  /** 标签 */
  label?: string;
}
