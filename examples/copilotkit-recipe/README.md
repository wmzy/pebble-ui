# haze-ui × CopilotKit recipe

A Vite + React 19 app wiring [CopilotKit](https://copilotkit.ai) v2
(`@copilotkit/react-core` `/v2` entry) around a haze-ui page: the agent
**reads** the page state through `useAgentContext` and **drives the very
same controls** through `useFrontendTool` — both sides write through
haze-ui's controllable state (`useControl`), so a Select, Switch and Dialog
each have exactly one state with two drivers: the user and the agent.

The demo page is a small deployment console: an environment `Select`, a
notification `Switch`, a `Badge`, a confirm `Dialog` (all haze-ui) and an
activity log that records who changed what (`USER` vs `AGENT` rows).

## Run it

CopilotKit's runtime is a server-side component, so unlike the
ai-sdk-recipe this example runs **two processes** (the documented
[React SPA pattern](https://docs.copilotkit.ai/react-spa)):

```bash
# 1. build the library first — the recipe consumes dist/, not src/
cd <repo root>
pnpm install
pnpm build

# 2. install the recipe (independent install root)
cd examples/copilotkit-recipe
pnpm install
cp .env.example .env    # put your OPENAI_API_KEY in it

# 3. terminal A: the CopilotKit runtime (port 8200)
pnpm dev:runtime

# 4. terminal B: the Vite app (port 5173)
pnpm dev                # http://localhost:5173
```

Without a key both servers still start and `pnpm build` passes; the first
chat message fails at the model call and surfaces as a `role=alert`
banner at the bottom of the page (the provider's `onError`), with the
stack in the runtime terminal.

Then, in the chat sidebar, try:

- "switch to production and open the deploy dialog" — the agent calls
  `setEnvironment` + `openDeploymentDialog`, the haze-ui Select and Dialog
  move, the activity log gains `AGENT` rows.
- "mute deploy notifications" — `setNotifications` flips the Switch.
- "what's the current console state?" — answered from the
  `useAgentContext` snapshot, not from the model's memory.

## How it is wired

### Runtime — `server.ts` (terminal A)

A ~40-line Node server hosting Copilot Runtime at
`http://localhost:8200/api/copilotkit` with a `BuiltInAgent` (CopilotKit's
own model-calling agent) registered as `default`, which the chat connects
to automatically:

```ts
const runtime = new CopilotRuntime({
  agents: { default: new BuiltInAgent({ model: 'openai:gpt-5.4-mini', prompt: '…' }) },
});
createServer(createCopilotNodeListener({ runtime, basePath: '/api/copilotkit', cors: true }))
  .listen(8200);
```

- `cors: true` is **required**: the app (5173) and runtime (8200) are
  different origins and the Node listener opts out of CORS by default.
- No `intelligence` / `identifyUser` options — per the quickstart the
  runtime then falls back to SSE mode with an in-memory runner; chat
  works, only persistent Threads and the Inspector stay locked.
- `server.ts` includes a tiny no-dependency `.env` reader so
  `cp .env.example .env` is enough; swap in dotenv in production.
- The BuiltInAgent is the placeholder: replace it with a LangGraph /
  CrewAI / Mastra / … agent and the frontend below does not change.

### Frontend — provider, context, tools (terminal B)

```tsx
import { CopilotKitProvider, CopilotSidebar, useAgentContext, useFrontendTool }
  from '@copilotkit/react-core/v2';
import '@copilotkit/react-core/v2/styles.css';
```

| piece | haze-ui side |
| --- | --- |
| `<CopilotKitProvider runtimeUrl>` | absolute URL — a SPA has no shared origin with the runtime (`VITE_COPILOT_RUNTIME_URL` overrides it) |
| `useAgentContext({ description, value })` | `value` is a live snapshot of the console state (environment, notifications, dialog visibility, deploy count, activity tail) — the v2 replacement of `useCopilotReadable`. Values are JSON-stringified on the wire; agents must parse them. |
| `useFrontendTool({ name, description, parameters, handler }, deps)` | the v2 replacement of `useCopilotAction`. Zod schemas (`zod` ≥ 3.25 is the peer floor) describe the args; the `handler` runs in the browser. |
| `<CopilotSidebar defaultOpen>` | the chat surface — swap for `CopilotPopup` / `CopilotChat` (same props), styled by the one-time `v2/styles.css` import. |
| provider `onError` | `role=alert` banner — runtime/agent/tool errors surface instead of a silently mute chat. |

### The point of the demo: one state, two drivers

Every controllable haze-ui component is wired the library's docs
prescribe for externally-driven state:

```tsx
const [environment, setEnvironment, environmentControl] =
  useControl<Environment>(undefined, 'staging');

<Select value={environmentControl} onChange={…}>…</Select>   // user driver
useFrontendTool({ name: 'setEnvironment', …,
  handler: async ({ environment: next }) => {                // agent driver
    setEnvironment(next);
    log('agent', `environment switched to ${next}`);
    return `Environment selector switched to ${next}.`;
  } }, [environment, log]);
```

The `Control` object from `useControl`'s third tuple element is handed to
the component; both the UI's native events and the agent's tool handlers
write through the same setter, so there is no second source of truth to
reconcile. `useAgentContext` re-registers on every render with the
current values, which keeps the agent's snapshot fresh for free.

## Differences from the sibling recipes

| | ai-sdk-recipe | ag-ui-recipe | this recipe |
| --- | --- | --- | --- |
| what CopilotKit/the SDK provides | chat transport (`useChat`) | agent event stream | **in-app copilot framework**: provider + chat UI + agent↔UI bridge |
| haze-ui's role | renders the chat (ChatMessage, ToolCallCard…) | renders telemetry | the **controlled app itself**; CopilotKit brings its own chat UI |
| server | Vite middleware in `vite.config.ts` (one process) | none (browser mock) | separate Node runtime server (`server.ts`, two processes) |
| state direction | SDK → UI | agent events → UI | **bidirectional**: UI → agent (`useAgentContext`) and agent → UI (`useFrontendTool`) |

## Notes

- `haze-ui` is linked with `link:../..` — a live symlink to the repository
  root. Re-running `pnpm build` in the repo root immediately changes what
  the recipe serves (`dist/` must exist). No reinstall needed.
- The comment-only `pnpm-workspace.yaml` here makes this directory an
  isolated install root: without it, `pnpm install` walks up and silently
  installs the repository root (verified with pnpm 11). Its `allowBuilds`
  block explicitly denies esbuild's and `@scarf/scarf`'s build scripts —
  esbuild's binary ships as a platform optional dependency and
  `@scarf/scarf` is telemetry — so installs don't stop on the
  ignored-builds prompt. pnpm may append a `minimumReleaseAgeExclude`
  block for freshly published dependencies; keep those entries.
- `resolve.dedupe: ['react', 'react-dom']` in `vite.config.ts` is load
  bearing: because `haze-ui` resolves through the repo root's
  `node_modules`, its peer deps would otherwise bind the root's react copy
  and produce two React instances.
- CopilotKit v1 (`@copilotkit/react-ui`, `useCopilotAction`,
  `useCopilotReadable`) is deprecated; this recipe uses the v2 API
  (`/v2` subpath of `@copilotkit/react-core`) per the current docs. The
  v1→v2 hook mapping used here: `useCopilotReadable` → `useAgentContext`,
  `useCopilotAction` → `useFrontendTool`.
- `app.css` is plain consumer CSS referencing `--haze-*` tokens — the
  intended consumer styling model: import `haze-ui/styles.css`, apply the
  `lightTheme` / `spacing` / `typography` classes, style against tokens.
