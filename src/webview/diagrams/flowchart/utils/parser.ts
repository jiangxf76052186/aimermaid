/**
 * 流程图 Mermaid 解析器
 * Flowchart Mermaid Parser
 *
 * 将 Mermaid 代码解析为 FlowchartDiagram 对象
 * Parses Mermaid code into FlowchartDiagram object
 */

import type {
  FlowchartDiagram,
  FlowNode,
  FlowEdge,
  Subgraph,
  ClassDef,
  Direction,
  NodeShape,
  EdgeType,
} from '@shared/types/flowchart';

/**
 * 解析流程图 Mermaid 代码
 * Parse Flowchart Mermaid code
 */
export function parseFlowchart(code: string): FlowchartDiagram {
  const lines = code
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%'));

  const diagram: FlowchartDiagram = {
    type: 'flowchart',
    direction: 'TB',
    nodes: [],
    edges: [],
    subgraphs: [],
    classDefs: [],
  };

  let currentSubgraph: Subgraph | null = null;
  const subgraphStack: Subgraph[] = [];

  for (const line of lines) {
    // 解析方向声明
    const directionMatch = line.match(
      /^flowchart\s+(TB|TD|BT|RL|LR)/i
    );
    if (directionMatch) {
      diagram.direction = directionMatch[1].toUpperCase() as Direction;
      continue;
    }

    // 解析 classDef
    const classDefMatch = line.match(/^classDef\s+(\w+)\s+(.+)$/);
    if (classDefMatch) {
      diagram.classDefs.push(
        parseClassDef(classDefMatch[1], classDefMatch[2])
      );
      continue;
    }

    // 解析 class 应用
    const classMatch = line.match(/^class\s+([\w,]+)\s+(\w+)$/);
    if (classMatch) {
      applyClass(diagram, classMatch[1], classMatch[2]);
      continue;
    }

    // 解析 subgraph 开始
    const subgraphMatch = line.match(
      /^subgraph\s+(\w+)(?:\s*\["?([^"\]]*)"?\])?/
    );
    if (subgraphMatch) {
      const subgraph: Subgraph = {
        id: subgraphMatch[1],
        title: subgraphMatch[2] || subgraphMatch[1],
        nodeIds: [],
      };

      if (currentSubgraph) {
        subgraphStack.push(currentSubgraph);
      }
      currentSubgraph = subgraph;
      diagram.subgraphs.push(subgraph);
      continue;
    }

    // 解析 subgraph 结束
    if (line === 'end') {
      if (subgraphStack.length > 0) {
        currentSubgraph = subgraphStack.pop() || null;
      } else {
        currentSubgraph = null;
      }
      continue;
    }

    // 解析方向覆盖 (在 subgraph 内)
    const directionOverrideMatch = line.match(
      /^direction\s+(TB|TD|BT|RL|LR)/i
    );
    if (directionOverrideMatch && currentSubgraph) {
      currentSubgraph.direction =
        directionOverrideMatch[1].toUpperCase() as Direction;
      continue;
    }

    // 解析节点定义
    const nodeMatch = line.match(
      /^(\w+)\s*(\[[^\]]*\]|\([^)]*\)|{[^}]*}|\(\([^)]*\)\)|\[\/[^\/]*\/\]|\[\\[^\\]*\\\]|\[\([^)]*\)\]|>>\[[^\]]*\]|\{\{[^}]*\}\}|\[\[[^\]]*\]\])/
    );
    if (nodeMatch) {
      const node = parseNodeDefinition(nodeMatch[1], nodeMatch[2]);
      if (currentSubgraph) {
        currentSubgraph.nodeIds.push(node.id);
      }
      diagram.nodes.push(node);
      continue;
    }

    // 解析连线
    const edgePatterns = [
      // 带文本的格式: A -->|text| B
      {
        regex: /^(\w+)\s*(-->|---|-.->|-.-|==>|===|~~~)\s*\|([^|]*)\|\s*(\w+)/,
        handler: parseEdgeWithText,
      },
      // 带冒号文本的格式: A --> B: text
      {
        regex: /^(\w+)\s*(-->|---|-.->|-.-|==>|===|~~~)\s*(\w+)\s*(?::\s*([^;]+))?/,
        handler: parseEdgeWithColonText,
      },
      // 标准格式: A --> B
      {
        regex: /^(\w+)\s*(-->|---|-.->|-.-|==>|===|~~~)\s*(\w+)/,
        handler: parseSimpleEdge,
      },
      // 链式: A --> B --> C (稍后处理)
    ];

    for (const pattern of edgePatterns) {
      const match = line.match(pattern.regex);
      if (match) {
        const edges = pattern.handler(match);
        diagram.edges.push(...edges);
        break;
      }
    }
  }

  return diagram;
}

