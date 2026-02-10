# Developer Guide - AIMermaid

## 项目概述

AIMermaid 是一个 VS Code 扩展，支持可视化拖拽编辑 Mermaid 图表（时序图、流程图、泳道图、状态机）。采用 Extension (Node.js) + Webview (React) 的双进程架构。

## 技术栈

### 核心框架
- **Extension 端**: VS Code API + Node.js
- **Webview 端**: React 18 + React Flow (XYFlow) + Zustand
- **构建工具**: esbuild (Extension) + Vite (Webview)
- **测试框架**: Vitest
- **类型检查**: TypeScript 5.3
- **样式**: Tailwind CSS + PostCSS
- **图表库**: Mermaid 10.6

### 关键依赖
```json
{
  "@xyflow/react": "^12.0.0",      // 流程图/拖拽编辑
  "zustand": "^4.4.7",               // 状态管理
  "mermaid": "^10.6.1",             // 图表渲染
  "react": "^18.2.0",               // UI 框架
  "tailwindcss": "^3.4.0"           // 样式
}
```

## 项目结构

```
aimermaid/
├── src/
│   ├── extension/                  # VS Code 扩展端
│   │   ├── extension.ts            # 主入口：activate/deactivate
│   │   ├── codelens.ts             # CodeLens：识别 ```mermaid 代码块
│   │   └── webview.ts              # Webview 面板管理
│   │
│   ├── webview/                    # React 可视化编辑器
│   │   ├── App.tsx                 # 主应用入口
│   │   ├── main.tsx                # React 初始化
│   │   ├── stores/                 # Zustand 状态管理
│   │   │   ├── diagramStore.ts     # 图表存储（包含所有图表类型）
│   │   │   ├── useAdapterStore.ts  # 适配器层（图表类型兼容）
│   │   │   └── useRegistryStore.ts # 图表注册表
│   │   ├── diagrams/               # 各种图表类型
│   │   │   ├── sequence/           # 时序图
│   │   │   │   ├── utils/
│   │   │   │   │   ├── mermaid-parser.ts
│   │   │   │   │   └── mermaid-generator.ts
│   │   │   │   └── ...
│   │   │   ├── flowchart/          # 流程图
│   │   │   ├── swimlane/           # 泳道图
│   │   │   └── stateDiagram/       # 状态机
│   │   ├── components/             # React 组件
│   │   │   ├── Canvas/             # 画布（React Flow）
│   │   │   ├── Toolbar/            # 工具栏
│   │   │   ├── TopBar/             # 顶部栏
│   │   │   ├── PropertyPanel/      # 属性面板
│   │   │   └── Preview/            # 预览面板
│   │   ├── nodes/                  # React Flow 节点
│   │   ├── edges/                  # React Flow 边
│   │   ├── __tests__/              # 集成测试
│   │   └── utils/                  # 工具函数
│   │
│   └── shared/                     # 共享代码
│       ├── types.ts                # 核心类型定义
│       └── constants.ts            # 常量定义
│
├── docs/                           # 文档
│   ├── DEV_NOTES.md               # 开发笔记（踩坑记录）
│   ├── PR/                         # 需求文档
│   │   ├── 时序图/DESIGN.md
│   │   ├── 流程图/DESIGN.md
│   │   ├── 泳道图/DESIGN.md
│   │   └── 状态机/DESIGN.md
│   └── PR_LIST.md                 # 项目进度跟踪
│
├── dist/                           # 构建产物
├── .eslintrc.json                 # ESLint 配置
├── tsconfig.json                  # TypeScript 配置
├── vite.config.ts                 # Vite 配置
├── vitest.config.ts               # Vitest 配置
├── tailwind.config.js             # Tailwind 配置
└── package.json
```

## 快速开始

### 环境要求
- Node.js 16+ 
- npm 8+
- VS Code 1.85.0+

### 开发流程

```bash
# 1. 安装依赖
npm install

