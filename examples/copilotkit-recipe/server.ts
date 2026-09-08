import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';

import { BuiltInAgent, CopilotRuntime } from '@copilotkit/runtime/v2';
import { createCopilotNodeListener } from '@copilotkit/runtime/v2/node';

/**
 * Load KEY=VALUE pairs from a local .env file into process.env (without
 * overriding variables that are already set). A tiny no-dependency reader
 * so `cp .env.example .env && pnpm dev:runtime` just works; replace with
 * dotenv/tsx --env-file in a real deployment if you prefer.
 */
function loadDotEnv(path = '.env'): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnv();

const runtime = new CopilotRuntime({
  agents: {
    // The chat auto-connects to the agent registered as "default". The
    // BuiltInAgent calls the model directly — swap in a LangGraph/CrewAI/
    // Mastra/... agent here later without touching the frontend.
    default: new BuiltInAgent({
      model: process.env.COPILOT_MODEL ?? 'openai:gpt-5.4-mini',
      prompt: [
        'You are the copilot of a deployment console built with haze-ui.',
        'The page registers its live UI state with useAgentContext and you',
        'control the page through frontend tools (setEnvironment,',
        'setNotifications, openDeploymentDialog). Prefer acting through',
        'those tools over describing steps whenever the user asks for a',
        'change; confirm the result afterwards in one short sentence.',
        'The activity log already records every change you make, so do not',
        'restate the full log.',
      ].join(' '),
    }),
  },
  // No `intelligence` / `identifyUser` options: per the quickstart this
  // falls back to SSE mode with an in-memory runner — chat works, only
  // persistent Threads and the Inspector stay unavailable.
});

const port = Number(process.env.PORT ?? 8200);

createServer(
  createCopilotNodeListener({
    runtime,
    basePath: '/api/copilotkit',
    // Required: the Vite app (5173) and this server (8200) are different
    // origins, so the runtime must opt into CORS or every request fails
    // preflight. This flag is off by default on the Node listener.
    cors: true,
  }),
).listen(port, () => {
  console.log(`Copilot Runtime listening at http://localhost:${port}/api/copilotkit`);
});
