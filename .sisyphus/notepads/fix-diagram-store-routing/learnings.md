# 学习记录 - Store 路由修复

## 时间戳
2026-02-11

## 核心问题

### Bug 1: 状态机图无法渲染且保存覆盖文件
**根因**: App.tsx / TopBar.tsx / Preview.tsx 中所有 store 操作硬编码到 `useDiagramStore`（时序图专用 store）

**影响**:
- 状态机图打开时，loadFromMermaid 调用时序图解析器 → 解析失败 → 空画布
- 保存时调用时序图生成器 → 生成 sequenceDiagram → 覆盖用户文件
- undo/redo/delete 操作时序图历史栈，而非当前图表

### Bug 2: 流程图 UI 空白
**根因**: flowchart/adapter.ts 中 Toolbar 和 PropertyPanel 是空壳组件（return null），而真正的组件实现存在但未导入

## 解决方案

### 1. Store 路由机制
创建 `getActiveStore(diagramType)` 函数，根据图表类型返回对应 store：
```typescript
export function getActiveStore(diagramType: DiagramType) {
  switch (diagramType) {
    case 'flowchart': return useFlowchartStore;
    case 'state': return useStateStore;
    default: return useDiagramStore;
  }
}
```

### 2. 修改点汇总
| 文件 | 修改内容 |
|------|----------|
| App.tsx | init 消息处理、键盘事件（Ctrl+Z/Y/S、Delete）路由到正确 store |
| TopBar.tsx | save/undo/redo 按钮路由，标题动态化 |
| Preview.tsx | 预览数据源路由，空态判断通用化 |
| adapter.ts | 导入真正的 FlowchartToolbar 和 FlowchartPropertyPanel |

### 3. 特殊处理
- `recalculateAllBlockContents()` 只有时序图 store 有，需在调用前判断类型
- 空态判断从 `diagram.participants.length`（时序图特有）改为 `code.split('\n').length <= 1`（通用）
- FlowchartToolbar 是 named export，FlowchartPropertyPanel 是 default export

## 验证结果
- ✅ TypeScript 类型检查通过
- ✅ 构建成功（extension + webview）
- ✅ VSIX 打包成功（1.44MB）

## 经验总结
1. 多图表类型项目需确保所有组件都能根据类型路由到正确 store
2. Adapter 模式需确保组件引用正确，避免空壳组件
3. 空态判断应使用通用逻辑，避免依赖特定类型的字段
4. 三个 store 接口一致是修复的基础，不一致会增加复杂度
