#!/usr/bin/env python3
"""Validate the canonical shell against a reviewed project-mamba code baseline."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
DEFAULT_SHELL = SKILL_DIR / "agione-console-shell-sample-v1.html"
DEFAULT_BASELINE = SKILL_DIR / "references" / "mamba-code-baseline.json"


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def css_block(text: str, selector: str) -> str:
    start = text.find(selector)
    if start < 0:
        return ""
    opening = text.find("{", start)
    depth = 0
    for index in range(opening, len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return text[opening + 1 : index]
    return ""


def css_declarations(block: str) -> dict[str, str]:
    clean = re.sub(r"/\*.*?\*/", "", block, flags=re.S)
    return {
        match.group(1): normalize(match.group(2))
        for match in re.finditer(r"(--ui-[a-z0-9-]+)\s*:\s*([^;]+);", clean)
    }


def js_theme_map(text: str, name: str) -> dict[str, str]:
    match = re.search(rf"const\s+{re.escape(name)}\s*=\s*\{{(.*?)\n\}};", text, flags=re.S)
    if not match:
        return {}
    return {
        item.group(1): normalize(item.group(2))
        for item in re.finditer(r"['\"](--ui-[a-z0-9-]+)['\"]\s*:\s*['\"]([^'\"]*)['\"]", match.group(1))
    }


def git_show(repo: Path, ref: str, relative: str) -> bytes:
    result = subprocess.run(
        ["git", "show", f"{ref}:{relative}"],
        cwd=repo,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.decode("utf-8", errors="replace").strip())
    return result.stdout


def sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def check_code_source(repo: Path, ref: str, baseline: dict[str, object], issues: list[str]) -> None:
    source_files = baseline["sourceFiles"]
    assert isinstance(source_files, dict)
    for relative, expected in source_files.items():
        try:
            actual = sha256(git_show(repo, ref, relative))
        except RuntimeError as error:
            issues.append(f"code source unavailable: {relative}: {error}")
            continue
        if actual != expected:
            issues.append(f"code source changed: {relative}: expected {expected}, got {actual}")

    package = json.loads(git_show(repo, ref, "package.json"))
    expected_dependencies = baseline["resolvedDependencies"]
    assert isinstance(expected_dependencies, dict)
    declared_mamba = package.get("dependencies", {}).get("mamba-layout")
    if declared_mamba != expected_dependencies["mamba-layout"]:
        issues.append(
            f"project-mamba mamba-layout declaration changed: expected {expected_dependencies['mamba-layout']}, got {declared_mamba}"
        )

    lock_text = git_show(repo, ref, "pnpm-lock.yaml").decode("utf-8", errors="replace")
    for dependency, version in expected_dependencies.items():
        marker = f"{dependency}@{version}"
        if marker not in lock_text:
            issues.append(f"project-mamba lock no longer contains {marker}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("shell", nargs="?", type=Path, default=DEFAULT_SHELL)
    parser.add_argument("--baseline", type=Path, default=DEFAULT_BASELINE)
    parser.add_argument("--project-mamba", type=Path)
    parser.add_argument("--ref", default="origin/test")
    args = parser.parse_args()

    if not args.shell.is_file() or not args.baseline.is_file():
        parser.error("shell or baseline file does not exist")

    baseline = json.loads(args.baseline.read_text(encoding="utf-8"))
    shell = args.shell.read_text(encoding="utf-8")
    root = css_declarations(css_block(shell, ":root"))
    light = {**root, **js_theme_map(shell, "lightVars")}
    dark = {**root, **js_theme_map(shell, "darkVars")}
    issues: list[str] = []

    for token in baseline["requiredNativeTokens"]:
        if token not in root:
            issues.append(f"missing mamba-native token: {token}")

    for mode, actual in (("light", light), ("dark", dark)):
        expected = baseline[f"{mode}Tokens"]
        for token, value in expected.items():
            if actual.get(token) != value:
                issues.append(f"{mode} token drift: {token}: expected {value!r}, got {actual.get(token)!r}")

    for name, url in baseline["prototypeDependencies"].items():
        if url not in shell:
            issues.append(f"prototype dependency drift: {name}: missing {url}")

    for marker in baseline["requiredShellMarkers"]:
        if marker not in shell:
            issues.append(f"missing shell contract marker: {marker}")

    chrome = baseline["chrome"]
    chrome_checks = {
        "topnav height": rf"\.topnav\s*\{{[^}}]*\bheight:\s*{re.escape(chrome['topnavHeight'])}",
        "topnav inline padding": rf"\.topnav\s*\{{[^}}]*\bpadding:\s*0\s+{re.escape(chrome['topnavPaddingInline'])}",
        "sidebar width": rf"\.sidebar\s*\{{[^}}]*\bwidth:\s*{re.escape(chrome['sidebarWidth'])}",
        "mobile drawer max width": rf"\.sidebar\s*\{{[^}}]*\bmax-width:\s*calc\(100vw\s*-\s*32px\)",
    }
    for label, pattern in chrome_checks.items():
        if not re.search(pattern, shell, flags=re.S):
            issues.append(f"chrome metric drift: {label}")

    if args.project_mamba:
        if not (args.project_mamba / ".git").exists():
            issues.append(f"not a project-mamba git checkout: {args.project_mamba}")
        else:
            check_code_source(args.project_mamba, args.ref, baseline, issues)

    print("Mamba code alignment check")
    print(f"  baseline: {baseline['authority']['repository']} {baseline['authority']['ref']} @ {baseline['authority']['reviewedCommit'][:8]}")
    print(f"  shell: {args.shell}")
    if args.project_mamba:
        print(f"  live code check: {args.project_mamba} {args.ref}")

    if issues:
        print(f"  result: FAIL ({len(issues)} issue(s))")
        for issue in issues:
            print(f"  - {issue}")
        return 1

    print("  result: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
