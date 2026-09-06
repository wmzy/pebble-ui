# haze-ui × AG-UI protocol recipe

A Vite + React 19 app wiring the [AG-UI](https://docs.ag-ui.com) client
(`@ag-ui/client` + `@ag-ui/core`) event stream into haze-ui's agent
telemetry components: `StepTimeline`, `ToolCallCard`, `ApprovalCard`, plus
the chat surface (`ChatContainer` / `ChatMessage` / `StreamingText` /
`ChatInput` / `ThinkingIndicator`).

The default agent is a **scripted local `MockAgent`** — a subclass of
`AbstractAgent` whose `run()` returns a timed Observable of protocol
events. No backend is needed; the full lifecycle (steps, tool calls, an
approval gate, streamed text) plays out in the browser.

## Run it

```bash
# 1. build the library first — the recipe consumes dist/, not src/
cd <repo root>
pnpm install
pnpm build

# 2. install and run the recipe (independent install root)
cd examples/ag-ui-recipe
pnpm install
pnpm dev        # http://localhost:5173
```

Send a message: the run emits `STEP_STARTED/ FINISHED` (gather), streams
intro text, calls `search_docs` (ToolCallCard), then pauses on a
`CUSTOM` `approval-required` event → an `ApprovalCard` appears.
**Approve** runs the `write_file` step and streams the final summary;
**Deny** emits `RUN_ERROR` and aborts the run.

To swap in a real agent, set `VITE_AGUI_URL` (see `.env.example`) —
`createAgent()` in `src/mockAgent.ts` then returns
`new HttpAgent({ url })` pointing at any AG-UI-compatible backend
(LangGraph, CrewAI, Agno, Mastra, ...). The UI code does not change:
both are just `AbstractAgent` event streams. A dead/placeholder URL
surfaces as a runtime error banner (`role=alert`), never at build time.

## How it is wired

### The agent

`src/mockAgent.ts` implements the single abstract member of
`AbstractAgent`:

```ts
class MockAgent extends AbstractAgent {
  readonly approval$ = new Subject<boolean>();

  run(input: RunAgentInput): Observable<BaseEvent> {
    // scripted protocol-valid event sequence, paced with rxjs delay();
    // the CUSTOM 'approval-required' event pauses the pipeline until
    // approval$.next(true | false) resumes it
  }
}
```

The event sequence is protocol-valid by construction:
`RUN_STARTED` → `STEP_STARTED` → (`TEXT_MESSAGE_START` / `CONTENT`* /
`END`, `TOOL_CALL_START` / `ARGS` / `END` / `RESULT`) → `STEP_FINISHED` →
… → `RUN_FINISHED` (or `RUN_ERROR`).

### Events → component state

`App.tsx` registers one `AgentSubscriber` — this callback map is the
entire integration. Every haze component is a pure function of the state
slices it updates:

| AG-UI event (subscriber callback) | state | haze-ui rendering |
| --- | --- | --- |
| `RUN_STARTED` (`onRunStartedEvent`) | `thinking = true` | `<ThinkingIndicator>` until first text |
| `TEXT_MESSAGE_CONTENT` (`onTextMessageContentEvent`, gives accumulated `textMessageBuffer`) | `streaming` | `<ChatMessage role='assistant'><StreamingText text={buffer}></ChatMessage>` |
| `TEXT_MESSAGE_END` (complete buffer) | commit bubble | `<ChatMessage>` with plain text |
| `STEP_STARTED` / `STEP_FINISHED` | `steps[]` | `<StepTimeline><StepTimelineItem status='active' \| 'done'>` |
| `TOOL_CALL_START` | new entry `status='running'` | `<ToolCallCard name={toolCallName}>` |
| `TOOL_CALL_ARGS` (accumulated `toolCallBuffer`) | `args` | `<ToolCallCard input={pretty-printed JSON}>` |
| `TOOL_CALL_RESULT` | `status='done'`, `output` | `<ToolCallCard output={...}>` |
| `CUSTOM` `approval-required` | `approval` | `<ApprovalCard onApprove onDeny>` → resolves `MockAgent.approval$` |
| `RUN_ERROR` / run failure | `error`, active steps → `error` | `role=alert` banner + red timeline markers |
| `RUN_FINISHED` | `running = false` | `<ChatInput>` re-enabled |

ChatInput `onSend` does: append the user bubble, `agent.addMessage({ role:
'user', content })`, then `agent.runAgent()` — the mock echoes the last
user message into its scripted reply.

## Notes

- `haze-ui` is linked with `link:../..` — a live symlink to the repository
  root. Re-running `pnpm build` in the repo root immediately changes what
  the recipe serves (`dist/` must exist). No reinstall needed.
- The comment-only `pnpm-workspace.yaml` here makes this directory an
  isolated install root: without it, `pnpm install` walks up and silently
  installs the repository root (verified with pnpm 11).
- `resolve.dedupe: ['react', 'react-dom']` in `vite.config.ts` is load
  bearing: because `haze-ui` resolves through the repo root's
  `node_modules`, its peer deps would otherwise bind the root's react copy
  and produce two React instances.
- `rxjs` is pinned to the **exact** version `@ag-ui/client` depends on
  (`7.8.1`, not `^7.8.1`): two rxjs copies in the same graph make the
  `Observable<BaseEvent>` return type of `run()` structurally incompatible
  and the build fails with "Two different types with this name exist".
- Real agents surface human-in-the-loop gates as `Interrupt`s
  (`onRunFinishedEvent` outcome `interrupt`, resolved via `runAgent({
  resume })`); the mock's CUSTOM-event + Subject gate keeps the same UI
  (`ApprovalCard`) without the backend machinery.
- `app.css` is plain consumer CSS referencing `--haze-*` tokens — the
  intended consumer styling model: import `haze-ui/styles.css`, apply the
  `lightTheme` / `spacing` / `typography` classes, style against tokens.
