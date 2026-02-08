# Phase 3 完善计划草稿

## 用户原始需求

完成 AI Mermaid 时序图可视化编辑器的 Phase 3 功能开发：
1. 修复 Vite 构建问题
2. 实现注释节点 (NoteNode)
3. 实现激活框 (Activation)
4. 实现循环/分支块 (BlockNode)
5. 优化功能（动态高度、拖拽排序）

---

## 代码库分析结果

### 技术栈
- **Extension**: TypeScript + VS Code API + esbuild
- **Webview**: React 18 + TypeScript + Vite 5
- **状态管理**: Zustand 4.4.7
- **图形引擎**: React Flow (@xyflow/react 12.0.0)
- **UI**: Tailwind CSS + Lucide Icons
- **图表库**: Mermaid 10.6.1

### 项目结构
```
src/
├── extension/          # VS Code 插件端
│   ├── extension.ts    # 入口
│   ├── codelens.ts     # CodeLens Provider
│   └── webview.ts      # Webview 管理
├── webview/            # React 应用端
│   ├── App.tsx
│   ├── stores/
│   │   └── diagramStore.ts
│   ├── components/
│   │   ├── Canvas/     # React Flow 画布
│   │   ├── Toolbar/    # 左侧工具栏
│   │   ├── PropertyPanel/
│   │   ├── Preview/
│   │   └── TopBar/
│   ├── nodes/
│   │   ├── ParticipantNode.tsx  ✅
│   │   ├── TimelineNode.tsx     ✅ (固定 400px)
│   │   └── [NoteNode.tsx]       ❌ 缺失
│   ├── edges/
│   │   └── MessageEdge.tsx      ✅
│   └── utils/
│       ├── mermaid-parser.ts    ✅ (支持 Note)
│       └── mermaid-generator.ts ✅ (支持 Note)
└── shared/
    ├── types.ts         ✅ 完整类型定义
    └── constants.ts
```

### 已实现功能 ✅
1. **基础框架**: 插件骨架、CodeLens、Webview 通信
2. **核心编辑**: 参与者节点、消息边、时间线
3. **状态管理**: Zustand store with undo/redo
4. **双向编辑**: 内联编辑（双击节点/边）
5. **实时预览**: Mermaid 图表预览
6. **文档同步**: 自动保存到编辑器
7. **解析器/生成器**: 支持 Participant、Message、Note 的解析和生成

### 待完成功能 ❌

#### 1. 构建问题修复 (RESOLVED)
- **问题**: 原以为 Vite 产物哈希命名会导致问题
- **实际状态**: vite.config.ts 已配置固定文件名
  ```ts
  entryFileNames: 'assets/main.js',
  assetFileNames: 'assets/main.[ext]',
  ```
- **结论**: ✅ 无需修复，配置正确

#### 2. 注释节点 (NoteNode) ❌
- **类型定义**: ✅ 已存在 (types.ts)
  ```ts
  interface Note {
    id: string;
    text: string;
    position: NotePosition; // 'left' | 'right' | 'over'
    participantIds: string[];
    order: number;
  }
  ```
- **解析器**: ✅ 已支持 (mermaid-parser.ts L82-100)
- **生成器**: ✅ 已支持 (mermaid-generator.ts L32-52)
- **缺失部分**:
  - NoteNode.tsx 组件
  - diagramStore 中的 addNote/updateNote/removeNote
  - Toolbar 中的注释按钮实现 (当前空函数)
  - PropertyPanel 中的注释属性编辑
  - Canvas 中注册 noteTypes
  - diagramToNodes 逻辑（Note 转为 React Flow 节点）

#### 3. 激活框 (Activation) ❌
- **类型定义**: ✅ 已存在 (types.ts)
  ```ts
  interface Activation {
    id: string;
    participantId: string;
    startMessageId: string;
    endMessageId: string;
  }
  ```
