# AI Mermaid 全面自动化测试方案

> **Plan Generated**: 2026-02-10  
> **Target**: Extension 端 + React 关键组件 + E2E 三层  
> **Coverage Goal**: 80%+ overall, 90% core logic, 70% Extension, 50% UI

---

## Overview

本项目是一个 VS Code 扩展，用于可视化编辑 Mermaid 图表。采用 Extension (Node.js) + Webview (React) 双进程架构。

**当前状态**：
- ✅ Parser/Generator/Store：207 个测试用例，覆盖率 ~90%
- ❌ Extension 端：0% 覆盖（CodeLens、Webview、命令）
- ❌ React 组件：0% 覆盖
- ❌ E2E 工作流：0% 覆盖

**测试层级规划**：
1. Extension 单元/集成测试（Vitest + vscode mock）
2. React 关键组件测试（Vitest + RTL + jsdom）
3. E2E 完整工作流测试（@vscode/test-electron）

---

## Test Layers Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    E2E Tests                                 │
│    (打开 MD → CodeLens → 编辑 → 保存 完整工作流)            │
│                   @vscode/test-electron                      │
├─────────────────────────────────────────────────────────────┤
│                 Integration Tests                           │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │ Extension       │  │ React Components                │  │
│  │ - CodeLens      │  │ - Canvas (React Flow)           │  │
│  │ - Commands      │  │ - PropertyPanel                 │  │
│  │ - Message Pass  │  │ - ContextMenu                   │  │
│  │ Vitest + Mock   │  │ Vitest + RTL + jsdom            │  │
│  └─────────────────┘  └─────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Unit Tests (已有)                        │
│  Parser / Generator / Store / Adapter                       │
│                    Vitest                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Extension 端测试（优先级：高）

**依赖**：无  
**风险**：这是最大缺口，目前无任何测试  
**工具**：Vitest（已有）+ @types/vscode mock

### 1.1 测试基础设施

**路径**: `src/extension/__tests__/`
**新增依赖**:
```json
{
  "devDependencies": {
    "@types/vscode": "^1.85.0"  // 已有
  }
}
```

**Mock 目录结构**:
```
src/extension/__tests__/
├── mocks/
│   ├── vscode.ts              # 核心 VS Code API mock
│   ├── document.ts            # TextDocument mock helper
│   └── fixtures/
│       └── sample.md          # 测试用 markdown 文件
├── unit/
│   ├── codelens.test.ts       # CodeLens Provider 测试
│   ├── extension.test.ts      # 命令注册、激活逻辑测试
│   └── utils/
│       └── diagram-detector.test.ts  # 图表类型检测
└── integration/
    └── webview.test.ts        # Webview 消息处理测试
```

### 1.2 具体测试任务

**Task 1.1**: `diagram-detector.ts` 单元测试（最简单，优先）
- **范围**: `src/extension/utils/diagram-detector.ts`
- **测试点**:
  - [ ] 检测 sequenceDiagram
  - [ ] 检测 graph/flowchart
  - [ ] 检测 stateDiagram
  - [ ] 检测 classDiagram
  - [ ] 检测 erDiagram
  - [ ] 未知类型返回 'unknown'
  - [ ] 首行有空白字符的情况
  - [ ] 空字符串处理
- **技术方案**: 纯函数，无需 mock，直接测试
- **预计工作量**: 1 小时

**Task 1.2**: `codelens.ts` 单元测试
- **范围**: `MermaidCodeLensProvider` 类
- **测试点**:
  - [ ] `findMermaidBlocks()` - 单代码块检测
  - [ ] `findMermaidBlocks()` - 多代码块检测
  - [ ] `findMermaidBlocks()` - 嵌套代码块边界
  - [ ] `provideCodeLenses()` - 返回正确 CodeLens 数量
  - [ ] `provideCodeLenses()` - CodeLens 命令和参数正确
  - [ ] 空文档返回空数组
  - [ ] 无 mermaid 代码块返回空数组
  - [ ] 未闭合的 mermaid 代码块（容错）
- **技术方案**: 需 mock `vscode.TextDocument`, `vscode.Range`, `vscode.CodeLens`
- **预计工作量**: 3 小时

