# 时序图现有实现深度分析报告

## 1. 项目结构与架构概述

项目目前处于从"单图表（时序图）"向"多图表"架构过渡的中间状态。

- **混合架构**：
  - **旧架构（Monolithic）**：`src/webview` 根目录下的 `App.tsx`、`Canvas.tsx` 和 `stores/diagramStore.ts` 仍然深度耦合了时序图的实现细节。
  - **新架构（Modular）**：`src/webview/core/registry` 和 `src/webview/diagrams/sequence` 目录展示了基于 `DiagramAdapter` 的插件化设计，但尚未完全贯通。

- **关键路径**：
  - `App.tsx` 虽然使用了 `DiagramRegistry` 来动态加载 `Toolbar` 和 `PropertyPanel`，但仍然直接依赖 `useDiagramStore`（这是一个专为时序图设计的 Store）。
  - `Canvas.tsx` 硬编码了时序图的节点类型（Participant, Timeline, Note, Block）。

## 2. Store 状态管理 (Zustand)

`src/webview/stores/diagramStore.ts` 是核心状态容器，但目前**高度耦合于时序图**。

- **数据结构**：
  - 直接依赖 `SequenceDiagram` 类型（包含 `participants`, `messages`, `activations` 等）。
  - 同时维护 `nodes` 和 `edges`（React Flow 的渲染数据）。
  
- **核心机制**：
  - **双向同步**：`diagram`（业务模型）是单一事实来源（Single Source of Truth）。每次修改 `diagram` 后，都会立即调用 `diagramToNodes` 和 `diagramToEdges` 重新生成 React Flow 的数据。
  - **历史记录 (Undo/Redo)**：
    - `history` 数组存储 `diagram` 的完整快照（深拷贝）。
    - `pushHistory()` 方法在每次变更操作前调用，保存当前状态。
    - `undo`/`redo` 通过回滚 `historyIndex` 并重新生成 nodes/edges 来实现。

- **Actions 设计**：
  - 包含了大量时序图专用 Action，如 `addParticipant`, `addMessage`, `syncBlockContents`。
  - 缺乏通用的图表操作接口。

## 3. 节点组件分析 (React Flow)

节点组件位于 `src/webview/nodes/`，实现了标准的 React Flow 自定义节点模式。

- **通用模式**：
  - **UI/交互**：使用 Tailwind CSS 样式，支持选中高亮 (`selected` prop)。
  - **编辑交互**：双击进入编辑模式 (`isEditing` state)，`onBlur` 或 `Enter` 键触发 Store 更新。
  - **Handle**：使用 `@xyflow/react` 的 `Handle` 组件定义连接点。

- **特定实现**：
  - **ParticipantNode**：直接调用 `useDiagramStore.updateParticipant`，耦合了 Store。
  - **BlockNode**：
    - 使用了 `<NodeResizer />` 实现大小调整。
    - 实现了复杂的交互逻辑：拖拽停止或调整大小时，会调用 `syncBlockContents` 来计算块内包含了哪些消息（自动吸附/包含逻辑）。

## 4. Canvas 集成现状

`src/webview/components/Canvas/Canvas.tsx` 目前是**非通用**的。

- **硬编码注册**：
  ```typescript
  const nodeTypes = {
    participant: ParticipantNode,
    // ...
  };
  ```
  直接导入并注册了时序图节点，无法直接用于流程图。

- **交互逻辑耦合**：
  - 依赖 `useDiagramStore` 的 `addBlock` 和 `selectedEdgeIds`，这些都是时序图特有的（基于消息连线创建 Block）。
  - 右键菜单和拖拽逻辑也针对时序图元素进行了处理。

## 5. UI 组件复用性评估

| 组件 | 当前状态 | 复用建议 |
|------|----------|----------|
| **Toolbar** | 通过 Adapter 动态加载 (`SequenceToolbar`) | **可完全复用模式**。流程图需实现 `FlowchartToolbar`。 |
| **PropertyPanel** | 通过 Adapter 动态加载 (`SequencePropertyPanel`) | **可完全复用模式**。流程图需实现 `FlowchartPropertyPanel`。 |
| **TopBar** | 通用组件 | **直接复用**。主要包含撤销/重做/保存等通用操作。 |
| **Preview** | 耦合于 `diagramStore` | **需重构**。目前依赖 `diagram.participants.length` 判断是否为空，且直接调用 Store 的 `toMermaid`。需要改为从 Adapter 获取生成函数或数据。 |
| **ContextMenu** | 通用组件 | **直接复用**。但调用方 `Canvas` 需要传入正确的上下文。 |

## 6. 解析器与生成器架构

- **Mermaid Parser** (`mermaid-parser.ts`)：
  - 使用正则表达式解析 Mermaid 文本。
  - 将文本转换为 `SequenceDiagram` 对象模型。

- **Mermaid Generator** (`mermaid-generator.ts`)：
  - 将 `SequenceDiagram` 对象模型转换回 Mermaid 文本字符串。
  - 这种“模型优先”的方法很好，流程图应沿用此模式（Mermaid Code <-> Flowchart Model <-> React Flow Nodes）。

## 流程图设计建议 (Next Steps)

基于以上分析，为支持流程图，建议采取以下步骤：

1.  **架构解耦（关键）**：
    - 既然已有 `DiagramAdapter` 接口，应强制推行该模式。
    - 需要引入一个 **Context** 或 **Store Provider**，使得 `Canvas` 和 `App` 可以根据当前激活的图表类型，访问不同的 Store（`useSequenceStore` vs `useFlowchartStore`），或者让 `useDiagramStore` 变为一个代理。

2.  **复用 Canvas**：
    - 将 `Canvas` 重构为接收 `nodeTypes`, `edgeTypes` 和 `store`（或 context）的通用组件。
    - 或者创建 `FlowchartCanvas`，虽然会有代码重复，但短期内风险更低。

3.  **状态管理**：
    - 不要试图扩展现有的 `diagramStore.ts`，它太重且太专。
    - 创建全新的 `src/webview/diagrams/flowchart/store.ts`，复用 `pushHistory` 等通用逻辑（可以提取为 hook 或 base store）。

4.  **数据模型**：
    - 参考 `SequenceDiagram` 接口，定义 `FlowchartDiagram` 接口（Nodes, Edges, Subgraphs）。
    - 实现 `FlowchartAdapter`。

5.  **节点开发**：
    - 开发流程图专用节点：`ProcessNode`, `DecisionNode`, `StartEndNode`。
    - 交互模式（双击编辑、Handle连接）可直接参考 `ParticipantNode`。

本报告确认了现有代码库中有大量高质量的基础设施（Undo/Redo, CodeLens 集成, Webview 通信）可供复用，但业务逻辑层面的解耦是流程图落地的首要任务。