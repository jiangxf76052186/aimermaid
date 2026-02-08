# AI Mermaid Editor Knowledge Base

**Generated:** 2026-02-06
**Project:** aimermaid v0.1.0

## OVERVIEW

VS Code 扩展，支持拖拽方式可视化编辑 Mermaid 时序图。Extension (Node.js) + Webview (React) 双进程架构。
本文档包含项目整体的信息（目录结构，开发规范）

## STRUCTURE

```
aimermaid/
├──docs
    ├──PR
        ├──流程图        # 流程图的需求文档和设计文档的目录
            ├──design.md # 流程图设计文档
        ├──时序图        # 时序图的需求文档和设计文档的目录  
            ├──design.md # 时序图设计文档
        dev_notes.md    # 开发注意事项    

├── src/extension/       # VS Code 扩展端 (Node.js)
│   ├── extension.ts     # 入口：activate/deactivate
│   ├── codelens.ts      # CodeLens：识别 ```mermaid 代码块
│   └── webview.ts       # Webview 面板管理
├── src/webview/         # React 可视化编辑器 (Browser)
│   ├── App.tsx          # 主应用：键盘快捷键、消息处理
│   ├── main.tsx         # React 入口
│   ├── stores/
│   │   └── diagramStore.ts  # Zustand 状态：核心数据模型
│   ├── components/
│   │   ├── Canvas/      # React Flow 画布
│   │   ├── Toolbar/     # 左侧工具栏
│   │   ├── TopBar/      # 顶部操作栏
│   │   ├── PropertyPanel/  # 右侧属性面板
│   │   └── Preview/     # Mermaid 实时预览
│   ├── nodes/           # React Flow 自定义节点
│   │   ├── ParticipantNode.tsx  # 参与者节点
│   │   ├── TimelineNode.tsx     # 时间线节点
│   │   ├── NoteNode.tsx         # 注释节点
│   │   └── BlockNode.tsx        # 块节点 (loop/alt/opt)
│   ├── edges/
│   │   └── MessageEdge.tsx      # 消息边
│   └── utils/
│       ├── mermaid-parser.ts    # Mermaid → SequenceDiagram
│       ├── mermaid-generator.ts # SequenceDiagram → Mermaid
│       └── vscode-api.ts        # VS Code Webview API 封装
├── src/shared/          # 两端共享代码
│   ├── types.ts         # 核心类型定义
│   └── constants.ts     # 消息符号映射
└── dist/                # 构建产物
    ├── extension/       # esbuild 打包
    └── webview/         # Vite 打包
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| 添加新节点类型 | `src/webview/nodes/` + `Canvas.tsx` | 需注册到 nodeTypes |
| 添加新边类型 | `src/webview/edges/` + `Canvas.tsx` | 需注册到 edgeTypes |
| 修改 Mermaid 解析 | `src/webview/utils/mermaid-parser.ts` | 正则匹配为主 |
| 修改 Mermaid 生成 | `src/webview/utils/mermaid-generator.ts` | 字符串拼接 |
| 添加 store action | `src/webview/stores/diagramStore.ts` | 遵循 pushHistory 模式 |
| 修改 Extension 命令 | `src/extension/extension.ts` + `package.json` | contributes.commands |
| Extension ↔ Webview 通信 | `src/shared/types.ts` | ExtensionMessage/WebviewMessage |

## DATA FLOW

```
Markdown文件
    ↓ CodeLens 识别
Extension (codelens.ts)
    ↓ openEditor 命令
Webview (MermaidEditorPanel)
    ↓ postMessage({type:'init', mermaidCode})
App.tsx → loadFromMermaid()
    ↓ parseMermaidSequence()
diagramStore (SequenceDiagram)
    ↓ diagramToNodes() / diagramToEdges()
React Flow (nodes, edges)
    ↓ 用户拖拽编辑
diagramStore 更新
    ↓ toMermaid() → generateMermaidSequence()
Webview postMessage({type:'save', mermaidCode})
    ↓
Extension 写回文件
```

## CONVENTIONS