**Task 1.3**: `extension.ts` 集成测试
- **范围**: `activate()`, `deactivate()`, 命令处理
- **测试点**:
  - [ ] `activate()` 注册 CodeLens Provider（两种语言）
  - [ ] `activate()` 注册 `aimermaid.openEditor` 命令
  - [ ] `activate()` 注册 `aimermaid.insertDiagram` 命令
  - [ ] `findMermaidBlockAtCursor()` 找到光标所在代码块
  - [ ] `findMermaidBlockAtCursor()` 光标不在代码块时返回 null
  - [ ] `openEditor` 命令带参数时直接打开
  - [ ] `openEditor` 命令无参数时从光标位置查找
  - [ ] `openEditor` 无活动编辑器时显示错误
  - [ ] `openEditor` 光标不在 mermaid 块时显示错误
  - [ ] `insertDiagram` 在当前光标位置插入模板
- **技术方案**: 需 mock `vscode.ExtensionContext`, `vscode.commands`, `vscode.window`, `vscode.workspace`
- **预计工作量**: 4 小时

**Task 1.4**: `webview.ts` 集成测试
- **范围**: `MermaidEditorPanel` 类
- **测试点**:
  - [ ] `createOrShow()` 单例模式正确处理
  - [ ] `createOrShow()` 关闭旧面板创建新面板
  - [ ] `_sendInitData()` 发送正确初始化数据
  - [ ] `_handleMessage()` 处理 'ready' 消息
  - [ ] `_handleMessage()` 处理 'save' 消息并更新文档
  - [ ] `_handleMessage()` 处理 'cancel' 消息并关闭面板
  - [ ] `_saveToDocument()` 正确计算新的 endLine
  - [ ] `_getMermaidContent()` 提取代码块内容
  - [ ] `dispose()` 正确清理资源
- **技术方案**: 需 mock `vscode.WebviewPanel`, `vscode.WorkspaceEdit`, `vscode.Uri`, `vscode.window.createWebviewPanel()`
- **预计工作量**: 5 小时

### 1.3 Mock 实现要点

**关键接线：Extension 测试文件必须在顶部声明 vscode mock**:
```typescript
// 每个 Extension 测试文件顶部必须包含
import { vi } from 'vitest';
vi.mock('vscode', () => require('./mocks/vscode').mockVscode);

// 或在 vitest.config.ts 中通过 alias 全局映射：
// resolve.alias: { 'vscode': resolve(__dirname, 'src/extension/__tests__/mocks/vscode.ts') }
```

**vscode.ts Mock 核心**:
```typescript
// 需 mock 的关键 API
export const mockVscode = {
  languages: { registerCodeLensProvider: vi.fn() },
  commands: { registerCommand: vi.fn(), executeCommand: vi.fn() },
  window: { 
    activeTextEditor: mockEditor,
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    createWebviewPanel: vi.fn(() => mockPanel),
    activeColorTheme: { kind: 2 } // Dark
  },
  workspace: { applyEdit: vi.fn(), save: vi.fn() },
  Uri: { joinPath: vi.fn(), file: vi.fn() },
  Range: vi.fn((sLine, sChar, eLine, eChar) => ({sLine, sChar, eLine, eChar})),
  Position: vi.fn((line, char) => ({line, char})),
  ViewColumn: { Beside: -2 },
  ColorThemeKind: { Dark: 2, Light: 1 }
};
```

**document.ts Mock Helper**:
```typescript
export function createMockDocument(lines: string[]): TextDocument {
  return {
    lineCount: lines.length,
    lineAt: (i: number) => ({ text: lines[i] }),
    fileName: 'test.md',
    uri: { fsPath: '/test.md' }
  } as any;
}
```

---

## Phase 2: React 关键组件测试（优先级：中）

**依赖**: Phase 1 完成（测试框架已配置好）  
**风险**: React Flow 组件复杂，测试难度高  
**工具**: Vitest + @testing-library/react + jsdom + @testing-library/user-event

### 2.1 测试基础设施

