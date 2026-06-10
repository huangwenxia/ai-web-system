---
name: stock-stage-diagnosis
description: Analyze an individual stock's stage, dominant capital behavior, business fundamentals, real problem, and current response. Use when the user asks about a stock's recent process, whether main funds are testing pressure or distributing, whether company business has problems, what truly changed, or how to handle the current position.
---

# Stock Stage Diagnosis

## Core Rule

Diagnose the stock as a staged process, not as a one-day candle. Separate verified facts, market-behavior inference, business fundamentals, and response planning.

Always verify live or latest data when the user asks about "today", "latest", "recent", current price action, fresh announcements, current leadership/holdings, or any time-sensitive market fact. Cite sources. Do not claim to know the exact hidden operator, dealer, or market maker; describe observable capital types such as super-large orders, large orders, institutions, hot-money seats, quants, financing funds, and retail.

## Data To Collect

Collect only what the task needs, but prefer this minimum set:

- Current or latest price, open/high/low/close, turnover, volume, amplitude, and relative strength versus major indices and sector.
- Daily K-line across at least 3-6 months, longer if the move started earlier.
- Intraday K-line when diagnosing today's behavior.
- Money flow by super-large, large, medium, and small orders; treat this as directional evidence, not proof by itself.
- Dragon Tiger List / institutional seat data when triggered by abnormal moves.
- Recent earnings, margin, revenue, profit, cash flow, expenses, order/customer progress, and company announcements.
- Shareholder count, top holders, lockups/unlocks, financing balance, and A/H or cross-market behavior when relevant.

## Stage Framework

Classify the stock into one or more sequential stages:

- **Narrative build-up**: price rises from a base, turnover expands moderately, business story or sector logic becomes visible, but not yet euphoric.
- **Acceleration / mark-up**: large candles, limit-up or near-limit moves, high turnover, super-large inflow, sector hype, and rapid valuation expansion.
- **Distribution / profit-taking**: high volume, long upper shadows, failed rebounds, large/super-large net outflow, small-order net inflow, and repeated "looks like it may start" traps.
- **Markdown / de-rating**: key support breaks, weak relative strength versus the market, rebounds fail below prior pressure, and liquidity is used to sell.
- **Box / T-trading inventory management**: repeated rallies into pressure and drops into support; capital rotates inventory but does not commit to a new trend.
- **Base repair / re-accumulation**: volume contracts after selling pressure fades, supports hold repeatedly, large money stops net outflowing, and the stock reclaims pressure levels.

Use absolute dates and price zones. Avoid vague wording like "recently fell a lot" when exact ranges are available.

## Dominant Process

For each stage, answer:

- **Who is likely dominant**: institutions, hot money, theme funds, quants, financing funds, retail, insiders/major shareholders only if disclosed.
- **What they are doing**: marking up, testing pressure, distributing, lowering cost through T-trading, suppressing price to test support, or re-accumulating.
- **Why it is likely**: cite price behavior, turnover, money-flow structure, Dragon Tiger List, shareholder change, or announcement timing.

When the user asks who is operating the stock, translate it into "which observable capital group is driving price direction". Never invent a named operator.

## Business Diagnosis

Judge whether the company business is actually broken or whether the market is repricing expectations:

- **No obvious business break**: revenue/profit still grow, core orders progress, and the selloff is mainly valuation or theme cooling.
- **Execution lag**: revenue grows but profit/margin lags; market waits for orders, capacity, or customer validation to turn into profit.
- **Margin pressure**: raw materials, product mix, price transmission, fees, exchange losses, or competition hurt profitability.
- **Narrative premium reversal**: the stock rose on future expectations faster than earnings could confirm.
- **Structural impairment**: core demand, customer, technology, governance, debt, cash flow, or legal issues materially deteriorate.

State the business conclusion separately from the stock conclusion. A good company can still have a bad stock stage.

## "Real Problem" Test

After listing facts, compress the diagnosis into the true contradiction:

- Was the stock too expensive for current earnings?
- Did the narrative outrun order/profit verification?
- Are large funds leaving while retail absorbs supply?
- Is margin/cash flow weaker than revenue growth suggests?
- Is the shareholder structure too dispersed to support price?
- Is the sector no longer rewarding the same theme?

Prefer one main contradiction and two secondary risks.

## Output Format

Use this structure unless the user asks for a different shape:

1. **Current Verdict**: one sentence, e.g. "This is not a restart yet; it is pressure testing after distribution."
2. **Hard Facts**: date, price zone, index/sector comparison, turnover, key money-flow data.
3. **Stage Diagnosis**: split by dates and price zones.
4. **Dominant Capital Process**: who is likely driving each stage and their likely purpose.
5. **Business Check**: whether core business has a problem, and what the actual financial/operating issue is.
6. **Real Problem**: the real contradiction behind the move.
7. **Current Response**: separate guidance for empty position, light position, and heavy position; include invalidation levels and what would prove improvement.
8. **Confidence / Watchlist**: what data would change the view.

Keep language direct and practical. The goal is to help the user stop reacting emotionally and see the stock's process.

## Risk Boundaries

Do not present financial advice as certainty. Do not say "buy", "sell", or "must" without framing it as risk management. Use phrases like "more suitable to wait", "the risk line is", "this would confirm improvement", or "this would invalidate the repair".

Do not over-weight a one-day red or green candle. Confirm with location, volume, relative strength, and money-flow structure.

## Reference Case

When the user asks for a similar "what happened to this stock" diagnosis, optionally read `references/wall-nuclear-materials-case.md` for a worked A-share/H-share example of a theme-driven mark-up followed by valuation de-rating and distribution.
