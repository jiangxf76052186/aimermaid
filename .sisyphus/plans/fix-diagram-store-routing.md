# 修复图表类型 Store 路由 — 状态机/流程图不可用

## TL;DR

> **Quick Summary**: 修复 App.tsx / TopBar.tsx / Preview.tsx 中所有硬编码到时序图 store 的操作，使其根据 `activeDiagramType` 路由到正确的 store。同时修复流程图 adapter 导入空壳组件的问题。
>
> **Deliverables**:
> - 创建 store 路由 hook `useActiveStore`
> - 修复 App.tsx 的 load/save/undo/redo/delete 路由
> - 修复 TopBar.tsx 的 save/undo/redo 路由和标题动态化
> - 修复 Preview.tsx 的预览数据源路由
> - 修复 flowchart/adapter.ts 导入真正的 Toolbar 和 PropertyPanel
>
> **Estimated Effort**: Short
> **Parallel Execution**: NO - sequential（修改互相依赖）
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6

---

## Context

### Original Request
用户报告两个严重 bug：
1. 状态机图打开后不渲染已有内容，手动画图保存后文件内容被清空并替换为时序图标记
2. 流程图/泳道图打开后 UI 完全空白，无工具栏、无属性面板、无按钮

### Interview Summary
**Key Discussions**:
- 确认了两个 bug 的复现场景
- 通过代码调研定位了架构级根因

**Research Findings**:
- **根因 1**: `App.tsx`、`TopBar.tsx`、`Preview.tsx` 中所有核心操作（load/save/undo/redo/delete/preview）硬编码到 `useDiagramStore`（时序图专用 store），导致非时序图类型的数据加载失败、保存覆盖、操作错位
- **根因 2**: `flowchart/adapter.ts` 中 Toolbar 和 PropertyPanel 导出的是 `return null` 空壳组件，而真正的完整实现 `FlowchartToolbar.tsx`（55行）和 `FlowchartPropertyPanel.tsx`（199行）未被引入
- **三个 store 接口一致**: `useDiagramStore`、`useFlowchartStore`、`useStateStore` 都具备 `loadFromMermaid`、`toMermaid`、`undo`、`redo`、`deleteSelected`、`setTheme`、`history`、`historyIndex` 一致接口
- **Preview.tsx 也硬编码**: 使用 `diagram.participants.length` 做空态判断，这是时序图特有字段

---

## Work Objectives

### Core Objective
实现 store 路由机制，让 App / TopBar / Preview 根据 `activeDiagramType` 自动调用对应图表类型的 store，同时修复流程图 adapter 组件引用。

### Concrete Deliverables
- `src/webview/hooks/useActiveStore.ts` — store 路由 hook
- `src/webview/App.tsx` — 修复 load/save/undo/redo/delete
- `src/webview/components/TopBar/TopBar.tsx` — 修复 save/undo/redo + 标题
- `src/webview/components/Preview/Preview.tsx` — 修复预览数据源
- `src/webview/diagrams/flowchart/adapter.ts` — 修复组件导入

### Definition of Done
- [ ] 打开状态机图能正确渲染已有内容
- [ ] 状态机图保存后文件内容为 `stateDiagram-v2` 格式
- [ ] 打开流程图/泳道图有工具栏和属性面板
- [ ] 流程图保存后文件内容为 `flowchart` 格式
- [ ] 时序图功能不受影响（回归）
- [ ] `npm run build` 构建成功

### Must Have
- store 路由覆盖所有三种图表类型（sequence / flowchart / state）
- 保存时使用正确的生成器
- 加载时使用正确的解析器
- undo/redo 操作正确的历史栈
- delete 操作正确的选中元素

### Must NOT Have (Guardrails)
- 不修改任何 store 的内部逻辑（`diagramStore.ts` / `flowchart/store.ts` / `stateDiagram/store.ts` 不动）
- 不修改 Canvas 组件（已经正确渲染）
- 不修改解析器/生成器（已经正确工作）
- 不引入新的状态管理库
- 不重构 store 为统一接口（保持现有三个独立 store）

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL verification by agent using tools.

