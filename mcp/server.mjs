/**
 * MCP stdio protocol core for the haze-ui docs server — JSON-RPC 2.0,
 * one message per NDJSON line.
 *
 * Pure by design: handleRequest(msg, data) maps one already-parsed message
 * to exactly one response object, or null for notifications (which are
 * never answered per JSON-RPC 2.0). The stdin/stdout framing loop lives
 * in index.mjs; tests call handleRequest directly.
 */
import { TOOL_DEFINITIONS, callTool } from './tools.mjs';

export const PROTOCOL_VERSION = '2025-06-18';
export const SERVER_INFO = { name: 'haze-ui-mcp', version: '1.0.0' };

const result = (id, value) => ({ jsonrpc: '2.0', id, result: value });
const failure = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

const isNotification = (msg) => msg.id === undefined || msg.id === null;

/**
 * Handle one parsed JSON-RPC message against the docs snapshot `data`.
 * Returns the response object, or null when the message is a notification
 * (nothing to answer) — callers must not write anything for null.
 */
export function handleRequest(msg, data) {
  if (
    msg === null ||
    typeof msg !== 'object' ||
    Array.isArray(msg) ||
    typeof msg.method !== 'string'
  ) {
    return failure(null, -32600, 'Invalid Request');
  }

  switch (msg.method) {
    case 'initialize':
      if (isNotification(msg)) return null;
      return result(msg.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });

    // Notifications are fire-and-forget — acknowledge by staying silent.
    case 'notifications/initialized':
    case 'notifications/cancelled':
    case 'notifications/progress':
      return null;

    case 'ping':
      if (isNotification(msg)) return null;
      return result(msg.id, {});

    case 'tools/list':
      if (isNotification(msg)) return null;
      return result(msg.id, { tools: TOOL_DEFINITIONS });

    case 'tools/call': {
      if (isNotification(msg)) return null;
      const name = msg.params?.name;
      if (typeof name !== 'string') {
        return failure(msg.id, -32602, "Invalid params: tools/call requires params.name");
      }
      try {
        return result(msg.id, callTool(name, msg.params?.arguments ?? {}, data));
      } catch (error) {
        // Protocol-level argument errors surface as JSON-RPC errors;
        // tool-level failures are reported inside the result (isError),
        // which is how MCP clients render tool output problems.
        if (error && error.code === -32602) {
          return failure(msg.id, error.code, error.message);
        }
        return result(msg.id, {
          content: [
            { type: 'text', text: `Error: ${error?.message ?? String(error)}` },
          ],
          isError: true,
        });
      }
    }

    default:
      // Unknown methods with an id get -32601; unknown notifications stay
      // silent, as JSON-RPC requires.
      return isNotification(msg)
        ? null
        : failure(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}