**新增依赖**:
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/jest-dom": "^6.2.0",
    "jsdom": "^23.0.0"
  }
}
```

**Vitest 配置更新**:
```typescript
// vitest.config.ts
export default defineConfig({
  // ... existing config
  test: {
    globals: true,
    environment: 'jsdom',  // 新增
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],  // 包含 .tsx
    setupFiles: ['./src/webview/__tests__/setup.ts'],  // 测试前置文件
  },
});
```

**测试目录**:
```
src/webview/components/
├── Canvas/
│   ├── Canvas.tsx
│   └── __tests__/
│       └── Canvas.test.tsx
├── PropertyPanel/
│   ├── PropertyPanel.tsx
│   └── __tests__/
│       └── PropertyPanel.test.tsx
└── ContextMenu/
    ├── ContextMenu.tsx
    └── __tests__/
        └── ContextMenu.test.tsx
```

**Setup 文件** (`src/webview/__tests__/setup.ts`):
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock VS Code API (webview 端)
global.acquireVsCodeApi = vi.fn(() => ({
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn()
}));
```

> **注意**: Zustand store mock 不放在全局 setup 中。
> 因为组件使用相对路径导入 (`../../stores/diagramStore`)，
> 需要在每个组件测试文件内部使用 `vi.mock()` 并指定相对路径:
> ```typescript
> // Canvas.test.tsx 中
> vi.mock('../../../stores/diagramStore', () => ({
>   useDiagramStore: vi.fn()
> }));
> ```
> 或者在 vitest.config.ts 中确保 `@/` 别名生效后使用别名路径 mock。

### 2.2 具体测试任务

**Task 2.1**: `Canvas` 组件测试
- **范围**: `src/webview/components/Canvas/Canvas.tsx`
- **组件复杂度**: 高（React Flow 集成）
- **测试点**:
  - [ ] 渲染时显示 ReactFlow 画布
  - [ ] 节点类型注册正确（participant, timeline, note, block）
  - [ ] 边类型注册正确（message）
  - [ ] 节点变化时调用 `onNodesChange`
  - [ ] 边变化时调用 `onEdgesChange`
  - [ ] 连接节点时调用 `onConnect`
  - [ ] 节点拖拽停止时调用 `onNodeDragStop`
  - [ ] 节点选择时调用 `setSelectedNode`
  - [ ] 边选择时调用 `setSelectedEdge`
  - [ ] 右键点击显示 ContextMenu
- **技术方案**: Mock `useDiagramStore`，提供测试节点/边数据，用 `render()` + `userEvent`
- **预计工作量**: 6 小时

**Task 2.2**: `PropertyPanel` 组件测试
- **范围**: `src/webview/components/PropertyPanel/PropertyPanel.tsx`
- **组件复杂度**: 中（表单交互多）
- **测试点**:
  - [ ] 无选中时显示空状态
  - [ ] 选中 participant 时显示 participant 属性表单
  - [ ] 修改 participant 名称时调用 `updateParticipant`
  - [ ] 删除 participant 时调用 `removeParticipant`
  - [ ] 选中 message 时显示 message 属性表单
  - [ ] 修改 message 文本时调用 `updateMessage`
  - [ ] 修改 message 类型时调用 `updateMessage`
  - [ ] 删除 message 时调用 `removeMessage`
  - [ ] 消息上移/下移时调用相应 action
  - [ ] 选中 note 时显示 note 属性表单
  - [ ] 修改 note 文本时调用 `updateNote`
  - [ ] 选中 block 时显示 block 属性表单
  - [ ] 修改 block 类型时调用 `updateBlock`
- **技术方案**: 大量表单交互测试，使用 `userEvent.type()` 和 `userEvent.click()`
- **预计工作量**: 5 小时

**Task 2.3**: `ContextMenu` 组件测试
- **范围**: `src/webview/components/ContextMenu/ContextMenu.tsx`
- **组件复杂度**: 低
- **实际组件功能**: 右键菜单，包含"置顶"、"置底"、"删除"三个操作项
- **Props**: `{ x, y, nodeId, nodeType, onClose }`
- **测试点**:
  - [ ] 渲染时在指定坐标 (x, y) 显示菜单
  - [ ] 根据 nodeType 显示正确的节点类型名称（参与者/注释/块/元素）
  - [ ] 点击"置顶"按钮时调用 `bringToFront(nodeId)` 并关闭菜单
  - [ ] 点击"置底"按钮时调用 `sendToBack(nodeId)` 并关闭菜单
  - [ ] 点击"删除"按钮时依次调用 `setSelectedNode(nodeId)` → `deleteSelected()` 并关闭菜单
  - [ ] 点击菜单外部时调用 `onClose`
  - [ ] 组件卸载时清理 mousedown 事件监听器
