#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


ALLOWED_TYPES = "feat|fix|refactor|perf|config|docs|test|chore"
TITLE_PATTERN = re.compile(rf"^({ALLOWED_TYPES})\([a-zA-Z0-9][a-zA-Z0-9._-]*\):\s+\S.+$")
VAGUE_PATTERNS = [
    re.compile(
        rf"^({ALLOWED_TYPES})\([^)]+\):\s*(优化|调整|修改|更新|修复|修复问题|bug fix|提交代码|代码提交)\s*$",
        re.IGNORECASE,
    ),
    re.compile(r"^(优化|调整|修改|更新|修复|修复问题|bug fix|提交代码|代码提交)\s*$", re.IGNORECASE),
]
TEST_WORDS = re.compile(r"测试|回归|验证|影响|流程|接口|配置|权限|页面|用户|账务|计费|模型|部署|数据|前端|后端")
CHANGE_SUMMARY_WORDS = re.compile(r"变更内容|修改|新增|修复|调整|重构|删除|改为|支持|统一|补充")
CHANGE_REASON_WORDS = re.compile(r"变更原因|原因|解决|避免|为了|由于|修复|补齐|降低|提升")
IMPACT_WORDS = re.compile(r"影响范围|影响|范围|流程|页面|接口|用户|模块|上下游|权限|数据")
TEST_SUGGESTION_WORDS = re.compile(r"测试建议|测试|回归|验证|联调|兼容性检查|边界")
RISK_WORDS = re.compile(r"风险点|风险|兼容|关注|需关注|权限边界|配置变更|数据迁移|前后端契约|接口契约|账务风险|计费风险|模型调用|部署影响|迁移")


def configure_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def read_message(args: argparse.Namespace) -> str:
    if args.message_file:
        path = Path(args.message_file)
        if not path.exists():
            print(f"Commit message file not found: {path}", file=sys.stderr)
            raise SystemExit(2)
        return path.read_text(encoding="utf-8-sig")
    return args.message or ""


def flatten_context_tokens(value: object) -> set[str]:
    tokens: set[str] = set()
    if isinstance(value, dict):
        for item in value.values():
            tokens.update(flatten_context_tokens(item))
    elif isinstance(value, list):
        for item in value:
            tokens.update(flatten_context_tokens(item))
    elif isinstance(value, str):
        for token in re.findall(r"[A-Za-z0-9_.:/-]{3,}", value):
            tokens.add(token.lower())
            if "/" in token:
                tokens.add(token.rsplit("/", 1)[-1].lower())
            if "." in token:
                tokens.add(token.rsplit(".", 1)[0].lower())
    return tokens


