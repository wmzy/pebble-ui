#!/usr/bin/env node
/**
 * haze-ui MCP server entry — stdio JSON-RPC 2.0 over NDJSON frames.
 *
 * Docs snapshot resolution, first hit wins:
 *   1. $HAZE_UI_MCP_DOCS            (explicit override)
 *   2. <package root>/dist/mcp-docs.json   (published layout)
 *   3. <package root>/mcp-docs.json        (repo-root development fallback)
 *
 * stdout carries ONLY protocol frames — anything else would corrupt the
 * stream — so all logging goes to stderr.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { handleRequest } from './server.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const resolveDocsPath = () => {
  const candidates = [
    process.env.HAZE_UI_MCP_DOCS,
    path.join(packageRoot, 'dist', 'mcp-docs.json'),
    path.join(packageRoot, 'mcp-docs.json'),
  ].filter(Boolean);
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    console.error(
      `haze-ui-mcp: no docs snapshot found. Tried:\n` +
        candidates.map((candidate) => `  - ${candidate}`).join('\n') +
        `\nGenerate one with \`node scripts/generate-mcp-docs.mjs\` — the published package ships dist/mcp-docs.json.`
    );
    process.exit(1);
  }
  return found;
};

const docsPath = resolveDocsPath();
const data = JSON.parse(readFileSync(docsPath, 'utf8'));
console.error(
  `haze-ui-mcp: serving ${Object.keys(data.components ?? {}).length} components, ` +
    `${(data.tokens ?? []).length} tokens from ${docsPath}`
);

const send = (message) => {
  process.stdout.write(`${JSON.stringify(message)}\n`);
};

const rl = createInterface({ input: process.stdin, terminal: false });
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }
  const response = handleRequest(msg, data);
  if (response !== null) send(response);
});
