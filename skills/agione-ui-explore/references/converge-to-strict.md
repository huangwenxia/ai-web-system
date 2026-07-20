# Converge Explore to Strict

Read this reference only when a user explicitly asks for `agione-ui`,
PM/frontend delivery, or production alignment.

## When to switch

| Signal | Action |
|---|---|
| “I choose S2 / use the second structure” | Stay in Explore; lock only that named decision and continue with the next unresolved material decision |
| “I choose V2 / the second final style works” | Stay in Explore; mark that rendered style preferred or approved |
| “V2 is close; make a small alternate region” | One final explore refine is acceptable |
| “None work; try again” | Continue explore with new theses |
| “Use agione-ui to converge / align this for production” | Strict convergence is authorized |
| “Send this to PM/frontend/production” | Strict convergence is authorized |

Selection is not convergence. A component, structure, or style preference never
implies permission to invoke `agione-ui`, copy the artifact into a
production-aligned target, or flatten its experimental component strategy.
Require an explicit convergence command.

## Handoff

Run this handoff only after explicit convergence authorization.

1. Preserve the selected file until the user decides whether to keep or clean
   the comparison set. Never delete existing variants automatically.
2. Copy it to the intended final filename only with user authorization.
3. Treat these selected attributes as an explicitly locked design intent:
   focal point, reading order, visual language, interaction model, component
   strategy, and accepted production deltas.
4. Invoke
   `agione-ui --direct --edit <selected-copy> "converge this selected explore
   direction to the strict contract"` so guided review does not reopen the
   already approved direction.
5. In strict mode:
   - restore strict information-architecture limits;
   - replace DS-external substitutes when a production component should own the
     behavior;
   - translate accepted experiment values into strict tokens/components without
     silently erasing the approved hierarchy or signature element;
   - normalize repeated L3 styles;
   - verify content/business boundaries;
   - run the strict structure evaluator and business checklist.

If strict normalization materially changes an approved visual attribute, render
that trade-off and ask the user instead of silently flattening the direction.

## Provenance note

The strict output may retain a concise provenance note:

```html
<!--AI-NOTES
converged-from: credit-dashboard-v2.html
original-explore-approach: "relationship map + exception timeline"
original-design-position: product-stretch
accepted-component-strategy: domain relationship map with persistent inspector
accepted-production-deltas: custom-component-model, typography-scale, custom-composition
strict-adjustments:
  - restored strict metric hierarchy
  - mapped shared interactions to production components
  - strict evaluator passed
AI-NOTES-->
```

Keep provenance out of customer-visible content.

## Original variants

Do not delete rejected or selected final variants automatically. Candidate
boards and scratch previews should already be ephemeral; do not preserve those
as project artifacts.
