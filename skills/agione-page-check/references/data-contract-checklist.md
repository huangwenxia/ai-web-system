# Data Contract Checklist

Use this checklist when displayed values, filters, totals, chart points, field names, or status semantics may disagree with the backend or business requirement.

## Trace The Real Consumer Path

Follow only as far as needed to resolve the question:

1. Page component and formatter.
2. Generated frontend API type and request wrapper.
3. Actual browser request and response.
4. Backend controller and VO/DTO.
5. Service and mapper/SQL for derived or ambiguous values.
6. Read-only database evidence only when API/source evidence cannot explain the contradiction.

Do not patch labels or formatters before confirming which layer owns the mismatch.

## Field Semantics

For important fields, verify:

- The backend field actually used by the page.
- Customer-facing label and terminology.
- Unit, currency, precision, sign, and scaling.
- Time meaning: created, activity, completed, payout, billing, or settlement time.
- Cycle meaning: calendar month, billing cycle, settlement cycle, or activity period.
- Status meaning and whether another field is the real discriminator.
- Name/slug versus internal ID display.
- Whether values are live, estimated, pending, settled, cumulative, or filtered.

## Filters And Aggregates

- A filter affects only the metrics and rows that belong to its scope.
- Default parameters do not silently change business meaning.
- Reset restores the documented default, not stale SPA state.
- Missing date buckets are represented as zero when continuity is part of the API contract.
- Overview, trend, table, and detail totals reconcile within documented rounding rules.
- Pagination uses the current page and total from the real response.
- Export follows the same active filters or clearly documents a different scope.

## Null, Zero, Empty, And Missing

Keep these states distinct:

| Source state | Typical display decision |
| --- | --- |
| Numeric zero | Show `0` with the expected unit/precision |
| Empty list | Show a deliberate empty state |
| Missing/unknown field | Show `-`, `Unknown`, or omit according to product semantics |
| Pending value | Show neutral loading/pending state |
| Failed request | Show error/retry state; do not reuse empty state |

Do not invent zero for unknown business data unless the contract explicitly defines it that way.

## Real Data Versus Mock Data

- Use mock/interception only to expose a state or extreme-value layout that live data cannot reach safely.
- Record exactly which request and fields were mocked.
- Never write mock values into production source.
- Disable interception, reload, and verify the real response before making backend-truth claims.
- If temporary SPA state may survive, open a clean tab/context or force a full reload.

## Database Boundary

- Page checking is read-only by default.
- Query the database only for Deep checks or unresolved data contradictions.
- Confirm the environment and schema before any query.
- Prefer minimal read-only queries tied to the displayed tenant/account/time window.
- Do not use a read replica or mirror result as proof of production state without saying so.

## Finding Severity

- `P0`: wrong-tenant exposure, unauthorized data/action, destructive workflow, or materially incorrect financial/resource result.
- `P1`: major workflow blocked, core totals/semantics wrong, persistent loading/error, or important role behavior incorrect.
- `P2`: non-blocking field/copy/layout inconsistency, minor edge case, or incomplete secondary evidence.
