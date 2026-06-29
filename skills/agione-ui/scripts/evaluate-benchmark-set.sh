#!/bin/bash
# Evaluate every generated AGIOne benchmark prototype in a directory.
#
# Usage:
#   bash scripts/evaluate-benchmark-set.sh /tmp/agione-ui-benchmark
#   bash scripts/evaluate-benchmark-set.sh /tmp/agione-ui-benchmark --write-baseline benchmarks/baseline.json
#   bash scripts/evaluate-benchmark-set.sh /tmp/agione-ui-benchmark --baseline benchmarks/baseline.json

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EVAL_SCRIPT="$SCRIPT_DIR/evaluate-prototype.py"
PROMPT_DIR="$SCRIPT_DIR/../benchmarks/prompts"
DIR=""
BASELINE=""
WRITE_BASELINE=""

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --baseline)
      BASELINE="${2:-}"
      shift 2
      ;;
    --write-baseline)
      WRITE_BASELINE="${2:-}"
      shift 2
      ;;
    --prompt-dir)
      PROMPT_DIR="${2:-}"
      shift 2
      ;;
    -*)
      echo "ERROR: unknown option: $1" >&2
      exit 2
      ;;
    *)
      if [[ -n "$DIR" ]]; then
        echo "ERROR: only one benchmark output directory is supported" >&2
        exit 2
      fi
      DIR="$1"
      shift
      ;;
  esac
done

if [[ -z "$DIR" ]]; then
  echo "Usage: bash $0 <directory-containing-html> [--baseline file.json] [--write-baseline file.json] [--prompt-dir dir]" >&2
  exit 2
fi

if [[ ! -d "$DIR" ]]; then
  echo "ERROR: directory does not exist: $DIR" >&2
  exit 2
fi

if [[ ! -f "$EVAL_SCRIPT" ]]; then
  echo "ERROR: missing evaluator: $EVAL_SCRIPT" >&2
  exit 2
fi
if [[ -n "$BASELINE" && ! -f "$BASELINE" ]]; then
  echo "ERROR: baseline file does not exist: $BASELINE" >&2
  exit 2
fi

FILES=()
while IFS= read -r file; do
  FILES+=("$file")
done < <(find "$DIR" -maxdepth 1 -type f -name '*.html' | sort)

if [[ "${#FILES[@]}" -eq 0 ]]; then
  echo "ERROR: no .html files found in $DIR" >&2
  exit 2
fi

PASS=0
FAIL=0
BASELINE_STATUS=0
REPORT_DIR=""

if [[ -n "$BASELINE" || -n "$WRITE_BASELINE" ]]; then
  REPORT_DIR="$(mktemp -d /tmp/agione-ui-benchmark-report.XXXXXX)"
fi

echo "============================================================"
echo "AGIOne Benchmark Evaluation · $DIR"
echo "============================================================"

for file in "${FILES[@]}"; do
  base="$(basename "$file" .html)"
  prompt="$PROMPT_DIR/$base.md"
  PROMPT_ARGS=()
  if [[ -f "$prompt" ]]; then
    PROMPT_ARGS=(--prompt "$prompt")
  fi

  echo
  echo ">>> $(basename "$file")"
  if python3 "$EVAL_SCRIPT" "${PROMPT_ARGS[@]}" "$file"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
  fi

  if [[ -n "$REPORT_DIR" ]]; then
    python3 "$EVAL_SCRIPT" --json "${PROMPT_ARGS[@]}" "$file" > "$REPORT_DIR/$base.json" || true
  fi
done

if [[ -n "$WRITE_BASELINE" ]]; then
  mkdir -p "$(dirname "$WRITE_BASELINE")"
  python3 - "$REPORT_DIR" "$WRITE_BASELINE" <<'PY'
import json
import sys
from pathlib import Path

report_dir = Path(sys.argv[1])
out_path = Path(sys.argv[2])
baseline = {}
for report_path in sorted(report_dir.glob("*.json")):
    report = json.loads(report_path.read_text(encoding="utf-8"))
    name = Path(report["file"]).name
    baseline[name] = {
        "passed": report["passed"],
        "failures": sorted(item["code"] for item in report["failures"]),
        "warnings": sorted(item["code"] for item in report["warnings"]),
    }
out_path.write_text(json.dumps(baseline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote baseline: {out_path}")
PY
fi

if [[ -n "$BASELINE" ]]; then
  if ! python3 - "$REPORT_DIR" "$BASELINE" <<'PY'
import json
import sys
from pathlib import Path

report_dir = Path(sys.argv[1])
baseline_path = Path(sys.argv[2])
baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
current = {}
for report_path in sorted(report_dir.glob("*.json")):
    report = json.loads(report_path.read_text(encoding="utf-8"))
    name = Path(report["file"]).name
    current[name] = {
        "passed": report["passed"],
        "failures": sorted(item["code"] for item in report["failures"]),
        "warnings": sorted(item["code"] for item in report["warnings"]),
    }

regressions = []
for name, cur in current.items():
    old = baseline.get(name)
    if old is None:
        regressions.append(f"{name}: not present in baseline")
        continue
    for kind in ("failures", "warnings"):
        added = sorted(set(cur[kind]) - set(old.get(kind, [])))
        if added:
            regressions.append(f"{name}: new {kind}: {', '.join(added)}")
    if old.get("passed") is True and cur.get("passed") is False:
        regressions.append(f"{name}: result regressed PASS -> FAIL")

for name in sorted(set(baseline) - set(current)):
    regressions.append(f"{name}: missing from current run")

if regressions:
    print("Baseline diff: FAIL")
    for item in regressions:
        print(f"  - {item}")
    raise SystemExit(1)

print("Baseline diff: PASS")
PY
  then
    BASELINE_STATUS=1
  fi
fi

if [[ -n "$REPORT_DIR" ]]; then
  rm -rf "$REPORT_DIR"
fi

echo
echo "============================================================"
echo "Benchmark summary: $PASS pass / $FAIL fail / ${#FILES[@]} total"
echo "============================================================"

[[ "$FAIL" -eq 0 && "$BASELINE_STATUS" -eq 0 ]] && exit 0 || exit 1
