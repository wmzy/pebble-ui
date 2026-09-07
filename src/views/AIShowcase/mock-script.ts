// ─── Mock streaming service ─────────────────────────────────────────
// Network-free, timer-driven playback for the AI showcase. Every
// "assistant reply" below is a fixed list of steps that use-chat-run.ts
// walks with setTimeout — deterministic, replayable, and parameterized by
// the selected model (speed + style only, never content correctness).

export type RunStep =
  | { t: 'think'; reasoning: string }
  | { t: 'tool'; name: string; input: string; output: string }
  | { t: 'stream'; text: string }
  | { t: 'markdown'; content: string }
  | {
      t: 'approval';
      title: string;
      description: string;
      detail: string;
      onApprove: RunStep[];
      onDeny: RunStep[];
    };

export type ConversationScript = {
  id: string;
  title: string;
  subtitle: string;
  /** Whether opening this conversation auto-sends the opener and plays
   * the scripted run (the showcase scenarios do; the sandbox does not). */
  autoPlay: boolean;
  opener: string;
  steps: RunStep[];
};

export type MockModel = {
  value: string;
  label: string;
  description: string;
  contextLength: string;
  /** TokenCounter max — modest so the bar stays legible. */
  contextTokens: number;
  /** ms per revealed character (handed to StreamingText `speed`). */
  streamSpeed: number;
  /** Thinking phase duration. */
  thinkMs: number;
  /** Tool call "running" phase duration. */
  toolMs: number;
};

export const MODELS: MockModel[] = [
  {
    value: 'haze-swift',
    label: 'Haze Swift',
    description: 'Snappy, terse answers',
    contextLength: '4k',
    contextTokens: 4096,
    streamSpeed: 10,
    thinkMs: 900,
    toolMs: 700,
  },
  {
    value: 'haze-balanced',
    label: 'Haze Balanced',
    description: 'Default quality',
    contextLength: '8k',
    contextTokens: 8192,
    streamSpeed: 22,
    thinkMs: 1800,
    toolMs: 1200,
  },
  {
    value: 'haze-deep',
    label: 'Haze Deep',
    description: 'Longer reasoning, richer answers',
    contextLength: '16k',
    contextTokens: 16384,
    streamSpeed: 34,
    thinkMs: 2800,
    toolMs: 1700,
  },
];

/** Rough chars/4 heuristic — the same estimate most token counters ship. */
export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

// ─── Conversation A — streaming, thinking, tools, markdown ──────────

const cssSplitAnswer = `## How haze-ui ships per-component CSS

The library build runs in three passes:

1. \`BUILD_LIB=true vite build\` compiles every module with Linaria and emits one \`*.wyw-in-js.css\` per module (\`cssCodeSplit: true\` — lib mode would otherwise merge everything).
2. \`scripts/split-css.mjs\` groups those module files by component directory into \`dist/css/<component>.css\` subpaths, plus a dedicated \`dist/css/tokens.css\`.
3. An aggregate \`dist/haze-ui.css\` is published as \`haze-ui/styles.css\` for quick starts.

\`\`\`ts
// scripts/split-css.mjs — grouping rule (simplified)
const group = (file: string) =>
  file.includes('/tokens/') ? 'tokens' : kebab(basename(dirname(file)));
\`\`\`

<!-- MarkdownRenderer has no GFM table pass yet, so this table is a raw HTML block (legal CommonMark). -->
<table>
<tr><th>Artifact</th><th>Contents</th><th>Intended consumer</th></tr>
<tr><td>\`dist/css/tokens.css\`</td><td>light/dark themes, motion, spacing</td><td>everyone (required)</td></tr>
<tr><td>\`dist/css/button.css\`</td><td>Button and its classes only</td><td>Button importers</td></tr>
<tr><td>\`dist/haze-ui.css\`</td><td>union of every group</td><td>zero-config setups</td></tr>
</table>

> The aggregate's class set is asserted to equal the union of the per-component groups — a build-time invariant, not a test-time hope.`;

