# Stock Opportunity Analysis Framework

Use this reference for full multi-stock screens, ranked watchlists, or reports that compare likely near-term trend candidates.

## Source Hierarchy

Use the highest available source tier for each claim:

1. Primary company and regulator sources: annual/quarterly reports, 10-K/10-Q/8-K, exchange announcements, investor presentations, earnings releases, earnings call transcripts, official IR pages, prospectuses, regulator filings, official policy documents.
2. Exchange and market infrastructure: SEC/EDGAR, SSE, SZSE, HKEX, CNINFO, Nasdaq/NYSE, company announcement portals, official index providers.
3. Recognized data and news providers: Bloomberg/Reuters/AP/WSJ/FT/CNBC, Wind/Eastmoney/Sina Finance/Tonghuashun where accessible, exchange-backed quote pages, reputable industry associations.
4. Secondary commentary: brokerage reports, blogs, forums, and social media. Use only as sentiment/context, never as the sole basis for a factual claim.

When sources disagree, prioritize the latest primary filing or official announcement. Mention the discrepancy instead of smoothing it away.

## Evidence Ledger

Create a small evidence ledger before conclusions:

| Field | Required evidence |
| --- | --- |
| Identity | Ticker, exchange, company name, market, reporting currency |
| Price context | Last close or current quote, date/session, index/sector comparison |
| Business chain | Core segment, value capture point, customers, suppliers, capacity, delivery bottleneck |
| Value barrier | IP, license, cost curve, scale, channel, switching cost, data/algorithm, qualification cycle, resource control |
| Financial cycle | Latest quarter/year revenue, profit, margin, cash flow, inventory/backlog/order status when available |
| Catalyst | Dated event, expected window, factual basis, uncertainty |
| Industry rotation | Sector policy/macro/liquidity driver, peer movement, valuation/positioning |
| Risk | Thesis invalidation, financial stress, policy risk, delivery miss, valuation already priced in |

If a field has no reliable source, mark it as missing and lower confidence.

## Business-Chain Analysis

For each stock, answer these questions:

- What exact product/service segment creates the thesis?
- Where does the company sit in the chain: upstream material/equipment, midstream manufacturing/platform, downstream brand/channel/application, or enabling infrastructure?
- Why is this company hard to replace: qualification, technical moat, license, scale, cost, customer relationship, ecosystem lock-in, or scarce resource?
- What must be delivered for the thesis to convert into revenue/profit?
- Which metric proves delivery: shipments, installed capacity, utilization, backlog, contract amount, ARR, active users, order book, gross margin, or cash collection?

Avoid vague labels such as "AI concept", "new energy", or "national policy benefit" without tying them to the company's real revenue source.

## Catalyst Map

Classify catalysts by reliability:

- Confirmed dated catalyst: announced earnings date, scheduled vote, delivery date, product launch, contract milestone, policy implementation date.
- Probable window: expected earnings season, regulator review window, customer ramp, seasonal demand, industry conference.
- Narrative catalyst: market rumor, theme speculation, broker narrative, fund-flow story.

For near-term opportunity, prefer stocks where at least one confirmed or probable catalyst falls inside the user's horizon.

## Financial And Delivery Quality

Evaluate whether the thesis is supported by reported numbers:

- Revenue growth: year-over-year and quarter-over-quarter where available.
- Profitability: gross margin, operating margin, net profit quality, non-recurring items.
- Cash conversion: operating cash flow versus net income, receivables, inventory, advance payments.
- Delivery: shipments, project milestones, signed orders, backlog, utilization, customer acceptance.
- Cyclicality: demand cycle, inventory cycle, price cycle, capex cycle, policy subsidy cycle.

If profit growth depends on one-off gains, subsidies, accounting revaluation, or asset sales, downgrade quality unless the user explicitly wants event-driven speculation.

## Rotation And Market Confirmation

Look for alignment between fundamentals and market behavior:

- Sector relative strength versus main index over the relevant horizon.
- Leadership within the chain: first movers with volume confirmation are stronger than late catch-up names with weak fundamentals.
- Positioning and valuation: a good business may be a poor near-term candidate if the catalyst is already crowded.
- Liquidity: thin liquidity weakens signal quality and increases execution risk.

Do not use technical movement alone as a reason to rank a stock highly.

## Scorecard

Use this only when ranking multiple names. Make clear that the score is an analyst judgment derived from cited evidence, not a factual measurement.

| Dimension | Weight | What earns a high score |
| --- | ---: | --- |
| Data reliability | Gate | Recent, primary, cross-checked sources exist |
| Business-chain value barrier | 25 | Clear value capture, durable moat, verified segment exposure |
| Financial/delivery momentum | 20 | Improving revenue/profit/cash flow supported by orders or deliveries |
| Near-term catalyst quality | 20 | Dated or high-probability catalyst within horizon |
| Industry rotation logic | 15 | Sector has credible policy/macro/fund-flow support |
| Market confirmation | 10 | Relative strength and volume support the thesis |
| Risk/reward asymmetry | 10 | Upside trigger is visible and invalidation is controllable |

If data reliability fails, do not calculate a final score; return `数据不足`.

## Report Template

Start with:

```markdown
数据截止: YYYY-MM-DD HH:MM timezone; price session/source; financial report period.
研究范围: tickers/markets; horizon; major sources used.
结论: 重点观察 / 条件观察 / 暂不优先 / 剔除.
```

Comparison table:

```markdown
| 股票 | 核心真实业务链/价值壁垒 | 行业轮动逻辑 | 近期大事件/催化 | 财务与交付验证 | 市场确认 | 主要风险 | 判断 |
| --- | --- | --- | --- | --- | --- | --- | --- |
```

Per-stock memo:

```markdown
### Ticker Company
- 事实: source-backed facts with dates.
- 推断: why the facts may create near-term opportunity.
- 催化: event/date/window and what would confirm it.
- 财务/交付: reported numbers and delivery proof, or missing evidence.
- 盘口/趋势: price/volume/relative strength, with source/date.
- 风险与失效条件: what would make the thesis wrong.
- 需要继续盯: next data points.
```

Close with a source list and research-only disclaimer.

## Confidence Labels

- `高`: primary current sources cover business, financials, catalyst, and market confirmation.
- `中`: major facts are sourced, but one important area has weaker or older data.
- `低`: thesis relies on secondary sources, missing financial/delivery proof, or catalyst timing is unclear.
- `不可判定`: identity or core data cannot be verified.
