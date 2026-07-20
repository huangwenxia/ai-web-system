#!/usr/bin/env python3
"""Safe OnePro DevOps document and API client using only Python stdlib."""

from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import json
import os
import secrets
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_BASE_URL = "http://192.168.31.194"
SAFE_POST_SUFFIXES = (
    "/intake-preview",
    "/fit-check",
    "/checkpoint-preview",
    "/transition-preview",
    "/managed-mode-preview",
)
HISTORY_PATHS = {
    "artifacts": "artifacts",
    "tests": "test-executions",
    "approvals": "approvals",
    "transitions": "transitions",
}
DOC_PATHS = (
    "/api/v1/agent-docs/overview",
    "/api/v1/agent-docs/auth",
    "/api/v1/agent-docs/endpoints",
    "/api/v1/agent-docs/workflows/dev-collab",
    "/api/v1/agent-docs/rules",
    "/api/v1/agent-docs/errors",
)
DOC_CACHE_MAX_AGE_SECONDS = 24 * 60 * 60
CONTRACT_ERROR_CODES = {
    "DEV_DELIVERY_API_CONTRACT_MISMATCH",
    "DEV_DELIVERY_WORKFLOW_VERSION_UNSUPPORTED",
    "DEV_DELIVERY_ENDPOINT_REMOVED",
}


def credential_value() -> str:
    value = os.environ.get("ONEPRO_DEVOPS_KEY", "").strip()
    if not value:
        value = os.environ.get("ONEPRO-DEVOPS-KEY", "").strip()
    return value


def credential() -> dict[str, str]:
    raw = credential_value()
    if not raw:
        raise SystemExit("Missing ONEPRO_DEVOPS_KEY (or historical ONEPRO-DEVOPS-KEY).")
    if raw.startswith("{"):
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as error:
            raise SystemExit(f"Credential JSON is invalid: {error.msg}") from error
        bearer = str(data.get("bearerToken") or data.get("token") or "").strip()
        if bearer:
            return {"type": "BEARER", "token": bearer}
        access_key = str(data.get("accessKeyId") or data.get("accessKey") or "").strip()
        secret_key = str(data.get("secretKey") or "").strip()
        if access_key and secret_key:
            return {"type": "HMAC", "accessKey": access_key, "secretKey": secret_key}
        raise SystemExit("Credential JSON needs bearerToken, or accessKeyId and secretKey.")
    if raw.startswith("oab_"):
        return {"type": "BEARER", "token": raw}
    raise SystemExit("ONEPRO_DEVOPS_KEY must be an oab_ Bearer token or credential JSON.")


def validate_json_body(body: bytes) -> bytes:
    if not body:
        return body
    try:
        text = body.decode("utf-8")
    except UnicodeDecodeError as error:
        raise SystemExit("Request body must be valid UTF-8 JSON.") from error
    try:
        json.loads(text)
    except json.JSONDecodeError as error:
        raise SystemExit(f"Request body JSON is invalid: {error.msg} at line {error.lineno} column {error.colno}.") from error
    return body


def read_body(args: argparse.Namespace) -> bytes:
    if args.data is not None:
        if args.data != "-":
            raise SystemExit(
                "Inline --data JSON is disabled because shell expansion can corrupt Markdown. "
                "Use --data -, --data-file, or --data-base64."
            )
        body = sys.stdin.buffer.read()
    elif args.data_file is not None:
        try:
            body = Path(args.data_file).read_bytes()
        except OSError as error:
            raise SystemExit(f"Cannot read request body file: {error}.") from error
    elif args.data_base64 is not None:
        try:
            encoded = sys.stdin.buffer.read().strip() if args.data_base64 == "-" else args.data_base64.encode("ascii")
            body = base64.b64decode(encoded, validate=True)
        except (ValueError, UnicodeEncodeError) as error:
            raise SystemExit("--data-base64 must contain valid ASCII base64 data.") from error
    else:
        body = b""
    return validate_json_body(body)


def auth_headers(method: str, parsed: urllib.parse.SplitResult, body: bytes) -> dict[str, str]:
    value = credential()
    if value["type"] == "BEARER":
        return {
            "Authorization": f"Bearer {value['token']}",
            "X-OnePro-Agent-Origin": "ONEPRO_DEVOPS_SKILL",
        }
    timestamp = str(int(time.time() * 1000))
    nonce = secrets.token_urlsafe(18)
    body_hash = hashlib.sha256(body).hexdigest()
    canonical = "\n".join([method, parsed.path, parsed.query, timestamp, nonce, body_hash])
    digest = hmac.new(value["secretKey"].encode(), canonical.encode(), hashlib.sha256).digest()
    signature = base64.urlsafe_b64encode(digest).decode().rstrip("=")
    return {
        "X-OA-Access-Key": value["accessKey"],
        "X-OA-Secret-Key": value["secretKey"],
        "X-OA-Timestamp": timestamp,
        "X-OA-Nonce": nonce,
        "X-OA-Body-SHA256": body_hash,
        "X-OA-Signature": signature,
        "X-OnePro-Agent-Origin": "ONEPRO_DEVOPS_SKILL",
    }


