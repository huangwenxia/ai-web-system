# Goal Mode — port the impl to 1:1 with the prototype (AI agent runbook)

You are running an autonomous fidelity loop. **Goal:** make the running impl match the static
prototype, then stop. Every round you get an objective signal — you are NOT guessing.

The comparator (`compare.mjs`) screenshots both sides and emits, per page, into `report/`:

- **`shots/<page>-sidebyside.png`** — proto ｜ impl, real UI. **You can view images — OPEN this and compare by eye.** This is your primary signal.
- **`shots/<page>-diff.png`** — pixel diff of masked shots; colored = real difference, 🟣 magenta = masked dynamic data (ignore).
- **`shots/<page>-proto.png` / `-impl.png`** — full-res singles for fine detail (the side-by-side is downscaled).
- **`fidelity-report.md`** — mismatch % (gate) + **style deltas** (exact computed-style/geometry targets).

---

## One-time setup

```bash
cd tools/fidelity && pnpm install && npx playwright install chromium
# serve the prototypes (separate terminal; point at the FO prototype html dir):
cd <…>/REQ-20260515-173706-ww-finance-optimization/prototypes/html && python3 -m http.server 8088
# impl dev server must be up on :8030  (pnpm dev --filter=financial)
node capture-auth.mjs    # opens a browser; log in; press ENTER (re-run when token expires)
```

Confirm the URLs/selectors in `targets.json` match your prototype filenames and impl routes.

---

## The loop (repeat until the stop condition)

1. **Measure:** `node compare.mjs <page>` (e.g. `eu-overview`). Whole set: `node compare.mjs`.
2. **Look:** open `report/shots/<page>-sidebyside.png`. Scan left (proto) vs right (impl) for
   anything off — spacing, font size/weight, color, alignment, a missing/extra element, wrong
   order. Cross-check `report/fidelity-report.md`: highest mismatch % / most style deltas /
   ⚠ height mismatch (= a whole section wrong) is where to start.
3. **Fix in the Vue impl only.** Two complementary signals:
   - **Visual** (side-by-side) tells you *what looks wrong*.
   - **Style deltas** give the *exact value*, e.g. `` heroBalanceNum: fontSize: proto=`52px` impl=`40px` `` →
     `grep -rn "ex-v3-hero__amount-num" apps/financial/src`, open that `.vue`, set it to the **proto** value.
   Make the smallest edit that closes the gap. Don't invent values — take them from the delta / proto.
4. **Re-measure that one page.** Confirm deltas dropped, % dropped, and the side-by-side now matches.
5. Repeat.

### Stop condition (success)
For every page, the **hard gate** is: **style deltas empty** AND **no ⚠ height mismatch** AND
the side-by-side looks the same to you. **mismatch % < 2.0% is a reference signal, NOT a hard gate** —
if % stays high but deltas are 0, classify the residual first (see `references/troubleshooting.md` §8):
- *true-data / locale residual* (real backend labels ≠ mock labels; wrong language/theme state) → acceptable / fix the test state, don't chase the %.
- *true style regression* (deltas non-zero, or visible structure diff in side-by-side) → fix it.
Then stop and summarize what you changed. **Never fake data to push the % down.**

If a round yields **no improvement twice in a row**, STOP and append a note to
`fidelity-report.md` listing what's left and why (e.g. "residual 3% is the ECharts canvas vs the
prototype's SVG — mask it or escalate"). **Never loop forever or game the %.**

---

## Reading the signals — DO / DON'T

- ✅ **Side-by-side image first.** You have vision — use it. It catches things no metric does
  (a slightly wrong gradient, a misaligned icon).
- ✅ **Style deltas are exact.** They compare style/geometry (not text) so they're immune to live
  data. Fix every one to the proto value.
- ✅ **⚠ Height mismatch** = a section is missing / extra / mis-sized. Fix structure, not just styles.
- 🟣 **Magenta in the diff = masked dynamic data (numbers, dates, charts, lists). IGNORE.**
- ⚠ **Don't chase the last fraction of a %.** Static HTML vs Vue is never literally pixel-identical
  (font hinting, sub-pixel AA, ECharts vs hand-rolled SVG). < 2% after masks + a matching
  side-by-side = faithful. If the residual is all inside a chart/canvas, mask it and move on.

---

## Hard rules (do not violate)

- **Edit only `apps/financial/src/**`.** Never touch the prototype HTML, `package.json`,
  `node_modules`, lockfiles, or any dependency. (A red Vite overlay about `mamba-layout/theme.css`
  is a stale-dep issue, NOT your code — restart the dev server, don't "fix" it in code.)
- **Additive on shared assets.** Shared i18n keys / shared components serve other pages too —
  add, don't repurpose or delete, unless you've confirmed the only consumer.
- **One page at a time**, smallest viable edit, re-measure before moving on.
- **Spec beats prototype on copy.** `frontend-development-guide-v1.md` wins (no
  GNOSIS/WANMORE/OPERATOR_FEE/VOID/晚到顺延; source systems = MODELONE/POWERONE/FINANCIAL).
  The prototype is the *visual* target, not the source of business wording.

## Extending coverage

Add objects to `targets.json`. Per page:
- `proto.url` / `impl.url` + a `waitFor` selector that proves the page rendered.
- `mask`: selectors for **dynamic-data regions** (numbers, dates, charts, lists) — blacked out on
  both sides so the % measures layout/style, not live values. Proto and impl share class names
  (impl was ported from the prototype), so one list usually works for both; use `proto.mask` /
  `impl.mask` for per-side extras.
- `probe`: `{ alias: selector }` for key structural elements you want exact style parity on.
