# ai-front-workbench

这是知识库内部的独立预览工作台，用于承接候选组件与候选页面的第一轮预览。

## 定位
- 独立于真实项目的候选资产预览壳
- 在进入真实项目 `__preview__` 前完成第一轮状态、视觉、结构验证
- 服务于个人资产沉淀，而不是正式业务交付

## 依赖原则
- workbench 可以独立成 app，但依赖生态优先对齐当前真实项目
- 预览壳独立，不代表可以自由引入项目中不存在的新 UI 或样式体系
- 若目标项目已提供 `@repo/ui`、`@repo/utils`、`@repo/hooks`、Tailwind 等基础设施，应优先复用
- 独立的是预览入口与目录，不是依赖生态

## 当前阶段目标
第一阶段先做到：
1. 能启动独立 Vue 预览壳
2. 能访问候选组件示例页
3. 能演示默认态、空态、loading 态
4. 后续再逐步接 manifest、资产自动发现与候选页面预览

## 当前阶段说明
当前这版是最小可运行骨架，因此先只接了最少依赖。

后续如果进入稳定使用阶段，应继续把依赖与 `project-mamba` 对齐，而不是让 workbench 发展成独立前端生态。

## 目录结构
```text
apps/ai-front-workbench/
  src/
    components/
    pages/
    App.vue
    main.ts
    router.ts
    styles.css
  index.html
  package.json
  tsconfig.json
  vite.config.ts
```

## 本地开发
安装依赖后，常用命令：

```powershell
cd apps/ai-front-workbench
pnpm install
pnpm dev
```

当前 Vite 开发端口为：`5176`

## 提交前最小检查
只要这次改动涉及 `apps/ai-front-workbench`，提交前至少执行：

```powershell
cd apps/ai-front-workbench
pnpm run check
```

当前 `check` 等价于：

```powershell
pnpm run build
```

这样做的目的不是替代完整测试，而是保证：
- 页面和路由没有明显构建错误
- Vue / TS 改动至少能通过生产构建
- 不把最基本的打包错误带进主分支

## 推荐提交流程
如果这次同时改了仓库文档和 workbench，建议分两步提交，不要混在一起。

workbench 相关改动推荐流程：

```powershell
cd apps/ai-front-workbench
pnpm run check

node scripts/verify-encoding.mjs .

git add apps/ai-front-workbench
git commit -m "feat: update workbench preview flow"
git push
```

## 当前提交建议
适合这个目录的提交类型通常有：
- `feat`: 新页面、新预览能力、新工作流区块
- `fix`: 修复构建、路由、样式、状态错误
- `refactor`: 调整页面结构或组件拆分
- `docs`: 仅更新 workbench 说明文档

## 后续可继续补的检查
当前先保持最小门槛，避免过早引入重配置。

后续如果 workbench 继续扩展，可以再补：
- `vue-tsc --noEmit`
- ESLint
- 页面级 smoke 检查
- manifest 输入校验

但前提是先保证这套最小构建检查长期被执行。