def request(args: argparse.Namespace) -> int:
    method = args.method.upper()
    base_url = args.base_url.rstrip("/")
    path = args.path if args.path.startswith("/") else f"/{args.path}"
    url = f"{base_url}{path}"
    parsed = urllib.parse.urlsplit(url)
    body = read_body(args)
    mutating = method not in {"GET", "HEAD"} and not parsed.path.endswith(SAFE_POST_SUFFIXES)
    if mutating and not args.allow_write:
        raise SystemExit("Mutating request blocked. Re-run with --allow-write only when the workflow authorizes it.")
    headers = auth_headers(method, parsed, body)
    if body:
        headers["Content-Type"] = "application/json; charset=utf-8"
    if args.idempotency_key:
        headers["Idempotency-Key"] = args.idempotency_key
    if args.preview_digest:
        headers["X-Preview-Digest"] = args.preview_digest
    if args.dry_run:
        print(json.dumps({
            "method": method,
            "url": url,
            "bodySha256": hashlib.sha256(body).hexdigest(),
            "headerNames": sorted(headers),
            "mutating": mutating,
        }, ensure_ascii=False, indent=2))
        return 0
    req = urllib.request.Request(url, data=body if body else None, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=args.timeout) as response:
            output = response.read().decode("utf-8", errors="replace")
            return print_api_response(output, args.raw, args.expect_business_error)
    except urllib.error.HTTPError as error:
        output = error.read().decode("utf-8", errors="replace")
        print(output or f"HTTP {error.code}", file=sys.stderr)
        if contract_refresh_required(error.code, output):
            try:
                refresh_docs_cache(args)
                print(
                    "Agent Docs cache refreshed after a contract error; the failed write was not replayed.",
                    file=sys.stderr,
                )
            except (OSError, ValueError, urllib.error.HTTPError, urllib.error.URLError) as refresh_error:
                print(f"Agent Docs refresh also failed: {refresh_error}", file=sys.stderr)
        return 1
    except urllib.error.URLError as error:
        print(f"Request failed: {error.reason}", file=sys.stderr)
        return 1