# 2. 开发模式（监听源文件变化）
npm run watch              # 同时监听 extension + webview
npm run dev:webview        # 仅启动 webview HMR（Vite）
npm run watch:extension    # 仅监听 extension

# 3. 构建
npm run build              # 完整构建
npm run build:extension    # 仅构建 extension
npm run build:webview      # 仅构建 webview

# 4. 测试
npm test                   # 运行所有测试
npm run test:watch         # 监听模式

# 5. 代码质量检查
npm run lint               # ESLint 检查
npm run typecheck          # TypeScript 类型检查
```

### 调试

#### 调试 Extension
1. 在 VS Code 中按 **F5** 启动 Extension Development Host
2. 打开任意 `.md` 文件包含 ` ```mermaid ` 代码块
3. 看到 CodeLens 按钮（"🎨 可视化编辑 Mermaid"）即表示成功
4. 在 Extension Host 中可以设置断点

#### 调试 Webview
1. 在 Extension Host 中按 **Cmd+Shift+P** → "Developer: Open Webview Developer Tools"
2. 打开开发者工具查看 Console
3. 所有 AIMermaid 日志前缀为 `[AIMermaid]`

#### 调试技巧
```typescript
// Webview 中添加日志
console.log('[AIMermaid]', 'message');

// 在存储中追踪状态变化
const unsubscribe = useDiagramStore.subscribe(
  state => state.diagram,
  diagram => console.log('[AIMermaid] Diagram updated:', diagram)
);
```

## 核心概念

### 1. 状态管理模式 (Zustand)

**关键规则**: 所有修改必须遵循 `pushHistory → 更新 diagram → 重算 nodes/edges` 的流程

```typescript
addParticipant: (name, type = 'participant') => {
  pushHistory();  // 1. 支持 undo
  const newDiagram = {
    ...diagram,
    participants: [...diagram.participants, { id, name, type }],
  };
  set({
    diagram: newDiagram,
    nodes: diagramToNodes(newDiagram),   // 2. 必须重算
    edges: diagramToEdges(newDiagram),   // 2. 必须重算
  });
};
```

**为什么这样做？**
- `pushHistory()` 保证 undo/redo 功能正常
- 通过 `diagram` 派生 `nodes/edges` 确保数据一致
- 避免手动修改 `nodes/edges` 导致不同步

### 2. 图表类型适配

项目支持多种图表类型，通过适配器模式统一接口：

```
SequenceDiagram → adapter.toCommon() → CommonDiagram
FlowchartDiagram → adapter.toCommon() → CommonDiagram
CommonDiagram → adapter.fromCommon() → TargetDiagram
```

关键文件：
- `useAdapterStore.ts` - 适配器管理
- `useRegistryStore.ts` - 图表注册表

### 3. Mermaid 代码解析和生成

每种图表都有对应的解析器和生成器：

```
Mermaid Code → Parser → Diagram Structure
Diagram Structure → Generator → Mermaid Code
```

例如：
- `src/webview/diagrams/sequence/utils/mermaid-parser.ts`
- `src/webview/diagrams/sequence/utils/mermaid-generator.ts`

### 4. React Flow 画布

使用 React Flow (@xyflow/react) 实现可视化编辑：

**关键常量**（`Canvas.tsx`）:
```typescript
const PARTICIPANT_GAP = 180;        // 参与者间距
const PARTICIPANT_Y = 50;           // 参与者 Y 坐标
const MESSAGE_SPACING = 50;         // 消息间距
```

**重要：箭头方向问题**

用户从 target handle 拖向 source handle（拉取模式），而非推送模式。因此在 `onConnect` 中需要交换 source 和 target：

```typescript
onConnect: (connection) => {
  if (connection.source && connection.target) {
    get().addMessage(connection.target, connection.source, 'New Message');
  }
}
```

详见 `docs/DEV_NOTES.md`。

## 工作流程

### 添加新图表类型

