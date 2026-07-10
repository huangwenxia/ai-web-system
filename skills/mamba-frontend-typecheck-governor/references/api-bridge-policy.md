# API Bridge Policy

Use a bridge only when generated contracts are incomplete or awkward but the app code is active and the runtime behavior is already proven. A bridge is a typed boundary; it is not a place to guess backend behavior.

## Allowed Bridge Cases

- A generated API method exists but dynamic access loses type information.
- A generated response type is too broad for an endpoint whose real contract is proven by generated types, backend samples, or nearby working code.
- Multiple active components need the same narrow cast around one generated API contract.

## Disallowed Bridge Cases

- Guessing missing request params or response fields.
- Accepting multiple possible response envelopes by scanning generic keys like `data`, `list`, `records`, `rows`, `items`, `children`, or `result`.
- Mapping unknown backend enum values into known states.
- Adding silent compatibility aliases without a source in generated code or backend contract.
- Casting through `any` in the page or component just to silence TypeScript.

## Placement

- Component-only helper: keep inside the component if it is small and private.
- Component capsule shared type: create sibling `types.ts`.
- Module-local API edge: create sibling or module-local `apiBridge.ts`.
- App-wide API edge: create app-local utility bridge, named for the API domain, such as `src/utils/cloudApiBridge.ts`.
- Public package problem: do not create an app bridge that masks an `@repo/request` contract bug.

## Bridge Shape

Keep bridge APIs narrow and explicit:

```ts
type ProvenCloudType = "aliyun" | "aws"

export function getCloudApi(api: CloudApiRoot, cloudType: ProvenCloudType) {
  return api[cloudType]
}
```

Prefer source-backed unions and generated types. If the source cannot be proven, stop and report the missing contract instead of building a bridge.

## Removal Rule

When generated API types catch up, delete the bridge and call generated clients directly. Bridges are temporary app-local boundaries around contract gaps.
