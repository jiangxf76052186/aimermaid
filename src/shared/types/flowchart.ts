/**
 * 流程图类型定义
 * Flowchart Type Definitions
 *
 * 基于 Mermaid Flowchart 语法设计
 * Based on Mermaid Flowchart Syntax
 */

// ==================== 基础枚举类型 ====================

/**
 * 图表方向
 * Diagram Direction
 */
export type Direction = 'TB' | 'TD' | 'BT' | 'RL' | 'LR';

/**
 * 节点形状类型
 * Node Shape Types
 *
 * 基础形状 (MVP): rect, rounded, diamond, circle, cylinder, subprocess
 * 扩展形状 (Phase 2): asymmetric, trapezoid, hexagon, parallelogram, etc.
 * v11.3+ 新形状 (Phase 3): stadium, document, delay, fork, card, cloud, etc.
 */
export type NodeShape =
  // 基础形状 (MVP)
  | 'rect'           // [] - 矩形
  | 'rounded'        // () - 圆角矩形
  | 'diamond'        // {} - 菱形/决策
  | 'circle'         // (()) - 圆形
  | 'cylinder'       // [(/)] - 圆柱形/数据库
  | 'subprocess'     // [[]] - 子程序
  // 扩展形状 (Phase 2)
  | 'asymmetric'     // >] - 非对称形状
  | 'trapezoid'      // [/\] - 梯形
  | 'trapezoid-alt'  // [\\/] - 反向梯形
  | 'hexagon'        // {{}} - 六边形
  | 'parallelogram'  // [/ /] - 平行四边形
  | 'parallelogram-alt' // [\\ \\] - 反向平行四边形
  | 'double-circle'  // ((())) - 双圆
  // v11.3+ 形状 (Phase 3)
  | 'stadium'        // 体育场形
  | 'document'       // 文档形
  | 'delay'          // 延迟
  | 'fork'           // 分叉
  | 'card'           // 卡片
  | 'cloud'          // 云
  | 'comment'        // 注释
  | 'cross-circle'   // 带叉圆圈
  | string;          // 更多形状...

/**
 * 连线类型
 * Edge Types
 */
export type EdgeType =
  | 'arrow'          // --> - 实线箭头
  | 'open'           // --- - 实线无箭头
  | 'dotted-arrow'   // -.-> - 虚线箭头
  | 'dotted-open'    // -.- - 虚线无箭头
  | 'thick-arrow'    // ==> - 粗线箭头
  | 'thick-open'     // === - 粗线无箭头
  | 'invisible';     // ~~~ - 不可见链接

// ==================== 核心数据结构 ====================

/**
 * 流程图节点
 * Flowchart Node
 */
export interface FlowNode {
  /** 唯一标识符 */
  id: string;
  /** 节点文本内容 */
  text: string;
  /** 节点形状 */
  shape: NodeShape;
  /** 节点位置坐标 */
  position: { x: number; y: number };
  /** 节点宽度（可选） */
  width?: number;
  /** 节点高度（可选） */
  height?: number;
  /** 应用的CSS类名列表 */
  classes?: string[];
  /** 内联样式属性 */
  styles?: Record<string, string>;
  /** FontAwesome图标名称 */
  icon?: string;
}

/**
 * 流程图连线
 * Flowchart Edge
 */
export interface FlowEdge {
  /** 唯一标识符 */
  id: string;
  /** 源节点ID */
  from: string;
  /** 目标节点ID */
  to: string;
  /** 连线上的文本（可选） */
  text?: string;
  /** 连线类型 */
  type: EdgeType;
  /** 最小长度，额外的连字符数量（可选） */
  length?: number;
}

/**
 * 子图（分组）
 * Subgraph (Group)
 */
export interface Subgraph {
  /** 唯一标识符 */
  id: string;
  /** 子图标题 */
  title: string;
  /** 子图特有的方向（可选，继承全局方向） */
  direction?: Direction;
  /** 包含的节点ID列表 */
  nodeIds: string[];
  /** 嵌套的子图ID列表（Phase 2+） */
  subgraphIds?: string[];
  /** 子图位置（可选） */
  position?: { x: number; y: number };
  /** 子图宽度（可选） */
  width?: number;
  /** 子图高度（可选） */
  height?: number;
}

/**
 * CSS类定义
 * CSS Class Definition
 */
export interface ClassDef {
  /** 类名 */
  name: string;
  /** 样式属性映射 */
  styles: Record<string, string>;
}

// ==================== 图表主数据结构 ====================

/**
 * 流程图数据模型
 * Flowchart Diagram Data Model
 */
export interface FlowchartDiagram {
  /** 图表类型标识 */
  type: 'flowchart';
  /** 图表整体方向 */
  direction: Direction;
  /** 所有节点 */
  nodes: FlowNode[];
  /** 所有连线 */
  edges: FlowEdge[];
  /** 所有子图 */
  subgraphs: Subgraph[];
  /** CSS类定义列表 */
  classDefs: ClassDef[];
}

// ==================== React Flow 映射类型 ====================

/**
 * React Flow 节点数据
 * React Flow Node Data Structure
 */
export interface RFNodeData {
  /** 节点标签/文本 */
  label: string;
  /** 节点形状 */
  shape: NodeShape;
  /** 应用的CSS类名 */
  classes?: string[];
  /** 内联样式 */
  styles?: Record<string, string>;
  /** FontAwesome图标 */
  icon?: string;
}

/**
 * React Flow 边数据
 * React Flow Edge Data Structure
 */
export interface RFEdgeData {
  /** 边上文本 */
  text?: string;
  /** 连线类型 */
  edgeType: EdgeType;
  /** 连线长度 */
  length?: number;
}

// ==================== 工具函数类型 ====================

/**
 * 形状到Mermaid语法的映射
 * Shape to Mermaid Syntax Mapping
 */
export const SHAPE_TO_MERMAID: Record<string, { open: string; close: string }> = {
  rect: { open: '[', close: ']' },
  rounded: { open: '(', close: ')' },
  circle: { open: '((', close: '))' },
  'double-circle': { open: '(((', close: ')))' },
  diamond: { open: '{', close: '}' },
  hexagon: { open: '{{', close: '}}' },
  cylinder: { open: '[(', close: ')]' },
  subprocess: { open: '[[', close: ']]' },
  asymmetric: { open: '>', close: ']' },
  trapezoid: { open: '[/\\', close: '\\]' },
  'trapezoid-alt': { open: '[\\/', close: '/]' },
  parallelogram: { open: '[/', close: '/]' },
  'parallelogram-alt': { open: '[\\', close: '\\]' },
};

/**
 * 连线类型到Mermaid语法的映射
 * Edge Type to Mermaid Syntax Mapping
 */
export const EDGE_TYPE_TO_MERMAID: Record<EdgeType, string> = {
  'arrow': '-->',
  'open': '---',
  'dotted-arrow': '-.->',
  'dotted-open': '-.-',
  'thick-arrow': '==>',
  'thick-open': '===',
  'invisible': '~~~',
};