### 状态管理模式
```typescript
// 所有修改必须：1) pushHistory 2) 更新 diagram 3) 重算 nodes/edges
addParticipant: (name) => {
  pushHistory();  // 支持 undo
  const newDiagram = { ...diagram, participants: [...] };
  set({
    diagram: newDiagram,
    nodes: diagramToNodes(newDiagram),  // 必须重算
    edges: diagramToEdges(newDiagram),
  });
}
```

### 节点组件模式
```typescript
// 使用 memo 优化渲染
const ParticipantNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  // Handle 定义连接点
  <Handle type="source" position={Position.Left} id="source-left" />
  // 双击触发内联编辑
  onDoubleClick={() => setIsEditing(true)}
  // 直接调用 store
  updateParticipant(id, { alias: value });
};
export default memo(ParticipantNode);
```

### 路径别名
- `@/*` → `src/*`
- `@shared/*` → `src/shared/*`

### CSS 类命名
- VS Code 主题变量：`bg-vscode-bg`, `text-vscode-fg`, `border-vscode-border`
- 见 `tailwind.config.js` 中的 extend

## CORE TYPES

```typescript
// src/shared/types.ts
interface SequenceDiagram {
  participants: Participant[];
  messages: Message[];
  notes: Note[];
  activations: Activation[];
  blocks: Block[];
}

type MessageType = 'sync' | 'syncDotted' | 'asyncOpen' | 'asyncDotted' | 'syncCross' | 'syncDottedCross';
// 对应 Mermaid: ->> | -->> | -) | --) | -x | --x

type BlockType = 'loop' | 'alt' | 'else' | 'opt' | 'par' | 'critical' | 'break';
```

## COMMANDS

```bash
# 开发
npm run watch              # 同时监听 extension + webview
npm run dev:webview        # 仅 webview (Vite HMR)

# 构建
npm run build              # 完整构建
npm run build:extension    # 仅 extension (esbuild)
npm run build:webview      # 仅 webview (Vite)

# 检查
npm run lint               # ESLint
npm run typecheck          # TypeScript 类型检查

# 打包 VSIX
npx vsce package
```

## ANTI-PATTERNS

| 禁止 | 原因 |
|------|------|
| 直接修改 `nodes`/`edges` | 必须通过 `diagram` 派生，否则数据不一致 |
| 跳过 `pushHistory()` | 导致 undo/redo 失效 |
| 在 Extension 端引入浏览器 API | Node.js 环境无 DOM |
| 在 Webview 端引入 `vscode` 模块 | 浏览器环境无 Node.js |

## PITFALLS (踩坑记录)

> 详细记录请见：[docs/DEV_NOTES.md](docs/DEV_NOTES.md)

| 概要 | 详情 |
|------|------|
| React Flow 箭头方向反向 | 用户心智模型（拉取）vs 代码逻辑（推送），需交换 source/target |

## DEVELOPMENT NOTES

### 调试 Extension
1. F5 启动 Extension Development Host
2. 打开任意 .md 文件包含 ```mermaid 块
3. 看到 CodeLens 按钮即成功

### 调试 Webview
1. 在 Extension Host 中 Cmd+Shift+P → "Developer: Open Webview Developer Tools"
2. Console 日志前缀 `[AIMermaid]`

### React Flow 布局常量
```typescript
const PARTICIPANT_GAP = 180;   // 参与者间距
const PARTICIPANT_Y = 50;       // 参与者 Y 坐标
const MESSAGE_SPACING = 50;     // 消息间距
```

### 消息 Y 坐标计算
```typescript
// MessageEdge.tsx
const adjustedSourceY = sourceY + yOffset;  // yOffset = 80 + order * 50
```

## ROADMAP (from docs/DESIGN.md)

- Phase 1 ✅: 基础框架、CodeLens、Webview
- Phase 2 ✅: 时序图核心（参与者、消息、解析器）
- Phase 3 (进行中): 注释节点、激活框、循环/分支块
- Phase 4 (规划中): 流程图、类图等其他图表
