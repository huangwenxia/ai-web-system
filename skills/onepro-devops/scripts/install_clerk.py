#!/usr/bin/env python3
"""Install the OnePro DevOps Clerk custom agent without changing the main Codex model."""

from __future__ import annotations

import argparse
import os
import re
from pathlib import Path


MODEL_LINE = re.compile(r'^model = "[^"]+"$', re.MULTILINE)


def parser() -> argparse.ArgumentParser:
    value = argparse.ArgumentParser(description=__doc__)
    value.add_argument("--model", default=os.environ.get("ONEPRO_DEVOPS_CLERK_MODEL", "gpt-5.4-mini"))
    value.add_argument("--target", type=Path, default=Path.home() / ".codex" / "agents" / "onepro-devops-clerk.toml")
    return value


def install(model: str, target: Path) -> Path:
    if not re.fullmatch(r"[A-Za-z0-9._:-]+", model):
        raise SystemExit("Clerk model contains unsupported characters.")
    template = Path(__file__).resolve().parents[1] / "assets" / "onepro-devops-clerk.toml"
    content = template.read_text(encoding="utf-8")
    content = MODEL_LINE.sub(f'model = "{model}"', content, count=1)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return target


def main() -> int:
    args = parser().parse_args()
    target = install(args.model, args.target.expanduser())
    print(f"Installed OnePro DevOps Clerk: {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