- **技术方案**: Mock `useDiagramStore` 返回 `bringToFront`, `sendToBack`, `deleteSelected`, `setSelectedNode` spy，使用 `userEvent.click()` 触发按钮，验证 store action 调用和 `onClose` 回调
- **预计工作量**: 3 小时

---

## Phase 3: E2E 测试（优先级：中）

**依赖**: Phase 1 + Phase 2 完成  
**风险**: 设置复杂，运行慢  
**工具**: @vscode/test-electron

### 3.1 测试基础设施

**新增依赖**:
```json
{
  "devDependencies": {
    "@vscode/test-electron": "^2.3.8"
  }
}
```

**测试目录**:
```
src/extension/__tests__/e2e/
├── fixtures/
│   ├── sample.md              # 包含 mermaid 代码块的测试文件
│   └── empty.md               # 空 markdown 文件
├── helpers/
│   └── extension.ts           # 扩展启动辅助函数
└── workflow.test.ts           # 核心工作流测试
```

**VS Code 测试配置**:
```javascript
// .vscode-test.js
const { defineConfig } = require('@vscode/test-electron');

module.exports = defineConfig({
  files: 'out/test/**/*.test.js',
  workspaceFolder: './test-workspace',
  mocha: {
    ui: 'tdd',
    timeout: 20000
  }
});
```

> **注意**: E2E 测试使用 `@vscode/test-electron`，不是 `@vscode/test-cli`。
> `@vscode/test-electron` 负责下载并启动 VS Code 实例，Mocha 作为测试运行器。

### 3.2 具体测试任务

**Task 3.1**: E2E 测试基础架构搭建
- **范围**: 测试环境配置、fixtures、helpers
- **工作内容**:
  - [ ] 创建 `test-workspace` 目录
  - [ ] 创建包含多种图表的 markdown fixtures
  - [ ] 实现扩展启动/关闭 helper
  - [ ] 实现 CodeLens 点击 helper
  - [ ] 实现 Webview 内容验证 helper
- **预计工作量**: 4 小时

**Task 3.2**: 核心工作流 E2E 测试
- **范围**: 完整用户操作路径
- **测试场景**:
  - [ ] 打开 markdown 文件，验证 CodeLens 显示
  - [ ] 点击 CodeLens，验证 Webview 打开
  - [ ] Webview 中验证初始化数据正确
  - [ ] 在 Webview 中编辑图表（添加节点）
  - [ ] 保存后验证 markdown 文件更新
  - [ ] 关闭 Webview
- **技术方案**: 使用 VS Code API 执行命令，操作 UI 元素，断言文档内容变化
- **预计工作量**: 6 小时

---

## Phase 4: 覆盖率与质量（优先级：低）

### 4.1 覆盖率报告

**新增依赖**:
```json
{
  "devDependencies": {
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

**脚本更新**:
```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

**Vitest 配置**:
```typescript
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    thresholds: {
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70
    }
  }
}
```

### 4.2 测试质量检查

**Task 4.1**: 集成测试流水线验证
- **范围**: 完整测试套件运行
- **验证点**:
  - [ ] 所有单元测试通过
  - [ ] 所有集成测试通过
  - [ ] 覆盖率达标
  - [ ] 无 flaky 测试
- **预计工作量**: 2 小时

---

## Summary: Task Checklist

- [x] **Task 1.1**: Extension 测试基础设施 - mocks/, fixtures/ (2h, 高优先级) ✅
- [x] **Task 1.1**: diagram-detector 测试 - utils/ (1h, 高优先级) ✅
- [ ] **Task 1.2**: codelens 测试 - codelens.ts (3h, 高优先级)
- [ ] **Task 1.3**: extension 集成测试 - extension.ts (4h, 高优先级)
- [ ] **Task 1.4**: webview 集成测试 - webview.ts (5h, 高优先级)
- [ ] **Task 2.1**: Canvas 组件测试 - Canvas.tsx (6h, 中优先级)
- [ ] **Task 2.2**: PropertyPanel 组件测试 - PropertyPanel.tsx (5h, 中优先级)
- [ ] **Task 2.3**: ContextMenu 组件测试 - ContextMenu.tsx (3h, 中优先级)
- [ ] **Task 3.1**: E2E 基础架构 - fixtures/, helpers/ (4h, 中优先级)
- [ ] **Task 3.2**: 核心工作流 E2E - workflow.test.ts (6h, 中优先级)
- [ ] **Task 4.1**: 覆盖率配置 - vitest.config.ts (1h, 低优先级)
- [ ] **Task 4.2**: 质量验证 - 全测试套件 (2h, 低优先级)

