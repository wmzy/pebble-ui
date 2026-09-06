import { Readable } from 'node:stream';
import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';

import react from '@vitejs/plugin-react';
import { convertToModelMessages, streamText } from 'ai';
import type { UIMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { defineConfig, loadEnv } from 'vite';
import type { Connect, Plugin } from 'vite';

function readJsonBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/**
 * A tiny in-process POST /api/chat endpoint so this recipe runs with a
 * single `pnpm dev` — no separate server to start. In a real app the same
 * handler body lives on your backend (Node route, Next.js route handler,
 * ...); the client side (`useChat` defaults to POST /api/chat) does not
 * change.
 *
 * The OpenAI credentials are read per request, never at build time:
 * `pnpm build` succeeds without any key, and a missing key only surfaces
 * as a runtime error on the first message.
 */
function chatApiPlugin(env: Record<string, string>): Plugin {
  const handler: Connect.NextHandleFunction = async (req, res) => {
    try {
      const { messages } = JSON.parse(await readJsonBody(req)) as {
        messages: UIMessage[];
      };
      const apiKey = env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
      if (!apiKey) {
        // plain text body: useChat surfaces it verbatim as error.message
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain');
        res.end(
          'OPENAI_API_KEY is not set. Copy .env.example to .env, put your key in it, and restart `pnpm dev`.',
        );
        return;
      }

      const openai = createOpenAI({ apiKey });
      const model = env.OPENAI_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
      const result = streamText({
        model: openai(model),
        messages: await convertToModelMessages(messages),
      });
      const response = result.toUIMessageStreamResponse();

      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (!response.body) {
        res.end();
        return;
      }
      Readable.fromWeb(response.body as unknown as NodeWebReadableStream).pipe(res);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('content-type', 'text/plain');
      res.end(err instanceof Error ? err.message : String(err));
    }
  };

  return {
    name: 'haze-ai-chat-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', handler);
    },
    configurePreviewServer(server) {
      // also serves the endpoint for `vite preview` (production bundle)
      server.middlewares.use('/api/chat', handler);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), chatApiPlugin(env)],
    // `haze-ui` is a live symlink (link:../..) into the repository root, so
    // its own peer deps would otherwise resolve to the root's react copy.
    // Dedupe pins every resolution to this app's react/react-dom instance.
    resolve: { dedupe: ['react', 'react-dom'] },
  };
});
