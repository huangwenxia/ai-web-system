# Content and Service Boundaries

Use this reference for requirement fidelity, customer-visible copy, errors,
empty states, service/capability locking, and operational explanations.

## Contents

- [Requirement fidelity](#requirement-fidelity)
- [Customer-visible content](#customer-visible-content)
- [Voice and actions](#voice-and-actions)
- [Locked service or capability gate](#locked-service-or-capability-gate)
- [Locked-state visual treatment](#locked-state-visual-treatment)
- [Prototype state content](#prototype-state-content)

## Requirement fidelity

Treat explicit requirement tables as contracts, not suggestions:

- Keep role, menu, page, field, state, operation, validation, permission, unit,
  and conditional-display requirements.
- Do not change business data merely to improve composition.
- Do not add fields, badges, automation, or interactions that imply unsupported
  product behavior.
- Keep repeated mock objects consistent across pages and scenarios.
- When information is missing, ask rather than inventing a business rule.

If a literal visual value makes the shell unusable, inaccessible, or
contradictory, preserve the requirement evidence in a Rule Gap and explain the
minimal strict override.

## Customer-visible content

Visible UI contains business objects, states, values, scope, time, risk,
outcomes, and available actions. It must not teach the review audience how the
prototype was designed.

Do not expose phrases or blocks such as:

- 原型说明 / 逻辑说明 / 规则说明 / 本原型
- prototype / demo / why this page exists
- component names, chart-family labels, implementation state machines
- internal probes, routing explanations, or design trade-off lectures

Put that material in `<!--AI-NOTES-->`, the requirement document, or the
delivery response.

When business rules need visible explanation, convert them into concise state,
scope, billing cycle, updated time, reset time, exception, and action language.

## Voice and actions

- Buttons use verb + object: “部署模型 / Deploy Model”, “删除成员 / Delete
  Member”, “充值 / Top Up”.
- Errors state what happened and what the user can do next.
- Toasts state the changed result without “成功/successfully” or a final period.
- First-use empty states point to the first action. Filter/search no-result rows
  may simply state that no matching data exists.
- In-progress copy uses the continuing action and an ellipsis.
- Avoid “请/please”, empty marketing superlatives, and unexplained internal
  acronyms.
- Keep English title/button/tab casing consistent; use sentence case for body,
  help, error, and toast copy.

## Locked service or capability gate

Before drawing a locked state, answer:

1. What exactly is disabled: a service, capability, environment, mode, model,
   permission, or commercial entitlement?
2. Are named options independent services/capabilities?
3. What business outcome becomes available after enablement?
4. What scenarios are outside this capability?
5. What is the single next action?

The page should contain:

1. Explicit current state and subject.
2. A concise service/capability definition.
3. Two or three concrete unlocked outcomes.
4. One customer-understandable boundary statement.
5. One primary contact/action and necessary contact detail.

Do not merge independently named services into a synthetic hybrid. Do not show
deployment detection APIs, internal prerequisites, “Next Steps” filler,
duplicate service-status blocks, or repeated contact buttons.

Use explicit English nouns. For example, write “On-Prem Deployment Service”
when On-Prem names a service; do not let readers interpret it as a model type.

For Model Services:

- On-Prem means AGIOne deploys and runs a model in customer-controlled physical,
  virtualized, or data-center infrastructure and publishes an API.
- On-Cloud means AGIOne deploys and runs a model in private/public cloud
  infrastructure and publishes an API.
- A model already deployed outside AGIOne follows the supported external-key
  integration path; do not describe it as an On-Prem/On-Cloud deployment
  service outcome.

When English content crowds the card, change width, grid, gap, or wrapping
before shortening product meaning without approval.

## Locked-state visual treatment

The focus is disabled state, unlocked value, boundary, and contact action. A
lock, envelope, mask, or illustration is secondary.

Custom illustrations need semantic tokens for visually distinct parts such as
paper, body, flap, and lock; do not paint every layer with the same background
token and lose recognition in Dark mode.

Keep one primary CTA. Do not repeat it in a modal, sidebar, and Hero.

## Prototype state content

Use the shell prototype state machine for meaningful review states such as
normal, empty, loading, error/risk, permission, locked, or threshold states.
Each option must change real business state, not merely colors.

Keep review-only explanation in the floating business-state panel and AI notes.
Do not add a customer-visible “demo mode” explanation inside the page.
