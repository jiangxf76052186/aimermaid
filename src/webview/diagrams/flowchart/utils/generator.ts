/**
 * 流程图 Mermaid 生成器
 * Flowchart Mermaid Generator
 *
 * 将 FlowchartDiagram 对象转换为 Mermaid 代码
 * Converts FlowchartDiagram object to Mermaid code
 */

import type {
  FlowchartDiagram,
  FlowNode,
  FlowEdge,
  Subgraph,
  NodeShape,
  EdgeType,
} from '@shared/types/flowchart';

/**
 * 形状到 Mermaid 语法的映射
 * Shape to Mermaid syntax mapping
 */
const SHAPE_TO_MERMAID: Record<string, { open: string; close: string }> = {
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
 * 连线类型到 Mermaid 语法的映射
 * Edge type to Mermaid syntax mapping
 */
const EDGE_TYPE_TO_MERMAID: Record<EdgeType, string> = {
  arrow: '-->',
  open: '---',
  'dotted-arrow': '-.->',
  'dotted-open': '-.-',
  'thick-arrow': '==>',
  'thick-open': '===',
  invisible: '~~~',
};

/**
 * 转义文本中的特殊字符
 * Escape special characters in text
 */
function escapeText(text: string): string {
  return text
    .replace(/"/g, '&quot;')
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
}

/**
 * 获取节点的 Mermaid 形状定义
 * Get Mermaid shape definition for a node
 */
function getShapeDefinition(shape: NodeShape, text: string): string {
  const escapedText = escapeText(text);
  const shapeDef = SHAPE_TO_MERMAID[shape];

  if (shapeDef) {
    return `${shapeDef.open}"${escapedText}"${shapeDef.close}`;
  }

  // 默认使用矩形
  return `["${escapedText}"]`;
}

/**
 * 生成节点定义行
 * Generate node definition line
 */
function generateNodeLine(node: FlowNode): string {
  // 如果有内联样式或图标，考虑使用新语法（v11.3+）
  if (node.icon || (node.styles && Object.keys(node.styles).length > 0)) {
    const props: string[] = [`shape: ${node.shape}`];
    if (node.icon) props.push(`icon: ${node.icon}`);
    // 这里可以添加更多属性支持
    return `${node.id}@{ ${props.join(', ')} }`;
  }

  return `${node.id}${getShapeDefinition(node.shape, node.text)}`;
}

/**
 * 生成子图
 * Generate subgraph
 */
function generateSubgraph(
  subgraph: Subgraph,
  diagram: FlowchartDiagram,
  indent: string = ''
): string {
  const lines: string[] = [];
  const escapedTitle = escapeText(subgraph.title);

  lines.push(`${indent}subgraph ${subgraph.id}["${escapedTitle}"]`);

  if (subgraph.direction) {
    lines.push(`${indent}    direction ${subgraph.direction}`);
  }

  for (const nodeId of subgraph.nodeIds) {
    const node = diagram.nodes.find((n) => n.id === nodeId);
    if (node) {
      lines.push(`${indent}    ${generateNodeLine(node)}`);
    }
  }

  lines.push(`${indent}end`);
  return lines.join('\n');
}

/**
 * 生成连线行
 * Generate edge line
 */
function generateEdgeLine(edge: FlowEdge): string {
  let arrow = EDGE_TYPE_TO_MERMAID[edge.type] || '-->';

  // 处理连线长度
  if (edge.length && edge.length > 1) {
    const baseChar = edge.type.includes('dotted')
      ? '.'
      : edge.type.includes('thick')
        ? '='
        : '-';
    const extraChars = baseChar.repeat(edge.length - 1);

    if (arrow.includes('>')) {
      arrow = arrow.replace(/-->|===|~~~|-\.->/, (match) => {
        const base = match.replace('>', '');
        return base.slice(0, -1) + extraChars + base.slice(-1) + '>';
      });
    } else {
      arrow = arrow.replace(/---|===|~~~|-\.-/, (match) => {
        return match.slice(0, -1) + extraChars + match.slice(-1);
      });
    }
  }

  if (edge.text) {
    const escapedText = escapeText(edge.text);
    return `${edge.from} ${arrow}|"${escapedText}"| ${edge.to}`;
  }

  return `${edge.from} ${arrow} ${edge.to}`;
}

/**
 * 格式化样式对象为字符串
 * Format styles object to string
 */
function formatStyles(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([key, value]) => `${key}:${value}`)
    .join(',');
}

/**
 * 生成 class 应用语句
 * Generate class application statements
 */
function generateClassApplications(diagram: FlowchartDiagram): string[] {
  const classMap = new Map<string, string[]>();

  // 收集每个类应用到哪些节点
  for (const node of diagram.nodes) {
    if (node.classes && node.classes.length > 0) {
      for (const className of node.classes) {
        if (!classMap.has(className)) {
          classMap.set(className, []);
        }
        classMap.get(className)!.push(node.id);
      }
    }
  }

  // 生成 class 语句
  const lines: string[] = [];
  for (const [className, nodeIds] of classMap) {
    lines.push(`class ${nodeIds.join(',')} ${className}`);
  }

  return lines;
}

/**
 * 生成流程图 Mermaid 代码
 * Generate Flowchart Mermaid code
 */
export function generateFlowchart(diagram: FlowchartDiagram): string {
  const lines: string[] = [];

  // 头部声明
  lines.push(`${diagram.keyword} ${diagram.direction}`);
  lines.push('');

  // 跟踪已定义的节点
  const definedNodes = new Set<string>();

  // 先输出不在子图中的节点
  const topLevelNodes = diagram.nodes.filter(
    (n) => !diagram.subgraphs.some((sg) => sg.nodeIds.includes(n.id))
  );

  for (const node of topLevelNodes) {
    lines.push(generateNodeLine(node));
    definedNodes.add(node.id);
  }

  if (topLevelNodes.length > 0) {
    lines.push('');
  }

  // 输出子图
  for (const subgraph of diagram.subgraphs) {
    lines.push(generateSubgraph(subgraph, diagram));
    subgraph.nodeIds.forEach((id) => definedNodes.add(id));
  }

  if (diagram.subgraphs.length > 0 && diagram.edges.length > 0) {
    lines.push('');
  }

  // 输出连线
  for (const edge of diagram.edges) {
    lines.push(generateEdgeLine(edge));
  }

  // 输出 classDef 定义
  if (diagram.classDefs.length > 0) {
    lines.push('');
    for (const classDef of diagram.classDefs) {
      const stylesStr = formatStyles(classDef.styles);
      lines.push(`classDef ${classDef.name} ${stylesStr}`);
    }
  }

  // 输出 class 应用
  const classApplications = generateClassApplications(diagram);
  if (classApplications.length > 0) {
    lines.push('');
    lines.push(...classApplications);
  }

  return lines.join('\n');
}