// ==================== 辅助解析函数 ====================

/**
 * 解析节点定义
 * Parse node definition
 */
function parseNodeDefinition(id: string, definition: string): FlowNode {
  const shape = detectShape(definition);
  const text = extractText(definition);

  return {
    id,
    text,
    shape,
    position: { x: 0, y: 0 }, // 初始位置，后续自动布局
  };
}

/**
 * 检测节点形状
 * Detect node shape
 */
function detectShape(def: string): NodeShape {
  if (def.startsWith('[[')) return 'subprocess';
  if (def.startsWith('((')) {
    // 检查是 circle 还是 double-circle
    if (def.startsWith('(((')) return 'double-circle';
    return 'circle';
  }
  if (def.startsWith('(')) return 'rounded';
  if (def.startsWith('{')) return 'diamond';
  if (def.startsWith('{{')) return 'hexagon';
  if (def.startsWith('[(')) return 'cylinder';
  if (def.startsWith('[\\') || def.startsWith('[\\/')) {
    return 'parallelogram-alt';
  }
  if (def.startsWith('[/')) {
    // 检查是 parallelogram 还是 trapezoid
    if (def.includes('\\')) return 'trapezoid';
    return 'parallelogram';
  }
  if (def.startsWith('>[')) return 'asymmetric';
  if (def.startsWith('[')) return 'rect';

  // 默认返回矩形
  return 'rect';
}

/**
 * 提取节点文本
 * Extract node text
 */
function extractText(def: string): string {
  // 移除形状标记，提取文本内容
  const matches = def.match(/(?:\[|\(|\{|>)(.+?)(?:\]|\)|\}|<)/);
  if (!matches) return '';
  return matches[1]?.trim() || '';
}

/**
 * 解析 CSS 类定义
 * Parse CSS class definition
 */
function parseClassDef(name: string, stylesStr: string): ClassDef {
  const styles: Record<string, string> = {};
  const pairs = stylesStr.split(',').map((s) => s.trim());

  for (const pair of pairs) {
    const [key, value] = pair.split(':').map((s) => s.trim());
    if (key && value) {
      styles[key] = value;
    }
  }

  return { name, styles };
}

/**
 * 应用 CSS 类到节点
 * Apply CSS class to nodes
 */
function applyClass(diagram: FlowchartDiagram, nodeIds: string, className: string): void {
  const ids = nodeIds.split(',').map((id) => id.trim());
  for (const id of ids) {
    const node = diagram.nodes.find((n) => n.id === id);
    if (node) {
      if (!node.classes) {
        node.classes = [];
      }
      if (!node.classes.includes(className)) {
        node.classes.push(className);
      }
    }
  }
}

/**
 * 解析带文本的连线 (|text|)
 * Parse edge with text (|text|)
 */
function parseEdgeWithText(
  match: RegExpMatchArray
): FlowEdge[] {
  const [, from, arrowType, text, to] = match;
  return [
    {
      id: `e_${from}_${to}_${Date.now()}`,
      from,
      to,
      text: text.trim(),
      type: parseArrowType(arrowType) as EdgeType,
    },
  ];
}

/**
 * 解析带冒号文本的连线 (: text)
 * Parse edge with colon text (: text)
 */
function parseEdgeWithColonText(
  match: RegExpMatchArray
): FlowEdge[] {
  const [, from, arrowType, to, text] = match;
  return [
    {
      id: `e_${from}_${to}_${Date.now()}`,
      from,
      to,
      text: text ? text.trim() : undefined,
      type: parseArrowType(arrowType) as EdgeType,
    },
  ];
}

/**
 * 解析简单连线
 * Parse simple edge
 */
function parseSimpleEdge(
  match: RegExpMatchArray
): FlowEdge[] {
  const [, from, arrowType, to] = match;
  return [
    {
      id: `e_${from}_${to}_${Date.now()}`,
      from,
      to,
      type: parseArrowType(arrowType) as EdgeType,
    },
  ];
}

/**
 * 解析箭头类型
 * Parse arrow type
 */
function parseArrowType(arrow: string): EdgeType {
  switch (arrow) {
    case '-->':
      return 'arrow';
    case '---':
      return 'open';
    case '-.->':
      return 'dotted-arrow';
    case '-.-':
      return 'dotted-open';
    case '==>':
      return 'thick-arrow';
    case '===':
      return 'thick-open';
    case '~~~':
      return 'invisible';
    default:
      return 'arrow';
  }
}