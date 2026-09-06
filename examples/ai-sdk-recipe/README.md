# haze-ui × Vercel AI SDK recipe

A Vite + React 19 app wiring the [Vercel AI SDK](https://ai-sdk.dev)
(`@ai-sdk/react` + `ai`) chat streaming into haze-ui's agent components:
`ChatContainer`, `ChatMessage`, `StreamingText`, `ChatInput`,
`ThinkingIndicator`, and `ToolCallCard` for tool parts.

## Run it

```bash
# 1. build the library first — the recipe consumes dist/, not src/
cd <repo root>
pnpm install
pnpm build

# 2. install and run the recipe (independent install root)
cd examples/ai-sdk-recipe
pnpm install
cp .env.example .env    # put your OPENAI_API_KEY in it
pnpm dev                # http://localhost:5173
```

`pnpm build` runs `tsc --noEmit && vite build` — it never needs the API
key. Without a key the app builds and starts fine; the error only appears
at runtime, on the first message, as a `role=alert` banner under the chat
(`status: error`).

## How it is wired

### Server side — a one-file /api/chat endpoint

`vite.config.ts` contains a tiny Vite plugin (`chatApiPlugin`) that mounts
`POST /api/chat` on **both** the dev server and `vite preview`. The handler
is the canonical AI SDK server pattern:

```ts
const result = streamText({
  model: openai(model),                          // @ai-sdk/openai
  messages: await convertToModelMessages(body.messages),
});
return result.toUIMessageStreamResponse();       // UIMessage stream protocol
```

Credentials are read per request from `.env` / the environment
(`OPENAI_API_KEY`, optional `OPENAI_MODEL`, default `gpt-4o-mini`), never at
build time. In a real deployment this handler moves to your backend
unchanged — the client below does not change.

### Client side — useChat → haze-ui props

`useChat()` (from `@ai-sdk/react`) defaults to `POST /api/chat`, so the
client is just a render loop over its state:

| `useChat` value | haze-ui component / prop |
| --- | --- |
| `messages[].role` | `<ChatMessage role={...}>` (`user` / `assistant`) |
| `messages[].parts[type='text']` (final) | `<ChatMessage>` children (plain pre-wrap div) |
| last assistant `parts[type='text'].state === 'streaming'` | `<StreamingText text={part.text}>` (animated reveal) |
| `parts[type='reasoning'].state === 'streaming'` | `<ThinkingIndicator text='Reasoning…'>` (completed reasoning is collapsed) |
| `parts` where `type` starts with `tool-` (or `'dynamic-tool'`) | `<ToolCallCard name={...} input={...} output={...} status={...}>` |
| `status === 'submitted'` (or streaming with no content yet) | `<ThinkingIndicator>` under the messages |
| `status === 'submitted'` on last user message | `<ChatMessage status='sending'>` |
| `status === 'error'` on last assistant message | `<ChatMessage status='error'>` |
| `status !== 'ready'` | `<ChatInput disabled>` |
| `error.message` | `role=alert` banner |
| `stop()` / `regenerate()` | `<Button>` in the composer row |

Tool part state → `ToolCallCard` status mapping (`toolStatusMap` in
`App.tsx`):

| AI SDK `part.state` | `ToolCallCard` status |
| --- | --- |
| `input-streaming` | `pending` |
| `input-available` | `running` |
| `approval-requested` / `approval-responded` | `pending` / `running` |
| `output-available` | `done` (output = `JSON.stringify(part.output)`) |
| `output-error` / `output-denied` | `error` (errorText as output) |

`'step-start'`, file, source and `data-*` parts exist in the protocol but
are intentionally not rendered in this recipe.

## Notes

- `haze-ui` is linked with `link:../..` — a live symlink to the repository
  root. Re-running `pnpm build` in the repo root immediately changes what
  the recipe serves (`dist/` must exist). No reinstall needed.
- The comment-only `pnpm-workspace.yaml` here makes this directory an
  isolated install root: without it, `pnpm install` walks up and silently
  installs the repository root (verified with pnpm 11). pnpm 11's
  supply-chain age gate appends a `minimumReleaseAgeExclude` block to that
  file when a freshly published dependency is resolved — the repository
  root's own `pnpm-workspace.yaml` uses the same pattern; keep the entries.
- `resolve.dedupe: ['react', 'react-dom']` in `vite.config.ts` is load
  bearing: because `haze-ui` resolves through the repo root's
  `node_modules`, its peer deps would otherwise bind the root's react copy
  and produce two React instances.
- `app.css` is plain consumer CSS referencing `--haze-*` tokens — this is
  the intended consumer styling model: import `haze-ui/styles.css`, apply
  the `lightTheme` / `spacing` / `typography` classes, use any CSS you like
  against the tokens.
