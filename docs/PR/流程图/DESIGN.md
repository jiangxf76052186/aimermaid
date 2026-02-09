# 流程图可视化编辑器设计文档

**版本**: v1.0  
**日期**: 2026-02-09  
**状态**: 设计阶段  

---

## 1. 需求范围定义

### 1.1 Mermaid流程图语法支持清单

| 特性分类 | 具体功能 | MVP (Phase 1) | Phase 2 | Phase 3 |
|---------|---------|--------------|---------|---------|
| **方向声明** | TB/TD (Top-Bottom) | ✅ | - | - |
|  | BT (Bottom-Top) | ✅ | - | - |
|  | LR (Left-Right) | ✅ | - | - |
|  | RL (Right-Left) | ✅ | - | - |
| **基础节点形状** | 矩形 `[]` | ✅ | - | - |
|  | 圆角矩形 `(())` | ✅ | - | - |
|  | 菱形 `{}` | ✅ | - | - |
|  | 圆形 `(())` | ✅ | - | - |
| **常用节点形状** | 圆柱 `[(/)]` (Database) | ✅ | - | - |
|  | 子程序 `[[]]` | ✅ | - | - |
|  | 非对称 `>]` | ⬜ | ✅ | - |
|  | 梯形 `[/\]` | ⬜ | ✅ | - |
|  | 六边形 `{{}}` | ⬜ | ✅ | - |
|  | 平行四边形 `[/ /]` | ⬜ | ✅ | - |
| **v11.3+新形状** | Stadium, Document, Delay等40+种 | ⬜ | ⬜ | ✅ |
| **连线类型** | 实线箭头 `-->` | ✅ | - | - |
|  | 实线无箭头 `---` | ✅ | - | - |
|  | 虚线箭头 `-.->` | ✅ | - | - |
|  | 虚线无箭头 `-.-` | ✅ | - | - |
|  | 粗线箭头 `==>` | ⬜ | ✅ | - |
|  | 不可见链接 `~~~` | ⬜ | ⬜ | ✅ |
| **连线文本** | 边上文本 `\|`text`\|` | ✅ | - | - |
|  | 长连线和多行文本 | ⬜ | ✅ | - |
| **子图** | 基本子图 | ✅ | - | - |
|  | 嵌套子图 | ⬜ | ✅ | - |
|  | 子图方向覆盖 | ⬜ | ✅ | - |
| **样式系统** | classDef定义 | ⬜ | ✅ | - |
|  | class应用 | ⬜ | ✅ | - |
|  | 内联样式 (:::) | ⬜ | ⬜ | ✅ |
| **交互** | click事件 | ⬜ | ⬜ | ✅ |
| **特殊节点** | FontAwesome图标 | ⬜ | ⬜ | ✅ |
|  | 图片节点 | ⬜ | ⬜ | ✅ |

### 1.2 编辑功能需求

| 功能 | 描述 | MVP | Phase2 | Phase3 |
|------|------|-----|--------|--------|
| 节点创建 | 从Toolbar添加节点到画布中心 | ✅ | - | - |
| 节点拖拽 | 拖动改变节点位置 | ✅ | - | - |
| 节点编辑 | 双击编辑节点文本 | ✅ | - | - |
| 节点删除 | Delete键或右键菜单删除 | ✅ | - | - |
| 节点形状切换 | PropertyPanel下拉选择 | ✅ | - | - |
| 连线创建 | Handle拖拽连接节点 | ✅ | - | - |
| 连线文本编辑 | 双击边标签编辑 | ✅ | - | - |
| 连线类型切换 | PropertyPanel按钮组 | ✅ | - | - |
| 子图创建 | Toolbar按钮 + 框选区域 | ✅ | - | - |
| 子图调整 | 拖拽整体移动内部节点 | ✅ | - | - |
| 缩放平移 | 滚轮缩放、中键拖拽平移 | ✅ | - | - |
| 多选操作 | Shift+框选多节点 | ⬜ | ✅ | - |
| 复制粘贴 | Ctrl+C/V 复制节点 | ⬜ | ✅ | - |
| 撤销重做 | Ctrl+Z/Y 完整历史记录 | ✅ | - | - |
| 实时预览 | 同步显示Mermaid代码预览 | ✅ | - | - |

---

## 2. 数据模型设计

### 2.1 核心类型定义

```typescript
// src/shared/types.ts 扩展

export type Direction = 'TB' | 'TD' | 'BT' | 'RL' | 'LR';

export type NodeShape = 
  // 基础形状 (MVP)
  | 'rect'           // []
  | 'rounded'        // ()
  | 'diamond'        // {}
  | 'circle'         // (())
  | 'cylinder'       // [(/)] Database
  | 'subprocess'     // [[]]
  // 扩展形状 (Phase 2)
  | 'asymmetric'     // >]
  | 'trapezoid'      // [/\]
  | 'trapezoid-alt'  // [\\/]
  | 'hexagon'        // {{}}
  | 'parallelogram'  // [/ /]
  | 'parallelogram-alt' // [\\ \\]
  | 'double-circle'  // ((()))
  // v11.3+ 形状 (Phase 3)
  | 'stadium'
  | 'document'
  | 'delay'
  | 'fork'
  | 'card'
  | 'cloud'
  | 'comment'
  | 'cross-circle'
  | string; // 更多形状...

export type EdgeType = 
  | 'arrow'          // -->
  | 'open'           // ---
  | 'dotted-arrow'   // -.->
  | 'dotted-open'    // -.-
  | 'thick-arrow'    // ==>
  | 'thick-open'     // ===
  | 'invisible';     // ~~~

export interface FlowNode {
  id: string;
  text: string;
  shape: NodeShape;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  classes?: string[];      // 应用的CSS类名
  styles?: Record<string, string>; // 内联样式
  icon?: string;           // FontAwesome图标名
}

export interface FlowEdge {
  id: string;
  from: string;           // source node id
  to: string;             // target node id
  text?: string;          // 连线上的文本
  type: EdgeType;
  length?: number;        // 最小长度 (额外的 - 数量)
}

export interface Subgraph {
  id: string;
  title: string;
  direction?: Direction;  // 子图特有的方向，可选
  nodeIds: string[];      // 包含的节点ID列表
  subgraphIds?: string[]; // 嵌套的子图ID (Phase 2+)
  position?: { x: number; y: number }; // 子图位置
  width?: number;
  height?: number;
}

export interface ClassDef {
  name: string;
  styles: Record<string, string>;
}

export interface FlowchartDiagram {
  type: 'flowchart';
  direction: Direction;
  nodes: FlowNode[];
  edges: FlowEdge[];
  subgraphs: Subgraph[];
  classDefs: ClassDef[];  // CSS类定义
}
```

### 2.2 React Flow映射

React Flow使用的Nodes和Edges结构：

```typescript
// React Flow Node Data Structure
interface RFNodeData {
  label: string;
  shape: NodeShape;
  classes?: string[];
  styles?: Record<string, string>;
  icon?: string;
}

// React Flow Edge Data Structure  
interface RFEdgeData {
  text?: string;
  edgeType: EdgeType;
  length?: number;
}
```

---

## 3. 解析器与生成器设计

### 3.1 Parser架构

文件: `src/webview/diagrams/flowchart/parser.ts`

