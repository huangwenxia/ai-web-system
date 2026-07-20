#!/usr/bin/env python3
"""Create 2-3 position-aware Explore variants from the AGIOne shell."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


EDIT_REGIONS = (
    "TITLE",
    "THEME_VARS",
    "I18N",
    "SIDEBAR",
    "MAIN",
    "SETUP_DATA",
    "SETUP_RETURN",
)
REQUIRED_ANCHORS = (
    *(f"AGIONE_EDIT_{region}_{edge}" for region in EDIT_REGIONS for edge in ("START", "END")),
    "AGIONE_LOGO_DANGER_START",
    "AGIONE_LOGO_DANGER_END",
)
POSITIONS = ("product-anchor", "product-stretch", "frontier")
DEFAULT_POSITIONS = {
    2: ("product-anchor", "product-stretch"),
    3: ("product-anchor", "product-stretch", "frontier"),
}


def skill_root() -> Path:
    return Path(__file__).resolve().parent.parent


def validate_shell(shell: Path) -> str:
    text = shell.read_text(encoding="utf-8")
    missing = [anchor for anchor in REQUIRED_ANCHORS if anchor not in text]
    if missing:
        raise SystemExit(f"Shell is missing required anchors: {', '.join(missing)}")
    if len(re.findall(r"^const LOGO_(?:DARK|LIGHT)\s*=", text, flags=re.M)) != 2:
        raise SystemExit("Shell must contain exactly two Logo constants")
    return text


def anchor_lines(text: str) -> list[str]:
    wanted = re.compile(r"AGIONE_EDIT_[A-Z_]+_START|AGIONE_LOGO_DANGER_(?:START|END)")
    return [f"{number}:{line.strip()}" for number, line in enumerate(text.splitlines(), 1) if wanted.search(line)]


def parse_positions(raw: str | None, count: int) -> tuple[str, ...]:
    if raw is None:
        return DEFAULT_POSITIONS[count]
    values = tuple(item.strip() for item in raw.split(",") if item.strip())
    if len(values) != count:
        raise SystemExit(f"--positions must contain exactly {count} comma-separated values")
    invalid = [value for value in values if value not in POSITIONS]
    if invalid:
        raise SystemExit(f"Unknown design position(s): {', '.join(invalid)}")
    if values.count("product-anchor") != 1:
        raise SystemExit("The scaffolded comparison set must contain exactly one product-anchor")
    return values


def notes(index: int, count: int, position: str) -> str:
    component_strategy = "shared AGIOne operational components" if position == "product-anchor" else "TODO"
    production_deltas = "none" if position == "product-anchor" else "TODO"
    return f"""<!--AI-NOTES
variant: {index} of {count}
design-position: {position}
explore-axis: TODO
approach: TODO
focal-point: TODO
reading-order: TODO
visual-language: TODO
interaction-model: TODO
component-strategy: {component_strategy}
tradeoff: TODO
production-deltas: {production_deltas}
visual-review: pending
AI-NOTES-->
"""


def write_variant(shell_text: str, output: Path, note: str | None) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text((note or "") + shell_text, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    target = parser.add_mutually_exclusive_group(required=True)
    target.add_argument("--output", type=Path, help="Create one unannotated shell copy")
    target.add_argument("--slug", help="Create Explore variants using this ASCII slug")
    parser.add_argument("--variants", type=int, choices=(2, 3), help="Variant count for --slug")
    parser.add_argument(
        "--positions",
        help="Comma-separated design positions; defaults to anchor/stretch[/frontier]",
    )
    parser.add_argument("--output-dir", type=Path, default=Path.cwd(), help="Directory for --slug outputs")
    parser.add_argument("--force", action="store_true", help="Overwrite existing outputs")
    args = parser.parse_args()

    shell = skill_root() / "agione-console-shell-sample-v1.html"
    if not shell.is_file():
        raise SystemExit(f"Shared shell not found: {shell}")
    shell_text = validate_shell(shell)

    if args.output:
        if args.variants is not None or args.positions is not None:
            parser.error("--variants/--positions are only valid with --slug")
        outputs = [args.output.expanduser().resolve()]
        positions: tuple[str, ...] = ()
    else:
        if args.variants is None:
            parser.error("--slug requires --variants 2 or 3")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.slug):
            parser.error("--slug must use lowercase ASCII letters, digits, and single hyphens")
        positions = parse_positions(args.positions, args.variants)
        output_dir = args.output_dir.expanduser().resolve()
        outputs = [output_dir / f"{args.slug}-v{index}.html" for index in range(1, args.variants + 1)]

    existing = [output for output in outputs if output.exists()]
    if existing and not args.force:
        formatted = "\n".join(f"  - {output}" for output in existing)
        raise SystemExit(f"Refusing to overwrite existing output(s):\n{formatted}")

    for index, output in enumerate(outputs, 1):
        position = positions[index - 1] if positions else None
        write_variant(shell_text, output, notes(index, len(outputs), position) if position else None)
        suffix = f" [{position}]" if position else ""
        print(f"created: {output}{suffix}")

    print("editable anchors:")
    for item in anchor_lines(shell_text):
        print(f"  {item}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
