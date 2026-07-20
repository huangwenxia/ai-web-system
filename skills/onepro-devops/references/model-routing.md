# Model Routing

Read this file when a task uses Codex subagents or the user asks to reduce DevOps transaction cost.

## Routing Order

1. Use `scripts/onepro_devops.py` directly for deterministic requests and validation. Do not spend model tokens when a script can decide the exact action.
2. Reuse one `onepro_devops_clerk` custom agent for the whole Delivery Run when orchestration needs a model to operate the deterministic workflow.
3. Keep the user-selected main Agent for requirement meaning, project/scope resolution, solution design, code, test strategy, `PATCH_REWORK|SCOPE_REWORK`, acceptance semantics, and final truth.

Never switch the main thread model. Never create one Clerk per API call. Never allow a Clerk to spawn another Clerk.

## Context Budget

- Bootstrap with the Skill entry plus only the mode/evidence reference required by the current phase.
- Keep one full business snapshot, then use versioned deltas; never resend unchanged artifacts or FULL Run history.
- Normal transaction output should stay below 1 KB and contain only IDs, version, phase, missing gates, digests, and receipt truth.
- A low/medium-risk Run should normally need no more than 15-20 API calls outside real test/deployment operations.
- Record actual runtime usage with cost-record and classify it as MAINLINE or ORCHESTRATION. Never estimate unavailable Token values.

Install the personal custom agent with:

```bash
python3 scripts/install_clerk.py
```

Override only the Clerk model when the organization uses another low-cost model:

```bash
ONEPRO_DEVOPS_CLERK_MODEL=organization-mini-model python3 scripts/install_clerk.py
```

Codex custom agents are standalone TOML files under `~/.codex/agents/` or project `.codex/agents/`. The required fields are `name`, `description`, and `developer_instructions`; `model`, `model_reasoning_effort`, and `sandbox_mode` may override the parent session. Source: <https://learn.chatgpt.com/docs/agent-configuration/subagents#custom-agents>.

## Main-Agent Decisions

Return these to the main Agent without guessing:

- ambiguous project, duplicate, repository, branch, path, person, or target object;
- solution, architecture, implementation, test strategy, acceptance, or completion judgment;
- frontend ownership when facts are insufficient;
- rework classification or any scope expansion;
- a failed gate that cannot be satisfied with already-approved evidence.

Use `NEED_MAIN_DECISION` and include verified facts plus the smallest exact decision required.
