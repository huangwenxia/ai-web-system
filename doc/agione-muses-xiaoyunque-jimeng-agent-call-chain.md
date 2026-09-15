# 小云雀 / 即梦 Agent：会话入口后的模型调用链路

> 日期：2026-09-15  
> 用途：把「对话入口之后，不同输入到底调了哪些模型」一次说清楚  
> 对照对象：红果小云雀、即梦 Agent（同一套字节生成底座）  
> 证据边界：官方 CLI（`dreamina`）、火山/金山 Seedance 2.0 API、即梦网页逆向（`generateSeedanceVideo`）。当前工作区没有小云雀/即梦源码。  
> 关联文档：`agione-muses-market-direction-decision.md`、`agione-muses-business-function-flow-analysis.md`

---

## 0. 先记住这一句话

**Agent 会话入口后面永远先走文本 LLM。**  
LLM 只负责听懂、拆任务、选工具。  
真正出图走 **Seedream**，真正出视频走 **Seedance**。  
已经有「文字 + 图片 + 视频」再要一条新视频时，**不会再拆给三个生成模型**，而是 **一次调用 Seedance 全能参考**。

---

## 1. 会话入口之后，固定先发生什么

用户打开小云雀 / 即梦 Agent，进入对话，发出一条任务。无论后面要出图还是出视频，第一跳都一样：

```
用户说话 / 上传素材
        │
        ▼
   文本 LLM（豆包；小云雀还接过 DeepSeek）
        │
        ├─ 理解意图：这次最终要图，还是要视频，还是只要改文案
        ├─ 看手里有什么：纯文字 / 有图 / 有视频 / 有音频 / 混合
        ├─ 缺不缺资产：有没有角色图、场景图、参考视频
        └─ 决定下一跳调哪个生成工具
```

LLM **自己不画出、不渲视频**。它只做编排。

编排完之后，只有三类生产工具：

| 工具 | 模型 | 只在什么时候调用 |
| --- | --- | --- |
| 出图 | Seedream | 最终产物是图片，或视频前需要先补角色图/场景图/分镜图 |
| 出视频 | Seedance | 最终产物是视频 |
| 写字 | 还是那个 LLM | 只要剧本、分镜、旁白、提示词，不需要生成媒体 |

---

## 2. 一张路由表：看输入，就能知道调谁

判断规则只有一条：**看最终要什么，再看手里已经有什么。**

不是「图片输入就调图片模型、视频输入就调视频模型」。

| # | 用户输入 | 用户最终要 | 实际调用顺序 | 一句话 |
| --- | --- | --- | --- | --- |
| A | 只有文字 | 一张图 | LLM → **Seedream** | 文生图 |
| B | 文字 + 参考图 | 一张新图 | LLM → **Seedream** | 图生图 |
| C | 只有文字 | 一条视频 | LLM 写 prompt → **Seedance** | 文生视频。不一定先出图 |
| D | 文字 + 一张图 | 一条视频 | LLM 写 prompt → **Seedance** | 图生视频。图当首帧/参考，不进 Seedream |
| E | 文字 + 多张图 | 一条视频 | LLM 写 prompt → **Seedance** | 多帧或全能参考，仍只调 Seedance |
| F | 文字 + 图 + 视频（可再加音频） | 一条新视频 | LLM 写 prompt → **Seedance 一次** | 全能参考。图/视频/文本全部当参考，不再分模型 |
| G | 只有一句主题，但要完整成片 | 一条成片 | LLM 拆分镜 → **Seedream 补图** → **Seedance 出各段视频** → 剪辑拼接 | 这才是 Agent 多模型协同 |
| H | 只要改剧本 / 旁白 / 提示词 | 文字 | 只调 LLM | 不碰 Seedream / Seedance |

下面按这条表展开。看的时候只盯「谁被调用、调用几次」。

---

## 3. 各任务的具体调用链

### A. 只有文字，要一张图

```
会话入口
  → LLM 扩写提示词
  → Seedream（text2image）
  → 返回图片
```

