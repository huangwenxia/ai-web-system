# Reasoning Architecture Framework Reference

## North Star

Move from symptoms to systems:

```text
Symptom -> Root Cause -> Layer -> Principle -> Architecture -> Execution
```

## Collaboration modes

### Mode 1: Diagnosis
Use when someone reports a problem, frustration, failed feature, bad dashboard, broken process, or unclear strategy.

Output:
- symptom
- deeper cause
- layer
- what not to fix
- what to correct instead

### Mode 2: Architecture Reset
Use when many local fixes accumulate and the system becomes bloated.

Output:
- current architecture
- desired architecture
- keep / remove / merge / redesign
- migration sequence

### Mode 3: Decision Support
Use when a human must decide but lacks context.

Output:
- situation
- evidence
- interpretation
- blind spots
- decision options
- recommended choice

### Mode 4: Team Alignment
Use when a concept must be shared across teams.

Output:
- shared language
- root-cause framing
- decision rationale
- execution brief

## Common layer examples

- Knowledge Production problem: data enters the system but digest/observation/learning quality is unknown.
- Knowledge Experience problem: knowledge exists but user only sees counts, logs, IDs, or titles.
- Human Decision problem: system asks for approval without enough context or reasoning.
- Operations problem: buttons, queues, logs, or master pipeline are not wired or traceable.
- Strategy problem: new signals challenge, strengthen, weaken, or extend core assumptions.

## Quality bar

A good answer should make the user feel:

- “Now I understand what kind of problem this is.”
- “Now I know what not to fix.”
- “Now I can explain this to my team.”
- “Now Codex or the team can execute without drifting back to local patches.”
