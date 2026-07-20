#!/usr/bin/env python3
"""Create one strict prototype or 2-3 explore variants from the shared shell."""

from __future__ import annotations

import argparse
import re
import shutil
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


def copy_one(shell: Path, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(shell, output)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    target = parser.add_mutually_exclusive_group(required=True)
    target.add_argument("--output", type=Path, help="Create one prototype file")
    target.add_argument("--slug", help="Create explore variants using this ASCII slug")
    parser.add_argument("--variants", type=int, choices=(2, 3), help="Variant count for --slug")
    parser.add_argument("--output-dir", type=Path, default=Path.cwd(), help="Directory for --slug outputs")
    parser.add_argument("--force", action="store_true", help="Overwrite existing outputs")
    args = parser.parse_args()

    shell = skill_root() / "agione-console-shell-sample-v1.html"
    if not shell.is_file():
        raise SystemExit(f"Shared shell not found: {shell}")
    text = validate_shell(shell)

    outputs: list[Path]
    if args.output:
        if args.variants is not None:
            parser.error("--variants is only valid with --slug")
        outputs = [args.output.expanduser().resolve()]
    else:
        if args.variants is None:
            parser.error("--slug requires --variants 2 or 3")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.slug):
            parser.error("--slug must use lowercase ASCII letters, digits, and single hyphens")
        output_dir = args.output_dir.expanduser().resolve()
        outputs = [output_dir / f"{args.slug}-v{index}.html" for index in range(1, args.variants + 1)]

    existing = [output for output in outputs if output.exists()]
    if existing and not args.force:
        formatted = "\n".join(f"  - {output}" for output in existing)
        raise SystemExit(f"Refusing to overwrite existing output(s):\n{formatted}")

    for output in outputs:
        copy_one(shell, output)
        print(f"created: {output}")

    print("editable anchors:")
    for item in anchor_lines(text):
        print(f"  {item}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