调了：LLM 1 次，Seedream 1 次。  
不调 Seedance。

官方命令：`dreamina text2image`

---

### B. 文字 + 参考图，要一张新图

```
会话入口
  → LLM 扩写提示词
  → Seedream（image2image，把原图当参考）
  → 返回新图
```

调了：LLM 1 次，Seedream 1 次。  
原图不会再进视频模型。

官方命令：`dreamina image2image`

---

### C. 只有文字，要一条视频

```
会话入口
  → LLM 把一句话扩成视频 prompt
  → Seedance（text2video）
  → 返回视频
```

调了：LLM 1 次，Seedance 1 次。  
**默认不先画图。** 文生视频可以直接进 Seedance。

只有 Agent 判断「必须先有角色图/分镜图才能保证一致性」时，才会插入 Seedream，变成 G。

官方命令：`dreamina text2video`

---

### D. 文字 + 一张图，要一条视频

```
会话入口
  → LLM 写运动/运镜 prompt
  → Seedance（image2video）
     图作为首帧或参考图，直接喂给视频模型
  → 返回视频
```

调了：LLM 1 次，Seedance 1 次。  
**这张图不会再走 Seedream。** 它已经是成品参考，不是「还要再画一张」的输入。

官方命令：`dreamina image2video`

---

### E. 文字 + 多张图，要一条视频

两条子路径，都只调 Seedance：

1. 多张图当关键帧讲故事：`dreamina multiframe2video`
2. 多张图当角色/场景/风格参考：`dreamina multimodal2video`

```
会话入口
  → LLM 写 prompt，并用 @图1 @图2 标明每张图干什么
  → Seedance 一次
  → 返回视频
```

调了：LLM 1 次，Seedance 1 次。  
多张图仍然全部作为 Seedance 的参考输入。

---

### F. 文字 + 图片 + 视频，再要一条新视频（最容易搞混）

这就是「全能参考 / omni reference」。

```
会话入口
  → LLM 只做两件事：
       1. 听懂「用这些素材再生成一条新视频」
       2. 写清每份素材的职责（角色图、运镜参考、口播等）
  → 素材上传（不是生成）
       图片 → ImageX 对象存储
       视频/音频 → VOD 对象存储
  → Seedance 一次（multimodal2video）
       content = [
         text,
         image_url + role=reference_image,
         video_url + role=reference_video,
         audio_url + role=reference_audio   // 如果有
       ]
  → 返回新视频
```

调了：LLM 1 次（编排），Seedance 1 次（出片）。  
**不调 Seedream。**  
**不会**「图片调图片模型、视频调视频模型、文本调文本模型，再拼起来」。

各输入在这一跳里的真实身份：

| 用户给的东西 | 在请求里是什么 | 干什么 |
| --- | --- | --- |
| 文字 | `type=text` | 指令、分镜、旁白 |
| 图片 | `type=image_url`，`role=reference_image` / `first_frame` / `last_frame` | 锁角色、服饰、构图、首尾帧 |
| 视频 | `type=video_url`，`role=reference_video` | 锁运镜、动作、节奏 |
| 音频 | `type=audio_url`，`role=reference_audio` | 锁口播、BGM、卡点 |

官方命令：

```bash
dreamina multimodal2video \
  --image ./人物.png \
  --image ./服饰.png \
  --video ./运镜参考.mp4 \
  --audio ./口播.wav \
  --prompt="参考图片1的角色与图片2的服饰，按视频1的运镜生成新视频" \
  --model_version=seedance2.0
```

官方 API 也是一次 POST、一个 model：

```json
{
  "model": "doubao-seedance-2-0-260128",
  "content": [
    { "type": "text", "text": "参考图片1的角色，按视频1的运镜生成新视频" },
    { "type": "image_url", "image_url": { "url": "..." }, "role": "reference_image" },
    { "type": "video_url", "video_url": { "url": "..." }, "role": "reference_video" }
  ]
}
```

即梦网页逆向内部模型名：`dreamina_seedance_40_pro`（2.0）或 `dreamina_seedance_40`（2.0 Fast）。  
上传分管道只是存储不同，不是分模型生成。