def print_api_response(output: str, raw: bool = False, expect_business_error: bool = False) -> int:
    """Treat the One-Agent envelope as the real success contract, not HTTP 200."""
    try:
        envelope = json.loads(output)
    except json.JSONDecodeError:
        print(output or "Response is not valid JSON.", file=sys.stderr)
        return 1
    if not isinstance(envelope, dict) or "code" not in envelope:
        print(json.dumps(envelope, ensure_ascii=False), file=sys.stderr)
        return 1
    business_success = envelope.get("code") == 0
    if expect_business_error:
        if business_success:
            print("Expected a business error but the request succeeded.", file=sys.stderr)
            return 1
        print(json.dumps(compact_error(envelope), ensure_ascii=False, indent=2))
        return 0
    if not business_success:
        print(json.dumps(compact_error(envelope), ensure_ascii=False, indent=2), file=sys.stderr)
        return 1
    if raw:
        print(json.dumps(envelope, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(compact_data(envelope.get("data")), ensure_ascii=False, indent=2))
    return 0


def compact_error(envelope: dict) -> dict:
    error = envelope.get("error") if isinstance(envelope.get("error"), dict) else {}
    return {
        "success": False,
        "code": envelope.get("code"),
        "message": envelope.get("message"),
        "errorCode": error.get("code"),
        "context": error.get("context"),
        "suggestedAction": error.get("suggestedAction"),
    }


def compact_data(data):
    if not isinstance(data, dict):
        return data
    if "actionId" in data and "actionType" in data:
        return {
            "actionId": data.get("actionId"),
            "actionType": data.get("actionType"),
            "runId": data.get("runId"),
            "version": data.get("version"),
            "artifactCount": data.get("artifactCount"),
            "testExecutionCount": data.get("testExecutionCount"),
            "transition": compact_data(data.get("transition")) if data.get("transition") else None,
            "nextAction": compact_data(data.get("nextAction")) if data.get("nextAction") else None,
        }
    if "requiredInputs" in data and "allowedCommands" in data:
        return pick(data, "action", "phase", "expectedVersion", "canAutoExecute", "requiredInputs",
                    "missingEvidence", "allowedCommands", "schemaVersion", "schemaDigest",
                    "inputSchemas", "riskProfile")
    if "activityScope" in data and "totalEvents" in data:
        return pick(data, "startDate", "endDate", "activityScope", "totalEvents",
                    "totalCodeActivities", "totalTestActivities", "totalCollaborationActivities",
                    "totalWorkflowActivities", "totalActiveWorkItems", "totalActiveDays", "totalHours")
    if "runCount" in data and "completionRate" in data:
        return pick(data, "startDate", "endDate", "devProjectId", "runCount", "completedCount",
                    "completionRate", "firstPassRate", "averageRunVersion", "averageArtifactCount",
                    "duplicateArtifactRate", "reworkRunCount", "failedExecutionCount", "testSessionCount",
                    "averageAttemptsPerSession", "apiCallCount", "averageApiCallsPerRun", "inputTokens",
                    "cachedInputTokens", "outputTokens", "mainlineTokens", "orchestrationTokens",
                    "tokenCoverageRunCount", "responseBytes", "interpretation")
    if "activityClass" in data and "agentRole" in data:
        return pick(data, "id", "deliveryRunId", "operation", "activityClass", "agentRole", "modelName",
                    "inputTokens", "cachedInputTokens", "outputTokens", "toolCallCount", "requestCount",
                    "responseBytes", "durationMs", "actorKind", "origin", "createdAt")
    if {"run", "transition", "version", "synchronizedState"}.issubset(data):
        run = data.get("run") or {}
        return {
            "verified": data.get("synchronizedState") is True,
            "runId": run.get("id"),
            "runCode": run.get("runCode"),
            "version": data.get("version"),
            "phase": run.get("phase"),
            "targetCode": data.get("targetCode"),
            "targetStatus": data.get("targetStatus"),
            "requirementStatus": data.get("requirementStatus"),
        }
    if "requirement" in data and "workItem" in data and "deliveryRun" in data:
        return {
            "requirement": pick(data.get("requirement"), "id", "reqCode", "status"),
            "workItem": pick(data.get("workItem"), "id", "itemCode", "status"),
            "deliveryRun": compact_data(data.get("deliveryRun")),
        }
    if "runCode" in data or ("phase" in data and "version" in data):
        return pick(data, "id", "runCode", "version", "phase", "targetCode", "targetStatus",
                    "requirementCode", "executionMode", "interactionRequired", "canTest", "canComplete",
                    "nextCheckpoint", "allowedNextPhases")
    if "artifactType" in data:
        return pick(data, "id", "artifactType", "revision", "checksum", "changeVersion")
    if "checkpoint" in data and "gateDigest" in data:
        return pick(data, "id", "allowed", "checkpoint", "decision", "gateDigest", "expectedVersion",
                    "fromPhase", "toPhase", "missingEvidence", "valid", "changeVersion")
    if "recordedCount" in data:
        return pick(data, "runId", "version", "recordedCount")
    if "previewDigest" in data:
        return pick(data, "allowed", "missingFields", "missingEvidence", "duplicates", "devProjectId",
                    "devProjectName", "previewDigest", "expectedVersion", "policyDigest")
    compact = {}
    for key, value in data.items():
        if value is None or isinstance(value, (str, int, float, bool)):
            compact[key] = value
        elif isinstance(value, list):
            compact[f"{key}Count"] = len(value)
    return compact


def pick(value, *keys):
    if not isinstance(value, dict):
        return value
    return {key: value.get(key) for key in keys if key in value}


def authenticated_get(args: argparse.Namespace, path: str) -> dict:
    base_url = args.base_url.rstrip("/")
    url = f"{base_url}{path}"
    parsed = urllib.parse.urlsplit(url)
    req = urllib.request.Request(url, headers=auth_headers("GET", parsed, b""), method="GET")
    try:
        with urllib.request.urlopen(req, timeout=args.timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        output = error.read().decode("utf-8", errors="replace")
        print(output or f"HTTP {error.code}", file=sys.stderr)
        raise SystemExit(1) from error
    except urllib.error.URLError as error:
        raise SystemExit(f"Request failed: {error.reason}") from error


def print_data(value: dict, compact: bool = True) -> int:
    if value.get("code") != 0:
        print(json.dumps(value, ensure_ascii=False), file=sys.stderr)
        return 1
    data = value.get("data")
    print(json.dumps(compact_data(data) if compact else data, ensure_ascii=False, indent=2))
    return 0


def deterministic_request(args: argparse.Namespace, method: str, path: str, body: dict,
                          *, allow_write: bool = True) -> int:
    values = vars(args).copy()
    values.update({
        "method": method,
        "path": path,
        "data": None,
        "data_file": None,
        "data_base64": base64.b64encode(
            json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        ).decode("ascii"),
        "allow_write": allow_write,
        "dry_run": False,
        "preview_digest": None,
        "raw": getattr(args, "raw", False),
        "expect_business_error": getattr(args, "expect_business_error", False),
    })
    return request(argparse.Namespace(**values))


def claim(args: argparse.Namespace) -> int:
    return deterministic_request(args, "POST", f"/api/v1/dev-collab/delivery-runs/{args.run_id}/claim", {
        "expectedVersion": args.expected_version,
        "agentRunId": args.agent_run_id,
        "claimSource": args.claim_source,
    })


def artifact_save(args: argparse.Namespace) -> int:
    content = json.loads(Path(args.content_file).read_text(encoding="utf-8"))
    return deterministic_request(args, "POST", f"/api/v1/dev-collab/delivery-runs/{args.run_id}/artifacts", {
        "expectedVersion": args.expected_version,
        "artifactType": args.artifact_type,
        "contentJson": json.dumps(content, ensure_ascii=False, separators=(",", ":")),
        "generatedByAi": True,
    })


def tests_batch(args: argparse.Namespace) -> int:
    executions = json.loads(Path(args.executions_file).read_text(encoding="utf-8"))
    if not isinstance(executions, list):
        raise SystemExit("--executions-file must contain one JSON array.")
    return deterministic_request(
        args, "POST", f"/api/v1/dev-collab/delivery-runs/{args.run_id}/test-executions/batch",
        {"expectedVersion": args.expected_version, "executions": executions},
    )


def test_session(args: argparse.Namespace) -> int:
    payload = json.loads(Path(args.session_file).read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise SystemExit("--session-file must contain one JSON object.")
    payload["expectedVersion"] = args.expected_version
    return deterministic_request(
        args, "POST", f"/api/v1/dev-collab/delivery-runs/{args.run_id}/test-sessions", payload,
    )


def action_bundle(args: argparse.Namespace) -> int:
    payload = json.loads(Path(args.bundle_file).read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise SystemExit("--bundle-file must contain one JSON object.")
    payload["expectedVersion"] = args.expected_version
    payload["actionType"] = args.action_type
    return deterministic_request(
        args, "POST", f"/api/v1/dev-collab/delivery-runs/{args.run_id}/actions", payload,
    )


def managed_advance(args: argparse.Namespace) -> int:
    reason = args.reason
    if args.reason_file:
        try:
            reason = Path(args.reason_file).read_text(encoding="utf-8")
        except (OSError, UnicodeError) as error:
            raise SystemExit(f"Cannot read --reason-file as UTF-8: {error}") from error
    if not reason or not reason.strip():
        raise SystemExit("Advance reason must not be empty.")
    return deterministic_request(args, "POST", f"/api/v1/dev-collab/delivery-runs/{args.run_id}/managed-advance", {
        "expectedVersion": args.expected_version,
        "toPhase": args.to_phase,
        "reason": reason,
        "reworkType": args.rework_type,
        "conversationRef": args.conversation_ref,
    })


def workflow_incident(args: argparse.Namespace) -> int:
    summary = Path(args.summary_file).read_text(encoding="utf-8")
    return deterministic_request(args, "POST", "/api/v1/dev-collab/workflow-incidents", {
        "incidentKey": args.incident_key,
        "title": args.title,
        "failureStage": args.failure_stage,
        "summaryMarkdown": summary,
        "requestFingerprint": args.request_fingerprint,
        "devProjectId": args.dev_project_id,
    })


def run_view(args: argparse.Namespace) -> int:
    query = urllib.parse.urlencode({"view": args.view})
    response = authenticated_get(args, f"/api/v1/dev-collab/delivery-runs/{args.run_id}?{query}")
    if args.view == "FULL":
        return print_data(response)
    return print_api_response(json.dumps(response, ensure_ascii=False))


def gate_context(args: argparse.Namespace) -> int:
    return print_data(authenticated_get(args, f"/api/v1/dev-collab/delivery-runs/{args.run_id}/gate-context"))


def next_action(args: argparse.Namespace) -> int:
    response, _ = fetch_next_action(args)
    return print_data(response)


def quality_metrics(args: argparse.Namespace) -> int:
    query = {"startDate": args.start_date, "endDate": args.end_date}
    if args.dev_project_id is not None:
        query["devProjectId"] = args.dev_project_id
    suffix = urllib.parse.urlencode(query)
    return print_data(authenticated_get(args, f"/api/v1/dev-collab/delivery-quality?{suffix}"))


def changes(args: argparse.Namespace) -> int:
    query = urllib.parse.urlencode({"sinceVersion": args.since_version})
    return print_data(authenticated_get(args, f"/api/v1/dev-collab/delivery-runs/{args.run_id}/changes?{query}"))


def history(args: argparse.Namespace) -> int:
    query = urllib.parse.urlencode({"page": args.page, "pageSize": args.page_size})
    suffix = HISTORY_PATHS[args.kind]
    return print_data(authenticated_get(
        args, f"/api/v1/dev-collab/delivery-runs/{args.run_id}/{suffix}?{query}"
    ))


def clerk_context(args: argparse.Namespace) -> int:
    gate = authenticated_get(args, f"/api/v1/dev-collab/delivery-runs/{args.run_id}/gate-context")
    if gate.get("code") != 0:
        return print_data(gate)
    envelope = {
        "contract": "onepro-devops-clerk/v1",
        "runId": args.run_id,
        "gateContext": gate.get("data"),
    }
    if args.since_version is not None:
        query = urllib.parse.urlencode({"sinceVersion": args.since_version})
        delta = authenticated_get(args, f"/api/v1/dev-collab/delivery-runs/{args.run_id}/changes?{query}")
        if delta.get("code") != 0:
            return print_data(delta)
        envelope["changes"] = delta.get("data")
    print(json.dumps(envelope, ensure_ascii=False, indent=2))
    return 0


def step(args: argparse.Namespace) -> int:
    """Validate a prepared action against the live next-action schema and commit it atomically."""
    next_response, schemas = fetch_next_action(args)
    if next_response.get("code") != 0:
        return print_data(next_response)
    contract = next_response.get("data") or {}
    payload = json.loads(Path(args.bundle_file).read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise SystemExit("--bundle-file must contain one JSON object.")
    artifacts = payload.get("artifacts") or []
    if not isinstance(artifacts, list):
        raise SystemExit("bundle artifacts must be one JSON array.")
    for artifact in artifacts:
        if not isinstance(artifact, dict):
            raise SystemExit("every artifact must be one JSON object.")
        artifact_type = str(artifact.get("artifactType") or "").strip()
        content = artifact.get("contentJson")
        if isinstance(content, str):
            try:
                content = json.loads(content)
            except json.JSONDecodeError as error:
                raise SystemExit(f"{artifact_type} contentJson is invalid JSON: {error.msg}") from error
        if not isinstance(content, dict):
            raise SystemExit(f"{artifact_type} contentJson must be one JSON object.")
        schema = schemas.get(artifact_type) or {}
        validate_schema(artifact_type, content, schema)
        artifact["contentJson"] = json.dumps(content, ensure_ascii=False, separators=(",", ":"))
    payload["expectedVersion"] = contract.get("expectedVersion")
    payload["actionType"] = contract.get("action")
    return deterministic_request(
        args, "POST", f"/api/v1/dev-collab/delivery-runs/{args.run_id}/actions", payload,
    )


def validate_schema(name: str, content: dict, schema: dict) -> None:
    missing = [field for field in schema.get("requiredFields", []) if field not in content]
    if missing:
        raise SystemExit(f"{name} is missing required fields: {', '.join(missing)}")
    item_fields = schema.get("itemRequiredFields") or []
    if not item_fields:
        return
    array_fields = [field for field in schema.get("requiredFields", []) if isinstance(content.get(field), list)]
    for field in array_fields:
        for index, item in enumerate(content[field]):
            if not isinstance(item, dict):
                raise SystemExit(f"{name}.{field}[{index}] must be one JSON object.")
            item_missing = [key for key in item_fields if key not in item]
            if item_missing:
                raise SystemExit(
                    f"{name}.{field}[{index}] is missing required fields: {', '.join(item_missing)}"
                )


def cost_record(args: argparse.Namespace) -> int:
    payload = json.loads(Path(args.usage_file).read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise SystemExit("--usage-file must contain one JSON object with actual runtime usage.")
    return deterministic_request(
        args, "POST", f"/api/v1/dev-collab/delivery-runs/{args.run_id}/cost-events", payload,
    )


def fetch_next_action(args: argparse.Namespace) -> tuple[dict, dict]:
    cached = load_schema_cache(args)
    query = {}
    if cached and cached.get("schemaDigest"):
        query["knownSchemaDigest"] = cached["schemaDigest"]
    suffix = f"?{urllib.parse.urlencode(query)}" if query else ""
    response = authenticated_get(
        args, f"/api/v1/dev-collab/delivery-runs/{args.run_id}/next-action{suffix}"
    )
    if response.get("code") != 0:
        return response, {}
    data = response.get("data") or {}
    digest = data.get("schemaDigest")
    returned = data.get("inputSchemas") or {}
    if digest and returned:
        existing = cached.get("schemas", {}) if cached and cached.get("schemaDigest") == digest else {}
        merged = dict(existing)
        merged.update(returned)
        write_schema_cache(args, digest, merged)
        return response, merged
    if digest and cached and cached.get("schemaDigest") == digest:
        return response, cached.get("schemas", {})
    return response, returned


def verify_receipt(args: argparse.Namespace) -> int:
    body = validate_json_body(sys.stdin.buffer.read())
    value = json.loads(body)
    receipt = value.get("data", value)
    required = ["run", "transition", "version", "synchronizedState"]
    missing = [item for item in required if item not in receipt]
    if missing:
        raise SystemExit("Transition receipt is missing: " + ", ".join(missing))
    if receipt.get("synchronizedState") is not True:
        raise SystemExit("Transition receipt reports unsynchronized target state.")
    run = receipt["run"]
    result = {
        "verified": True,
        "runId": run.get("id"),
        "runCode": run.get("runCode"),
        "phase": run.get("phase"),
        "version": receipt.get("version"),
        "targetCode": receipt.get("targetCode"),
        "targetStatus": receipt.get("targetStatus"),
        "requirementStatus": receipt.get("requirementStatus"),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def docs_cache_path(args: argparse.Namespace) -> Path:
    configured = getattr(args, "cache_dir", None) or os.environ.get("ONEPRO_DEVOPS_CACHE_DIR")
    root = Path(configured).expanduser() if configured else Path(
        os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")
    ).expanduser() / "onepro-devops"
    base_url = args.base_url.rstrip("/")
    cache_key = hashlib.sha256(base_url.encode("utf-8")).hexdigest()[:16]
    return root / f"agent-docs-{cache_key}.json"


def schema_cache_path(args: argparse.Namespace) -> Path:
    configured = getattr(args, "cache_dir", None) or os.environ.get("ONEPRO_DEVOPS_CACHE_DIR")
    root = Path(configured).expanduser() if configured else Path(
        os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")
    ).expanduser() / "onepro-devops"
    base_url = args.base_url.rstrip("/")
    cache_key = hashlib.sha256(base_url.encode("utf-8")).hexdigest()[:16]
    return root / f"next-action-schemas-{cache_key}.json"


def load_schema_cache(args: argparse.Namespace) -> dict | None:
    try:
        value = json.loads(schema_cache_path(args).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if value.get("schemaVersion") != 1 or not isinstance(value.get("schemas"), dict):
        return None
    return value


def write_schema_cache(args: argparse.Namespace, digest: str, schemas: dict) -> None:
    path = schema_cache_path(args)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temporary.write_text(json.dumps({
        "schemaVersion": 1,
        "schemaDigest": digest,
        "schemas": schemas,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def load_docs_cache(args: argparse.Namespace) -> dict | None:
    path = docs_cache_path(args)
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if value.get("schemaVersion") != 1 or value.get("baseUrl") != args.base_url.rstrip("/"):
        return None
    if not isinstance(value.get("documents"), dict):
        return None
    return value


def docs_cache_fresh(cache: dict | None, max_age_seconds: int, now: float | None = None) -> bool:
    if not cache or max_age_seconds < 1:
        return False
    fetched_at = cache.get("fetchedAtEpoch")
    if not isinstance(fetched_at, (int, float)):
        return False
    age = (time.time() if now is None else now) - fetched_at
    return 0 <= age < max_age_seconds


def fetch_docs(args: argparse.Namespace) -> dict[str, dict]:
    base_url = args.base_url.rstrip("/")
    documents: dict[str, dict] = {}
    for path in DOC_PATHS:
        with urllib.request.urlopen(f"{base_url}{path}", timeout=args.timeout) as response:
            envelope = json.loads(response.read().decode("utf-8"))
        if envelope.get("code") != 0 or envelope.get("data") is None:
            raise ValueError(f"Agent Docs returned an invalid envelope for {path}")
        documents[path] = envelope
    return documents


def write_docs_cache(args: argparse.Namespace, documents: dict[str, dict]) -> dict:
    now = time.time()
    payload = {
        "schemaVersion": 1,
        "baseUrl": args.base_url.rstrip("/"),
        "fetchedAtEpoch": now,
        "fetchedAt": datetime.fromtimestamp(now, timezone.utc).isoformat(),
        "documents": documents,
    }
    payload["digest"] = hashlib.sha256(
        json.dumps(documents, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    path = docs_cache_path(args)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)
    return payload


def refresh_docs_cache(args: argparse.Namespace) -> dict:
    return write_docs_cache(args, fetch_docs(args))


def document_key(path: str) -> str:
    prefix = "/api/v1/agent-docs/"
    return path[len(prefix):] if path.startswith(prefix) else path


def document_digest(envelope: dict) -> str:
    return hashlib.sha256(
        json.dumps(envelope.get("data"), ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


def print_document(envelope: dict) -> None:
    data = envelope.get("data")
    if isinstance(data, dict) and isinstance(data.get("content"), str):
        print(data["content"])
        return
    print(json.dumps(data, ensure_ascii=False, indent=2))


def contract_refresh_required(http_status: int, output: str) -> bool:
    if http_status in {405, 410}:
        return True
    try:
        value = json.loads(output)
    except json.JSONDecodeError:
        return False
    code = str((value.get("error") or {}).get("code") or "")
    return code in CONTRACT_ERROR_CODES


def docs(args: argparse.Namespace) -> int:
    previous = load_docs_cache(args)
    max_age = args.max_age_hours * 60 * 60
    source = "cache"
    unavailable = False
    cache = previous
    if args.refresh or not docs_cache_fresh(cache, max_age):
        try:
            cache = refresh_docs_cache(args)
            source = "live"
        except (OSError, ValueError, json.JSONDecodeError, urllib.error.HTTPError, urllib.error.URLError) as error:
            if cache is None:
                print(f"Failed to read Agent Docs and no cache is available: {error}", file=sys.stderr)
                return 1
            source = "stale-cache"
            unavailable = True
    assert cache is not None
    documents = cache["documents"]
    selected = []
    if args.show:
        selected = [path for path in DOC_PATHS if document_key(path) == args.show]
        if not selected:
            print(f"Unknown Agent Docs key: {args.show}", file=sys.stderr)
            return 1
    elif args.all:
        selected = list(DOC_PATHS)
    if selected:
        for path in selected:
            print(f"\n===== {path} =====")
            print_document(documents[path])
        return 0
    previous_documents = previous.get("documents", {}) if previous else {}
    changed = [
        document_key(path) for path, envelope in documents.items()
        if path not in previous_documents
        or document_digest(previous_documents[path]) != document_digest(envelope)
    ]
    age = max(0, int(time.time() - cache["fetchedAtEpoch"]))
    summary = {
        "source": source,
        "baseUrl": cache["baseUrl"],
        "fetchedAt": cache["fetchedAt"],
        "ageSeconds": age,
        "maxAgeSeconds": int(max_age),
        "digest": cache["digest"],
        "changedDocuments": changed,
        "documentVersions": {
            document_key(path): (envelope.get("data") or {}).get("version")
            for path, envelope in documents.items()
        },
        "hint": "Use docs --show <key> only when a changed contract must be inspected; use docs --refresh on request.",
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    if unavailable:
        print("Agent Docs cache is expired and refresh failed; DevOps writes must stop.", file=sys.stderr)
        return 1
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    root.add_argument("--base-url", default=os.environ.get("ONEPRO_DEVOPS_BASE_URL", DEFAULT_BASE_URL))
    root.add_argument("--timeout", type=float, default=20.0)
    root.add_argument("--cache-dir")
    commands = root.add_subparsers(dest="command", required=True)
    docs_parser = commands.add_parser("docs", help="Use the 24-hour Agent Docs cache")
    docs_parser.add_argument("--refresh", action="store_true", help="Refresh the cache even when it is fresh")
    docs_output = docs_parser.add_mutually_exclusive_group()
    docs_output.add_argument("--show", help="Print one cached document by key, for example endpoints")
    docs_output.add_argument("--all", action="store_true", help="Print every cached document")
    docs_parser.add_argument("--max-age-hours", type=float, default=24.0)
    docs_parser.set_defaults(handler=docs)
    request_parser = commands.add_parser("request", help="Call an authenticated API endpoint")
    request_parser.add_argument("method")
    request_parser.add_argument("path")
    body_group = request_parser.add_mutually_exclusive_group()
    body_group.add_argument(
        "--data",
        metavar="-",
        help="Read exact UTF-8 JSON bytes from stdin. Inline JSON is intentionally rejected.",
    )
    body_group.add_argument("--data-file", help="Read exact UTF-8 JSON bytes from a file")
    body_group.add_argument(
        "--data-base64",
        metavar="BASE64|-",
        help="Decode a shell-safe base64 JSON body; use - to read base64 from stdin",
    )
    request_parser.add_argument("--idempotency-key")
    request_parser.add_argument("--preview-digest")
    request_parser.add_argument("--allow-write", action="store_true")
    request_parser.add_argument("--dry-run", action="store_true")
    request_parser.add_argument("--raw", action="store_true", help="Print the complete successful API envelope")
    request_parser.add_argument(
        "--expect-business-error", action="store_true",
        help="Return success only when the API envelope reports a business error",
    )
    request_parser.set_defaults(handler=request)
    claim_parser = commands.add_parser("claim", help="Atomically claim one Delivery Run")
    claim_parser.add_argument("run_id", type=int)
    claim_parser.add_argument("expected_version", type=int)
    claim_parser.add_argument("agent_run_id")
    claim_parser.add_argument("--claim-source", default="EXTERNAL_AGENT")
    claim_parser.add_argument("--idempotency-key", required=True)
    claim_parser.add_argument("--raw", action="store_true")
    claim_parser.set_defaults(handler=claim)
    artifact_parser = commands.add_parser("artifact-save", help="Save structured evidence from a JSON file")
    artifact_parser.add_argument("run_id", type=int)
    artifact_parser.add_argument("expected_version", type=int)
    artifact_parser.add_argument("artifact_type")
    artifact_parser.add_argument("--content-file", required=True)
    artifact_parser.add_argument("--idempotency-key", required=True)
    artifact_parser.add_argument("--raw", action="store_true")
    artifact_parser.set_defaults(handler=artifact_save)
    batch_parser = commands.add_parser("tests-batch", help="Record independent test executions in one transaction")
    batch_parser.add_argument("run_id", type=int)
    batch_parser.add_argument("expected_version", type=int)
    batch_parser.add_argument("--executions-file", required=True)
    batch_parser.add_argument("--idempotency-key", required=True)
    batch_parser.add_argument("--raw", action="store_true")
    batch_parser.set_defaults(handler=tests_batch)
    session_parser = commands.add_parser("test-session", help="Record one real test session or retry attempt")
    session_parser.add_argument("run_id", type=int)
    session_parser.add_argument("expected_version", type=int)
    session_parser.add_argument("--session-file", required=True)
    session_parser.add_argument("--idempotency-key", required=True)
    session_parser.add_argument("--raw", action="store_true")
    session_parser.set_defaults(handler=test_session)
    action_parser = commands.add_parser("action-bundle", help="Commit evidence, tests and transition as one business version")
    action_parser.add_argument("run_id", type=int)
    action_parser.add_argument("expected_version", type=int)
    action_parser.add_argument("action_type")
    action_parser.add_argument("--bundle-file", required=True)
    action_parser.add_argument("--idempotency-key", required=True)
    action_parser.add_argument("--raw", action="store_true")
    action_parser.set_defaults(handler=action_bundle)
    advance_parser = commands.add_parser("advance", help="Atomically approve and advance a fully managed Run")
    advance_parser.add_argument("run_id", type=int)
    advance_parser.add_argument("expected_version", type=int)
    advance_parser.add_argument("to_phase")
    advance_reason = advance_parser.add_mutually_exclusive_group(required=True)
    advance_reason.add_argument("--reason", help="Short plain-text reason; use --reason-file for Markdown")
    advance_reason.add_argument("--reason-file", help="Read the exact UTF-8 Markdown reason from a file")
    advance_parser.add_argument("--rework-type")
    advance_parser.add_argument("--conversation-ref")
    advance_parser.add_argument("--idempotency-key", required=True)
    advance_parser.add_argument("--raw", action="store_true")
    advance_parser.set_defaults(handler=managed_advance)
    incident_parser = commands.add_parser("incident", help="Record a minimal workflow infrastructure blocker")
    incident_parser.add_argument("--incident-key", required=True)
    incident_parser.add_argument("--title", required=True)
    incident_parser.add_argument("--failure-stage", required=True)
    incident_parser.add_argument("--summary-file", required=True)
    incident_parser.add_argument("--request-fingerprint")
    incident_parser.add_argument("--dev-project-id", type=int)
    incident_parser.add_argument("--idempotency-key", required=True)
    incident_parser.add_argument("--raw", action="store_true")
    incident_parser.set_defaults(handler=workflow_incident)
    run_parser = commands.add_parser("run", help="Read one Delivery Run; COMPACT is the default")
    run_parser.add_argument("run_id", type=int)
    run_parser.add_argument("--view", choices=["MINIMAL", "COMPACT", "FULL"], default="MINIMAL")
    run_parser.set_defaults(handler=run_view)
    gate_parser = commands.add_parser("gate-context", help="Read the minimal evidence and gate context")
    gate_parser.add_argument("run_id", type=int)
    gate_parser.set_defaults(handler=gate_context)
    next_parser = commands.add_parser("next-action", help="Read the server-selected next delivery action")
    next_parser.add_argument("run_id", type=int)
    next_parser.set_defaults(handler=next_action)
    quality_parser = commands.add_parser("quality", help="Read delivery flow quality metrics")
    quality_parser.add_argument("start_date")
    quality_parser.add_argument("end_date")
    quality_parser.add_argument("--dev-project-id", type=int)
    quality_parser.set_defaults(handler=quality_metrics)
    changes_parser = commands.add_parser("changes", help="Read changes after a Delivery Run version")
    changes_parser.add_argument("run_id", type=int)
    changes_parser.add_argument("since_version", type=int)
    changes_parser.set_defaults(handler=changes)
    history_parser = commands.add_parser("history", help="Read one paged audit history")
    history_parser.add_argument("run_id", type=int)
    history_parser.add_argument("kind", choices=sorted(HISTORY_PATHS))
    history_parser.add_argument("--page", type=int, default=1)
    history_parser.add_argument("--page-size", type=int, default=20)
    history_parser.set_defaults(handler=history)
    clerk_parser = commands.add_parser("clerk-context", help="Build a compact Clerk context envelope")
    clerk_parser.add_argument("run_id", type=int)
    clerk_parser.add_argument("--since-version", type=int)
    clerk_parser.set_defaults(handler=clerk_context)
    receipt_parser = commands.add_parser("verify-receipt", help="Verify a transition receipt read from stdin")
    receipt_parser.set_defaults(handler=verify_receipt)
    step_parser = commands.add_parser(
        "step", help="Validate a prepared bundle against live schemas and commit one atomic action"
    )
    step_parser.add_argument("run_id", type=int)
    step_parser.add_argument("--bundle-file", required=True)
    step_parser.add_argument("--idempotency-key", required=True)
    step_parser.add_argument("--raw", action="store_true")
    step_parser.set_defaults(handler=step)
    cost_parser = commands.add_parser(
        "cost-record", help="Record actual runtime token/tool usage without estimating missing values"
    )
    cost_parser.add_argument("run_id", type=int)
    cost_parser.add_argument("--usage-file", required=True)
    cost_parser.add_argument("--idempotency-key", required=True)
    cost_parser.add_argument("--raw", action="store_true")
    cost_parser.set_defaults(handler=cost_record)
    return root


def main() -> int:
    args = parser().parse_args()
    return args.handler(args)


if __name__ == "__main__":
    raise SystemExit(main())