### Test Decision
- **Infrastructure exists**: YES (vitest)
- **Automated tests**: Tests-after（修复后验证构建通过）
- **Framework**: vitest

### Agent-Executed QA Scenarios (MANDATORY)

**构建验证**: `npm run build` 成功，无 TypeScript 错误
**类型检查**: `npm run typecheck` 通过

---

## Execution Strategy

### Sequential Execution

所有任务顺序执行，因为后续任务依赖前序任务的代码修改：

```
Task 1: 创建 useActiveStore hook
   ↓
Task 2: 修复 App.tsx store 路由
   ↓
Task 3: 修复 TopBar.tsx store 路由
   ↓
Task 4: 修复 Preview.tsx 预览数据源
   ↓
Task 5: 修复 flowchart adapter 组件导入
   ↓
Task 6: 构建验证
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4 | None |
| 2 | 1 | 3 | None |
| 3 | 1 | None | None |
| 4 | 1 | None | None |
| 5 | None | 6 | 1 |
| 6 | 1-5 | None | None |

---

## TODOs

- [x] 1. 创建 store 路由 hook `useActiveStore`

  **What to do**:
  - 创建 `src/webview/hooks/useActiveStore.ts`
  - 该 hook 根据 `useEditorStore` 的 `activeDiagramType` 返回对应 store 的操作方法
  - 返回统一接口：`{ loadFromMermaid, toMermaid, undo, redo, deleteSelected, setTheme, history, historyIndex, recalculateAllBlockContents? }`
  - 对于 `recalculateAllBlockContents`，仅时序图有此方法，其他类型返回空函数 `() => {}`
  - 使用 `useMemo` 或条件分支根据 `activeDiagramType` 选择 store

  **实现思路**:
  ```typescript
  import { useDiagramStore } from '../stores/diagramStore';
  import { useFlowchartStore } from '../diagrams/flowchart/store';
  import { useStateStore } from '../diagrams/stateDiagram/store';
  import { useEditorStore } from '../stores/editorStore';

  export function getActiveStore(diagramType: DiagramType) {
    switch (diagramType) {
      case 'flowchart': return useFlowchartStore;
      case 'state': return useStateStore;
      default: return useDiagramStore;
    }
  }
  ```

  **Must NOT do**:
  - 不要修改任何已有 store 的接口
  - 不要引入新的 zustand 实例

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: React hooks 和 Zustand store 领域

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 2, 3, 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/webview/stores/editorStore.ts:22-36` — `activeDiagramType` 状态定义和 setter
  - `src/webview/stores/diagramStore.ts:1-62` — 时序图 store 接口定义（loadFromMermaid/toMermaid/undo/redo/deleteSelected/history/historyIndex）
  - `src/webview/diagrams/flowchart/store.ts:26-55` — 流程图 store 接口（相同方法签名）
  - `src/webview/diagrams/stateDiagram/store.ts:34-64` — 状态图 store 接口（相同方法签名）

  **Type References**:
  - `src/shared/types.ts` — `DiagramType` 类型定义

  **Acceptance Criteria**:
  - [ ] 文件 `src/webview/hooks/useActiveStore.ts` 已创建
  - [ ] 导出 `getActiveStore` 函数，接受 `DiagramType` 返回对应 store
  - [ ] TypeScript 类型正确，无 type error

  **Commit**: YES (groups with 2, 3, 4, 5)
  - Message: `fix: implement store routing for multi-diagram support`
  - Files: `src/webview/hooks/useActiveStore.ts`

---