const conversationCss: ConversationScript = {
  id: 'css-split',
  title: 'CSS splitting deep dive',
  subtitle: 'Streaming · tools · markdown',
  autoPlay: true,
  opener: 'How does haze-ui split its CSS per component, and what does the build emit?',
  steps: [
    {
      t: 'think',
      reasoning: `The user asks about the CSS pipeline. Plan:
1. Recall the lib build mode — Linaria emits one CSS file per module.
2. Verify the grouping step and the exact artifacts with a docs lookup.
3. Answer with the three passes, the grouping rule, and the artifact table.`,
    },
    {
      t: 'tool',
      name: 'search_docs',
      input: 'query: "css code splitting per component"',
      output: 'css-manifest.json · 91 component css files · 534 classes',
    },
    {
      t: 'stream',
      text: 'Found it — the build groups Linaria’s per-module output into one CSS file per component. Here is the full picture:',
    },
    { t: 'markdown', content: cssSplitAnswer },
  ],
};

// ─── Conversation B — human-in-the-loop approval ────────────────────

const releaseNotes = `## haze-ui 1.14.0 released

- \`ConversationList\` — new \`end\` slot for per-item badges
- \`ToolCallCard\` — status dot now differentiates running vs pending
- \`TokenCounter\` — threshold colors tuned for dark theme

\`\`\`bash
pnpm add haze-ui@1.14.0
\`\`\`

Checks: lint 0 errors, tsc 0 errors, 827 tests passed, e2e 49/49.`;

const conversationRelease: ConversationScript = {
  id: 'release-approval',
  title: 'Ship 1.14.0',
  subtitle: 'Needs your approval',
  autoPlay: true,
  opener: 'Please ship version 1.14.0 — run the checks and deploy if they pass.',
  steps: [
    {
      t: 'think',
      reasoning: `Release request. Plan:
1. Run the check suite against the 1.14.0 tag.
2. Publishing to npm is a destructive action — escalate to the user with an approval card instead of proceeding silently.
3. On approval: publish, then summarize. On denial: hold and confirm nothing was touched.`,
    },
    {
      t: 'tool',
      name: 'run_checks',
      input: 'target: 1.14.0 · suites: lint, typecheck, unit, e2e',
      output: 'lint 0 errors · tsc 0 errors · unit 827 passed · e2e 49 passed',
    },
    {
      t: 'approval',
      title: 'Deploy haze-ui@1.14.0',
      description:
        'All checks passed. Publishing to npm and tagging the release is irreversible — your call.',
      detail: '3 components changed · changelog generated · dist 412.3 kB',
      onApprove: [
        {
          t: 'tool',
          name: 'publish_npm',
          input: 'tag: 1.14.0 · provenance: CI (verified)',
          output: '+ haze-ui@1.14.0 · tarball 412.3 kB · dist-tag latest',
        },
        { t: 'markdown', content: releaseNotes },
      ],
      onDeny: [
        {
          t: 'stream',
          text: 'Understood — release held. Nothing was published and no tag was created. The draft changelog is kept locally; ask me to retry whenever you are ready.',
        },
      ],
    },
  ],
};

// ─── Conversation C — sandbox ────────────────────────────────────────

const conversationSandbox: ConversationScript = {
  id: 'sandbox',
  title: 'Sandbox',
  subtitle: 'Type to get a scripted reply',
  autoPlay: false,
  opener: '',
  steps: [],
};

export const CONVERSATIONS: ConversationScript[] = [
  conversationCss,
  conversationRelease,
  conversationSandbox,
];

/** Reply chain used for free-typed follow-ups in any conversation. */
export function makeGenericReply(question: string): RunStep[] {
  const short =
    question.length > 48 ? `${question.slice(0, 45).trimEnd()}…` : question;
  return [
    {
      t: 'think',
      reasoning: `Question: “${short}”. Plan: answer directly with one concrete example, keep it tight, then offer a deeper dive.`,
    },
    {
      t: 'stream',
      text: 'Short answer first, then the details:',
    },
    {
      t: 'markdown',
      content: `### On “${short}”

- **The one-liner** — the mock engine replays scripted steps with timers, so every answer you see here is deterministic and network-free.
- **Why it matters** — you can replay the exact same conversation at three different model speeds to compare how streaming *feels*.
- **Try it** — switch the model in the header, hit Reset, and watch the pacing change.

Switch to **Haze Deep** for slower, longer answers; **Haze Swift** for near-instant ones.`,
    },
  ];
}
