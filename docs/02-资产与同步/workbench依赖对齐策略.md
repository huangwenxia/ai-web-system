# workbench依赖对齐策略

##目标
明确 `ai-front-workbench` 应如何与 `project-mamba` 保持依赖生态一致，避免知识库预览结果与真实项目落地环境脱节。

---

## 核心结论
`ai-front-workbench` 可以是独立 app，但它不应该发展成独立依赖生态。

应遵循：

**目录独立，依赖尽量对齐真实项目。**

---

## 为什么要对齐依赖
如果 workbench 使用了一套项目中不存在的依赖生态，会带来几个问题：

1. workbench 中预览正常，进入真实项目后失真
2. 候选组件会隐式依赖知识库私有能力
3. approval 前的判断依据不可靠
4. 知识库资产难以直接回落到真实项目

所以你的原始原则“知识库组件依赖来自当前真实项目”也应延伸到 workbench 本身。

---

## 推荐依赖分层
### 第一层：必须对齐
- `vue`
- `vue-router`
- `typescript`

### 第二层：优先复用 workspace 包
- `@repo/ui`
- `@repo/utils`
- `@repo/hooks`
-其他 `project-mamba` 内已有公共包

### 第三层：样式体系必须对齐
- 如果真实项目主要使用 Tailwind CSS，则 workbench 中的候选组件与页面也应优先使用 Tailwind 工具类
- 不应在 workbench 中另起一套与真实项目不一致的样式实现方法

### 第四层：新增依赖要极其克制
除非真实项目未来也会采用，否则不建议在 workbench 中新增：
- 新 UI 库
- 新状态库
- 新样式框架
- 新图标系统

---

## 当前阶段的现实策略
当前 `ai-front-workbench`只是第一版最小骨架，因此先使用了最少依赖：
- `vue`
- `vue-router`
- `vite`

这是为了先把预览壳跑起来。

但下一阶段建议明确往下走：

1.尽量与 `project-mamba` 的包版本保持一致
2.逐步引入 `@repo/ui` 等 workspace 公共包
3.让候选组件在 workbench 中也尽量按真实项目的 Tailwind约束实现

---

## 对你当前体系的指导意义
这意味着：

- `ai-front-workbench` 是知识库预览入口
- `hashrate/__preview__` 是真实项目集成预览入口
- 两者预览结果要尽量一致

而保证这一点的关键，就是依赖生态对齐。

---

## 一句话结论
**workbench 可以独立，但不能“自成一派”。**

它应该尽量站在 `project-mamba` 的依赖现实上工作，这样知识库预览结果才有真正的落地价值。