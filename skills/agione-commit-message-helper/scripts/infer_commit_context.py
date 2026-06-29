#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any
from urllib.parse import urlparse


SKILL_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SCOPE_MAP = SKILL_ROOT / "references" / "scope-map.json"


def configure_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def run_git(repo: Path, args: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", "-C", str(repo), *args],
        check=check,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def load_scope_map(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_repo_path(remote_url: str) -> str:
    remote_url = remote_url.strip()
    if not remote_url:
        return ""

    if remote_url.startswith("git@") and ":" in remote_url:
        path = remote_url.split(":", 1)[1]
    elif "://" in remote_url:
        parsed = urlparse(remote_url)
        path = parsed.path
    else:
        path = remote_url

    path = path.strip("/")
    if path.endswith(".git"):
        path = path[:-4]
    return path.lower()


def get_repo_identity(repo: Path) -> dict[str, str]:
    top = run_git(repo, ["rev-parse", "--show-toplevel"]).stdout.strip()
    branch = run_git(repo, ["branch", "--show-current"], check=False).stdout.strip()
    remotes = run_git(repo, ["remote", "-v"], check=False).stdout.splitlines()

    remote_url = ""
    for line in remotes:
        parts = line.split()
        if len(parts) >= 3 and parts[0] == "origin" and parts[2] == "(fetch)":
            remote_url = parts[1]
            break
    if not remote_url and remotes:
        parts = remotes[0].split()
        if len(parts) >= 2:
            remote_url = parts[1]

    return {
        "path": str(Path(top)),
        "branch": branch,
        "remote_url": remote_url,
        "remote_path": normalize_repo_path(remote_url),
    }


def staged_diff(repo: Path) -> dict[str, Any]:
    stat = run_git(repo, ["diff", "--cached", "--stat"], check=False).stdout
    name_only = run_git(repo, ["diff", "--cached", "--name-only"], check=False).stdout
    diff = run_git(repo, ["diff", "--cached"], check=False).stdout
    files = [line.strip().replace("\\", "/") for line in name_only.splitlines() if line.strip()]
    return {"stat": stat, "files": files, "diff": diff}


def count_scope_hits(files: list[str], diff: str, scope_map: dict[str, Any]) -> tuple[Counter[str], dict[str, list[str]]]:
    scope_hits: Counter[str] = Counter()
    evidence: dict[str, list[str]] = {}
    haystacks = [(file, file.lower()) for file in files]
    diff_lower = diff.lower()

    for rule in scope_map.get("path_scope_rules", []):
        scope = rule["scope"]
        matched: list[str] = []
        for pattern in rule.get("patterns", []):
            pat = pattern.lower()
            path_matches = [file for file, low in haystacks if pat in low]
            diff_match = pat in diff_lower
            if path_matches or diff_match:
                scope_hits[scope] += len(path_matches) or 1
                for file in path_matches[:5]:
                    matched.append(file)
                if diff_match and not path_matches:
                    matched.append(f"diff:{pattern}")
        if matched:
            evidence[scope] = sorted(set(matched))

    return scope_hits, evidence


def extract_evidence(files: list[str], diff: str, scope_map: dict[str, Any]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    lower_files = [(file, file.lower()) for file in files]
    diff_lower = diff.lower()

    for kind, patterns in scope_map.get("evidence_patterns", {}).items():
        matches: list[str] = []
        for pattern in patterns:
            pat = pattern.lower()
            path_matches = [file for file, low in lower_files if pat in low]
            if path_matches:
                matches.extend(path_matches[:5])
            elif pat in diff_lower:
                matches.append(f"diff:{pattern}")
        if matches:
            result[kind] = sorted(set(matches))

    api_paths = sorted(set(re.findall(r"['\"](/(?:api|v1|v2|openapi|admin|console)/[^'\"\\s]+)['\"]", diff)))
    if api_paths:
        result["api_paths"] = api_paths[:20]

    config_keys = sorted(set(re.findall(r"(?m)^[+ -]\s*([A-Za-z0-9_.-]{3,})\s*[:=]", diff)))
    if config_keys:
        result["config_keys"] = config_keys[:20]

    return result


def infer_message_requirements(
    suggested_scope: str,
    evidence: dict[str, list[str]],
    role: str,
    has_staged_diff: bool,
) -> dict[str, Any]:
    high_risk_scopes = {"auth", "permission", "billing", "model-service", "deployment"}
    medium_evidence = {"api", "config", "page"}
    high_evidence = {"database", "deployment"}

    risk_flags: list[str] = []
    if suggested_scope in high_risk_scopes:
        risk_flags.append(f"{suggested_scope}_domain")
    for key in sorted(evidence):
        if key in high_evidence:
            risk_flags.append(key)
        elif key in medium_evidence:
            risk_flags.append(f"{key}_changed")

    is_docs_or_test_only = suggested_scope in {"docs", "test"} and not any(
        key in evidence for key in ["api", "config", "page", "database", "deployment"]
    )
    business_or_system_change = has_staged_diff and not is_docs_or_test_only
    risk_level = "low"
    if any(flag in risk_flags for flag in ["database", "deployment"]):
        risk_level = "high"
    elif suggested_scope in high_risk_scopes:
        risk_level = "high"
    elif any(key in evidence for key in ["api", "config", "page"]):
        risk_level = "medium"

    return {
        "needs_change_summary": has_staged_diff,
        "needs_change_reason": business_or_system_change,
        "needs_impact_scope": business_or_system_change,
        "needs_test_suggestion": business_or_system_change and risk_level in {"medium", "high"},
        "needs_risk_note": risk_level == "high",
        "risk_flags": risk_flags,
        "risk_level": risk_level,
    }


def infer_repo(repo: Path, scope_map: dict[str, Any]) -> dict[str, Any]:
    identity = get_repo_identity(repo)
    diff_info = staged_diff(repo)
    fallback = scope_map.get("repository_fallback_scopes", {}).get(identity["remote_path"], {})
    scope_hits, scope_evidence = count_scope_hits(diff_info["files"], diff_info["diff"], scope_map)

    suggested_scope = fallback.get("scope", "chore")
    confidence = "low"
    reason = "fallback"
    if scope_hits:
        suggested_scope = scope_hits.most_common(1)[0][0]
        confidence = "medium"
        reason = "path-or-diff-rule"
    if not diff_info["files"]:
        confidence = "none"
        reason = "no-staged-diff"

    evidence = extract_evidence(diff_info["files"], diff_info["diff"], scope_map)
    role = fallback.get("role", "unknown")
    has_staged_diff = bool(diff_info["files"])

    return {
        "repo": identity,
        "role": role,
        "fallback_scope": fallback.get("scope", ""),
        "suggested_scope": suggested_scope,
        "scope_confidence": confidence,
        "scope_reason": reason,
        "scope_hits": dict(scope_hits),
        "scope_evidence": scope_evidence,
        "staged_files": diff_info["files"],
        "staged_stat": diff_info["stat"].strip(),
        "evidence": evidence,
        "message_requirements": infer_message_requirements(suggested_scope, evidence, role, has_staged_diff),
        "has_staged_diff": has_staged_diff,
    }


def aggregate(repos: list[dict[str, Any]]) -> dict[str, Any]:
    roles = sorted({repo.get("role", "unknown") for repo in repos if repo.get("has_staged_diff")})
    scopes = Counter(repo["suggested_scope"] for repo in repos if repo.get("has_staged_diff") and repo.get("suggested_scope"))
    frontend = any(role == "frontend" for role in roles)
    backend = any(role.startswith("backend") for role in roles)

    linked = frontend and backend
    repo_requirements = [repo.get("message_requirements", {}) for repo in repos if repo.get("has_staged_diff")]
    risk_flags = sorted({flag for req in repo_requirements for flag in req.get("risk_flags", [])})
    if linked:
        risk_flags.append("frontend_backend_linked")
    risk_levels = [req.get("risk_level", "low") for req in repo_requirements]
    risk_level = "high" if "high" in risk_levels or linked else "medium" if "medium" in risk_levels else "low"

    return {
        "repo_count": len(repos),
        "repos_with_staged_diff": sum(1 for repo in repos if repo.get("has_staged_diff")),
        "repos_with_errors": sum(1 for repo in repos if repo.get("error")),
        "roles": roles,
        "frontend_backend_linked": linked,
        "suggested_scope": scopes.most_common(1)[0][0] if scopes else "",
        "scope_candidates": dict(scopes),
        "message_requirements": {
            "needs_change_summary": any(req.get("needs_change_summary") for req in repo_requirements),
            "needs_change_reason": any(req.get("needs_change_reason") for req in repo_requirements),
            "needs_impact_scope": any(req.get("needs_impact_scope") for req in repo_requirements),
            "needs_test_suggestion": any(req.get("needs_test_suggestion") for req in repo_requirements) or linked,
            "needs_risk_note": any(req.get("needs_risk_note") for req in repo_requirements) or linked,
            "risk_flags": sorted(set(risk_flags)),
            "risk_level": risk_level,
        },
        "needs_business_intent_question": any(repo.get("scope_confidence") in {"none", "low"} for repo in repos),
    }


def main() -> int:
    configure_stdio()
    parser = argparse.ArgumentParser(description="Infer AGIOne commit context from staged git diffs.")
    parser.add_argument("repos", nargs="*", default=["."], help="Repository paths to inspect.")
    parser.add_argument("--scope-map", default=str(DEFAULT_SCOPE_MAP), help="Path to scope-map.json.")
    parser.add_argument("--include-diff", action="store_true", help="Include full staged diffs in output.")
    args = parser.parse_args()

    scope_map = load_scope_map(Path(args.scope_map))
    repo_results = []
    for repo_arg in args.repos:
        repo = Path(repo_arg).resolve()
        try:
            result = infer_repo(repo, scope_map)
            if args.include_diff:
                result["staged_diff"] = staged_diff(repo)["diff"]
            repo_results.append(result)
        except subprocess.CalledProcessError as exc:
            repo_results.append(
                {
                    "repo": {"path": str(repo)},
                    "has_staged_diff": False,
                    "error": exc.stderr.strip() or str(exc),
                }
            )

    output = {
        "version": 1,
        "scope_map": str(Path(args.scope_map).resolve()),
        "aggregate": aggregate(repo_results),
        "repositories": repo_results,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
