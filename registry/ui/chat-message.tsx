/**
 * haze-ui ChatMessage — thin re-export wrapper for the shadcn CLI.
 *
 * The anchor of the haze-ui AI chat kit: role-aware message bubbles
 * (user / assistant / system) with streaming-friendly content slots.
 * The rest of the kit is importable from `haze-ui` directly:
 * `ChatContainer`, `ChatInput`, `StreamingText`, `MarkdownRenderer`.
 *
 * Docs:    https://github.com/wmzy/haze-ui#readme
 * Source:  https://github.com/wmzy/haze-ui/tree/main/src/lib/components/ChatMessage
 *
 * Styles — import once in your app entry (haze-ui ships JS and CSS separately):
 *
 *   import 'haze-ui/styles.css';           // full sheet (~12kB gzipped)
 *   // or per-component:
 *   import 'haze-ui/css/tokens.css';
 *   import 'haze-ui/css/chat-message.css';
 *
 * Then activate the design tokens on a container (usually <body>):
 *
 *   import { lightTheme, spacing, typography } from 'haze-ui';
 *   <body className={`${lightTheme} ${spacing} ${typography}`}>
 */
export { ChatMessage } from 'haze-ui';
export type { ChatMessageProps, ChatMessageRole } from 'haze-ui';
