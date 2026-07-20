# project-mamba 当前规则适配

本文件只规定**如何发现当前事实**。目标仓库文件始终优先于本 skill 的历史案例。

## 开工核对

从目标文件向仓库根查找所有 `AGENTS.md`，再确认 repo-local skills：

```bash
find .. -name AGENTS.md -print
find .codex/skills -maxdepth 2 -name SKILL.md -print
```

UI 页面通常需要读取：

- `.codex/skills/ui-spec/SKILL.md`
- `.codex/skills/mamba-page-development/SKILL.md`
- 实际使用 EasyBill 组件时读取对应 component manual reference

不要假设这些 skill 一定安装在用户级目录；优先使用目标仓库声明的位置。

## 易漂移事实

每次执行都重新验证以下内容，不从旧案例复制：

### 图标包

```bash
rg -n "new icons|图标|@lucide/vue|lucide-vue-next" AGENTS.md .codex/skills package.json apps/*/package.json pnpm-lock.yaml
rg -n "from [\"'](@lucide/vue|lucide-vue-next)[\"']" apps packages | head -80
```

使用当前 `AGENTS.md` 指定的包和导入方式。历史页面仍使用旧包，不代表新代码可以继续使用。

### 单位与文案

```bash
rg -n "credits|Credits|积分|单位" AGENTS.md .codex/skills apps/*/src/locales
```

单位大小写、币种和术语以当前项目规则及需求为准。原型文案与业务规范冲突时记录差异，不回退正确业务术语。

### 验证命令

```bash
node -e 'const p=require("./package.json"); console.log(p.scripts)'
APP=financial node -e 'const p=require(`./apps/${process.env.APP}/package.json`); console.log(p.name, p.scripts)'
```

只运行实际存在的 script。不要把 `tsc`、`type-check`、`lint` 或 `build` 名称写死为所有 app 通用命令。

### API 与生成文件

```bash
APP=financial
rg -n "packages/api|auto-generated|generated" AGENTS.md .codex/skills/mamba-page-development/SKILL.md
rg -n 'ProviderSettlement|replace-with-endpoint-or-type' packages/api "apps/$APP/src"
```

先确认生成客户端和类型，再核对后端 controller/DTO。若项目规定生成文件不可手改，必须通过 Swagger 或上游契约更新。

### 页面范本与共享组件

```bash
APP=financial
rg --files "apps/$APP/src/views" | rg 'replace-with-page-keyword'
rg --files apps/common/src/components node_modules/easybill-ui | rg 'CardBox|replace-with-component-name'
```

示例路径可能移动。复制页面骨架前先确认文件存在，并打开组件源码核对 props、slots 和样式，不依赖旧 skill 对组件行为的描述。

## 项目适配结论

开工记录至少包含：

- 适用的 `AGENTS.md` 与 repo-local skills。
- app 名、真实 package script、图标包、locale alias。
- 目标路由与角色、API/types 来源。
- 选用的页面分型和范本文件。

这些结论属于本次任务证据，不要反向写成跨项目永久规则。
