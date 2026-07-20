#!/usr/bin/env python3
"""Regression tests for safe OnePro DevOps request-body transport."""

from __future__ import annotations

import argparse
import base64
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("onepro_devops.py")
SPEC = importlib.util.spec_from_file_location("onepro_devops", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class Stdin:
    def __init__(self, value: bytes):
        self.buffer = io.BytesIO(value)


class Response:
    def __init__(self, value: dict):
        self.value = value

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return json.dumps(self.value, ensure_ascii=False).encode()


def args(*, data=None, data_file=None, data_base64=None):
    return argparse.Namespace(data=data, data_file=data_file, data_base64=data_base64)


class RequestBodyTest(unittest.TestCase):
    body = '{"markdown":"## Evidence\\n\\n- `code`\\n- $(must-not-run)\\n- 中文"}'.encode()

    def test_stdin_file_and_base64_preserve_identical_bytes(self):
        with patch.object(MODULE.sys, "stdin", Stdin(self.body)):
            stdin_body = MODULE.read_body(args(data="-"))
        with tempfile.NamedTemporaryFile() as file:
            file.write(self.body)
            file.flush()
            file_body = MODULE.read_body(args(data_file=file.name))
        encoded = base64.b64encode(self.body).decode()
        base64_body = MODULE.read_body(args(data_base64=encoded))
        self.assertEqual(self.body, stdin_body)
        self.assertEqual(self.body, file_body)
        self.assertEqual(self.body, base64_body)

    def test_base64_can_be_read_from_stdin(self):
        encoded = base64.b64encode(self.body)
        with patch.object(MODULE.sys, "stdin", Stdin(encoded)):
            self.assertEqual(self.body, MODULE.read_body(args(data_base64="-")))

    def test_inline_json_is_rejected_before_request(self):
        with self.assertRaisesRegex(SystemExit, "Inline --data JSON is disabled"):
            MODULE.read_body(args(data=self.body.decode()))

    def test_invalid_base64_is_rejected(self):
        with self.assertRaisesRegex(SystemExit, "valid ASCII base64"):
            MODULE.read_body(args(data_base64="not-base64!"))
        with self.assertRaisesRegex(SystemExit, "valid ASCII base64"):
            MODULE.read_body(args(data_base64="中文"))

    def test_invalid_utf8_and_json_are_rejected(self):
        with self.assertRaisesRegex(SystemExit, "valid UTF-8 JSON"):
            MODULE.validate_json_body(b"\xff")
        with self.assertRaisesRegex(SystemExit, "Request body JSON is invalid"):
            MODULE.validate_json_body(b"{broken")

    def test_body_sources_are_mutually_exclusive(self):
        with patch.object(MODULE.sys, "stderr", io.StringIO()):
            with self.assertRaises(SystemExit):
                MODULE.parser().parse_args([
                    "request", "POST", "/example", "--data", "-", "--data-file", "payload.json"
                ])

    def test_compact_commands_parse_without_request_body(self):
        parsed = MODULE.parser().parse_args(["run", "42"])
        self.assertEqual(42, parsed.run_id)
        self.assertEqual("MINIMAL", parsed.view)
        history = MODULE.parser().parse_args(["history", "42", "artifacts", "--page-size", "50"])
        self.assertEqual("artifacts", history.kind)
        self.assertEqual(50, history.page_size)

    def test_http_200_business_error_returns_non_zero(self):
        with patch.object(MODULE.sys, "stderr", io.StringIO()) as error:
            self.assertEqual(1, MODULE.print_api_response(
                '{"code":1,"message":"denied","error":{"code":"AUTH_REQUIRED"}}'
            ))
            self.assertIn("AUTH_REQUIRED", error.getvalue())

    def test_expected_business_error_is_explicit(self):
        with patch.object(MODULE.sys, "stdout", io.StringIO()) as output:
            self.assertEqual(0, MODULE.print_api_response(
                '{"code":1,"message":"invalid range","error":{"code":"INVALID_RANGE"}}',
                expect_business_error=True,
            ))
            self.assertIn("INVALID_RANGE", output.getvalue())
        with patch.object(MODULE.sys, "stderr", io.StringIO()):
            self.assertEqual(1, MODULE.print_api_response('{"code":0,"data":{}}',
                                                          expect_business_error=True))

    def test_compact_receipt_avoids_full_run_output(self):
        value = {"code": 0, "data": {
            "run": {"id": 42, "runCode": "DR-42", "phase": "SELF_TEST", "artifacts": [1, 2]},
            "transition": {"toPhase": "SELF_TEST"}, "version": 8, "synchronizedState": True,
            "targetCode": "WI-42", "targetStatus": "自测中", "requirementStatus": "自测中",
        }}
        with patch.object(MODULE.sys, "stdout", io.StringIO()) as output:
            self.assertEqual(0, MODULE.print_api_response(json.dumps(value)))
            self.assertNotIn("artifacts", output.getvalue())
            self.assertIn('"verified": true', output.getvalue())

    def test_compact_unknown_dto_keeps_scalars_instead_of_empty_object(self):
        value = MODULE.compact_data({"startDate": "2026-07-01", "totalEvents": 12, "rows": [1, 2]})
        self.assertEqual("2026-07-01", value["startDate"])
        self.assertEqual(12, value["totalEvents"])
        self.assertEqual(2, value["rowsCount"])

    def test_action_receipt_is_compact_but_keeps_next_action(self):
        value = MODULE.compact_data({
            "actionId": "DA-1", "actionType": "COMPLETE_ANALYSIS", "runId": 42, "version": 4,
            "artifactCount": 1, "testExecutionCount": 0,
            "nextAction": {
                "action": "FINALIZE_PLAN_AND_START_DEVELOPMENT", "phase": "SOLUTION_DESIGN",
                "expectedVersion": 4, "requiredInputs": ["SOLUTION_PLAN"], "missingEvidence": [],
                "allowedCommands": ["step"], "schemaVersion": "v2", "schemaDigest": "abc",
                "inputSchemas": {}, "riskProfile": {"riskTier": "MEDIUM"}
            },
        })
        self.assertEqual("DA-1", value["actionId"])
        self.assertEqual("SOLUTION_DESIGN", value["nextAction"]["phase"])

    def test_minimal_run_command_prints_compact_fields_only(self):
        value = {"code": 0, "data": {
            "id": 42,
            "runCode": "DR-42",
            "version": 8,
            "phase": "SELF_TEST",
            "targetCode": "WI-42",
            "title": None,
            "artifacts": None,
            "allowedNextPhases": ["READY_FOR_TEST"],
        }}
        command = argparse.Namespace(run_id=42, view="MINIMAL")
        with patch.object(MODULE, "authenticated_get", return_value=value), \
                patch.object(MODULE.sys, "stdout", io.StringIO()) as output:
            self.assertEqual(0, MODULE.run_view(command))
            self.assertIn('"runCode": "DR-42"', output.getvalue())
            self.assertNotIn("artifacts", output.getvalue())
            self.assertNotIn("title", output.getvalue())

    def test_deterministic_command_parsers(self):
        claim = MODULE.parser().parse_args(["claim", "42", "3", "agent-1", "--idempotency-key", "claim-1"])
        self.assertEqual(42, claim.run_id)
        advance = MODULE.parser().parse_args([
            "advance", "42", "8", "SELF_TEST", "--reason", "ready", "--idempotency-key", "advance-1"
        ])
        self.assertEqual("SELF_TEST", advance.to_phase)
        incident = MODULE.parser().parse_args([
            "incident", "--incident-key", "intake-1", "--title", "failed", "--failure-stage", "INTAKE",
            "--summary-file", "summary.md", "--idempotency-key", "incident-1"
        ])
        self.assertEqual("intake-1", incident.incident_key)
        action = MODULE.parser().parse_args([
            "action-bundle", "42", "9", "FINALIZE", "--bundle-file", "bundle.json",
            "--idempotency-key", "action-1"
        ])
        self.assertEqual("FINALIZE", action.action_type)
        session = MODULE.parser().parse_args([
            "test-session", "42", "9", "--session-file", "session.json",
            "--idempotency-key", "session-1"
        ])
        self.assertEqual(9, session.expected_version)
        next_action = MODULE.parser().parse_args(["next-action", "42"])
        self.assertEqual(42, next_action.run_id)
        step = MODULE.parser().parse_args([
            "step", "42", "--bundle-file", "bundle.json", "--idempotency-key", "step-1"
        ])
        self.assertEqual("bundle.json", step.bundle_file)
        cost = MODULE.parser().parse_args([
            "cost-record", "42", "--usage-file", "usage.json", "--idempotency-key", "cost-1"
        ])
        self.assertEqual("usage.json", cost.usage_file)

    def test_managed_advance_reads_markdown_reason_from_file(self):
        with tempfile.NamedTemporaryFile(mode="w+", encoding="utf-8") as file:
            file.write("## Safe reason\n\n- `code`\n- $(must-not-run)")
            file.flush()
            command = argparse.Namespace(
                run_id=42, expected_version=9, to_phase="SELF_TEST", reason=None,
                reason_file=file.name, rework_type=None, conversation_ref="test"
            )
            with patch.object(MODULE, "deterministic_request", return_value=0) as request:
                self.assertEqual(0, MODULE.managed_advance(command))
                body = request.call_args.args[3]
                self.assertIn("`code`", body["reason"])
                self.assertIn("$(must-not-run)", body["reason"])

    def test_step_validates_live_schema_and_normalizes_content(self):
        contract = {"code": 0, "data": {
            "action": "COMPLETE_ANALYSIS", "expectedVersion": 3,
            "inputSchemas": {
                "IMPACT_ANALYSIS": {
                    "requiredFields": ["frontend", "regression", "browserVisible"],
                    "itemRequiredFields": []
                }
            }
        }}
        bundle = {"artifacts": [{
            "artifactType": "IMPACT_ANALYSIS",
            "contentJson": {"frontend": "yes", "regression": "build", "browserVisible": True}
        }]}
        with tempfile.NamedTemporaryFile(mode="w+", encoding="utf-8") as file:
            json.dump(bundle, file, ensure_ascii=False)
            file.flush()
            command = argparse.Namespace(run_id=42, bundle_file=file.name)
            with patch.object(MODULE, "fetch_next_action", return_value=(
                    contract, contract["data"]["inputSchemas"])), \
                    patch.object(MODULE, "deterministic_request", return_value=0) as request:
                self.assertEqual(0, MODULE.step(command))
                body = request.call_args.args[3]
                self.assertEqual(3, body["expectedVersion"])
                self.assertEqual("COMPLETE_ANALYSIS", body["actionType"])
                self.assertIsInstance(body["artifacts"][0]["contentJson"], str)

    def test_step_rejects_missing_schema_field_before_write(self):
        contract = {"code": 0, "data": {
            "action": "COMPLETE_ANALYSIS", "expectedVersion": 3,
            "inputSchemas": {
                "IMPACT_ANALYSIS": {
                    "requiredFields": ["browserVisible"],
                    "itemRequiredFields": []
                }
            }
        }}
        with tempfile.NamedTemporaryFile(mode="w+", encoding="utf-8") as file:
            json.dump({"artifacts": [{
                "artifactType": "IMPACT_ANALYSIS", "contentJson": {"frontend": "yes"}
            }]}, file)
            file.flush()
            command = argparse.Namespace(run_id=42, bundle_file=file.name)
            with patch.object(MODULE, "fetch_next_action", return_value=(
                    contract, contract["data"]["inputSchemas"])), \
                    patch.object(MODULE, "deterministic_request") as request:
                with self.assertRaisesRegex(SystemExit, "browserVisible"):
                    MODULE.step(command)
                request.assert_not_called()

    def test_advance_reason_sources_are_mutually_exclusive(self):
        with patch.object(MODULE.sys, "stderr", io.StringIO()):
            with self.assertRaises(SystemExit):
                MODULE.parser().parse_args([
                    "advance", "42", "8", "SELF_TEST", "--reason", "ready",
                    "--reason-file", "reason.md", "--idempotency-key", "advance-1"
                ])

    def test_action_bundle_injects_version_without_shell_json(self):
        with tempfile.NamedTemporaryFile(mode="w+", encoding="utf-8") as file:
            json.dump({"artifacts": [], "reason": "## Safe\n\n- `code`"}, file, ensure_ascii=False)
            file.flush()
            command = argparse.Namespace(
                run_id=42, expected_version=9, action_type="FINALIZE", bundle_file=file.name
            )
            with patch.object(MODULE, "deterministic_request", return_value=0) as request:
                self.assertEqual(0, MODULE.action_bundle(command))
                body = request.call_args.args[3]
                self.assertEqual(9, body["expectedVersion"])
                self.assertEqual("FINALIZE", body["actionType"])
                self.assertIn("`code`", body["reason"])

    def test_transition_receipt_requires_atomic_sync(self):
        valid = json.dumps({
            "data": {
                "run": {"id": 42, "runCode": "DR-42", "phase": "SELF_TEST"},
                "transition": {"toPhase": "SELF_TEST"},
                "version": 8,
                "synchronizedState": True,
                "targetCode": "WI-42",
                "targetStatus": "自测中",
                "requirementStatus": "自测中",
            }
        }).encode()
        with patch.object(MODULE.sys, "stdin", Stdin(valid)), patch.object(MODULE.sys, "stdout", io.StringIO()) as output:
            self.assertEqual(0, MODULE.verify_receipt(argparse.Namespace()))
            self.assertIn('"verified": true', output.getvalue())
        invalid = json.dumps({"run": {}, "transition": {}, "version": 8, "synchronizedState": False}).encode()
        with patch.object(MODULE.sys, "stdin", Stdin(invalid)):
            with self.assertRaisesRegex(SystemExit, "unsynchronized"):
                MODULE.verify_receipt(argparse.Namespace())

    def test_schema_cache_reuses_digest_without_losing_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            command = argparse.Namespace(base_url="http://devops.example", cache_dir=directory)
            MODULE.write_schema_cache(command, "digest-1", {
                "IMPACT_ANALYSIS": {"requiredFields": ["browserVisible"]}
            })
            value = MODULE.load_schema_cache(command)
            self.assertEqual("digest-1", value["schemaDigest"])
            self.assertEqual(
                ["browserVisible"], value["schemas"]["IMPACT_ANALYSIS"]["requiredFields"]
            )


class AgentDocsCacheTest(unittest.TestCase):

    def docs_args(self, cache_dir: str, **overrides):
        values = {
            "base_url": "http://devops.example",
            "timeout": 1,
            "cache_dir": cache_dir,
            "max_age_hours": 24.0,
            "refresh": False,
            "show": None,
            "all": False,
        }
        values.update(overrides)
        return argparse.Namespace(**values)

    def response(self, url, **_):
        path = "/" + url.split("/", 3)[-1]
        key = path.removeprefix("/api/v1/agent-docs/")
        return Response({
            "code": 0,
            "data": {"key": key, "version": "2026-07-11", "content": f"# {key}\n"},
        })

    def test_fresh_cache_avoids_repeated_network_reads(self):
        with tempfile.TemporaryDirectory() as directory:
            args = self.docs_args(directory)
            with patch.object(MODULE.urllib.request, "urlopen", side_effect=self.response) as urlopen, \
                patch.object(MODULE.sys, "stdout", io.StringIO()) as first_output:
                self.assertEqual(0, MODULE.docs(args))
                self.assertEqual(len(MODULE.DOC_PATHS), urlopen.call_count)
                self.assertIn('"source": "live"', first_output.getvalue())
            with patch.object(MODULE.urllib.request, "urlopen") as urlopen, \
                patch.object(MODULE.sys, "stdout", io.StringIO()) as second_output:
                self.assertEqual(0, MODULE.docs(args))
                urlopen.assert_not_called()
                self.assertIn('"source": "cache"', second_output.getvalue())
                self.assertIn('"changedDocuments": []', second_output.getvalue())

    def test_explicit_refresh_and_show_use_cached_document(self):
        with tempfile.TemporaryDirectory() as directory:
            args = self.docs_args(directory)
            with patch.object(MODULE.urllib.request, "urlopen", side_effect=self.response), \
                patch.object(MODULE.sys, "stdout", io.StringIO()):
                MODULE.docs(args)
            refresh = self.docs_args(directory, refresh=True)
            with patch.object(MODULE.urllib.request, "urlopen", side_effect=self.response) as urlopen, \
                patch.object(MODULE.sys, "stdout", io.StringIO()):
                self.assertEqual(0, MODULE.docs(refresh))
                self.assertEqual(len(MODULE.DOC_PATHS), urlopen.call_count)
            show = self.docs_args(directory, show="endpoints")
            with patch.object(MODULE.urllib.request, "urlopen") as urlopen, \
                patch.object(MODULE.sys, "stdout", io.StringIO()) as output:
                self.assertEqual(0, MODULE.docs(show))
                urlopen.assert_not_called()
                self.assertIn("# endpoints", output.getvalue())

    def test_contract_error_requests_refresh_without_broad_http_404_rule(self):
        payload = json.dumps({"error": {"code": "DEV_DELIVERY_API_CONTRACT_MISMATCH"}})
        self.assertTrue(MODULE.contract_refresh_required(400, payload))
        self.assertTrue(MODULE.contract_refresh_required(405, ""))
        self.assertFalse(MODULE.contract_refresh_required(404, '{"error":{"code":"NOT_FOUND"}}'))


if __name__ == "__main__":
    unittest.main()
