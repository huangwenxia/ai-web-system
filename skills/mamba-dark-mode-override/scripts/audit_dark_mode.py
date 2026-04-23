#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

TEXT_EXTENSIONS = {
    ".vue",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".html",
}

DEFAULT_EXCLUDES = {
    "node_modules",
    "dist",
    "build",
    ".git",
    ".turbo",
    ".next",
    "coverage",
}

PATTERNS = [
    ("tailwind_light_utility", re.compile(r"\b(?:bg|text|border)-white\b")),
    ("tailwind_gray_utility", re.compile(r"\b(?:bg|text|border|placeholder:text)-gray-\d{2,3}\b")),
    ("raw_hex", re.compile(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b")),
    ("raw_rgb", re.compile(r"\brgba?\([^)]*\)")),
    ("named_white_black", re.compile(r"(?<![-\w])(?:white|black)(?![-\w])")),
]


def iter_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in DEFAULT_EXCLUDES for part in path.parts):
            continue
        if path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        yield path


def scan_file(path: Path, suppress_tokens: list[str]):
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except UnicodeDecodeError:
        lines = path.read_text(encoding="utf-8-sig").splitlines()

    hits = []
    for line_no, line in enumerate(lines, start=1):
        if any(token in line for token in suppress_tokens):
            continue
        for name, pattern in PATTERNS:
            for match in pattern.finditer(line):
                hits.append((line_no, name, match.group(0), line.strip()))
    return hits


def main():
    parser = argparse.ArgumentParser(description="Audit a directory for suspicious hard-coded light-mode colors.")
    parser.add_argument("target", help="File or directory to scan")
    parser.add_argument(
        "--suppress-if-line-contains",
        dest="suppress_tokens",
        action="append",
        default=[],
        help="Skip a line when it contains this substring. Repeatable.",
    )
    args = parser.parse_args()

    target = Path(args.target).expanduser().resolve()
    if not target.exists():
        print(f"[ERROR] Target not found: {target}", file=sys.stderr)
        return 1

    files = [target] if target.is_file() else list(iter_files(target))
    total_hits = 0

    for path in files:
        hits = scan_file(path, args.suppress_tokens)
        if not hits:
            continue
        print(path)
        for line_no, name, token, line in hits:
            print(f"  L{line_no}: {name}: {token}")
            print(f"    {line}")
        total_hits += len(hits)

    if total_hits == 0:
        print("No suspicious light-mode literals found.")
        return 0

    print(f"\nTotal suspicious matches: {total_hits}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