def validate_context_alignment(message: str, context_file: str) -> list[str]:
    if not context_file:
        return []

    path = Path(context_file)
    if not path.exists():
        return [f"Context file not found: {path}"]

    context = json.loads(path.read_text(encoding="utf-8-sig"))
    aggregate = context.get("aggregate", {})
    repositories = context.get("repositories", [])
    warnings: list[str] = []

    if aggregate.get("repos_with_staged_diff", 0) == 0:
        warnings.append("Context has no staged diff; commit message cannot be checked against diff evidence.")
        return warnings

    message_lower = message.lower()
    suggested_scope = aggregate.get("suggested_scope") or ""
    title = next((line.strip() for line in re.split(r"\r?\n", message) if line.strip() and not line.lstrip().startswith("#")), "")
    scope_match = re.match(rf"^({ALLOWED_TYPES})\(([^)]+)\):", title)
    title_scope = scope_match.group(2) if scope_match else ""
    if suggested_scope and title_scope and title_scope != suggested_scope:
        warnings.append(f"Title scope '{title_scope}' differs from inferred scope '{suggested_scope}'.")

    evidence_tokens = flatten_context_tokens(
        {
            "scope_candidates": aggregate.get("scope_candidates", {}),
            "repositories": [
                {
                    "remote_path": repo.get("repo", {}).get("remote_path", ""),
                    "suggested_scope": repo.get("suggested_scope", ""),
                    "scope_evidence": repo.get("scope_evidence", {}),
                    "evidence": repo.get("evidence", {}),
                    "staged_files": repo.get("staged_files", []),
                }
                for repo in repositories
            ],
        }
    )
    weak_tokens = {"src", "main", "test", "java", "ts", "tsx", "js", "vue", "json", "xml", "yaml", "yml"}
    evidence_tokens = {token for token in evidence_tokens if token not in weak_tokens and len(token) >= 3}
    matched = sorted(token for token in evidence_tokens if token in message_lower)
    if evidence_tokens and len(matched) == 0:
        warnings.append("Body does not reference any inferred diff evidence such as repo, file area, API, config, or scope.")

    requirements = aggregate.get("message_requirements", {})
    body_text = "\n".join(line for line in re.split(r"\r?\n", message) if line.strip() and not line.lstrip().startswith("#"))

    if requirements.get("needs_change_summary") and not CHANGE_SUMMARY_WORDS.search(body_text):
        warnings.append("Context indicates staged changes, but message lacks a clear change summary.")
    if requirements.get("needs_change_reason") and not CHANGE_REASON_WORDS.search(body_text):
        warnings.append("Context indicates a business/system change, but message lacks a change reason.")
    if requirements.get("needs_impact_scope") and not IMPACT_WORDS.search(body_text):
        warnings.append("Context indicates a business/system change, but message lacks impact scope.")
    if requirements.get("needs_test_suggestion") and not TEST_SUGGESTION_WORDS.search(body_text):
        warnings.append("Context indicates medium/high-risk change, but message lacks a test suggestion.")
    if requirements.get("needs_risk_note") and not RISK_WORDS.search(body_text):
        warnings.append("Context indicates high-risk or linked change, but message lacks a risk note.")

    if aggregate.get("frontend_backend_linked"):
        linkage_words = ("前端", "后端", "frontend", "backend", "接口", "api")
        if not any(word in message_lower for word in linkage_words):
            warnings.append("Context indicates frontend/backend linked changes, but message does not mention the linkage.")

    return warnings


def validate(message: str, context_file: str = "") -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if not message.strip():
        return ["Commit message is empty."], warnings

    lines = [line for line in re.split(r"\r?\n", message) if not re.match(r"^\s*#", line)]
    non_empty = [line.strip() for line in lines if line.strip()]
    if not non_empty:
        return ["Commit message is empty."], warnings

    title = non_empty[0]
    if not TITLE_PATTERN.match(title):
        errors.append(f"Title must match: <type>(<scope>): <clear purpose>. Allowed types: {ALLOWED_TYPES}")

    if any(pattern.match(title) for pattern in VAGUE_PATTERNS):
        errors.append("Title is too vague. Explain what changed and why.")

    if len(title) > 90:
        warnings.append("Title is long; consider keeping it under 90 characters.")

    body_lines = non_empty[1:]
    bullet_lines = [line for line in body_lines if re.match(r"^[-*]\s+\S", line)]
    if len(bullet_lines) < 2:
        errors.append("Body should contain at least two bullet lines describing impact, purpose, or testing.")

    body_text = "\n".join(body_lines)
    if len(bullet_lines) < 3 and not TEST_WORDS.search(body_text):
        warnings.append("Body does not mention impact or testing cues; add affected flow and regression suggestion.")

    if bullet_lines and not CHANGE_SUMMARY_WORDS.search(body_text):
        warnings.append("Body does not clearly describe the core change; add a change-summary bullet before QA notes.")
    if bullet_lines and not CHANGE_REASON_WORDS.search(body_text):
        warnings.append("Body does not clearly explain why the change is needed; add a change-reason bullet when applicable.")

    warnings.extend(validate_context_alignment(message, context_file))

    return errors, warnings


def main() -> int:
    configure_stdio()
    parser = argparse.ArgumentParser(description="Validate a Codex-style commit message.")
    parser.add_argument("--message-file", "-MessageFile", default="")
    parser.add_argument("--message", "-Message", default="")
    parser.add_argument("--context-file", "-ContextFile", default="")
    args = parser.parse_args()

    message = read_message(args)
    errors, warnings = validate(message, args.context_file)

    if errors:
        print("Commit message check failed:")
        for item in errors:
            print(f"- {item}")
        if warnings:
            print("Warnings:")
            for item in warnings:
                print(f"- {item}")
        return 1

    if warnings:
        print("Commit message check passed with warnings:")
        for item in warnings:
            print(f"- {item}")
        return 0

    print("Commit message check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