- **Message 激活标志**: ✅ 已存在
  ```ts
  interface Message {
    activateTarget?: boolean;
    deactivateTarget?: boolean;
  }
  ```
- **解析器**: ✅ 已支持 (mermaid-parser.ts L75-76)
- **生成器**: ✅ 已支持 (mermaid-generator.ts L68-71)
- **缺失部分**:
  - TimelineNode 上渲染激活框的逻辑
  - PropertyPanel 中激活框控制
  - diagramStore 中激活框管理逻辑

#### 4. 循环/分支块 (BlockNode) ❌
- **类型定义**: ✅ 已存在 (types.ts)
  ```ts
  type BlockType = 'loop' | 'alt' | 'else' | 'opt' | 'par' | 'critical' | 'break';
  interface Block {
    id: string;
    type: BlockType;
    label: string;
    messageIds: string[];
    children?: Block[];
  }
  ```
- **缺失部分**:
  - 解析器未实现块语法解析
  - 生成器未实现块语法生成
  - BlockNode.tsx 组件
  - diagramStore 中的 addBlock/updateBlock/removeBlock
  - Toolbar 中的循环/分支按钮实现
  - PropertyPanel 中的块属性编辑
  - Canvas 中注册 blockTypes

#### 5. 优化功能 ❌
- **TimelineNode 动态高度**: 当前固定 400px
- **参与者拖拽排序**: 当前可拖拽但未更新 order
- **消息拖拽排序**: 未实现

---

## 已有设计模式分析

### 1. 节点组件模式 (ParticipantNode)
```tsx
- 使用 @xyflow/react 的 NodeProps
- Handle 组件定义连接点 (left, right)
- 双击触发内联编辑
- 直接调用 store.updateParticipant
- memo 优化渲染
```

### 2. 状态管理模式 (diagramStore)
```ts
- 单一数据源: SequenceDiagram
- 派生状态: nodes, edges (从 diagram 计算)
- 更新模式: pushHistory → 修改 diagram → 重算 nodes/edges
- Undo/Redo: history 数组 + historyIndex
```

### 3. 布局计算模式
```ts
// diagramToNodes 函数
- 参与者: 水平排列，间距 180px
- 时间线: 位于参与者下方，居中对齐
- 消息: yOffset 基于 order (80 + order * 50)
```

### 4. React Flow 集成模式
```tsx
// Canvas.tsx
- nodeTypes: { participant, timeline }
- edgeTypes: { message }
- onConnect → store.addMessage
- onClick → store.setSelected
```

---

## 技术约束与假设

### 确认的约束
1. ✅ Vite 构建配置正确，无需修复
2. ✅ 解析器和生成器已支持 Note
3. ✅ 类型定义完整

### 待明确的问题
1. **注释节点的定位方式**？
   - 是否需要独立拖拽？
   - position ('left'/'right'/'over') 如何映射到 x, y 坐标？
   - 是否需要连线到相关参与者？

2. **激活框的渲染方式**？
   - 是否作为 TimelineNode 的子元素渲染？
   - 还是作为独立的 ActivationNode？
   - 如何计算起始和结束位置？

3. **块节点的交互方式**？
   - 是否需要拖拽框选多个消息？
   - 还是在 PropertyPanel 中选择消息范围？
   - 嵌套块如何表示（children 字段）？

4. **UI/UX 偏好**？
   - 注释节点的视觉风格？（便签/气泡/卡片）
   - 激活框的颜色和透明度？
   - 块节点的边框样式？

5. **性能要求**？
   - 最大支持多少参与者/消息？
   - 是否需要虚拟滚动？

---

## 用户决策结果 ✅

### 问题 1：注释节点定位
**选择**：A - 相对定位（自动计算位置）
- 注释节点自动计算位置（相对于参与者）
- `left of User` → 自动定位在 User 左侧
- `over User, API` → 自动定位在两者中间上方
- 用户可微调位置但不改变 position 类型