---

### G. 只有一句主题，要一条完整成片（Agent 真正「多模型」的时候）

只有这时，才会按步骤连续调用多个模型。因为用户手里没有资产，Agent 必须先造资产，再造视频。

```
会话入口
  → LLM：拆主题为大纲 / 剧本 / 分镜
  → Seedream：按分镜生成角色图、场景图、关键帧
  → （可选）用户确认图片
  → Seedance：每个镜头用对应图片做参考，逐段出视频
  → 本地剪辑 / 拼接 / 字幕 / BGM
  → 返回成片
```

调了：LLM 若干次，Seedream 若干次，Seedance 若干次。  
这是「缺什么补什么」，不是「每种输入模态都对应一个生成模型」。

即梦 Agent 的视频 SOP 大致是：需求说明 → 大纲 → 剧本 → 故事板 → 出图 → 出视频 clip → 成片。  
简单、单 clip、4–15 秒、素材已齐：会跳过 SOP，直接进 C / D / F。

---

### H. 只要文字结果

```
会话入口
  → LLM
  → 返回文案 / 分镜 / 提示词
```

不调 Seedream，不调 Seedance。

---

## 4. 两层不要混

很多人乱，是因为把「Agent 层」和「出片层」当成同一件事。

```
┌─────────────────────────────────────────────┐
│  Agent 层（会话入口后）                       │
│  豆包 / DeepSeek LLM                         │
│  只负责：听懂、拆任务、选工具、写 prompt        │
└──────────────────────┬──────────────────────┘
                       │ 按最终产物选工具
           ┌───────────┴───────────┐
           ▼                       ▼
   Seedream 出图              Seedance 出视频
   text2image                 text2video
   image2image                image2video
                              frames2video
                              multiframe2video
                              multimodal2video  ← 图+文+视频再生视频走这里
```

- Agent 层：**会**内部调用其他模型。不是一个模型包办整个产品。
- 出片层（F）：**不会**再把图/视频/文本拆给三个生成模型。一个 Seedance 吃掉所有参考。

Seedance 模型内部有文本/视觉/音频编码器，那是同一个视频模型的模块，不是产品再去调 Seedream 或另一个文本生成模型。

---

## 5. 用三个问题自检

以后看到一条任务，只问这三句：

1. **最终产物是图、视频，还是字？**  
   图 → Seedream；视频 → Seedance；字 → LLM。
2. **手里的图/视频是「还要再生成」还是「拿来当参考」？**  
   当参考 → 直接喂给最终那个生成模型，不再调对应模态的生成模型。
3. **资产齐不齐？**  
   齐了 → 一次生成调用。  
   缺了 → Agent 先用 Seedream 补图，再交给 Seedance。

套到最容易混的场景：

> 同时有文字、图片、视频，让再生成一条视频。

答案：资产已齐，最终产物是视频 → **LLM 写 prompt + Seedance 一次**。  
图片当参考图，视频当参考视频，文字当 prompt。  
不走 Seedream，不走第二个视频模型，不走文本生成模型出片。

---

## 6. 证据来源（调用链不是猜的）

| 层 | 证据 |
| --- | --- |
| Agent 编排 | 即梦 Agent 公开拆解：Router → Skill → Execution；LLM 编排，工具出片。小云雀公开接入豆包 / Seedream / Seedance |
| 命令分流 | 官方 CLI：`text2image` / `image2image` 走 Seedream；`text2video` / `image2video` / `multimodal2video` 走 Seedance |
| 混合再生视频 | 官方 API 一次 POST，`content[]` 同时带 `text` / `image_url` / `video_url` / `audio_url` |
| 网页实链 | 逆向 `generateSeedanceVideo`：按 MIME 分流上传（图走 ImageX，音视频走 VOD），再组装 `unified_edit_input`，一次提交 `dreamina_seedance_40_pro` |

本文不声称看到了小云雀/即梦闭源仓库。产品层调用关系以上述 CLI、API、逆向链路为准。
