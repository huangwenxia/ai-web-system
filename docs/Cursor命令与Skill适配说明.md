# Cursor 命令与 Skill适配说明

##目标
明确 `ai-web-system` 中的 `commands` 与 `skills` 在 Cursor 中分别是什么角色、当前能否自动加载、以及后续应该如何适配。

---

##先说结论
###1. commands
`commands/*.md` **有机会被 Cursor 当作 slash command使用**，但前提是：
- Cursor 当前版本支持从指定命令目录加载
- 文件格式符合 Cursor 命令协议
-命令目录被 Cursor 实际扫描并刷新成功

因此：

**commands 是更接近 Cursor 原生命令入口的那一层。**

###2. skills
`skills/*/SKILL.md` **目前并不等于 Cursor 会自动原生加载的对象**。

也就是说：
- skill 文件对我、对某些支持 Skill 协议的终端有意义
-但 Cursor 当前并不会因为你有 `SKILL.md`，就自动把它们变成 slash command 或内建技能面板

因此：

**skills 当前更多是“能力协议层”和“跨智能体复用层”，不是 Cursor 原生命令层。**

---

## commands 与 skills 在 Cursor 中的正确关系
### commands
负责：
- 给 Cursor 提供更接近 slash command 的入口内容
-适合作为手动调用入口

### skills
负责：
-让能力协议化
-让不同智能体可以复用同一套工作流定义
- 给主 agent在任务理解后自动参考

换句话说：

- `commands` 更像 **Cursor 的入口适配层**
- `skills` 更像 **底层能力协议层**

所以不是“skill 自动变成 Cursor command”，而是：

**需要一层映射 /适配，把 skill能力投影成 Cursor 可识别的命令入口。**

---

## 当前是否已经支持 Cursor 自动加载 skill
###结论：**当前还不算真正支持。**

当前现状更准确地说是：
-你已经有 skill 内容
-你已经有 command 内容
-你也有同步脚本把 commands复制到 `C:\Users\xia\.cursor\commands`

但：
-这不等于 Cursor 一定已识别
- 更不等于 `skills/`目录会被 Cursor 自动理解为技能系统

所以当前应该判断为：

### 已有
- Cursor 命令入口的候选源文件：`commands`
- Skill 协议源文件：`skills`

###未完成
- Cursor 对 `commands` 的实际协议确认与 UI 生效验证
- Skill 到 Cursor 命令入口的稳定适配机制

---

## 最合理的适配策略
###策略一：继续以 `commands`作为 Cursor入口层
这是当前最现实的方案。

做法：
- 保持 `commands/*.md`作为 Cursor侧命令源
- 根据 Cursor真实协议补必要元信息
-由同步脚本发到 `C:\Users\xia\.cursor\commands`

###策略二：`skills` 不直接给 Cursor 用，而是成为 commands 的上游协议层
也就是：
- skill继续定义身份、输入、workflow、handoff、guardrails
- command负责把 skill能力转成 Cursor能用的入口表达

这其实也是你当前目录结构最自然的方向。

---

##你现在最应该怎么理解“Cursor也能使用 skill”
不是：

- Cursor直接原生理解 `skills/*/SKILL.md`

而是：

- Cursor通过 `commands` 使用能力入口
- 主 agent 或你自己在执行时，再自动参考对应 skill

换句话说：

**目前 Cursor 使用的是“命令入口层”，skill仍然是底层协议层。**

---

## 推荐后续建设方向
###短期
1.先确认 Cursor 当前实际认可的命令协议
2.让 `commands` 真正在 slash 列表中出现
3. 把命令和对应 skill 的映射关系明确下来

###中期
4. 做“command -> skill”的稳定映射规则
5.让主 agent 在接到 Cursor 命令时，自动读取对应 skill 和 standards

###长期
6. 如果 Cursor未来提供真正的 Skill / Tool 协议加载能力，再把 `skills`直接适配进去

---

## 当前推荐使用方式
### 如果你在 Cursor 中希望手动触发
优先通过：
- `commands`

### 如果你在和我这样的 agent 协作时希望自动触发
优先通过：
- `skills + standards + examples`

这两者不是冲突，而是不同入口层级。

---

## 一句话结论
**目前 Cursor 更适合承接 `commands`，而不是直接原生承接 `skills`；skill现在更像底层协议层，commands 才是更接近 Cursor 自动加载入口的那一层。**