### 问题 2：激活框实现
**选择**：A - Timeline 覆盖层
- 在时间线组件内部渲染半透明矩形
- 基于 startMessageId 和 endMessageId 计算 y 位置和高度
- TimelineNode 需要接收 diagram 数据来渲染激活框

### 问题 3：块创建方式
**选择**：A - 框选创建
- 用户点击 Toolbar 的块按钮
- 在画布上拖拽框选多个消息
- 自动创建包含这些消息的 BlockNode
- **技术挑战**：需要实现选择框 UI 和多选消息逻辑

### 问题 4：嵌套块
**需求**：✅ 支持嵌套块
- Block 的 children 字段需要支持递归结构
- 解析器和生成器需要支持递归解析/生成
- UI 上需要显示嵌套层级

### 问题 5：优先级
**顺序**：A - 注释 → 激活 → 块 → 优化

### 问题 6：视觉风格
**方案**：按开发者专业判断（VS Code 风格）
- 保持 VS Code 主题变量
- 简洁专业的设计
- 与现有 Participant 和 Message 风格一致

---

## 技术决策推导

### 注释节点布局算法
```typescript
function calculateNotePosition(
  note: Note, 
  participants: Participant[], 
  participantPositions: Map<string, {x: number, y: number}>
): {x: number, y: number} {
  const targetParticipants = note.participantIds.map(id => 
    participantPositions.get(id)
  );
  
  if (note.position === 'over') {
    // 计算中间位置 + 上方偏移
    const avgX = average(targetParticipants.map(p => p.x));
    return { x: avgX, y: currentMessageY - 80 };
  } else if (note.position === 'left') {
    const leftMost = min(targetParticipants.map(p => p.x));
    return { x: leftMost - 150, y: currentMessageY };
  } else { // 'right'
    const rightMost = max(targetParticipants.map(p => p.x));
    return { x: rightMost + 150, y: currentMessageY };
  }
}
```

### 激活框数据流
```typescript
// TimelineNode 需要接收的数据
interface TimelineData {
  participantId: string;
  activations: Activation[]; // 属于该参与者的所有激活框
  messages: Message[];       // 用于计算 y 坐标
}

// 激活框渲染逻辑
activations.map(act => {
  const startY = getMessageYOffset(act.startMessageId);
  const endY = getMessageYOffset(act.endMessageId);
  return <div style={{top: startY, height: endY - startY}} />;
})
```

### 框选多选实现方案
```typescript
// Canvas 新增状态
const [selectionMode, setSelectionMode] = useState<'loop' | 'alt' | null>(null);
const [selectionBox, setSelectionBox] = useState<Box | null>(null);

// 拖拽事件
onMouseDown → 记录起点
onMouseMove → 更新选择框尺寸
onMouseUp → 计算框选范围内的消息，创建 Block

// 消息碰撞检测
function getMessagesInBox(box: Box, edges: Edge[]): string[] {
  return edges.filter(edge => {
    const {x, y} = getEdgeLabelPosition(edge);
    return isPointInBox({x, y}, box);
  }).map(edge => edge.id);
}
```

### 嵌套块解析策略
```typescript
// 递归解析块结构
function parseBlock(lines: string[], startIndex: number): {
  block: Block;
  endIndex: number;
} {
  const block: Block = { type, label, messageIds: [], children: [] };
  
  for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].match(/^(loop|alt|opt)/)) {
      // 递归解析子块
      const { block: childBlock, endIndex } = parseBlock(lines, i);
      block.children.push(childBlock);
      i = endIndex;
    } else if (lines[i] === 'end') {
      return { block, endIndex: i };
    } else if (isMessage(lines[i])) {
      block.messageIds.push(parseMessage(lines[i]).id);
    }
  }
}
```

---

## 下一步行动

立即执行：
1. ✅ 咨询 Metis 进行差距分析
2. ✅ 生成详细工作计划
3. ✅ 自我审查并呈现摘要
