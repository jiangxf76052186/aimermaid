# Development Notes & Pitfalls

## PITFALLS (踩坑记录)

### React Flow onConnect 方向问题

**问题现象**：用户从节点 A 拖动连线到节点 B 时，箭头方向相反（指向 A 而不是 B）。

**根因分析**：

React Flow 的 `onConnect` 回调中：
- `connection.source` = 拖动**起点**节点
- `connection.target` = 拖动**终点**节点

但在时序图语境中，用户的心智模型是：
- 从**发送方**拖向**接收方** → 箭头应指向接收方
- 即：拖动起点 = 发送方，拖动终点 = 接收方

然而 `MessageEdge` 中箭头绘制在 `target` 端（React Flow edge 的 target），而 `diagramToEdges()` 中：
```typescript
source: msg.from,  // 消息发送方
target: msg.to,    // 消息接收方 → 箭头在这里
```

如果直接使用 `addMessage(connection.source, connection.target, ...)`：
- 创建的消息：from = 拖动起点，to = 拖动终点
- edge 的 source/target 与拖动方向一致
- **但用户期望的是"拖向谁，箭头就指向谁"**

**实际问题**：用户习惯从 **target handle** 拖向 **source handle**（拉取模式），而非从 source 拖向 target（推送模式）。

**解决方案**：

```typescript
// diagramStore.ts - onConnect
onConnect: (connection) => {
  if (connection.source && connection.target) {
    // 交换 source 和 target，使箭头方向符合用户拖动意图
    get().addMessage(connection.target, connection.source, 'New Message');
  }
},
```

**经验总结**：
1. React Flow 的 source/target 语义是**连接的起点/终点**，不是业务意义上的发送/接收
2. 自定义边的箭头方向需要与业务语义对齐，而非 React Flow 的默认语义
3. 在实现拖拽连线时，先明确用户的心智模型是"推送"还是"拉取"

---

### Mermaid 解析器优先级问题

**问题现象**：`participant A` 被解析为 `{ type: "par", label: "ticipant A" }`，导致 Webview 完全空白（无参与者、无消息）。

**根因分析**：

Block 关键字正则先于 participant 匹配：
```typescript
const BLOCK_START_REGEX = /^(loop|alt|opt|par|critical|break)\s*(.*)$/i;
```

`participant` 以 `par` 开头，被错误匹配为 `par` block。

原解析顺序：
```
sequenceDiagram → block → participant → message → note
```

当 `participant A` 进入解析循环时，block 正则先匹配成功，直接跳过了 participant 逻辑。

**解决方案**：

调整解析优先级，具体语法优先于通用 block：
```
sequenceDiagram → participant → message → note → block
```

```typescript
// mermaid-parser.ts - 修改后的顺序
while (i < lines.length) {
  // 1. 先匹配具体语法
  if (participantMatch) { ... }
  if (messageMatch) { ... }
  if (noteMatch) { ... }
  // 2. 最后匹配通用 block
  if (blockResult) { ... }
}
```

**经验总结**：
1. 正则匹配顺序决定解析优先级，具体模式应优先于通用模式
2. `par` 是 block 关键字，`participant` 以 `par` 开头 —— 这类前缀冲突容易被忽视
3. 解析器调试时，先打印中间结果（parsed diagram）定位问题层级