```typescript
export function parseFlowchart(code: string): FlowchartDiagram {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));
  
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
    if (line.match(/^flowchart\s+(TB|TD|BT|RL|LR)/i)) {
      diagram.direction = line.match(/(TB|TD|BT|RL|LR)/i)?.[1].toUpperCase() as Direction || 'TB';
      continue;
    }

    // 解析classDef
    const classDefMatch = line.match(/^classDef\s+(\w+)\s+(.+)$/);
    if (classDefMatch) {
      diagram.classDefs.push(parseClassDef(classDefMatch[1], classDefMatch[2]));
      continue;
    }

    // 解析class应用
    const classMatch = line.match(/^class\s+([\w,]+)\s+(\w+)$/);
    if (classMatch) {
      applyClass(diagram, classMatch[1], classMatch[2]);
      continue;
    }

    // 解析subgraph开始
    const subgraphMatch = line.match(/^subgraph\s+(\w+)(?:\s*\["?([^"\]]*)"?\])?/);
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

    // 解析subgraph结束
    if (line === 'end') {
      if (subgraphStack.length > 0) {
        currentSubgraph = subgraphStack.pop() || null;
      } else {
        currentSubgraph = null;
      }
      continue;
    }

    // 解析方向覆盖 (在subgraph内)
    const directionMatch = line.match(/^direction\s+(TB|TD|BT|RL|LR)/i);
    if (directionMatch && currentSubgraph) {
      currentSubgraph.direction = directionMatch[1].toUpperCase() as Direction;
      continue;
    }

    // 解析节点定义
    const nodeMatch = line.match(/^(\w+)\s*(\[[^\]]*\]|\([^)]*\)|{[^}]*}|\(\([^)]*\)\)|\[\/[^\/]*\/\]|\[\\[^\\]*\\\]|\[\([^)]*\)\]|>>\[[^\]]*\]|\{\{[^}]*\}\}|\[\[[^\]]*\]\])/);
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
      // 标准格式: A --> B
      { regex: /^(\w+)\s*(-->|---|-.->|-.-|==>|===|~~~)\s*(\w+)\s*(?::\s*([^;]+))?/, handler: parseSimpleEdge },
      // 带文本的格式: A -->|text| B
      { regex: /^(\w+)\s*(-->|---|-.->|-.-|==>|===|~~~)\s*\|([^|]*)\|\s*(\w+)/, handler: parseEdgeWithText },
      // 链式: A --> B --> C
      { regex: /^(\w+(?:\s*-->\s*\w+)+)/, handler: parseChainedEdges },
    ];
    
    for (const pattern of edgePatterns) {
      const match = line.match(pattern.regex);
      if (match) {
        const edges = pattern.handler(match, diagram.nodes);
        diagram.edges.push(...edges);
        break;
      }
    }
  }

  return diagram;
}

// 辅助函数
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

function detectShape(def: string): NodeShape {
  if (def.startsWith('[[')) return 'subprocess';
  if (def.startsWith('((')) return 'double-circle';
  if (def.startsWith('(')) return 'rounded';
  if (def.startsWith('{')) return 'diamond';
  if (def.startsWith('{{')) return 'hexagon';
  if (def.startsWith('[(')) return 'cylinder';
  if (def.startsWith('[\\') || def.startsWith('[\\/')) return 'parallelogram-alt';
  if (def.startsWith('[/' )) return 'parallelogram';
  if (def.startsWith('>[')) return 'asymmetric';
  if (def.startsWith('[/\\')) return 'trapezoid';
  if (def.startsWith('[\\/')) return 'trapezoid-alt';
  if (def.startsWith('[')) return 'rect';
  
  // v11.3+ 新语法: A@{ shape: rect }
  const newShapeMatch = def.match(/@\{\s*shape:\s*(\w+)\s*\}/);
  if (newShapeMatch) {
    return newShapeMatch[1] as NodeShape;
  }
  
  return 'rect';
}

function extractText(def: string): string {
  // 移除形状标记，提取文本内容
  const matches = def.match(/(?:\[|\(|\{|>)(.+?)(?:\]|\)|\}|<)/);
  return matches?.[1]?.trim() || '';
}
```

### 3.2 Generator架构

文件: `src/webview/diagrams/flowchart/generator.ts`