- [x] 2. 修复 App.tsx store 路由

  **What to do**:
  - 修改 `src/webview/App.tsx`，使用 `getActiveStore` 替代硬编码的 `useDiagramStore`
  - **初始化加载**（第34行）：`loadFromMermaid` 需根据 `diagramType` 调用正确 store
  - **Ctrl+S 保存**（第60-62行）：根据 `activeDiagramType` 调用正确 store 的 `toMermaid()`，`recalculateAllBlockContents` 仅在时序图时调用
  - **Ctrl+Z / Ctrl+Y**（第54-57行）：调用正确 store 的 `undo()` / `redo()`
  - **Delete/Backspace**（第69行）：调用正确 store 的 `deleteSelected()`
  - **setTheme**（第35行）：需同时设置所有 store 的 theme，或只设置当前活跃 store

  **具体修改**:

  第26-48行 `handleMessage` 中：
  ```typescript
  case 'init':
    const diagramType = message.data.diagramType as DiagramType;
    setActiveDiagramType(diagramType);
    // 根据类型路由到正确 store
    const store = getActiveStore(diagramType);
    store.getState().loadFromMermaid(message.data.mermaidCode);
    // theme 需要设置到对应 store
    store.getState().setTheme(message.data.theme as 'light' | 'dark');
    break;
  ```

  第50-75行 键盘处理中：
  ```typescript
  // 获取当前活跃 store
  const currentType = useEditorStore.getState().activeDiagramType;
  const activeStore = getActiveStore(currentType);

  // Ctrl+Z
  activeStore.getState().undo();
  // Ctrl+Y
  activeStore.getState().redo();
  // Ctrl+S
  if (currentType === 'sequence') {
    useDiagramStore.getState().recalculateAllBlockContents();
  }
  const code = activeStore.getState().toMermaid();
  vscodeApi.save(code);
  // Delete
  activeStore.getState().deleteSelected();
  ```

  同时需要移除顶部 `const { loadFromMermaid, setTheme } = useDiagramStore();` 这行的解构，因为不再直接使用。

  **Must NOT do**:
  - 不修改 Canvas 渲染逻辑（`renderCanvas` 函数已正确）
  - 不修改 adapter/registry 逻辑

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/webview/App.tsx:1-104` — 完整文件，所有需要修改的位置
  - `src/webview/App.tsx:16` — `const { loadFromMermaid, setTheme } = useDiagramStore();` 需替换
  - `src/webview/App.tsx:30-36` — init 消息处理，需路由 loadFromMermaid
  - `src/webview/App.tsx:50-75` — 键盘处理，需路由 undo/redo/save/delete
  - `src/webview/stores/editorStore.ts:29` — `setActiveDiagramType` 方法

  **Acceptance Criteria**:
  - [ ] `App.tsx` 不再直接调用 `useDiagramStore` 的 `loadFromMermaid`
  - [ ] 保存操作调用正确 store 的 `toMermaid()`
  - [ ] `recalculateAllBlockContents()` 仅在 `activeDiagramType === 'sequence'` 时调用
  - [ ] undo/redo/delete 操作正确 store

  **Commit**: YES (groups with 1, 3, 4, 5)
  - Message: `fix: implement store routing for multi-diagram support`
  - Files: `src/webview/App.tsx`

---

- [x] 3. 修复 TopBar.tsx store 路由和标题动态化

  **What to do**:
  - 修改 `src/webview/components/TopBar/TopBar.tsx`
  - **保存按钮**（第9-16行）：使用 `getActiveStore` 获取正确 store 的 `toMermaid()` 和 `recalculateAllBlockContents()`
  - **Undo/Redo 按钮**（第7行 + 第22-23行 + 第47-62行）：从正确 store 获取 `undo`、`redo`、`history`、`historyIndex`
  - **标题**（第66行）：将硬编码的 `"AI Mermaid Editor - 时序图"` 改为根据类型动态显示

  **具体修改**:
  ```typescript
  import { useEditorStore } from '../../stores/editorStore';
  import { getActiveStore } from '../../hooks/useActiveStore';

  const TopBar: React.FC = () => {
    const activeDiagramType = useEditorStore((s) => s.activeDiagramType);
    const store = getActiveStore(activeDiagramType);
    const { toMermaid, undo, redo, history, historyIndex } = store();

    const handleSave = () => {
      if (activeDiagramType === 'sequence') {
        useDiagramStore.getState().recalculateAllBlockContents();
      }
      const code = toMermaid();
      vscodeApi.save(code);
    };

    // 标题映射
    const titleMap: Record<string, string> = {
      sequence: '时序图',
      flowchart: '流程图',
      state: '状态图',
    };
    const title = titleMap[activeDiagramType] || activeDiagramType;
    // 渲染中使用: `AI Mermaid Editor - ${title}`
  };
  ```

  **Must NOT do**:
  - 不修改按钮布局或样式
  - 不添加新按钮

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/webview/components/TopBar/TopBar.tsx:1-73` — 完整文件
  - `src/webview/components/TopBar/TopBar.tsx:7` — `const { toMermaid, undo, redo, history, historyIndex, recalculateAllBlockContents } = useDiagramStore();` 需替换
  - `src/webview/components/TopBar/TopBar.tsx:66` — `"AI Mermaid Editor - 时序图"` 需动态化

  **Acceptance Criteria**:
  - [ ] TopBar 不再直接 import `useDiagramStore`（除非用于 sequence 的 `recalculateAllBlockContents`）
  - [ ] 保存调用正确 store 的 `toMermaid()`
  - [ ] undo/redo 操作正确 store 的历史栈
  - [ ] 标题根据图表类型动态显示

  **Commit**: YES (groups with 1, 2, 4, 5)
  - Message: `fix: implement store routing for multi-diagram support`
  - Files: `src/webview/components/TopBar/TopBar.tsx`

