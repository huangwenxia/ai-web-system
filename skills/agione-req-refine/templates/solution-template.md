# REQ-YYYY-NNN 主方案文档

- 版本：
- 日期：
- 状态：`Solution Draft`
- 负责人：

> 用途说明：
> 这份文档是跨功能的产品逻辑主文档，用来统一评审业务规则、对象关系和方案边界。
> 它不替代 `functions/` 下的功能说明书，也不替代 `tech-solution.md`。

---

## AI 协作提示词

### 提示词 1：主方案采访（AI 问你答）

> 使用时机：brief.md 已定稿后，开始写 solution.md 前。

````
你是一位资深 B 端产品经理，帮我把一个已有业务简报的需求进一步梳理，输出「主方案文档（solution.md）」。

【业务简报（brief.md）】
[粘贴 brief.md 全文]

【背景】
- 产品：AGIONE（企业 AI 平台，多主体、多角色）
- 只写跨功能业务层，字段/状态机/接口交给 functions/ 文档

【采访维度】每轮 1-3 个问题，覆盖以下 5 个方面：
1. 核心对象与角色关系（业务对象有哪些、对象间关系、谁能操作什么）
2. 核心业务规则（跨功能的约束、优先级、计算逻辑）
3. 方案边界（本期做/不做，再次确认）
4. 跨功能权限原则（多角色/多主体的隔离约束）
5. 依赖与风险（上游依赖、下游影响、最可能出问题的地方）

【规则】遇到"不确定"给 2-3 个选项让我选，不要帮我猜；不问字段细节。

开始第 1 轮提问。
````

### 提示词 2：主方案起草（AI 起草，我审核）

> 使用时机：5 个维度采访信息已齐全。

````
基于我们的采访记录，严格按照本模板结构起草 solution.md。
要求：只写跨功能逻辑，不写字段/接口细节；信息不足处标注「⚠️ 待补充」；末尾附待确认问题清单。
````

---

## 1. 方案目标

## 2. 方案范围

- 本次包含：
- 本次不包含：

## 3. 角色与对象

| 对象 / 角色 | 定义 | 关键关系 |
| --- | --- | --- |

## 4. 核心业务规则

1.
2.
3.

## 5. 功能方案

### 5.1 能力清单

### 5.2 关键交互或配置项

### 5.3 异常和例外

## 6. 数据与状态

- 关键对象：
- 关键状态：
- 状态流转规则：

## 7. 权限与边界

## 8. 依赖与影响

- 上游依赖：
- 下游影响：
- 风险点：

## 8.1 代码地图对口（Code-Map Anchor）

> 起草前先扫一眼 [00-overview/code-map.md](../../00-overview/code-map.md) 第 §10 速查表，把"功能方案"映射到仓库 / 模块。
> 跨仓库改动要画出"桥"和"调用方向"，避免每个仓库各做一半。

### 8.1.1 主要落点

| 业务能力 | 后端仓库 / 模块 | 关键 Controller / Service | 前端 app / 视图 |
| --- | --- | --- | --- |
| 例：充值 | `metis-cbdp/cbdp-financial-account` | `RechargeOrderController` + `AccountTransactionService` | `apps/financial/views/index/...` |

### 8.1.2 跨仓库桥（如有）

| 起点 | 桥（已有 / 新增） | 终点 | 用途 |
| --- | --- | --- | --- |
| 例：`metis-cbdp/cbdp-financial-account` | `metis-wanmore/CbdpRechargeController`(`/service/thirdparty/cbdp`)（已有） | `metis-wanmore/wanmore-manage/SpecQuotaService` | 充值结果同步到算模方额度 |

### 8.1.3 是否新增 / 修改公共契约

- 是否要在 `metis-upms-api` 加 `RemoteXxxService`：
- 是否要在 `metis-common-*` 改公共能力（log / oss / kafka / datasource …）：
- 是否要在 `packages/api` / `packages/utils` 加跨 app 工具：

## 9. 决策记录

- 本文涉及的关键决策：

## 10. 待确认问题

1.
2.