1. **创建数据结构**
   ```typescript
   // src/shared/types.ts 或 src/webview/diagrams/[type]/types.ts
   interface YourDiagram {
     // 定义图表结构
   }
   ```

2. **实现 Parser 和 Generator**
   ```typescript
   // src/webview/diagrams/[type]/utils/parser.ts
   export function parseYourDiagram(code: string): YourDiagram { ... }

   // src/webview/diagrams/[type]/utils/generator.ts
   export function generateYourMermaid(diagram: YourDiagram): string { ... }
   ```

3. **创建 Zustand Store**
   ```typescript
   // src/webview/stores/diagramStore.ts 中添加相应 action
   addNode: (name) => { ... }
   ```

4. **创建节点和边组件**
   ```typescript
   // src/webview/nodes/YourNode.tsx
   // src/webview/edges/YourEdge.tsx
   ```

5. **注册到画布**
   ```typescript
   // src/webview/components/Canvas/Canvas.tsx
   const nodeTypes = { ..., yourNode: YourNode };
   const edgeTypes = { ..., yourEdge: YourEdge };
   ```

6. **编写测试**
   ```typescript
   // src/webview/__tests__/integration/your-store.test.ts
   describe('YourStore', () => { ... });
   ```

### 修改 Mermaid 解析逻辑

**重要**：解析优先级很关键！具体模式必须优先于通用 block 模式。

```typescript
// 正确的顺序
while (i < lines.length) {
  // 1. 先匹配具体语法
  if (participantMatch) { ... }
  if (messageMatch) { ... }
  if (noteMatch) { ... }
  
  // 2. 最后匹配通用 block
  if (blockMatch) { ... }
}
```

## 测试

### 测试结构

```
src/webview/__tests__/
├── integration/
│   ├── sequence-store.test.ts      # 时序图 store 测试（29 测试）
│   ├── flowchart-store.test.ts     # 流程图 store 测试（29 测试）
│   ├── state-store.test.ts         # 状态机 store 测试（31 测试）
│   ├── adapter-pipeline.test.ts    # 适配器管道测试（21 测试）
│   └── diagram-registry.test.ts    # 注册表测试（18 测试）
└── diagrams/
    ├── sequence/utils/__tests__/
    │   ├── mermaid-parser.test.ts
    │   └── mermaid-generator.test.ts
    ├── flowchart/utils/__tests__/
    │   └── ...
    └── ...
```

### 编写测试

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useDiagramStore } from '@/webview/stores/diagramStore';

describe('My Feature', () => {
  beforeEach(() => {
    // 重置状态
    useDiagramStore.setState({
      diagram: { /* 初始状态 */ },
      nodes: [],
      edges: [],
    });
  });

  it('should do something', () => {
    const store = useDiagramStore.getState();
    store.addParticipant('Alice');
    
    const updated = useDiagramStore.getState();
    expect(updated.diagram.participants).toHaveLength(1);
  });
});
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- src/webview/__tests__/integration/sequence-store.test.ts

# 监听模式（开发中）
npm run test:watch
```

**当前测试统计**:
- 总测试数: 242
- 通过率: 100% ✅
- 测试文件: 11

## 代码规范

### 路径别名

```typescript
// ✅ 正确
import { useStore } from '@/webview/stores/diagramStore';
import { Participant } from '@shared/types';

// ❌ 错误
import { useStore } from '../../../stores/diagramStore';
import { Participant } from '../../../../shared/types';
```

### CSS 类命名

遵循 VS Code 主题变量：

```html
<!-- 背景 -->
<div className="bg-vscode-bg">Content</div>

<!-- 文字 -->
<div className="text-vscode-fg">Text</div>

<!-- 边框 -->
<div className="border-vscode-border">Border</div>
```

### TypeScript

- 启用严格模式（`strict: true`）
- 避免使用 `any` 类型，优先使用 `unknown` 或具体类型
- 为函数参数和返回值添加类型注解
- 使用 `interface` 定义对象结构，`type` 定义联合类型

```typescript
// ✅ 好
function handleMessage(msg: Message): Promise<void> { ... }