**Total**: 12 tasks, 42 hours

---

## Implementation Order

**Wave 1** (Week 1): Extension 基础测试
- Task 1.1: 基础设施
- Task 1.1: diagram-detector
- Task 1.2: codelens

**Wave 2** (Week 2): Extension 集成测试
- Task 1.3: extension
- Task 1.4: webview

**Wave 3** (Week 3): React 组件测试
- Task 2.1: Canvas
- Task 2.2: PropertyPanel

**Wave 4** (Week 4): 收尾测试
- Task 2.3: ContextMenu
- Task 3.1: E2E 基础架构
- Task 3.2: E2E 工作流

**Wave 5** (Week 5): 质量保障
- Task 4.1: 覆盖率
- Task 4.2: 验证

---

## Expected Deliverables

### 文件结构
```
.
├── src/
│   ├── extension/
│   │   └── __tests__/
│   │       ├── mocks/
│   │       │   ├── vscode.ts
│   │       │   ├── document.ts
│   │       │   └── fixtures/
│   │       │       └── sample.md
│   │       ├── unit/
│   │       │   ├── codelens.test.ts
│   │       │   ├── extension.test.ts
│   │       │   └── utils/
│   │       │       └── diagram-detector.test.ts
│   │       ├── integration/
│   │       │   └── webview.test.ts
│   │       └── e2e/
│   │           ├── fixtures/
│   │           ├── helpers/
│   │           └── workflow.test.ts
│   └── webview/
│       ├── components/
│       │   ├── Canvas/
│       │   │   └── __tests__/
│       │   │       └── Canvas.test.tsx
│       │   ├── PropertyPanel/
│       │   │   └── __tests__/
│       │   │       └── PropertyPanel.test.tsx
│       │   └── ContextMenu/
│       │       └── __tests__/
│       │           └── ContextMenu.test.tsx
│       └── __tests__/
│           └── setup.ts
├── test-workspace/
│   └── sample.md
├── vitest.config.ts (更新)
└── package.json (新增依赖)
```

### 命令
```bash
# 运行所有测试
npm run test

# 运行 Extension 测试
npm run test -- src/extension/__tests__

# 运行组件测试
npm run test -- src/webview/components

# 运行覆盖率
npm run test:coverage
```

### 覆盖率目标
| 模块 | 目标覆盖率 |
|------|-----------|
| Extension 端 | 70%+ |
| React 组件 | 60%+ |
| Parser/Generator | 90%+ (已有) |
| Store | 85%+ (已有) |
| **整体** | **80%+** |

---

## Risks & Mitigations

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| VS Code API Mock 复杂度高 | 延期 | 分阶段实现，先测纯函数 |
| React Flow 组件难测试 | 低覆盖 | 聚焦关键交互，mock 复杂子组件 |
| E2E 测试不稳定 | 维护成本高 | 优先完成单元/集成，E2E 简化场景 |
| 测试运行时间长 | 开发效率 | 并行执行，watch 模式仅相关测试 |

---

## Notepad

> 保留给执行过程中的记录
> 路径: `.sisyphus/notepads/testing-strategy/`

```
## Conventions
- Mock 文件放在 `__tests__/mocks/`
- 测试文件命名: `[module].test.ts`
- 每个测试文件只测一个模块
- 使用 arrange-act-assert 结构

## VS Code Mock Patterns
- 使用 vi.fn() 创建 spy
- 复杂对象用 factory 函数创建
- 共享 mock 放在 mocks/vscode.ts

## Component Test Patterns
- 用 render() 渲染组件
- 用 userEvent 模拟交互
- 用 screen 查询元素
- Mock store 提供测试状态
```
