# Branch Consolidation & Merge Strategy

## 当前分支状态

### 分支历史
```
main (outdated) ← dev (outdated) ← 历史分支
dev_flow ← 流程图功能
dev_Swimlane ← 泳道图功能 (基于 dev_flow)
dev_state ← 状态机功能 (基于 dev_Swimlane) ✅ 最新/最完整
```

### 功能分布
| 分支 | 时序图 | 流程图 | 泳道图 | 状态机 | 测试覆盖 |
|------|-------|--------|--------|---------|---------|
| main | ✅ | ❌ | ❌ | ❌ | ❌ |
| dev | ✅ | ❌ | ❌ | ❌ | ❌ |
| dev_flow | ✅ | ✅ | ❌ | ❌ | 部分 |
| dev_Swimlane | ✅ | ✅ | ✅ | ❌ | 部分 |
| dev_state | ✅ | ✅ | ✅ | ✅ | ✅ |

### 最新提交
- **dev_state** (HEAD): f74b10c - 修复 linting 错误 + 添加 ESLint 配置 + DEVELOPER_GUIDE ✅
- **dev_Swimlane**: 674c19a - 泳道图完成
- **dev_flow**: a30faab - 流程图完成
- **main/dev**: 53e80c0 - test (outdated)

## 推荐的合并策略

### ✅ 采用方案：以 dev_state 为基础合并到 dev/main

**理由**：
1. `dev_state` 包含所有功能（时序图、流程图、泳道图、状态机）
2. 有完整的测试覆盖（242 个测试通过）
3. 代码质量最高（通过 linting 和 type checking）
4. 已有开发指南和文档

### 合并步骤

#### 步骤 1: 准备 dev_state（已完成）
```bash
# ✅ 已完成
# - 所有测试通过 (242/242)
# - 构建成功
# - 代码检查通过
# - 文档完善
```

#### 步骤 2: 更新 dev 分支
```bash
# 确保在 dev_state
git checkout dev_state

# 确保本地已更新
git pull origin dev_state

# 切换到 dev
git checkout dev

# 从 dev_state 合并
git merge dev_state --no-ff -m "merge: 合并所有图表功能 (sequence/flowchart/swimlane/state) 和完整测试"
```

#### 步骤 3: 更新 main 分支
```bash
# 切换到 main
git checkout main

# 从 dev 合并（建议先测试）
git merge dev --no-ff -m "merge: 发布完整版本 v0.1.0 (所有图表类型 + 完整测试)"
```

#### 步骤 4: 推送到远程
```bash
# 推送 dev
git push origin dev

# 推送 main
git push origin main

# 推送 dev_state（保留为记录）
git push origin dev_state
```

#### 步骤 5: 清理历史分支（可选）
```bash
# 删除本地分支
git branch -d dev_flow dev_Swimlane

# 删除远程分支（谨慎操作！）
git push origin --delete dev_flow dev_Swimlane
```

## 合并前检查清单

- [x] 所有测试通过 (242/242) ✅
- [x] 构建成功 ✅
- [x] Linting 通过 ✅
- [x] TypeScript 类型检查通过 ✅
- [x] 文档完善 ✅
- [x] 提交消息清晰 ✅

## 合并后验证

```bash
# 切换到 main（或 dev）
git checkout main

# 验证
npm install          # 确保依赖安装
npm run typecheck    # TypeScript 检查
npm run lint         # 代码检查
npm test             # 运行所有测试
npm run build        # 构建

# 预期结果
# ✅ TypeScript: 0 errors
# ✅ ESLint: 4 warnings (acceptable)
# ✅ Tests: 242 passed
# ✅ Build: success
```

## 版本号和发布

### 版本规划
- **v0.1.0**: 当前版本（四种图表 + 完整测试）
- **v0.2.0**: 后续改进（性能、UX、新功能）

### 更新版本号
```bash
# 在 package.json 中更新版本
{
  "version": "0.1.0"  // ← 保持或更新为 0.1.0
}
```

### 创建发布标签
```bash
git tag -a v0.1.0 -m "Release v0.1.0: Complete diagram editor with tests"
git push origin v0.1.0
```

## 后续工作

### 短期（下个迭代）
- [ ] 合并分支
- [ ] 验证发布
- [ ] 测试 VSIX 打包
- [ ] 发布到 VS Code Marketplace

### 中期（v0.2.0）
- [ ] 性能优化（减少 bundle 大小）
- [ ] UX 改进（快捷键、菜单优化）
- [ ] 更多导出格式（SVG、PNG）

### 长期（v0.3.0+）
- [ ] 新图表类型（ER 图、甘特图、etc.）
- [ ] 协作编辑
- [ ] 主题定制

## 常见问题

### Q: 为什么不直接在 dev_state 上工作？
A: 保留分支历史便于追踪各功能的开发过程。合并后 main 和 dev 成为工作分支。

### Q: 合并时发生冲突怎么办？
A: 由于是线性合并，不应该有冲突。如果有：
```bash
# 查看冲突
git diff

# 手动解决后
git add .
git commit --no-edit
```

### Q: 要回滚合并怎么办？
A: 
```bash
# 回滚最后一次合并
git reset --hard HEAD~1

# 或使用 revert（推荐，保留历史）
git revert -m 1 <merge-commit-hash>
```

### Q: 删除的分支可以恢复吗？
A: 可以，通过 reflog：
```bash
git reflog
git checkout -b dev_flow <old-hash>
```

## 关键文件检查清单

合并前请确保以下文件是最新的：

- [x] `package.json` - 依赖版本
- [x] `tsconfig.json` - TypeScript 配置
- [x] `vite.config.ts` - Vite 配置
- [x] `vitest.config.ts` - 测试配置
- [x] `.eslintrc.json` - 代码检查配置
- [x] `AGENTS.md` - 知识库
- [x] `DEVELOPER_GUIDE.md` - 开发指南
- [x] `README.md` - 项目说明

---

**最后更新**: 2026-02-10
**建议执行人**: DevOps / 项目维护者
**预计时间**: 10-15 分钟
