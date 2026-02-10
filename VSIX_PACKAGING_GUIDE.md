# VSIX 打包和发布指南

## 前置条件

### 1. 安装 vsce 工具

```bash
# 全局安装 vsce (Visual Studio Code Extension)
npm install -g vsce

# 或者使用 npx（推荐，无需全局安装）
npx vsce package
```

### 2. 验证打包前的准备工作

在打包前，确保：

```bash
# 所有检查通过
npm run typecheck    # ✅ TypeScript 类型检查
npm run lint         # ✅ ESLint 检查
npm test             # ✅ 242 个测试通过
npm run build        # ✅ 构建成功
```

## 打包 VSIX

### 方法 1: 使用 npx（推荐，不需要全局安装）

```bash
cd /data/dev/aimermaid
npx vsce package
```

输出示例：
```
aimermaid-0.1.0.vsix
```

### 方法 2: 全局安装 vsce

```bash
npm install -g vsce
cd /data/dev/aimermaid
vsce package
```

## VSIX 文件信息

### 生成的文件
- 文件名: `aimermaid-0.1.0.vsix`
- 位置: 项目根目录
- 大小: ~1.2-1.5 MB（取决于依赖）

### 文件内容
VSIX 是标准的 ZIP 存档，包含：
```
aimermaid-0.1.0.vsix
├── extension/           # Extension 代码
├── webview/            # Webview 代码（React + 资源）
├── [Content_Types].xml # VSIX 元数据
└── extension.vsixmanifest  # 扩展清单
```

## 本地测试 VSIX

### 在 VS Code 中安装本地 VSIX

1. 打开 VS Code
2. 按 `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
3. 输入 `Extensions: Install from VSIX...`
4. 选择 `aimermaid-0.1.0.vsix` 文件
5. 重启 VS Code

### 验证安装

1. 打开任意 `.md` 文件包含 ` ```mermaid ` 代码块
2. 应该看到 CodeLens 按钮："🎨 可视化编辑 Mermaid"
3. 点击按钮打开编辑器

### 卸载测试版本

在 VS Code 扩展面板中找到 "AI Mermaid Editor" 并卸载。

## 发布到 VS Code Marketplace

### 先决条件

1. 拥有 Microsoft 账户（免费）
2. 创建 VS Code Marketplace 发布者账户
3. 获取 Personal Access Token (PAT)

### 创建发布者账户

访问: https://marketplace.visualstudio.com/manage

1. 使用 Microsoft 账户登录
2. 创建新发布者（Publisher ID）
   - 示例: `aimermaid` 或 `your-company`
   - 规则: 小写字母、数字、连字符

### 获取 Personal Access Token

1. 访问: https://dev.azure.com/
2. 创建新的 Azure DevOps 组织（如果没有）
3. 生成 Personal Access Token
   - 权限: `Marketplace (Manage)`
   - 有效期: 建议 1 年

### 发布命令

```bash
# 创建发布者账户（首次）
vsce create-publisher <publisher-name>

# 登录发布者账户
vsce login <publisher-name>

# 发布扩展
vsce publish

# 或指定版本
vsce publish 0.1.0

# 或一步到位（使用 PAT）
vsce publish -p <personal-access-token>
```

### 发布示例

```bash
# 假设 publisher 是 "aimermaid"
vsce publish -p vso...xxx
# 或
vsce publish -p vso...xxx major  # 发布主版本更新
vsce publish -p vso...xxx minor  # 发布次版本更新
vsce publish -p vso...xxx patch  # 发布补丁版本
```

## 版本号管理

### 遵循 Semantic Versioning (SemVer)

```
MAJOR.MINOR.PATCH
   0.   1.    0
```

- **MAJOR**: 不兼容的 API 变更（新图表类型、破坏性重构）
- **MINOR**: 向后兼容的功能添加（新功能、改进）
- **PATCH**: 向后兼容的 bug 修复（修复问题、性能优化）

### 版本历史规划

```
v0.1.0 ✅ 当前版本
  - 时序图、流程图、泳道图、状态机
  - 完整测试覆盖（242 个测试）
  - 开发文档完整

v0.1.1 (后续 patch)
  - Bug 修复
  - 小的改进

v0.2.0 (后续 minor)
  - 新功能（更多导出格式、快捷键优化）
  - UI/UX 改进
  - 性能优化

v1.0.0 (未来 major)
  - API 稳定
  - 全面的用户文档
  - 市场验证
```