```typescript
export function generateFlowchart(diagram: FlowchartDiagram): string {
  const lines: string[] = [];
  
  // 头部
  lines.push(`flowchart ${diagram.direction}`);
  lines.push('');
  
  // 节点定义 (按子图分组输出)
  const definedNodes = new Set<string>();
  
  // 先输出不在子图中的节点
  const topLevelNodes = diagram.nodes.filter(n => 
    !diagram.subgraphs.some(sg => sg.nodeIds.includes(n.id))
  );
  
  for (const node of topLevelNodes) {
    lines.push(generateNodeLine(node));
    definedNodes.add(node.id);
  }
  
  if (topLevelNodes.length > 0) lines.push('');
  
  // 输出子图
  for (const subgraph of diagram.subgraphs) {
    lines.push(generateSubgraph(subgraph, diagram));
    subgraph.nodeIds.forEach(id => definedNodes.add(id));
  }
  
  // 输出连线
  for (const edge of diagram.edges) {
    lines.push(generateEdgeLine(edge));
  }
  
  if (diagram.edges.length > 0) lines.push('');
  
  // 输出class定义
  for (const classDef of diagram.classDefs) {
    lines.push(`classDef ${classDef.name} ${formatStyles(classDef.styles)}`);
  }
  
  // 输出class应用
  const classApplications = generateClassApplications(diagram);
  if (classApplications.length > 0) {
    lines.push('');
    lines.push(...classApplications);
  }
  
  return lines.join('\n');
}

function generateNodeLine(node: FlowNode): string {
  const shapeDef = getShapeDefinition(node.shape, node.text);
  
  // 如果有额外样式或图标，使用新语法
  if (node.icon || Object.keys(node.styles || {}).length > 0) {
    const props: string[] = [`shape: ${node.shape}`];
    if (node.icon) props.push(`icon: ${node.icon}`);
    // ... 其他属性
    return `${node.id}@{ ${props.join(', ')} }`;
  }
  
  return `${node.id}${shapeDef}`;
}

function getShapeDefinition(shape: NodeShape, text: string): string {
  const escapedText = text.replace(/"/g, '&quot;');
  
  switch (shape) {
    case 'rect': return `["${escapedText}"]`;
    case 'rounded': return `("${escapedText}")`;
    case 'circle': return `(("${escapedText}"))`;
    case 'double-circle': return `((("${escapedText}")))`;
    case 'diamond': return `{"${escapedText}"}`;
    case 'hexagon': return `{{"${escapedText}"}}`;
    case 'cylinder': return `[("${escapedText}")]`;
    case 'subprocess': return `[["${escapedText}"]]`;
    case 'asymmetric': return `>${escapedText}]`;
    case 'trapezoid': return `[/"${escapedText}"\\]`;
    case 'trapezoid-alt': return `[\\"${escapedText}"/`;
    case 'parallelogram': return `[/"${escapedText}"/]`;
    case 'parallelogram-alt': return `[\\"${escapedText}"\\]`;
    default: return `["${escapedText}"]`;
  }
}

function generateSubgraph(subgraph: Subgraph, diagram: FlowchartDiagram): string {
  const lines: string[] = [];
  lines.push(`subgraph ${subgraph.id}["${subgraph.title}"]`);
  
  if (subgraph.direction) {
    lines.push(`    direction ${subgraph.direction}`);
  }
  
  for (const nodeId of subgraph.nodeIds) {
    const node = diagram.nodes.find(n => n.id === nodeId);
    if (node) {
      lines.push(`    ${generateNodeLine(node)}`);
    }
  }
  
  lines.push('end');
  return lines.join('\n');
}

function generateEdgeLine(edge: FlowEdge): string {
  const arrowMap: Record<EdgeType, string> = {
    'arrow': '-->',
    'open': '---',
    'dotted-arrow': '-.->',
    'dotted-open': '-.-',
    'thick-arrow': '==>',
    'thick-open': '===',
    'invisible': '~~~',
  };
  
  let arrow = arrowMap[edge.type] || '-->';
  
  // 处理连线长度
  if (edge.length && edge.length > 1) {
    const extra = edge.type.includes('dotted') ? '.' : 
                  edge.type.includes('thick') ? '=' : '-';
    arrow = arrow.replace(/(-|=|\.)>/, (match) => extra.repeat(edge.length!) + '>').replace(/(-|=|\.)$/, (match) => extra.repeat(edge.length!));
  }
  
  if (edge.text) {
    return `${edge.from} ${arrow}|"${edge.text}"| ${edge.to}`;
  }
  
  return `${edge.from} ${arrow} ${edge.to}`;
}
```

---

## 4. 界面交互设计

### 4.1 节点操作

#### 4.1.1 添加节点

**触发方式：**
1. **Toolbar点击**：点击左侧工具栏的形状按钮 → 在画布中心创建该形状的节点
2. **快捷键**：选中节点后按 Enter 创建相同形状的兄弟节点
3. **右键菜单**：画布空白处右键 → "Add Node" → 选择形状

**默认位置计算：**
```typescript
// 在画布可视区域中心附近随机偏移，避免重叠
const centerX = viewport.x + viewport.width / 2;
const centerY = viewport.y + viewport.height / 2;
const offsetX = (Math.random() - 0.5) * 50;
const offsetY = (Math.random() - 0.5) * 50;
position = { x: centerX + offsetX, y: centerY + offsetY };
```

**默认尺寸规范：**
| 形状 | 宽度 | 高度 | 备注 |
|------|------|------|------|
| 矩形/圆角 | 140px | 60px | 标准尺寸 |
| 菱形 | 120px | 120px | 正方形比例 |
| 圆形 | 100px | 100px | 正圆 |
| 圆柱 | 140px | 80px | 稍高 |

#### 4.1.2 编辑节点

**内联编辑模式：**
- **触发**：双击节点或使用快捷键 F2
- **UI元素**：节点变为输入框，边框高亮为蓝色
- **确认**：Enter 键或失去焦点 (onBlur)
- **取消**：Escape 键恢复原始文本
- **验证**：不允许空字符串，自动去除首尾空格

**实现参考：**
```typescript
const [isEditing, setIsEditing] = useState(false);
const [editValue, setEditValue] = useState(data.label);

const handleDoubleClick = () => {
  setIsEditing(true);
  setEditValue(data.label);
};

const handleBlur = () => {
  setIsEditing(false);
  if (editValue.trim() && editValue !== data.label) {
    updateNode(id, { text: editValue.trim() });
  }
};
```

#### 4.1.3 移动节点

**行为：**
- **拖拽**：鼠标左键按住节点任意位置拖动
- **对齐提示**：靠近其他节点时显示对齐辅助线（水平/垂直居中、边缘对齐）
- **网格吸附**：可配置是否开启，步进值为 10px
- **边界限制**：节点不能完全拖出画布可视区域

**子图内的节点：**
- 拖动子图标题栏整体移动子图及其内部所有节点
- 单独拖动子图内的节点可调整相对位置

#### 4.1.4 删除节点

**触发方式：**
1. **键盘**：选中节点后按 Delete 或 Backspace 键
2. **右键菜单**：右键节点 → "Delete"
3. **PropertyPanel**：点击顶部的删除按钮

**级联删除：**
- 自动删除与该节点相连的所有边
- 如果节点属于某个子图，仅从子图的 nodeIds 中移除，不删除子图本身
- 弹出确认对话框（可配置开关）："删除此节点将同时删除 X 条连接线，确定吗？"

#### 4.1.5 改变节点形状

**触发方式：**
- PropertyPanel中的下拉选择器（选中节点时可见）

**形状分类展示：**
```
基础形状
├── 矩形 (Process)
├── 圆角矩形 (Event)  
├── 菱形 (Decision)
└── 圆形 (Start/Stop)

数据存储
├── 圆柱 (Database)
└── 文档 (Document)

流程控制
├── 子程序 (Subroutine)
├── 预定义过程
└── 手动操作

高级形状 (Phase 2+)
├── 梯形
├── 六边形
├── 平行四边形
└── 更多...
```

**切换逻辑：**
- 保留节点的 ID、文本内容、位置不变
- 根据新形状的尺寸调整宽高比
- 触发 pushHistory() 以便撤销

### 4.2 连线操作

#### 4.2.1 创建连线

**操作流程：**
1. 鼠标移到源节点边缘，出现半透明 Handle（小蓝点）
2. 按住 Handle 拖拽出连线
3. 拖到目标节点上时，目标节点高亮显示
4. 松开鼠标完成连接

**Handle位置：**
- 每个节点有 4 个 Handle：Top、Right、Bottom、Left
- 默认连线从右侧Handle出发，连到左侧Handle
- 用户可以从任意Handle开始拖拽

**与时序图的关键差异：**
```typescript
// 时序图的反向逻辑（重要！已在项目中踩坑并记录）
// 用户心智模型：从A拉一条线到B，表示A→B
// React Flow逻辑：source是起点，target是终点
// 但在本项目时序图中，发现需要交换source/target才能正确显示箭头方向

// 流程图同样需要遵循此模式
onConnect: (connection) => {
  if (connection.source && connection.target) {
    // 用户从source拖到target，实际想表达的是: source --> target
    // 所以直接使用 connection.source -> connection.target
    addEdge(connection.source, connection.target, 'New Edge');
  }
}
```

**智能连接：**
- 如果两个节点已经存在同向连接，提示"已存在连接线"
- 如果会形成循环（取决于图表语义），允许但用不同颜色警告

#### 4.2.2 编辑连线文本

**触发方式：**
- **双击连线**：在连线中点处出现文本输入框
- **PropertyPanel**：选中边后，在面板中编辑 Text 字段

**文本位置：**
- 始终显示在连线中点
- 文本较长时自动换行（最多2行）
- 背景使用半透明白色遮罩，确保文字可读

**输入约束：**
- 单行文本，Enter 确认
- 最大长度 100 字符（超出截断）
- 支持 Unicode 和 Emoji

#### 4.2.3 改变连线类型

**PropertyPanel中的选项：**
```
连线类型 (Edge Type)
○ 实线箭头  ──────────►  (默认)
○ 实线      ──────────
○ 虚线箭头  - - - - - ►
○ 虚线      - - - - -
○ 粗线箭头  ══════════►
```

**视觉呈现：**
- 实线：stroke-dasharray: none
- 虚线：stroke-dasharray: 5,5
- 粗线：stroke-width: 3px (vs 默认 1.5px)

#### 4.2.4 删除连线

- 选中连线（单击）→ Delete键删除
- 右键连线 → "Delete Edge"
- 删除节点时级联删除其所有连线

### 4.3 子图操作

#### 4.3.1 创建子图

**方式一：框选创建（推荐）**
1. 按住 Shift + 鼠标拖拽，绘制选择框包围多个节点
2. 右键 → "Group into Subgraph" 或 Toolbar上的"Group"按钮
3. 自动生成子图，包含选中的所有节点

**方式二：先创建后填充**
1. Toolbar点击"Subgraph"按钮
2. 在画布上创建一个空的子图容器
3. 将已有节点拖入子图

**新建子图的默认值：**
```typescript
const newSubgraph: Subgraph = {
  id: `sg_${Date.now()}`,
  title: 'New Subgraph',
  direction: undefined, // 继承全局方向
  nodeIds: selectedNodeIds, // 如果是框选
  position: calculateBoundingBox(selectedNodes),
  width: calculatedWidth + PADDING,
  height: calculatedHeight + PADDING,
};
```

#### 4.3.2 子图视觉效果

**外观样式：**
- 浅灰色半透明背景 (rgba(200, 200, 200, 0.15))
- 顶部标题栏：深色背景，白色文字
- 边框：虚线边框，颜色略深于背景
- 内边距：20px（节点不能贴边）

**选中态：**
- 边框变为蓝色 (#3b82f6)
- 四角显示 resize handles（用于调整大小）

#### 4.3.3 编辑子图

**修改标题：**
- 双击标题栏进入编辑模式
- 或选中后在 PropertyPanel 编辑

**调整大小：**
- 拖拽四角或边缘的 resize handles
- 最小尺寸：200x150px
- 内部节点随子图移动保持相对位置

**移动子图：**
- 拖拽标题栏整体移动
- 内部所有节点跟随移动
- 子图之间的连线自动重绘路径

**解散子图：**
- 右键子图 → "Ungroup"
- 仅删除子图容器，保留所有节点在画布上
- 不会删除节点或连线

#### 4.3.4 嵌套子图 (Phase 2)

**层次管理：**
- 子图可以包含其他子图
- 最多支持 3 层嵌套（避免过于复杂）
- 嵌套子图在视觉上缩进显示

**操作约束：**
- 不能直接拖拽节点到跨级子图
- 必须先展开父级子图

### 4.4 属性面板设计 (PropertyPanel)

文件：`src/webview/diagrams/flowchart/components/FlowchartPropertyPanel.tsx`

#### 4.4.1 通用布局

```
┌─────────────────────────────┐
│  Properties          [×]    │
├─────────────────────────────┤
│                             │
│  [动态内容区域]              │
│                             │
├─────────────────────────────┤
│  Actions                    │
│  [删除] [复制] [置顶/置底]   │
└─────────────────────────────┘
```

#### 4.4.2 选中节点时的属性

```
┌─────────────────────────────┐
│ Node Properties             │
├─────────────────────────────┤
│                             │
│  Text                       │
│  ┌─────────────────────┐    │
│  │ Process Payment     │    │
│  └─────────────────────┘    │
│                             │
│  Shape                      │
│  ┌─────────────────────┐    │
│  │ 🔽 Rect (Rectangle) │    │
│  └─────────────────────┘    │
│                             │
│  Position                   │
│  X: [  120  ] Y: [  340 ]   │
│                             │
│  Size                       │
│  W: [  140  ] H: [   60 ]   │
│                             │
│  Style Classes              │
│  ┌─────────────────────┐    │
│  │ highlight, error    │    │
│  └─────────────────────┘    │
│                             │
│  [Advanced...]              │
│                             │
└─────────────────────────────┘
```

**字段说明：**
- **Text**: textarea，支持多行，自动调整节点高度
- **Shape**: select dropdown，分组显示各类形状
- **Position**: 数字输入框，可直接精确定位
- **Size**: 数字输入框，部分形状禁用（如圆形只能改直径）
- **Style Classes**: 逗号分隔的类名输入，用于应用CSS样式

#### 4.4.3 选中边时的属性

```
┌─────────────────────────────┐
│ Edge Properties             │
├─────────────────────────────┤
│                             │
│  Label                      │
│  ┌─────────────────────┐    │
│  │ Yes                 │    │
│  └─────────────────────┘    │
│                             │
│  Edge Type                  │
│  ○ Solid Arrow              │
│  ● Dotted Arrow             │
│  ○ Thick Arrow              │
│  ○ Solid Line               │
│                             │
│  Source → Target            │
│  node_1 → node_2            │
│                             │
│  [Reverse Direction]        │
│                             │
└─────────────────────────────┘
```

#### 4.4.4 选中子图时的属性

```
┌─────────────────────────────┐
│ Subgraph Properties         │
├─────────────────────────────┤
│                             │
│  Title                      │
│  ┌─────────────────────┐    │
│  │ Authentication Flow │    │
│  └─────────────────────┘    │
│                             │
│  Direction Override         │
│  ┌─────────────────────┐    │
│  │ Inherit (TB)        │    │
│  └─────────────────────┘    │
│                             │
│  Contains                   │
│  • 5 nodes                  │
│  • 3 edges                  │
│                             │
│  [Ungroup] [Export...]      │
│                             │
└─────────────────────────────┘
```

#### 4.4.5 未选中任何元素时的全局设置

```
┌─────────────────────────────┐
│ Flowchart Settings          │
├─────────────────────────────┤
│                             │
│  Direction                  │
│  ┌─────────────────────┐    │
│  │ Top to Bottom ↓     │    │
│  └─────────────────────┘    │
│                             │
│  Theme                      │
│  ○ Light  ● Dark            │
│                             │
│  Grid                       │
│  ● Show grid                │
│  ○ Snap to grid             │
│                             │
│  Stats                      │
│  Nodes: 12 | Edges: 18      │
│  Subgraphs: 3               │
│                             │
│  [Auto Layout]              │
│                             │
└─────────────────────────────┘
```

### 4.5 Toolbar设计

文件：`src/webview/diagrams/flowchart/components/FlowchartToolbar.tsx`

#### 4.5.1 布局结构

左侧垂直工具栏，宽 56px，高度自适应。

```
┌─────────┐
│ 🔷      │ ← 选择/拖拽模式 (默认激活)
├─────────┤
│ ☐       │ ← 矩形
│ ◇       │ ← 菱形
│ ⚪      │ ← 圆形
│ ▭▭      │ ← 圆角矩形
├─────────┤
│ 🗄️      │ ← 数据库
│ 📄      │ ← 文档
│ ⚙️      │ ← 子程序
├─────────┤
│ 📦      │ ← 子图
│ 📝      │ ← 文本块
├─────────┤
│ ↔️      │ ← 连线模式
└─────────┘
```

#### 4.5.2 按钮分组

| 分组 | 按钮 | Tooltip | 快捷键 |
|------|------|---------|--------|
| **光标** | Pointer | 选择和拖拽模式 | V |
| **基础形状** | Rectangle | 矩形 (Process) | R |
| | Diamond | 菱形 (Decision) | D |
| | Circle | 圆形 (Start/End) | C |
| | Rounded | 圆角矩形 | O |
| **数据/IO** | Database | 圆柱形数据库 | S |
| | Document | 文档形状 | F |
| | Parallelogram | 平行四边形 (Input/Output) | I |
| **流程控制** | Subprocess | 子程序/预定义过程 | U |
| **容器** | Subgraph | 创建子图分组 | G |
| | Text Block | 纯文本注释 | T |
| **工具** | Edge Mode | 快速连线模式 | E |

#### 4.5.3 交互细节

**按钮激活态：**
- 当前选中的工具按钮高亮显示（蓝色背景）
- 选择模式(Pointer)为默认状态

**创建节点的反馈：**
- 点击形状按钮后，按钮高亮闪烁一次
- 鼠标光标变为十字准星
- 在画布上点击即在该位置创建节点
- 创建完成后自动回到Pointer模式

**快捷创建：**
- 按住 Alt 键点击按钮 = 连续创建模式（可连续放置多个同类节点）

### 4.6 Canvas画布行为

文件：`src/webview/diagrams/flowchart/components/FlowchartCanvas.tsx`

#### 4.6.1 背景网格

**显示选项：**
- 点状网格（默认）：间隔 20px，小灰点 rgba(150,150,150,0.2)
- 线状网格：细线，适合精确对齐
- 隐藏网格：简洁视图

**配置项：**
```typescript
interface GridOptions {
  enabled: boolean;
  type: 'dots' | 'lines' | 'none';
  size: number;      // 网格间距，默认 20
  snap: boolean;     // 是否吸附
  snapThreshold: number; // 吸附阈值，默认 10px
}
```

#### 4.6.2 视口操作

**平移画布：**
- 方式1：按住 Space 键 + 鼠标拖拽
- 方式2：按住鼠标中键拖拽
- 方式3：触控板双指滑动（Mac）

**缩放：**
- 鼠标滚轮：以光标位置为中心缩放
- 捏合手势（触控板）
- 缩放范围：25% - 200%
- 重置：Ctrl+0 或双击缩放控件

**缩放控件UI：**
```
右下角悬浮控件
┌──────────┐
│ +  100%  │ ← 放大按钮、当前百分比
│          │
│    −     │ ← 缩小按钮
└──────────┘
```

#### 4.6.3 多选操作

**框选：**
- 按住 Shift + 鼠标拖拽绘制选择框
- 完全在选择框内的节点被选中
- 被选中的节点显示蓝色阴影边框

**多选编辑：**
- 批量移动：拖拽任意选中节点，所有选中节点一起移动
- 批量删除：Delete键删除所有选中节点
- 成组：选中的节点可以一键转为子图

### 4.7 快捷键设计

| 快捷键 | 功能 | 上下文 |
|--------|------|--------|
| **基础操作** |||
| Ctrl+S | 保存 | 全局 |
| Ctrl+Z | 撤销 | 全局 |
| Ctrl+Y / Ctrl+Shift+Z | 重做 | 全局 |
| Ctrl+A | 全选 | 全局 |
| Delete / Backspace | 删除选中 | 有选中元素时 |
| Esc | 取消选择/退出编辑模式 | 全局 |
| **编辑** |||
| F2 | 编辑选中节点文本 | 选中单个节点时 |
| Enter | 确认编辑 | 编辑模式中 |
| Escape | 取消编辑 | 编辑模式中 |
| **创建** |||
| R | 切换到矩形工具 | 全局 |
| D | 切换到菱形工具 | 全局 |
| C | 切换到圆形工具 | 全局 |
| V | 切换到选择工具 | 全局 |
| G | 创建子图（从选中） | 有选中节点时 |
| **导航** |||
| Space + Drag | 平移画布 | 全局 |
| Ctrl+0 | 重置缩放 | 全局 |
| Ctrl++ / Ctrl+= | 放大 | 全局 |
| Ctrl+- | 缩小 | 全局 |
| **高级** |||
| Tab | 创建兄弟节点 | 选中节点时 |
| Ctrl+D | 复制选中 | 有选中元素时 |
| Ctrl+G | 成组 | 多选时 |
| Ctrl+Shift+G | 解散组 | 选中子图时 |
| ? | 显示快捷键帮助 | 全局 |

---

## 5. 组件架构

### 5.1 组件清单

#### 5.1.1 容器组件

| 组件名 | 文件路径 | 职责 |
|--------|----------|------|
| FlowchartEditor | `components/FlowchartEditor.tsx` | 流程图编辑器主容器，组装所有子组件 |
| FlowchartCanvas | `components/FlowchartCanvas.tsx` | React Flow画布包装，处理交互 |
| FlowchartProvider | `components/FlowchartProvider.tsx` | Context Provider，提供store访问 |

#### 5.1.2 UI组件

| 组件名 | 文件路径 | 职责 |
|--------|----------|------|
| FlowchartToolbar | `components/FlowchartToolbar.tsx` | 左侧工具栏 |
| FlowchartPropertyPanel | `components/FlowchartPropertyPanel.tsx` | 右侧属性面板 |
| MiniMap | `components/MiniMap.tsx` | 画布缩略图（React Flow内置） |
| Controls | `components/Controls.tsx` | 缩放控制按钮 |
| ContextMenu | `components/ContextMenu.tsx` | 右键上下文菜单 |

#### 5.1.3 节点组件

**方案选择：**

方案A: **通用ShapeNode组件**（推荐）
- 单一组件处理所有40+种形状
- 通过 `shape` prop 决定渲染的SVG path
- 优点：代码少，易维护，统一交互
- 缺点：复杂度集中在单个组件

方案B: 每种形状独立组件
- RectangleNode, DiamondNode, CircleNode等
- 优点：单个组件简单
- 缺点：重复代码多，新增形状需新建文件

**推荐采用方案A，实现如下：**

```typescript
// nodes/ShapeNode.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useFlowchartStore } from '../store';
import { NodeShape } from '@shared/types';

interface ShapeNodeData {
  label: string;
  shape: NodeShape;
  classes?: string[];
  icon?: string;
}

const ShapeNode: React.FC<NodeProps<ShapeNodeData>> = ({ 
  id, 
  data, 
  selected,
  xPos,
  yPos 
}) => {
  const { label, shape, classes = [], icon } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const updateNode = useFlowchartStore(s => s.updateNode);
  
  // 形状渲染逻辑
  const renderShape = () => {
    switch (shape) {
      case 'rect':
        return <rect x="0" y="0" width="140" height="60" />;
      case 'rounded':
        return <rect x="0" y="0" width="140" height="60" rx="8" />;
      case 'diamond':
        return <polygon points="70,0 140,30 70,60 0,30" />;
      case 'circle':
        return <circle cx="50" cy="30" r="30" />;
      case 'cylinder':
        return (
          <>
            <path d="M0,15 Q0,0 70,0 Q140,0 140,15 L140,45 Q140,60 70,60 Q0,60 0,45 Z" />
            <ellipse cx="70" cy="15" rx="70" ry="15" fill="currentColor" opacity="0.1" />
          </>
        );
      // ... 更多形状
      default:
        return <rect x="0" y="0" width="140" height="60" />;
    }
  };
  
  return (
    <div className={`shape-node ${selected ? 'selected' : ''} ${classes.join(' ')}`}>
      {/* Handles */}
      <Handle type="target" position={Position.Top} id="t" />
      <Handle type="target" position={Position.Right} id="r" />
      <Handle type="target" position={Position.Bottom} id="b" />
      <Handle type="target" position={Position.Left} id="l" />
      <Handle type="source" position={Position.Top} id="st" />
      <Handle type="source" position={Position.Right} id="sr" />
      <Handle type="source" position={Position.Bottom} id="sb" />
      <Handle type="source" position={Position.Left} id="sl" />
      
      {/* Shape SVG */}
      <svg className="node-shape" viewBox="0 0 140 60">
        {renderShape()}
      </svg>
      
      {/* Content */}
      <div className="node-content">
        {isEditing ? (
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
              setIsEditing(false);
              if (editValue.trim() !== label) {
                updateNode(id, { text: editValue.trim() });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                setEditValue(label);
                setIsEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <span onDoubleClick={() => {
            setIsEditing(true);
            setEditValue(label);
          }}>
            {icon && <Icon name={icon} />}
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default memo(ShapeNode);
```

#### 5.1.4 边组件

```typescript
// edges/FlowEdge.tsx
import { memo } from 'react';
import { EdgeProps, getBezierPath } from '@xyflow/react';
import { useFlowchartStore } from '../store';

const FlowEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const { text, edgeType } = data || {};
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const updateEdge = useFlowchartStore(s => s.updateEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // 根据edgeType设置样式
  const getStrokeStyle = () => {
    switch (edgeType) {
      case 'dotted-arrow':
      case 'dotted-open':
        return { strokeDasharray: '5,5' };
      case 'thick-arrow':
      case 'thick-open':
        return { strokeWidth: 3 };
      default:
        return {};
    }
  };

  return (
    <>
      <path
        id={id}
        className={`flow-edge ${selected ? 'selected' : ''}`}
        d={edgePath}
        markerEnd={edgeType?.includes('arrow') ? 'url(#arrowhead)' : undefined}
        fill="none"
        {...getStrokeStyle()}
      />
      {text && (
        <foreignObject
          x={labelX - 50}
          y={labelY - 15}
          width={100}
          height={30}
          className="edge-label"
        >
          {isEditing ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => {
                setIsEditing(false);
                if (editValue !== text) {
                  updateEdge(id, { text: editValue });
                }
              }}
              autoFocus
            />
          ) : (
            <span onDoubleClick={() => {
              setIsEditing(true);
              setEditValue(text);
            }}>
              {text}
            </span>
          )}
        </foreignObject>
      )}
    </>
  );
};

export default memo(FlowEdge);
```

#### 5.1.5 子图组件

```typescript
// nodes/SubgraphNode.tsx
import { memo } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { useFlowchartStore } from '../store';

interface SubgraphData {
  label: string;
  direction?: string;
}

const SubgraphNode: React.FC<NodeProps<SubgraphData>> = ({
  id,
  data,
  selected,
  xPos,
  yPos,
}) => {
  const { label, direction } = data;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const updateSubgraph = useFlowchartStore(s => s.updateSubgraph);

  return (
    <div className={`subgraph-node ${selected ? 'selected' : ''}`}>
      {selected && (
        <NodeResizer
          minWidth={200}
          minHeight={150}
          onResizeEnd={(_, params) => {
            updateSubgraph(id, { 
              width: params.width, 
              height: params.height 
            });
          }}
        />
      )}
      
      {/* 标题栏 */}
      <div className="subgraph-header">
        {isEditing ? (
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
              setIsEditing(false);
              if (editValue !== label) {
                updateSubgraph(id, { title: editValue });
              }
            }}
            autoFocus
          />
        ) : (
          <span onDoubleClick={() => {
            setIsEditing(true);
            setEditValue(label);
          }}>
            {label}
            {direction && ` (${direction})`}
          </span>
        )}
      </div>
      
      {/* 内容区域 */}
      <div className="subgraph-content" />
    </div>
  );
};

export default memo(SubgraphNode);
```

### 5.2 组件注册

在Canvas组件中注册所有节点和边类型：

```typescript
// FlowchartCanvas.tsx
import ShapeNode from '../nodes/ShapeNode';
import SubgraphNode from '../nodes/SubgraphNode';
import TextNode from '../nodes/TextNode';
import FlowEdge from '../edges/FlowEdge';

const nodeTypes = {
  shape: ShapeNode,
  subgraph: SubgraphNode,
  text: TextNode,
};

const edgeTypes = {
  flow: FlowEdge,
};

// React Flow中使用
<ReactFlow
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  // ...
/>
```

---

## 6. Store设计

### 6.1 State定义

```typescript
// store.ts
import { create } from 'zustand';
import { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import { FlowchartDiagram, FlowNode, FlowEdge, Subgraph, Direction } from '@shared/types';

export interface FlowchartState {
  // 核心数据
  diagram: FlowchartDiagram;
  
  // React Flow渲染数据（派生自diagram）
  nodes: Node[];
  edges: Edge[];
  
  // UI状态
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  lastSelectedNodeId: string | null;
  
  // 工具状态
  activeTool: 'pointer' | 'rectangle' | 'diamond' | 'circle' | 'rounded' | 
              'database' | 'document' | 'subprocess' | 'edge';
  
  // 历史记录
  history: FlowchartDiagram[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

export interface FlowchartActions {
  // 初始化
  loadFromMermaid: (code: string) => void;
  toMermaid: () => string;
  
  // 节点选择
  selectNode: (id: string, multi?: boolean) => void;
  selectNodes: (ids: string[]) => void;
  deselectAll: () => void;
  
  // 节点操作
  addNode: (shape: NodeShape, position?: { x: number; y: number }, text?: string) => void;
  updateNode: (id: string, updates: Partial<FlowNode>) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  changeNodeShape: (id: string, shape: NodeShape) => void;
  
  // 边操作
  addEdge: (from: string, to: string, type?: EdgeType, text?: string) => void;
  updateEdge: (id: string, updates: Partial<FlowEdge>) => void;
  removeEdge: (id: string) => void;
  changeEdgeType: (id: string, type: EdgeType) => void;
  
  // 子图操作
  addSubgraph: (nodeIds: string[], title?: string) => void;
  updateSubgraph: (id: string, updates: Partial<Subgraph>) => void;
  removeSubgraph: (id: string, keepNodes?: boolean) => void;
  ungroupSubgraph: (id: string) => void;
  moveSubgraph: (id: string, delta: { dx: number; dy: number }) => void;
  
  // 批量操作
  deleteSelected: () => void;
  duplicateSelected: () => void;
  groupSelected: () => void;
  
  // 历史记录
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  
  // React Flow回调
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: (event: React.MouseEvent, node: Node) => void;
  
  // 工具
  setActiveTool: (tool: FlowchartState['activeTool']) => void;
  
  // 全局设置
  setDirection: (direction: Direction) => void;
  autoLayout: () => void;
}

export type FlowchartStore = FlowchartState & FlowchartActions;
```

### 6.2 Store实现

```typescript
// store.ts (continued)

// 转换函数
function diagramToNodes(diagram: FlowchartDiagram): Node[] {
  const nodes: Node[] = [];
  
  // 转换普通节点
  for (const node of diagram.nodes) {
    const isInSubgraph = diagram.subgraphs.some(sg => sg.nodeIds.includes(node.id));
    
    nodes.push({
      id: node.id,
      type: 'shape',
      position: node.position,
      parentId: isInSubgraph ? findParentSubgraph(diagram, node.id) : undefined,
      data: {
        label: node.text,
        shape: node.shape,
        classes: node.classes,
        icon: node.icon,
      },
      style: {
        width: node.width || 140,
        height: node.height || 60,
      },
    });
  }
  
  // 转换子图
  for (const subgraph of diagram.subgraphs) {
    nodes.push({
      id: subgraph.id,
      type: 'subgraph',
      position: subgraph.position || { x: 0, y: 0 },
      data: {
        label: subgraph.title,
        direction: subgraph.direction,
      },
      style: {
        width: subgraph.width || 300,
        height: subgraph.height || 200,
      },
    });
  }
  
  return nodes;
}

function diagramToEdges(diagram: FlowchartDiagram): Edge[] {
  return diagram.edges.map(edge => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    type: 'flow',
    data: {
      text: edge.text,
      edgeType: edge.type,
    },
    label: edge.text,
  }));
}

export const useFlowchartStore = create<FlowchartStore>((set, get) => ({
  // 初始状态
  diagram: {
    type: 'flowchart',
    direction: 'TB',
    nodes: [],
    edges: [],
    subgraphs: [],
    classDefs: [],
  },
  nodes: [],
  edges: [],
  selectedNodeIds: [],
  selectedEdgeIds: [],
  lastSelectedNodeId: null,
  activeTool: 'pointer',
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,

  // 加载Mermaid代码
  loadFromMermaid: (code: string) => {
    try {
      const diagram = parseFlowchart(code);
      const nodes = diagramToNodes(diagram);
      const edges = diagramToEdges(diagram);
      set({ 
        diagram, 
        nodes, 
        edges, 
        selectedNodeIds: [],
        selectedEdgeIds: [],
        history: [diagram],
        historyIndex: 0,
        canUndo: false,
        canRedo: false,
      });
    } catch (error) {
      console.error('Failed to parse mermaid:', error);
    }
  },

  // 导出Mermaid代码
  toMermaid: () => {
    return generateFlowchart(get().diagram);
  },

  // 节点选择
  selectNode: (id: string, multi = false) => {
    const { selectedNodeIds } = get();
    if (multi) {
      if (selectedNodeIds.includes(id)) {
        set({ 
          selectedNodeIds: selectedNodeIds.filter(i => i !== id),
          selectedEdgeIds: []
        });
      } else {
        set({ 
          selectedNodeIds: [...selectedNodeIds, id],
          selectedEdgeIds: []
        });
      }
    } else {
      set({ 
        selectedNodeIds: [id],
        selectedEdgeIds: [],
        lastSelectedNodeId: id
      });
    }
  },

  selectNodes: (ids: string[]) => {
    set({ selectedNodeIds: ids, selectedEdgeIds: [] });
  },

  deselectAll: () => {
    set({ 
      selectedNodeIds: [], 
      selectedEdgeIds: [],
      lastSelectedNodeId: null
    });
  },

  // 添加节点
  addNode: (shape, position, text) => {
    get().pushHistory();
    const { diagram } = get();
    
    const newNode: FlowNode = {
      id: `n_${Date.now()}`,
      text: text || shape.charAt(0).toUpperCase() + shape.slice(1),
      shape,
      position: position || { x: 100, y: 100 },
    };
    
    const newDiagram = {
      ...diagram,
      nodes: [...diagram.nodes, newNode],
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
    });
  },

  // 更新节点
  updateNode: (id, updates) => {
    get().pushHistory();
    const { diagram } = get();
    
    const newDiagram = {
      ...diagram,
      nodes: diagram.nodes.map(n => 
        n.id === id ? { ...n, ...updates } : n
      ),
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
    });
  },

  // 删除节点
  removeNode: (id) => {
    get().pushHistory();
    const { diagram } = get();
    
    // 级联删除相关边
    const relatedEdges = diagram.edges.filter(
      e => e.from === id || e.to === id
    );
    
    const newDiagram = {
      ...diagram,
      nodes: diagram.nodes.filter(n => n.id !== id),
      edges: diagram.edges.filter(e => e.from !== id && e.to !== id),
      subgraphs: diagram.subgraphs.map(sg => ({
        ...sg,
        nodeIds: sg.nodeIds.filter(nid => nid !== id),
      })),
    };
    
    set({
      diagram: newDiagram,
      nodes: diagramToNodes(newDiagram),
      edges: diagramToEdges(newDiagram),
      selectedNodeIds: get().selectedNodeIds.filter(i => i !== id),
    });
  },

  // 添加边
  addEdge: (from, to, type = 'arrow', text) => {
    get().pushHistory();
    const { diagram } = get();
    
    const newEdge: FlowEdge = {
      id: `e_${Date.now()}`,
      from,
      to,
      type,
      text,
    };
    
    const newDiagram = {
      ...diagram,
      edges: [...diagram.edges, newEdge],
    };
    
    set({
      diagram: newDiagram,
      edges: diagramToEdges(newDiagram),
    });
  },

  // 历史记录管理
  pushHistory: () => {
    const { diagram, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(diagram)));
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const diagram = history[newIndex];
      set({
        diagram,
        nodes: diagramToNodes(diagram),
        edges: diagramToEdges(diagram),
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const diagram = history[newIndex];
      set({
        diagram,
        nodes: diagramToNodes(diagram),
        edges: diagramToEdges(diagram),
        historyIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < history.length - 1,
      });
    }
  },

  // React Flow回调
  onNodesChange: (changes) => {
    // 应用React Flow的节点变化
    const { nodes: currentNodes } = get();
    const newNodes = applyNodeChanges(changes, currentNodes);
    set({ nodes: newNodes });
    
    // 同步回diagram（位置变化）
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        const { diagram } = get();
        const nodeIndex = diagram.nodes.findIndex(n => n.id === change.id);
        if (nodeIndex >= 0) {
          const newDiagram = { ...diagram };
          newDiagram.nodes[nodeIndex] = {
            ...newDiagram.nodes[nodeIndex],
            position: change.position,
          };
          set({ diagram: newDiagram });
        }
      }
    });
  },

  onEdgesChange: (changes) => {
    const { edges: currentEdges } = get();
    const newEdges = applyEdgeChanges(changes, currentEdges);
    set({ edges: newEdges });
  },

  onConnect: (connection) => {
    if (connection.source && connection.target) {
      get().addEdge(connection.source, connection.target);
    }
  },

  onNodeDragStop: (_, node) => {
    get().pushHistory();
    const { diagram } = get();
    
    // 更新diagram中的节点位置
    const newNodes = diagram.nodes.map(n =>
      n.id === node.id ? { ...n, position: node.position } : n
    );
    
    const newDiagram = { ...diagram, nodes: newNodes };
    set({ diagram: newDiagram });
  },

  // 更多actions...
  deleteSelected: () => {
    const { selectedNodeIds, selectedEdgeIds } = get();
    selectedEdgeIds.forEach(id => get().removeEdge(id));
    selectedNodeIds.forEach(id => get().removeNode(id));
    set({ selectedNodeIds: [], selectedEdgeIds: [] });
  },

  setActiveTool: (tool) => set({ activeTool: tool }),
  
  setDirection: (direction) => {
    get().pushHistory();
    const { diagram } = get();
    const newDiagram = { ...diagram, direction };
    set({ diagram: newDiagram });
  },

  // ... 其他actions的实现
}));
```

### 6.3 History机制详解

**设计原则：**
- 每次用户操作前调用 `pushHistory()`
- 保存完整的 `diagram` 快照（深拷贝）
- Undo/Redo 通过替换当前 diagram 实现
- nodes 和 edges 从新的 diagram 重新计算

**内存优化（Phase 2考虑）：**
- 使用结构化克隆替代 JSON.parse/stringify
- 限制历史记录数量（例如最多50步）
- 对大图考虑增量diff而非全量快照

---

## 7. 样式与主题

### 7.1 VS Code主题适配

使用VS Code提供的CSS变量：

```css
/* styles/flowchart.css */
:root {
  /* VS Code主题变量 */
  --vscode-bg: var(--vscode-editor-background);
  --vscode-fg: var(--vscode-editor-foreground);
  --vscode-border: var(--vscode-panel-border);
  --vscode-accent: var(--vscode-button-background);
  --vscode-accent-hover: var(--vscode-button-hoverBackground);
  --vscode-selection: var(--vscode-editor-selectionBackground);
}
```

### 7.2 节点默认样式

```css
/* 基础节点样式 */
.shape-node {
  background: transparent;
  border: none;
}

.shape-node svg {
  fill: var(--vscode-input-background);
  stroke: var(--vscode-input-border);
  stroke-width: 2;
}

.shape-node.selected svg {
  stroke: var(--vscode-focusBorder);
  filter: drop-shadow(0 0 4px var(--vscode-focusBorder));
}

.node-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--vscode-input-foreground);
  font-size: 14px;
  pointer-events: none;
}

.node-content input {
  pointer-events: all;
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-focusBorder);
  color: var(--vscode-input-foreground);
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
}
```

### 7.3 边样式

```css
.flow-edge {
  stroke: var(--vscode-foreground);
  stroke-width: 1.5;
}

.flow-edge.selected {
  stroke: var(--vscode-focusBorder);
  stroke-width: 2.5;
}

.edge-label {
  background: var(--vscode-editor-background);
  color: var(--vscode-foreground);
  font-size: 12px;
  text-align: center;
}

.edge-label input {
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-focusBorder);
  color: var(--vscode-input-foreground);
  padding: 2px 4px;
  font-size: 12px;
}
```

### 7.4 子图样式

```css
.subgraph-node {
  background: rgba(var(--vscode-editor-background), 0.3);
  border: 2px dashed var(--vscode-panel-border);
  border-radius: 8px;
}

.subgraph-node.selected {
  border-color: var(--vscode-focusBorder);
  border-style: solid;
}

.subgraph-header {
  background: var(--vscode-titleBar-activeBackground);
  color: var(--vscode-titleBar-activeForeground);
  padding: 8px 12px;
  border-radius: 6px 6px 0 0;
  font-weight: bold;
  cursor: grab;
}

.subgraph-content {
  min-height: 100px;
  padding: 20px;
}
```

---

## 8. 文件结构

```
src/
├── extension/
│   └── ... (保持不变)
│
├── webview/
│   ├── diagrams/
│   │   ├── sequence/           # 现有时序图
│   │   │   └── ...
│   │   │
│   │   └── flowchart/          # 新增流程图
│   │       ├── components/
│   │       │   ├── FlowchartCanvas.tsx
│   │       │   ├── FlowchartToolbar.tsx
│   │       │   ├── FlowchartPropertyPanel.tsx
│   │       │   ├── FlowchartProvider.tsx
│   │       │   └── ContextMenu.tsx
│   │       │
│   │       ├── nodes/
│   │       │   ├── ShapeNode.tsx       # 通用形状节点
│   │       │   ├── SubgraphNode.tsx    # 子图容器
│   │       │   └── TextNode.tsx        # 纯文本节点
│   │       │
│   │       ├── edges/
│   │       │   └── FlowEdge.tsx
│   │       │
│   │       ├── store.ts
│   │       ├── adapter.ts
│   │       ├── parser.ts
│   │       ├── generator.ts
│   │       ├── shapes.ts               # 形状定义和渲染
│   │       └── index.ts
│   │
│   ├── core/
│   │   └── registry.ts       # DiagramRegistry扩展
│   │
│   └── ...
│
└── shared/
    └── types.ts              # 扩展FlowchartDiagram类型
```

---

## 9. 待确认问题清单

以下问题在设计阶段解决，开发阶段不再讨论：

### Q1: 40+种形状如何实现？
**推荐方案**：采用通用ShapeNode组件
- 原因：代码复用率高，新增形状只需扩展shapes.ts字典
- 实现：创建shapes.ts导出所有形状的SVG path和数据
- 风险：单个组件可能变得复杂（通过拆分renderShape函数缓解）

### Q2: 子图的内部布局如何处理？
**推荐方案**：委托给React Flow的parentNode机制
- 子图作为parent节点，内部节点设置parentId
- React Flow自动处理相对坐标
- 拖拽子图时会带动子节点

### Q3: 是否需要自动布局算法？
**推荐方案**：MVP不包含，Phase 2引入
- MVP依赖用户手动拖拽定位
- Phase 2集成dagre.js或其他布局引擎
- 提供"Auto Layout"按钮作为可选功能

### Q4: 如何处理子图与外部节点的连线？
**推荐方案**：React Flow原生支持跨层级连线
- 边的source/target可以是不同层级的节点
- 视觉上连线穿透子图边界
- 这在Mermaid语法中是合法的

### Q5: 样式的双向同步策略？
**推荐方案**：单向数据流（Source of Truth）
- Store中的diagram是唯一真相来源
- UI只是视图层，不直接持有状态
- 性能考虑：对大型图使用虚拟化或按需渲染

### Q6: 如何复用时序图的UI组件？
**推荐方案**：抽象通用组件，通过Adapter注入差异
- TopBar、Preview、ContextMenu可以复用
- Toolbar和PropertyPanel需要重新实现（业务逻辑不同）
- 参考现有sequence目录的结构保持一致性

### Q7: 连线文本的定位策略？
**推荐方案**：始终显示在中点
- 使用foreignObject嵌入HTML输入框
- 双击进入编辑模式
- 文本过长时自动截断显示省略号

### Q8: 节点的唯一ID生成策略？
**推荐方案**：`n_${timestamp}_${random}`
- 保证全局唯一性
- 可读性好，便于调试
- 备选：使用nanoid库

### Q9: 是否支持Markdown富文本？
**推荐方案**：Phase 3支持
- MVP仅支持纯文本
- Phase 3可以使用v11.3的新语法 @{ } 支持富文本
- 需要评估性能影响

### Q10: 剪贴板操作（复制/粘贴/剪切）？
**推荐方案**：Phase 2实现
- MVP仅专注于核心CRUD操作
- Phase 2实现序列化到剪贴板
- 支持在同一图表或不同图表间复制

### Q11: 删除节点确认对话框的配置
**位置**: 第4.1.4节 - 删除节点
**问题**: "弹出确认对话框（可配置开关）"但缺少具体定义
**选项**:
- A. PropertyPanel的Flowchart Settings中添加开关，默认关闭
- B. 首次删除时提示，提供"不再提示"选项
- C. 始终确认
**决策**: ✅ **A** - PropertyPanel添加开关，默认关闭

### Q12: 循环连线警告规则
**位置**: 第4.2.1节 - 智能连接
**问题**: "如果会形成循环...允许但用不同颜色警告"定义模糊
**选项**:
- A. 检测简单循环并橙色警告
- B. 不做循环检测（流程图中循环是常见合法结构）
- C. 提供可配置选项
**决策**: ✅ **B** - 不检测循环，避免误报警告

### Q13: 不可见连线的文本处理
**位置**: 第4.2.2节 + 第4.2.3节
**问题**: invisible连线(~~~)是否允许文本？文本如何显示？
**选项**:
- A. invisible连线不允许添加文本
- B. 可以添加文本，显示为淡灰色背景
- C. 选择invisible类型时清空已有文本
**决策**: ✅ **A** - invisible连线禁用文本输入

### Q14: 节点尺寸边界限制
**位置**: 第4.4.2节
**问题**: 未定义最小/最大尺寸限制
**选项**:
- A. 统一40x40 ~ 400x400
- B. 每种形状独立范围，PropertyPanel显示提示
- C. 不设限制
**决策**: ✅ **B** - 按形状定义范围，实时显示约束

### Q15: 连线长度的UI支持
**位置**: 数据模型定义了length，但交互设计缺失
**问题**: 如何在UI中调整连线长度？
**选项**:
- A. PropertyPanel添加Length输入框（1-10）
- B. 仅通过Mermaid代码编辑
- C. 拖拽连线中点调整
**决策**: ✅ **A** - PropertyPanel数字输入，支持1-10

### Q16: 连线方向反转行为
**位置**: 第4.4.3节的[Reverse Direction]按钮
**问题**: 反转时文本如何处理？
**选项**:
- A. 交换source/target，文本保持不变
- B. 尝试智能反转文本（如send→receive）
- C. 弹出对话框询问
**决策**: ✅ **A** - 仅交换节点方向，文本不变

### Q17: 子图移动的坐标系统
**位置**: 第4.3.3节
**问题**: 节点存储绝对还是相对坐标？
**选项**:
- A. 绝对坐标，手动计算delta更新
- B. 相对子图坐标，React Flow自动管理
- C. 混合模式
**决策**: ✅ **B** - React Flow parent-child机制

### Q18: 全局方向切换的影响
**位置**: 第4.4.5节
**问题**: 切换TB/LR后是否重新布局节点？
**选项**:
- A. 自动重布局+确认提示
- B. 仅修改direction字段，保持位置
- C. 提供两个按钮供用户选择
**决策**: ✅ **C** - 两个选项：保持位置 vs 重新布局

### Q19: 连线编辑的热区优化
**位置**: 第4.2.2节
**问题**: 连线很细，双击难以命中
**选项**:
- A. 热区宽度20px透明覆盖层
- B. 只能点击文本标签触发
- C. 右键菜单备选
**决策**: ✅ **A+C** - 20px热区 + 右键菜单备选

### Q20: Tab键创建兄弟节点的逻辑
**位置**: 第4.7节快捷键表
**问题**: "兄弟节点"的定义和位置不明确
**选项**:
- A. 根据全局方向在右侧/下方创建，继承父节点连线
- B. 在下方创建，无自动连线
- C. 弹出对话框询问
**决策**: ✅ **A** - 智能推断位置和继承连线

### Q21: 连线文本长度与换行
**位置**: 第4.2.2节
**问题**: "最多2行"和"最大100字符"约束冲突
**选项**:
- A. 固定100字符，不换行
- B. 基于宽度智能换行，最多2行
- C. 支持多行输入
**决策**: ✅ **B** - 基于宽度换行，2行上限

### Q22: 解散子图的坐标转换
**位置**: 第4.3.3节
**问题**: 解散后相对坐标如何转为绝对坐标？
**选项**:
- A. React Flow自动处理
- B. 手动计算：子图position + 节点相对坐标
- C. 询问用户是否调整
**决策**: ✅ **A** - React Flow自动处理

---

## 10. 实现路线图

### Phase 1: MVP (预计2周)

**Week 1: 基础设施**
- [ ] 1.1 定义FlowchartDiagram类型和共享类型
- [ ] 1.2 实现Parser（支持基本语法）
- [ ] 1.3 实现Generator（基本代码生成）
- [ ] 1.4 创建flowchartStore（基础state和actions）
- [ ] 1.5 实现ShapeNode组件（6种基础形状）

**Week 2: 交互功能**
- [ ] 2.1 实现FlowchartCanvas和节点渲染
- [ ] 2.2 实现FlowchartToolbar（基础工具）
- [ ] 2.3 实现节点CRUD操作
- [ ] 2.4 实现FlowEdge和连线操作
- [ ] 2.5 实现FlowchartPropertyPanel
- [ ] 2.6 实现基础子图功能
- [ ] 2.7 集成到Adapter系统
- [ ] 2.8 端到端测试

**MVP交付标准：**
- 能正确解析和生成MVP范围内的语法
- 支持6种基础形状的增删改
- 支持连线的增删改
- 支持简单子图
- Undo/Redo工作正常
- 代码生成与解析可逆（round-trip测试通过）

### Phase 2: 增强功能 (预计1周)

- [ ] 2.1 扩展形状支持到20+种
- [ ] 2.2 实现classDef/class样式系统
- [ ] 2.3 嵌套子图支持
- [ ] 2.4 多选和批量操作
- [ ] 2.5 复制/粘贴功能
- [ ] 2.6 连线长度控制
- [ ] 2.7 自动布局（可选）

### Phase 3: 高级特性 (预计1周)

- [ ] 3.1 剩余所有40+形状
- [ ] 3.2 v11.3新语法支持
- [ ] 3.3 交互事件(click)支持
- [ ] 3.4 FontAwesome图标支持
- [ ] 3.5 图片节点支持
- [ ] 3.6 Markdown富文本
- [ ] 3.7 性能优化（大图处理）

### 依赖关系图

```
Phase 1 基础设施
├── 类型定义 (types.ts)
├── Parser
├── Generator
├── Store (含History)
└── ShapeNode (6 shapes)
    └── FlowchartCanvas
        ├── FlowchartToolbar
        ├── FlowchartPropertyPanel
        └── ContextMenu

Phase 2 增强
├── 扩展Shapes (+14种)
├── 样式系统
├── 嵌套子图
└── 批量操作

Phase 3 高级
├── 完整Shapes (40+)
├── 富文本
├── 图标支持
└── 性能优化
```

---

## 附录A: Mermaid流程图语法速查

```mermaid
flowchart TD
    %% 方向声明
    direction TB  %% 或 LR, RL, BT
    
    %% 节点定义
    A[矩形]
    B(圆角)
    C{菱形}
    D((圆形))
    E[(数据库)]
    F[[子程序]]
    
    %% 连线
    A --> B          %% 实线箭头
    B --- C          %% 实线无箭头
    C -.-> D         %% 虚线箭头
    D -.- E          %% 虚线无箭头
    E ==> F          %% 粗线箭头
    
    %% 带文本的连线
    A -->|Yes| B
    B -->|No| C
    
    %% 子图
    subgraph 子图标题
        direction LR
        G --> H
    end
    
    %% 样式
    classDef red fill:#f96
    class A,B red
```

---

## 附录B: 形状与符号对照表

| 形状名称 | Mermaid语法 | 用途 |
|---------|-------------|------|
| Rectangle | `[text]` | 处理/操作 |
| Rounded | `(text)` | 事件/开始结束 |
| Stadium | `([text])` | 终端点/起止 |
| Circle | `((text))` | 连接器/判断 |
| Double Circle | `(((text)))` | 停止 |
| Diamond | `{text}` | 决策/条件 |
| Hexagon | `{{text}}` | 准备/预处理 |
| Cylinder | `[(text)]` | 数据库/存储 |
| Document | `([text)]` | 文档/报告 |
| Subprocess | `[[text]]` | 预定义过程 |
| Parallelogram | `[/text/]` | 输入/输出 |
| Trapezoid | `[/text\]` | 优先级操作 |
| Manual Input | `[/text]` | 人工输入 |
| Card | `[>text]` | 卡片 |
| Delay | `>text]` | 延迟 |
| Storage | `[(text)]` | 直接访问存储 |

---

**文档结束**

*本文档详细定义了流程图可视化编辑器的所有设计要素，涵盖数据模型、界面交互、组件架构等各个方面。开发团队应严格按照本设计文档实施，如有必要变更，需在此文档中进行更新。*
