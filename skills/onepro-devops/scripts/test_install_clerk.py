#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("install_clerk.py")
SPEC = importlib.util.spec_from_file_location("install_clerk", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class InstallClerkTest(unittest.TestCase):

    def test_installs_required_custom_agent_fields_and_model_override(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "clerk.toml"
            MODULE.install("org-mini-model", target)
            value = target.read_text(encoding="utf-8")
            self.assertIn('name = "onepro_devops_clerk"', value)
            self.assertIn('model = "org-mini-model"', value)
            self.assertIn('developer_instructions = """', value)
            self.assertIn('sandbox_mode = "read-only"', value)

    def test_rejects_model_text_that_could_corrupt_toml(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(SystemExit, "unsupported characters"):
                MODULE.install('bad"\nmodel', Path(directory) / "clerk.toml")


if __name__ == "__main__":
    unittest.main()