### 更新版本号

在 `package.json` 中更新：

```json
{
  "version": "0.1.0"  // ← 修改此处
}
```

## 故障排查

### 问题 1: `vsce package` 失败 - 找不到 main 入口

**错误**: `ERROR Could not find 'main' field`

**解决**: 检查 `package.json` 中的 `main` 字段：

```json
{
  "main": "./dist/extension/extension.js"
}
```

### 问题 2: VSIX 太大（超过限制）

当前 VSIX 大小约 1.2-1.5 MB（在限制内）

如果超过 200 MB，使用 `.vscodeignore`：

```
# .vscodeignore
node_modules/
.git/
.gitignore
src/
tsconfig.json
vitest.config.ts
*.test.ts
.eslintrc.json
docs/
DEVELOPER_GUIDE.md
MERGE_STRATEGY.md
```

### 问题 3: 发布时认证失败

```bash
# 清除旧的 PAT
vsce logout

# 重新登录
vsce login <publisher-name>

# 输入 PAT 时，使用全新的 token（旧 token 可能过期）
```

### 问题 4: 扩展安装后不工作

检查清单：

1. ✅ 所有依赖正确 (`npm install`)
2. ✅ 构建成功 (`npm run build`)
3. ✅ 没有 TypeScript 错误 (`npm run typecheck`)
4. ✅ `package.json` 中的 `main` 字段正确
5. ✅ VS Code 版本 >= 1.85.0
6. ✅ 开发者工具中没有 JavaScript 错误

## 更新现有扩展

如果已在 Marketplace 上发布，更新步骤：

```bash
# 1. 提高版本号（在 package.json）
"version": "0.1.1"

# 2. 打包
npx vsce package

# 3. 发布
npx vsce publish patch  # 自动从 package.json 读取版本
```

## Marketplace 页面优化

### 必填信息

- **displayName**: `AI Mermaid Editor` ✅
- **description**: 简短描述（< 200 字）✅
- **version**: 语义版本号 ✅
- **publisher**: 发布者 ID（需创建）

### 可选但推荐

- **README.md**: 在 Marketplace 显示
- **CHANGELOG.md**: 版本更新说明
- **icon.png**: 扩展图标 (128x128)
- **keywords**: 搜索关键词

### 创建 README for Marketplace

在项目根目录创建高质量的 `README.md`：

```markdown
# AI Mermaid Editor

VS Code 扩展，支持拖拽方式可视化编辑 Mermaid 图表。

## 功能

- ✨ 支持时序图、流程图、泳道图、状态机
- 🎨 拖拽编辑，实时预览
- ⚡ Mermaid 代码自动同步
- 🔄 撤销/重做支持

## 快速开始

1. 在 VS Code 中打开 Markdown 文件
2. 添加 Mermaid 代码块:
   \`\`\`mermaid
   sequenceDiagram
     participant Alice
     participant Bob
     Alice->>Bob: Hello
   \`\`\`
3. 点击 CodeLens "🎨 可视化编辑 Mermaid"
4. 开始拖拽编辑！

## 文档

- [开发指南](./DEVELOPER_GUIDE.md)
- [设计文档](./docs/PR/时序图/DESIGN.md)

## 许可证

MIT
```

## 发布清单

打包和发布前检查：

- [ ] 版本号已更新（package.json）
- [ ] 所有测试通过（npm test）
- [ ] 构建成功（npm run build）
- [ ] TypeScript 无错误（npm run typecheck）
- [ ] 代码检查通过（npm run lint）
- [ ] Git 已提交（git commit）
- [ ] 创建了发布标签（git tag）
- [ ] README 已更新
- [ ] CHANGELOG 已更新
- [ ] 本地测试通过

## 监控和维护

### Marketplace 统计

发布后，访问发布者控制面板查看：
- 安装数
- 活跃用户数
- 评分和评论
- 下载趋势

### 收集反馈

1. 在 Marketplace 回复用户评论
2. 追踪 GitHub Issues（如果有）
3. 每月总结改进建议

## 相关资源

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Marketplace 文档](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce 文档](https://github.com/microsoft/vscode-vsce)

---

**最后更新**: 2026-02-10
**维护者**: AIMermaid Team