---

- [x] 4. 修复 Preview.tsx 预览数据源

  **What to do**:
  - 修改 `src/webview/components/Preview/Preview.tsx`
  - **数据源**（第10-11行）：根据 `activeDiagramType` 从正确 store 获取 `toMermaid` 和 `diagram`
  - **空态判断**（第27行）：`diagram.participants.length === 0` 是时序图特有判断，需改为通用的空态检查

  **具体修改**:
  ```typescript
  import { useEditorStore } from '../../stores/editorStore';
  import { getActiveStore } from '../../hooks/useActiveStore';

  const Preview: React.FC = () => {
    const activeDiagramType = useEditorStore((s) => s.activeDiagramType);
    const store = getActiveStore(activeDiagramType);
    const toMermaid = store((s) => s.toMermaid);
    const diagram = store((s) => s.diagram);

    // 空态判断：检查生成的 mermaid 代码是否有实质内容
    // 不再依赖 diagram.participants（时序图特有）
    const code = toMermaid();
    const isEmpty = !code.trim() || code.split('\n').length <= 1;
  ```

  **Must NOT do**:
  - 不修改 mermaid 渲染逻辑
  - 不修改折叠/展开行为

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/webview/components/Preview/Preview.tsx:1-76` — 完整文件
  - `src/webview/components/Preview/Preview.tsx:10-11` — `useDiagramStore` 数据源，需替换
  - `src/webview/components/Preview/Preview.tsx:27` — `diagram.participants.length === 0` 需改为通用判断
  - `src/webview/components/Preview/Preview.tsx:28` — `'添加参与者开始绘图'` 提示文案可改为通用文案

  **Acceptance Criteria**:
  - [ ] Preview 不再直接 import `useDiagramStore`
  - [ ] 预览渲染正确 store 的 mermaid 代码
  - [ ] 空态判断不依赖 `participants`（时序图特有字段）
  - [ ] 空态提示文案改为通用的如 "添加元素开始绘图"

  **Commit**: YES (groups with 1, 2, 3, 5)
  - Message: `fix: implement store routing for multi-diagram support`
  - Files: `src/webview/components/Preview/Preview.tsx`

---

- [x] 5. 修复 flowchart adapter 组件导入

  **What to do**:
  - 修改 `src/webview/diagrams/flowchart/adapter.ts`
  - **删除空壳组件**（第10-16行）：删除 `FlowchartToolbar` 和 `FlowchartPropertyPanel` 两个 `return null` 的空壳定义
  - **导入真正组件**：从已有的完整实现文件导入
  - 更新 adapter 导出的 `Toolbar` 和 `PropertyPanel` 字段

  **具体修改**:
  ```typescript
  // 删除这两个空壳：
  // const FlowchartToolbar: React.FC = () => { return null; };
  // const FlowchartPropertyPanel: React.FC = () => { return null; };

  // 替换为导入真正的组件：
  import { FlowchartToolbar } from './components/FlowchartToolbar';
  import FlowchartPropertyPanel from './components/FlowchartPropertyPanel';
  ```

  注意 `FlowchartToolbar` 是 named export，`FlowchartPropertyPanel` 是 default export。

  **Must NOT do**:
  - 不修改 `FlowchartToolbar.tsx` 和 `FlowchartPropertyPanel.tsx` 的实现
  - 不修改 adapter 的其他字段（parse/generate/detect/nodeTypes/edgeTypes 等）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 1-4 无代码依赖）
  - **Parallel Group**: 可与 Task 1 并行
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/webview/diagrams/flowchart/adapter.ts:10-16` — 空壳组件定义，需删除
  - `src/webview/diagrams/flowchart/adapter.ts:124-125` — adapter 中引用 Toolbar 和 PropertyPanel
  - `src/webview/diagrams/flowchart/components/FlowchartToolbar.tsx:15` — 真正的 FlowchartToolbar（named export）
  - `src/webview/diagrams/flowchart/components/FlowchartPropertyPanel.tsx:26,198` — 真正的 FlowchartPropertyPanel（default export）

  **Acceptance Criteria**:
  - [ ] `adapter.ts` 中不再有 `return null` 的空壳组件
  - [ ] `adapter.ts` 导入了 `FlowchartToolbar` 和 `FlowchartPropertyPanel`
  - [ ] `FlowchartAdapter.Toolbar` 和 `FlowchartAdapter.PropertyPanel` 指向真正的组件

  **Commit**: YES (groups with 1, 2, 3, 4)
  - Message: `fix: implement store routing for multi-diagram support`
  - Files: `src/webview/diagrams/flowchart/adapter.ts`

