# Project Mamba App Topology Matrix

本文件记录 `project-mamba` 各 app 当前已确认的实现拓扑，用于命中 `project-mamba` 时先分型，再套实施规则。

## T1：common-shell source app
### common
- `vite.config.ts`：只挂本地 `src/views`
- alias：`@common -> src`
- `main.ts`：初始化 `initTheme()`，使用 `@common/locales`、`@common/utils/auth`
- 结论：共享壳、共享主题、共享 layout、共享 views 与大量共享组件的源头

## T2：common-view mixed app
### zguan
- `vite.config.ts`：挂本地 `src/views` + `../common/src/views`
- `~common` baseRoute：写死为 `/common`
- alias：`@common -> ../common/src`
- `main.ts`：本地 `install`、本地 directives、本地 `stores/user.ts` 权限来源、本地 `tailwind.css`
- 其他：接入 `$bus`、`@repo/ui/dist/ui.css`、`./service/template.service`
- 结论：属于 T2，但 bootstrap、权限、样式入口明显本地化；不能按 common 的初始化链推断

### gnosis
- `vite.config.ts`：挂本地 `src/views` + `../common/src/views`
- alias：`@common`、`@gnosis`、`@wanmore`
- `main.ts`：本地 i18n、本地 auth、本地 install / directives
- 结论：T2 mixed，视图混合，但运行时更偏本地

### hashrate
- `vite.config.ts`：挂本地 `src/views` + `../common/src/views`
- alias：`@common`、`@wanmore`、`@gnosis`、`@hashrate`
- `main.ts`：直接复用 `@wanmore/components/install` 与 `@wanmore/global`
- 结论：T2 mixed，并且存在跨 app bootstrap 复用；不能只看本 app 文件夹名做判断

### financial
- `vite.config.ts`：挂本地 `src/views` + `../common/src/views`
- alias：`@common`
- `main.ts`：使用 `@common/locales`、`@common/utils/auth`
- 结论：T2 mixed，但 shared runtime 比 zguan / gnosis 更强

### cbdp
- `vite.config.ts`：挂本地 `src/views` + `../common/src/views`
- alias：`@common`、`@cbdp`
- `main.ts`：本地 auth、本地 i18n、本地 directives，且有 `updateConstantLabel()`
- 结论：T2 mixed，但常量初始化与本地 runtime 逻辑要优先看本 app

## T3：multi-source route app
### wanmore
- `vite.config.ts`：本地视图不是单目录，而是 `src/views/common`、`src/views/manager`、`src/views/user` 三段；同时再挂 `../common/src/views`
- alias：`@wanmore`、`@common`、`@zguan`、`@general`、`@metis`、`@gnosis`
- `main.ts`：本地 i18n、本地 store、本地 globals
- 结论：先判当前页面属于哪一个本地分段，再判是否与 common 叠加

### metis
- `vite.config.ts`：挂本地 `src/views` + `../common/src/views` + `../cbdp/src/views`
- alias：`@common`、`@cbdp`
- `main.ts`：使用 `@common/locales`、`@common/utils/auth`
- 结论：典型 multi-source route app；不先判 route ownership 就容易复用错来源

## T4：standalone route app
### general
- `vite.config.ts`：只挂本地 `src/views`，不挂 `../common/src/views`
- alias：`@common`、`@general`、`@wanmore`
- `main.ts`：本地 install、本地 directives、本地 globals
- 结论：当前是 standalone route app；即使存在 `@common` alias，也不能把 common-view 页面结构当默认来源

## 实施判定顺序建议
1. 先读当前 app `vite.config.ts`
2. 判断它属于 T1 / T2 / T3 / T4
3. 再读当前 app `src/main.ts`
4. 确认 i18n、auth、install、directives、globals、store 来源
5. 再确认当前页面 route ownership：本地 / `~common` / `~cbdp` / 其他
6. 最后才进入页面壳、组件和字段映射的复用判断