// ❌ 不好
function handleMessage(msg: any) { ... }
```

### React 组件

- 使用函数组件 + hooks
- 使用 `memo` 优化性能
- 合理划分组件职责

```typescript
import { memo } from 'react';

const MyNode = memo(({ id, data }: NodeProps) => {
  return <div>{data.label}</div>;
});

export default MyNode;
```

## 反面模式 (Anti-patterns)

| 禁止 | 原因 |
|------|------|
| 直接修改 `nodes`/`edges` | 必须通过 `diagram` 派生，否则数据不一致 |
| 跳过 `pushHistory()` | 导致 undo/redo 失效 |
| 在 Extension 端引入浏览器 API | Node.js 环境无 DOM |
| 在 Webview 端引入 `vscode` 模块 | 浏览器环境无 Node.js |
| 在图表类型之间混用类型 | 破坏单一责任，使用适配器而非直接转换 |

## 常见问题 (FAQ)

### Q: 添加新节点类型后节点不显示？
A: 检查是否在 `Canvas.tsx` 中注册了 `nodeTypes`。

### Q: 修改 Mermaid 解析后图表为空？
A: 检查正则表达式优先级。具体模式应优先于通用 block（参见 `DEV_NOTES.md`）。

### Q: undo/redo 不工作？
A: 确保在 store action 中调用了 `pushHistory()`。

### Q: React Flow 箭头方向反向？
A: 这是设计问题。用户拖拽时采用"拉取"模式。在 `onConnect` 中交换 source/target（参见源代码注释）。

### Q: VS Code 扩展 DevTools 打不开？
A: 确保在 Extension Host 中操作，不是普通 VS Code 窗口。快捷键: Cmd+Shift+P → "Developer: Open Webview Developer Tools"

## 性能优化

### Bundle 大小

当前 webview bundle 大小约 3.8MB（1.1MB gzipped）。主要原因是 Mermaid 库较大。

优化策略：
1. 使用动态 import 按需加载某些 Mermaid 功能
2. 配置 Vite 的 `rollupOptions.output.manualChunks` 进行代码分割
3. 定期检查依赖更新

### 渲染性能

- 使用 `memo` 包装节点组件避免不必要重新渲染
- 在 store 中只订阅需要的数据片段
- 避免在 JSX 中创建新函数（使用 `useCallback`）

## 发布流程

### 打包 VSIX

```bash
# 全局安装 vsce
npm install -g vsce

# 在项目根目录打包
vsce package
```

### 发布到 VS Code Marketplace

```bash
vsce publish
```

需要：
- VS Code Marketplace 账户
- Personal Access Token (PAT)

详见：https://code.visualstudio.com/api/working-with-extensions/publishing-extension

## 资源和参考

### VS Code 文档
- [Extension API](https://code.visualstudio.com/api)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)

### React Flow 文档
- [Official Site](https://reactflow.dev)
- [API Reference](https://reactflow.dev/api-reference)

### Mermaid 文档
- [Official Site](https://mermaid.js.org)
- [Syntax Reference](https://mermaid.js.org/intro/)

### 项目文档
- [AGENTS.md](./AGENTS.md) - 项目知识库
- [docs/DEV_NOTES.md](./docs/DEV_NOTES.md) - 开发笔记
- [docs/PR_LIST.md](./docs/PR_LIST.md) - 进度跟踪

## 支持

遇到问题？

1. 检查 [docs/DEV_NOTES.md](./docs/DEV_NOTES.md) 的踩坑记录
2. 查看相关测试文件作为使用示例
3. 查阅 Webview DevTools Console 的 `[AIMermaid]` 日志
4. 检查 TypeScript 错误（运行 `npm run typecheck`）

## 许可证

MIT

---

**最后更新**: 2026-02-10
**维护者**: AIMermaid Team