---

- [x] 6. 构建验证和 VSIX 打包

  **What to do**:
  - 运行 `npm run typecheck` 验证 TypeScript 类型
  - 运行 `npm run build` 验证完整构建
  - 运行 `npx vsce package --allow-missing-repository` 生成 VSIX 包
  - 如有类型错误则修复

  **Must NOT do**:
  - 不修改构建配置
  - 不修改 tsconfig

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final
  - **Blocks**: None
  - **Blocked By**: Tasks 1-5

  **References**:
  - `package.json` — build/typecheck 命令定义

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: TypeScript 类型检查通过
    Tool: Bash
    Steps:
      1. npm run typecheck
      2. Assert: exit code 0, 无 error 输出
    Expected Result: 类型检查通过
    Evidence: 命令输出

  Scenario: 完整构建成功
    Tool: Bash
    Steps:
      1. npm run build
      2. Assert: exit code 0
      3. Assert: dist/extension/extension.js 存在
      4. Assert: dist/webview/index.html 存在
    Expected Result: 构建产物生成
    Evidence: 命令输出

  Scenario: VSIX 打包成功
    Tool: Bash
    Steps:
      1. npx vsce package --allow-missing-repository
      2. Assert: exit code 0
      3. Assert: aimermaid-*.vsix 文件存在
    Expected Result: VSIX 包生成
    Evidence: 命令输出和文件大小
  ```

  **Commit**: YES
  - Message: `fix: implement store routing for multi-diagram support`
  - Files: 所有修改文件
  - Pre-commit: `npm run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 6 (全部完成) | `fix: implement store routing for multi-diagram support` | hooks/useActiveStore.ts, App.tsx, TopBar.tsx, Preview.tsx, flowchart/adapter.ts | npm run build |

---

## Success Criteria

### Verification Commands
```bash
npm run typecheck       # Expected: 0 errors
npm run build           # Expected: exit 0, dist/ 产物正常
npx vsce package --allow-missing-repository  # Expected: .vsix 生成
```

### Final Checklist
- [ ] 状态机图打开后能渲染已有内容
- [ ] 状态机图保存生成 `stateDiagram-v2` 格式
- [ ] 流程图打开后有工具栏（形状按钮、分组按钮）
- [ ] 流程图打开后有属性面板
- [ ] 流程图保存生成 `flowchart` 格式
- [ ] 时序图功能不受影响
- [ ] Preview 预览所有图表类型正确
- [ ] TopBar 标题动态显示图表类型
- [ ] 构建成功，VSIX 打包成功
