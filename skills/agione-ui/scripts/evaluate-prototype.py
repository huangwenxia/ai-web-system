#!/usr/bin/env python3
"""
AGIOne prototype evaluation entrypoint.

This script is intentionally stricter than quality-audit.py:
- check-prototype.sh remains the base hard gate.
- This layer catches recurrent structure mistakes that are cheap to detect.
- Semantic/product correctness is emitted as a short business review checklist.

Usage:
  python3 scripts/evaluate-prototype.py <prototype.html>
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Finding:
    code: str
    message: str
    evidence: list[str] = field(default_factory=list)


def strip_comments_keep_lines(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        return "\n" * match.group(0).count("\n")

    text = re.sub(r"<!--.*?-->", repl, text, flags=re.S)
    text = re.sub(r"/\*.*?\*/", repl, text, flags=re.S)
    return text


def extract_main(text: str) -> tuple[str, int]:
    match = re.search(r"<main\b[^>]*>(.*?)</main>", text, flags=re.I | re.S)
    if not match:
        return "", 0
    start_line = text.count("\n", 0, match.start(1)) + 1
    return match.group(1), start_line


def line_hits(
    pattern: str,
    text: str,
    original: str,
    *,
    flags: int = 0,
    limit: int = 5,
    line_offset: int = 0,
) -> list[str]:
    original_lines = original.splitlines()
    hits: list[str] = []
    seen_lines: set[int] = set()
    for match in re.finditer(pattern, text, flags):
        line_no = text.count("\n", 0, match.start()) + 1 + line_offset
        if line_no in seen_lines:
            continue
        seen_lines.add(line_no)
        excerpt = original_lines[line_no - 1].strip() if 0 < line_no <= len(original_lines) else ""
        hits.append(f"L{line_no}: {excerpt[:180]}")
        if len(hits) >= limit:
            break
    return hits


def run_base_gate(path: Path, script_dir: Path) -> tuple[bool, str]:
    check_script = script_dir / "check-prototype.sh"
    if not check_script.exists():
        return False, f"Missing base gate: {check_script}"

    proc = subprocess.run(
        ["bash", str(check_script), str(path)],
        cwd=str(script_dir.parent),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    return proc.returncode == 0, proc.stdout.strip()


def evaluate_structure(path: Path) -> tuple[list[Finding], list[Finding]]:
    original = path.read_text(encoding="utf-8")
    text = strip_comments_keep_lines(original)
    main, main_start_line = extract_main(text)
    failures: list[Finding] = []
    warnings: list[Finding] = []

    if not main:
        failures.append(Finding("main.missing", "No <main> region found; shell-sample chrome may be broken."))
        return failures, warnings

    subtitle_hits = line_hits(
        r"\bpageSubtitle\b|class=[\"'][^\"']*\bpage-subtitle\b",
        text,
        original,
        flags=re.I,
    )
    if subtitle_hits:
        failures.append(
            Finding(
                "subtitle.remnant",
                "Custom page subtitle remnants found. check-prototype.sh owns component subtitle= checks; this catches pageSubtitle/page-subtitle drift.",
                subtitle_hits,
            )
        )

    custom_scenario_hits = line_hits(
        r"\b(scenario-bar|scenario-switcher|demo-switcher|mode-tabs|mode-switcher|state-tabs|review-mode-bar)\b",
        text,
        original,
        flags=re.I,
    )
    if custom_scenario_hits:
        failures.append(
            Finding(
                "scenario.custom-ui",
                "Custom scenario UI found. Use shell-sample Scenario Switcher; do not add a switcher in sidebar/main/page header.",
                custom_scenario_hits,
            )
        )

    kpi_count = len(re.findall(r"<\s*KpiCard\b", main))
    if kpi_count >= 4:
        failures.append(
            Finding(
                "kpi.too-many",
                f"Found {kpi_count} KpiCard usages in <main>. Normal overview pages allow 2-3; use MetricsStrip/KvCard/table for >=4. Dashboard .ds-stat-card is the exception.",
                line_hits(r"<\s*KpiCard\b", main, original, flags=re.I, line_offset=main_start_line - 1),
            )
        )

    nested_card_hits = line_hits(
        r"<\s*CardBox\b(?:(?!</\s*CardBox>).){0,6000}<\s*(CardBox|KpiCard|FilterBox)\b",
        main,
        original,
        flags=re.I | re.S,
        line_offset=main_start_line - 1,
    )
    if nested_card_hits:
        failures.append(
            Finding(
                "cardbox.nested",
                "CardBox wraps another card-like component. Do not wrap FilterBox/KpiCard/CardBox inside CardBox.",
                nested_card_hits,
            )
        )

    filter_card_hits = line_hits(
        r"class=[\"'][^\"']*(filter-card|search-card|toolbar-card|query-card)[^\"']*[\"']",
        main,
        original,
        flags=re.I,
        line_offset=main_start_line - 1,
    )
    if filter_card_hits:
        warnings.append(
            Finding(
                "filter.card-wrapper",
                "Filter/search wrapper card-like class found. Verify FilterBox is not visually wrapped by a second card/border.",
                filter_card_hits,
            )
        )

    raw_radio_hits = line_hits(
        r"<\s*el-radio(?:\s|>|/)",
        main,
        original,
        flags=re.I,
        line_offset=main_start_line - 1,
    )
    if raw_radio_hits:
        failures.append(
            Finding(
                "radio.raw-el-radio",
                "Raw <el-radio> found. Use the agione-ui radio variants instead of Element Plus default radio.",
                raw_radio_hits,
            )
        )

    if re.search(r"\brule-gap\s*:", original):
        warnings.append(
            Finding(
                "rule-gap.present",
                "AI-NOTES contains rule-gap. Owner should decide whether to codify the exception or reject the prototype.",
                line_hits(r"\brule-gap\s*:", original, original),
            )
        )

    placeholder_hits = line_hits(
        r"\b(TODO|lorem ipsum|placeholder)\b|占位",
        main,
        original,
        flags=re.I,
        limit=3,
        line_offset=main_start_line - 1,
    )
    if placeholder_hits:
        warnings.append(
            Finding(
                "content.placeholder",
                "Placeholder content found in <main>. Accept only when the benchmark/request explicitly permits placeholders.",
                placeholder_hits,
            )
        )

    grid4_hits = line_hits(
        r"\b(grid-4|repeat\(\s*4\s*,\s*1fr\s*\))",
        main,
        original,
        flags=re.I,
        limit=3,
        line_offset=main_start_line - 1,
    )
    if grid4_hits and ".ds-stat-card" not in main and "ds-stats-row" not in main:
        warnings.append(
            Finding(
                "layout.grid4",
                "4-column grid found outside dashboard stat-card usage. Check whether this is KPI walling.",
                grid4_hits,
            )
        )

    return failures, warnings


def extract_prompt_review_items(prompt_path: Path | None) -> list[str]:
    if not prompt_path or not prompt_path.exists():
        return []

    text = prompt_path.read_text(encoding="utf-8")
    items: list[str] = []
    current_heading = ""
    capture = False
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        heading = line.rstrip(":：")
        if heading in {"必须覆盖的 mock 数据", "验收重点"}:
            current_heading = heading
            capture = True
            continue
        if capture and re.match(r"^#+\s+", line):
            capture = False
            current_heading = ""
            continue
        if capture and line.startswith("-"):
            item = line.lstrip("-").strip()
            if item:
                items.append(f"{current_heading}: {item}")
    return items


def print_findings(title: str, findings: list[Finding]) -> None:
    if not findings:
        print(f"{title}: none")
        return
    print(f"{title}:")
    for finding in findings:
        print(f"  - {finding.code}: {finding.message}")
        for item in finding.evidence:
            print(f"      {item}")


def print_business_checklist(prompt_items: list[str]) -> None:
    if prompt_items:
        print("Prompt-specific review checklist (from benchmark prompt):")
        for item in prompt_items:
            print(f"  [ ] {item}")
        return

    print("Business review checklist (human only, no visual taste required):")
    for item in [
        "Menu/page names match the requested role and workflow.",
        "Table/form/detail fields match the source requirement; no invented business fields.",
        "Primary actions, destructive actions, and disabled states match the workflow.",
        "Status labels/badges represent real business states and use the expected severity.",
        "Scenario states cover required review cases: normal, empty, loading, error/risk, permission/edge case when applicable.",
        "Mock numbers, units, dates, and currency are plausible for the domain.",
    ]:
        print(f"  [ ] {item}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate an AGIOne prototype HTML file.")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON summary.")
    parser.add_argument("--prompt", help="Optional benchmark prompt markdown; prints prompt-specific review checklist.")
    parser.add_argument("prototype", help="Path to prototype HTML")
    args = parser.parse_args()

    path = Path(args.prototype).expanduser().resolve()
    prompt_path = Path(args.prompt).expanduser().resolve() if args.prompt else None
    script_dir = Path(__file__).resolve().parent

    if not path.exists():
        print(f"ERROR: file does not exist: {path}", file=sys.stderr)
        return 2
    if path.suffix.lower() != ".html":
        print(f"ERROR: expected .html file: {path}", file=sys.stderr)
        return 2

    base_ok, base_output = run_base_gate(path, script_dir)
    failures, warnings = evaluate_structure(path)
    prompt_items = extract_prompt_review_items(prompt_path)
    passed = base_ok and not failures

    if args.json:
        import json

        print(
            json.dumps(
                {
                    "file": str(path),
                    "prompt": str(prompt_path) if prompt_path else None,
                    "base_ok": base_ok,
                    "passed": passed,
                    "failures": [finding.__dict__ for finding in failures],
                    "warnings": [finding.__dict__ for finding in warnings],
                    "prompt_review_items": prompt_items,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0 if passed else 1

    print("============================================================")
    print(f"AGIOne Prototype Evaluation · {path.name}")
    print("============================================================")
    print(f"Base gate: {'PASS' if base_ok else 'FAIL'}")
    if base_output:
        print(base_output)
    print("------------------------------------------------------------")
    print_findings("Hard failures", failures)
    print_findings("Warnings", warnings)
    print("------------------------------------------------------------")
    print_business_checklist(prompt_items)
    print("============================================================")

    print(f"RESULT: {'PASS' if passed else 'FAIL'}")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
