#!/usr/bin/env python3
"""Validate a 2-3 file AGIOne Explore comparison set."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


POSITIONS = {"product-anchor", "product-stretch", "frontier"}
AXES = {"composition", "visual-language", "interaction", "density", "content-chrome"}
FORBIDDEN_PRODUCTION_DELTAS = {
    "accessibility",
    "business-fields",
    "business-truth",
    "business-units",
    "business-values",
    "contrast",
    "customer-semantics",
    "destructive-action-safety",
    "focus-visibility",
    "i18n",
    "keyboard-access",
    "light-dark",
    "logo-integrity",
    "permissions",
    "runtime",
    "states",
    "validation",
    "vue-syntax",
}
LEGACY_PRODUCTION_DELTAS = {"component-substitution"}
REVIEW_STATES = {"pending", "presented", "approved"}
REQUIRED_FIELDS = (
    "variant",
    "design-position",
    "explore-axis",
    "approach",
    "focal-point",
    "reading-order",
    "visual-language",
    "interaction-model",
    "component-strategy",
    "tradeoff",
    "production-deltas",
    "visual-review",
)
SIGNATURE_FIELDS = (
    "focal-point",
    "reading-order",
    "component-strategy",
    "visual-language",
    "interaction-model",
)


@dataclass
class Variant:
    path: Path
    fields: dict[str, str]
    components: set[str]


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def split_values(value: str) -> set[str]:
    return {item.strip() for item in re.split(r"[,+]", value) if item.strip()}


def extract_notes(text: str) -> dict[str, str]:
    match = re.search(r"<!--AI-NOTES\s*(.*?)\s*AI-NOTES-->", text[:12000], flags=re.S)
    if not match:
        return {}
    fields: dict[str, str] = {}
    for line in match.group(1).splitlines():
        field = re.match(r"^([a-z][a-z0-9-]*):\s*(.*?)\s*$", line)
        if field:
            fields[field.group(1)] = field.group(2)
    return fields


def extract_main(text: str) -> str:
    match = re.search(r"<main\b[^>]*>(.*?)</main>", text, flags=re.S | re.I)
    return match.group(1) if match else ""


def extract_components(text: str) -> set[str]:
    main = extract_main(text)
    components = set(re.findall(r'data-component="([^"]+)"', main))
    components.update(f"tag:{name}" for name in re.findall(r"<([A-Z][A-Za-z0-9]+)\b", main))
    return components


def parse_variant(path: Path, issues: list[str]) -> Variant:
    text = path.read_text(encoding="utf-8")
    main = extract_main(text)
    if 'class="stage-wrap"' in main or "t.stageTitle" in main:
        issues.append(f"{path.name}: shared shell placeholder remains in <main>")
    fields = extract_notes(text)
    if not fields:
        issues.append(f"{path.name}: missing <!--AI-NOTES--> block in the first 12k characters")
        return Variant(path, {}, extract_components(text))

    if "anchor-exceptions" in fields:
        issues.append(f"{path.name}: replace legacy anchor-exceptions with production-deltas")

    for key in REQUIRED_FIELDS:
        value = fields.get(key, "").strip()
        if not value:
            issues.append(f"{path.name}: missing field {key}")
        elif value.upper() == "TODO":
            issues.append(f"{path.name}: unresolved TODO in {key}")

    position = fields.get("design-position", "")
    if position and position not in POSITIONS:
        issues.append(f"{path.name}: unknown design-position {position!r}")

    component_strategy = normalize(fields.get("component-strategy", ""))
    if position == "product-anchor" and not {"shared", "agione"}.issubset(
        set(component_strategy.split())
    ):
        issues.append(
            f"{path.name}: product-anchor component-strategy must describe shared AGIOne components"
        )

    axes = split_values(fields.get("explore-axis", ""))
    invalid_axes = axes - AXES
    if invalid_axes:
        issues.append(f"{path.name}: unknown explore-axis values {sorted(invalid_axes)}")
    if len(axes) > 2:
        issues.append(f"{path.name}: use one primary and at most one secondary explore axis")

    deltas = split_values(fields.get("production-deltas", ""))
    invalid_delta_format = sorted(
        delta for delta in deltas if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", delta)
    )
    if invalid_delta_format:
        issues.append(f"{path.name}: production-deltas must use comma-separated kebab-case values: {invalid_delta_format}")
    if "none" in deltas and len(deltas) > 1:
        issues.append(f"{path.name}: production-deltas cannot combine none with material deltas")

    if position == "product-anchor":
        if deltas != {"none"}:
            issues.append(f"{path.name}: product-anchor must use production-deltas: none")
    elif position in {"product-stretch", "frontier"}:
        if not deltas or deltas == {"none"}:
            issues.append(f"{path.name}: {position} must record at least one material production delta")

    legacy_deltas = deltas & LEGACY_PRODUCTION_DELTAS
    if legacy_deltas:
        issues.append(
            f"{path.name}: legacy permission-style production delta {sorted(legacy_deltas)}; "
            "describe the actual component model instead"
        )
    forbidden_deltas = sorted(deltas & FORBIDDEN_PRODUCTION_DELTAS)
    if forbidden_deltas:
        issues.append(f"{path.name}: Core requirements cannot become production deltas {forbidden_deltas}")

    review = fields.get("visual-review", "")
    if review and review not in REVIEW_STATES:
        issues.append(f"{path.name}: visual-review must be pending, presented, or approved")

    components = extract_components(text)
    if not components:
        issues.append(f"{path.name}: <main> needs data-component boundaries or shared component tags")
    return Variant(path, fields, components)


def run_gate(command: list[str]) -> tuple[int, str]:
    result = subprocess.run(command, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    return result.returncode, result.stdout.strip()


def jaccard(left: set[str], right: set[str]) -> float:
    union = left | right
    return len(left & right) / len(union) if union else 0.0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--require-visual-review", action="store_true")
    parser.add_argument("files", nargs="+")
    args = parser.parse_args()

    if not 2 <= len(args.files) <= 3:
        parser.error("Explore comparison requires 2-3 HTML files")

    paths = [Path(item).expanduser().resolve() for item in args.files]
    missing = [path for path in paths if not path.is_file()]
    if missing:
        for path in missing:
            print(f"❌ 文件不存在: {path}", file=sys.stderr)
        return 2

    script_dir = Path(__file__).resolve().parent
    issues: list[str] = []
    variants = [parse_variant(path, issues) for path in paths]

    print("────────────────────────────────────────────────────")
    print(f"Explore Comparison Check · {len(variants)} variants")
    print("────────────────────────────────────────────────────")

    variant_numbers: list[tuple[int, int]] = []
    for variant in variants:
        raw = variant.fields.get("variant", "")
        match = re.fullmatch(r"(\d+)\s+of\s+(\d+)", raw)
        if not match:
            issues.append(f"{variant.path.name}: variant must use '<index> of <count>'")
            continue
        variant_numbers.append((int(match.group(1)), int(match.group(2))))

    if variant_numbers:
        expected = len(variants)
        if {total for _, total in variant_numbers} != {expected}:
            issues.append(f"variant totals must all equal the {expected}-file comparison set")
        if {index for index, _ in variant_numbers} != set(range(1, expected + 1)):
            issues.append("variant indices must be unique and cover 1..N")

    anchors = [variant for variant in variants if variant.fields.get("design-position") == "product-anchor"]
    if len(anchors) != 1:
        issues.append(f"comparison set must contain exactly one product-anchor; found {len(anchors)}")

    print("\n── Position-aware mechanical gates ──")
    for variant in variants:
        position = variant.fields.get("design-position", "unknown")
        gate = "check-product-anchor.sh" if position == "product-anchor" else "check-prototype.sh"
        code, output = run_gate(["bash", str(script_dir / gate), str(variant.path)])
        if code == 0:
            print(f"  ✅ {variant.path.name}: {position} gate passed")
        else:
            print(f"  ❌ {variant.path.name}: {position} gate failed")
            for line in output.splitlines():
                print(f"     {line}")
            issues.append(f"{variant.path.name}: {gate} failed")

    print("\n── Comparison signatures ──")
    for index, left in enumerate(variants):
        for right in variants[index + 1 :]:
            differences = [
                field
                for field in SIGNATURE_FIELDS
                if normalize(left.fields.get(field, "")) != normalize(right.fields.get(field, ""))
            ]
            similarity = jaccard(left.components, right.components)
            print(
                f"  {left.path.name} vs {right.path.name}: "
                f"signature differences={len(differences)} ({', '.join(differences) or 'none'}), "
                f"component Jaccard={similarity:.2f}"
            )
            pair_axes = split_values(left.fields.get("explore-axis", "")) | split_values(
                right.fields.get("explore-axis", "")
            )
            required_differences = 1 if pair_axes == {"visual-language"} else 2
            if len(differences) < required_differences:
                issues.append(
                    f"{left.path.name} vs {right.path.name}: fewer than {required_differences} "
                    "meaningful signature difference(s) for the declared axes"
                )
            if similarity > 0.90:
                print("    ℹ️  DOM/component structure is very similar; this is valid only when the visible axis justifies it")

    pending = [variant.path.name for variant in variants if variant.fields.get("visual-review") == "pending"]
    if args.require_visual_review and pending:
        issues.append(f"visual review is still pending for: {', '.join(pending)}")

    print("\n────────────────────────────────────────────────────")
    if issues:
        print(f"❌ {len(issues)} issue(s)")
        for issue in issues:
            print(f"  - {issue}")
        return 1

    print("✅ MECHANICAL_PASS")
    if pending:
        print(f"⚠️  VISUAL_REVIEW_REQUIRED: {', '.join(pending)}")
    else:
        print("✅ VISUAL_REVIEW_RECORDED")
    print("Component choice is free outside Product Anchor; similarity remains evidence only.")
    print("Inspect equal-condition renders before claiming diversity.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
