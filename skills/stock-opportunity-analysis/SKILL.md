---
name: stock-opportunity-analysis
description: Analyze and rank multiple stocks for near-term opportunity using verified current data, cited sources, business-chain moat analysis, industry rotation logic, catalysts/events, cyclical financial profitability, orders/deliveries, and risk/invalidation. Use when the user asks to compare several stocks, find potential growth or trend candidates, screen stocks by real fundamentals/catalysts, or demands stock-analysis data that is true, current, and source-backed.
---

# Stock Opportunity Analysis

## Operating Rules

Use this skill to build a source-backed research watchlist from multiple stocks. Treat the result as investment research and risk analysis, not guaranteed buy/sell advice.

Default to the user's language. For Chinese prompts, write the report in Chinese.

## Non-Negotiable Data Discipline

- Browse or otherwise verify current market, company, financial, catalyst, delivery, and policy data before analyzing. Do not rely on memory for current facts.
- Cite sources with publication/report dates for factual claims and every displayed business or financial number.
- Prefer primary sources: company filings, exchange announcements, investor relations, earnings releases/calls, regulator data, official policy documents, and recognized industry or market data providers.
- Cross-check important facts with at least two credible sources when possible, especially revenue/profit changes, order or delivery claims, policy catalysts, and management guidance.
- Never invent numeric values to make a table look complete. If a value cannot be verified, write `未核验`, `缺失`, or `需补充来源`, and explain the impact on confidence.
- Separate `事实`, `推断`, and `观点`. A catalyst can be factual; the likely stock-price response is an inference.
- Use probability/condition language such as `若...则...`, `倾向`, or `观察条件成立后` rather than declaring certain price growth.
- State the data cutoff date and market session used for prices or technical signals.

## Inputs To Clarify

If the user gives ambiguous names or tickers, resolve the listing venue and ticker before analysis. Ask only when ambiguity cannot be resolved safely.

If the user does not specify a horizon, use a near-term horizon of 1-3 months and say so. If the user asks for "近期", align catalysts, earnings, deliveries, and sector rotation to that horizon.

For a very large stock list, first create a data-sufficiency and catalyst triage, then deeply analyze the most promising names.

## Workflow

1. Normalize the stock universe: ticker, exchange, company name, market, sector, and user's intended horizon.
2. Build an evidence ledger for each stock: latest price context, filings, recent results, guidance, orders/deliveries, segment exposure, policy or event catalysts, sector data, and notable risks.
3. Identify the core real business chain: upstream inputs, proprietary capability or value barrier, customers/downstream demand, capacity or delivery constraint, and where profit is actually captured.
4. Test industry rotation logic: macro/policy/liquidity driver, sector relative strength, valuation reset, fund-flow narrative, and whether the stock is a leader, follower, or laggard within the chain.
5. Map expected events: earnings dates, product launches, policy windows, approvals, contracts, delivery milestones, index events, shareholder actions, or other dated catalysts.
6. Review cyclical financial quality: revenue and profit trend, gross margin, operating cash flow, backlog/order book, inventory, capex, debt pressure, and whether reported profit is supported by delivery or cash conversion.
7. Check market confirmation: price trend, volume/turnover, relative strength versus sector/index, support/resistance, and whether price has already fully priced in the thesis.
8. Rank candidates only after data sufficiency is clear. Mark each as `重点观察`, `条件观察`, `暂不优先`, or `剔除`, with explicit invalidation conditions.
9. Produce a compact watchlist first, then per-stock memos for the highest-ranked names.

## Full Report Framework

For a full multi-stock screen or ranked research report, read `references/analysis-framework.md` and follow its templates. Use the scorecard only as an analytical aid; do not present scores as objective facts.

## Output Requirements

Every report must include:

- `数据截止`: date/time, market session, and source scope.
- `结论先行`: which stocks deserve attention and why.
- `多股对比表`: business-chain value barrier, industry rotation logic, catalysts, financial/delivery pulse, price confirmation, main risk, and data confidence.
- `单股拆解`: facts, inference, expected near-term trigger, risk/invalidation, and what data to watch next.
- `来源清单`: direct links or clear source names with dates.
- `免责声明`: research only, not financial advice; user must decide based on personal risk tolerance.

## Refusal Or Degradation Conditions

Do not force a prediction when current data cannot be verified, market identity is unclear, or source quality is too weak. In those cases, return a data-gap report and list exactly what sources are needed before a responsible ranking can be made.
