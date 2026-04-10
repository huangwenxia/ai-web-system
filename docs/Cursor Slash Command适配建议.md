# Cursor Slash Command适配建议

##目标
把 `ai-web-system/commands` 整理成更适合 Cursor slash command 使用与排查的入口层，帮助你优先打通：

**在 Cursor 中直接使用你积累的提示词模板命令。**

---

##先说结论
对 Cursor 来说，当前最值得优先打通的不是 `skills/`，而是：

- `commands/*.md`

因为这层本来就更接近“命令入口模板”。

你的 `skills/`仍然有价值，但在 Cursor 当前使用链路里，应先作为：
- 底层能力协议
- command 的上游定义

而不是第一优先的 slash command载体。

---

## 当前推荐目录角色
### commands
作为 Cursor slash command适配层。

### skills
作为能力协议层。

### standards
作为规则正文层。

这三层关系在 Cursor 上应理解为：

**Cursor 更先吃 commands，commands 再代表性地引用 skill 与 standards。**

---

## 当前推荐手动调用方式
如果 Cursor 的 slash command目录加载未完全稳定前，你仍可以先采用下面写法：

- `/frontend-implementer ...`
- `/schema-to-ui ...`
- `/page-analysis ...`
- `/ui-visual-review ...`

如果 slash 菜单还没弹出，可以先把这些命令名当“你自己的入口约定”。

---

## 为什么你现在 slash可能没出现
从现有同步脚本看，当前只是把 `commands/*.md`复制到了：

- `C:\Users\xia\.cursor\commands`

但这不自动等于 Cursor 一定会成功加载它们。

你现在需要区分3 件事：

1. 文件是否已同步成功
2. Cursor 是否真的支持这个本地目录协议
3. 命令文件格式是否满足 Cursor 当前版本要求

只要任意一环不成立，slash 列表就不会出现。

---

## 当前最推荐的排查顺序
### Step1：确认文件已同步到本地目录
检查：

- `C:\Users\xia\.cursor\commands`

里面是否真的存在：
- `frontend-implementer.md`
- `schema-to-ui.md`
- `page-analysis.md`
- `ui-visual-review.md`

### Step2：重启 Cursor
同步后建议：
-关闭 Cursor
-重新打开
-重新打开工作区
- 再在输入框键入 `/`

### Step3：如果仍不显示，先按“Cursor 当前不认这套格式”处理
这时不要再把问题归因为“命令没同步”，而应判断为：

**Cursor 当前版本的 slash command 协议与现有 markdown 模板之间仍有适配差异。**

---

## 推荐的 command 写法原则
为了让 `commands/*.md` 更像 Cursor 可读入口，建议继续遵守：

1. 一个文件只代表一个明确命令
2. 命令名尽量稳定且短
3. 文件顶部第一行就是命令名，例如：
 - `# /frontend-implementer`
 - `# /schema-to-ui`
4. 内容尽量直接表达：
 -角色
 -先读什么
 -执行步骤
 - 输出要求
5. 避免在 command 文件里塞太多规则正文

你当前这些 `commands` 基本已经是朝这个方向了，所以方向没有错。

---

## 当前对 Cursor 的现实策略
###短期目标
先让 `commands` 真正成为 Cursor 可用的 slash command 候选源。

###中期目标
让这些 command 背后稳定映射到：
- 对应 skill
- 对应 standards

###长期目标
如果 Cursor未来支持真正的本地 custom skill，再考虑直接让 `skills/`进入 Cursor 原生能力层。

---

## 对你当前最有用的实际建议
你现在别把重点放在“让 SKILL.md直接变 Cursor 内建 skill”。

当前最值得优先跑通的是：

###让这些命令先在 Cursor 中出现
- `/frontend-implementer`
- `/schema-to-ui`
- `/page-analysis`
- `/ui-visual-review`

只要这层跑通，你的提示词资产就已经开始在 Cursor 中变成可调用入口了。

---

## 一句话结论
**对于 Cursor，现在最现实的方向是优先把 `commands/` 打造成 slash command 可用入口，而不是先要求 `skills/` 被 Cursor 原生内建加载。**
