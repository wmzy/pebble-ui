import { AbstractAgent, HttpAgent } from '@ag-ui/client';
import { EventType } from '@ag-ui/core';
import type { BaseEvent, RunAgentInput } from '@ag-ui/core';
import { concat, delay, of, Subject, switchMap, take } from 'rxjs';
import type { Observable } from 'rxjs';

/** Emits one event, `ms` after subscription — the "typing speed" of the mock. */
function paced<T>(event: T, ms: number): Observable<T> {
  return of(event).pipe(delay(ms));
}

/**
 * A fully local, scripted AG-UI agent. It extends `AbstractAgent` and
 * implements the single abstract method — `run(input)` returning an
 * Observable of protocol events — which is exactly what a real transport
 * (HTTP, WebSocket, ...) does under the hood. No server involved: the whole
 * "agent run" is a timed event sequence, including an approval gate driven
 * by a Subject that the UI resolves via ApprovalCard.
 */
export class MockAgent extends AbstractAgent {
  /** The UI calls next(true/false) to resolve the CUSTOM approval gate. */
  readonly approval$ = new Subject<boolean>();

  constructor() {
    super({
      agentId: 'haze-mock-agent',
      description: 'Scripted in-browser AG-UI agent (no backend)',
      threadId: 'haze-demo-thread',
    });
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    const { threadId, runId, messages } = input;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const question =
      lastUser && typeof lastUser.content === 'string'
        ? lastUser.content
        : 'your question';

    const textId = `msg-${runId}-intro`;
    const finalId = `msg-${runId}-final`;
    const searchId = `call-${runId}-search`;
    const writeId = `call-${runId}-write`;

    const gather: Observable<BaseEvent>[] = [
      paced({ type: EventType.RUN_STARTED, threadId, runId }, 80),
      paced({ type: EventType.STEP_STARTED, stepName: 'gather' }, 120),
      paced({ type: EventType.TEXT_MESSAGE_START, messageId: textId, role: 'assistant' }, 120),
      paced(
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: textId, delta: `Looking into “${question}”. ` },
        140,
      ),
      paced(
        { type: EventType.TEXT_MESSAGE_CONTENT, messageId: textId, delta: 'Searching the docs first…' },
        140,
      ),
      paced({ type: EventType.TEXT_MESSAGE_END, messageId: textId }, 100),
      paced({ type: EventType.TOOL_CALL_START, toolCallId: searchId, toolCallName: 'search_docs' }, 160),
      paced(
        {
          type: EventType.TOOL_CALL_ARGS,
          toolCallId: searchId,
          delta: JSON.stringify({ query: question, scope: 'chat-components' }),
        },
        160,
      ),
      paced({ type: EventType.TOOL_CALL_END, toolCallId: searchId }, 120),
      paced(
        {
          type: EventType.TOOL_CALL_RESULT,
          toolCallId: searchId,
          messageId: `result-${searchId}`,
          content: JSON.stringify({
            hits: ['ChatContainer', 'StreamingText', 'ToolCallCard', 'StepTimeline', 'ApprovalCard'],
          }),
        },
        120,
      ),
      paced({ type: EventType.STEP_FINISHED, stepName: 'gather' }, 100),
      // Pause the run and hand control to the UI: the ApprovalCard reads
      // this CUSTOM event, and approval$.next(...) resumes the pipeline.
      paced(
        {
          type: EventType.CUSTOM,
          name: 'approval-required',
          value: {
            toolCallId: writeId,
            title: 'Write summary file',
            description: `The agent wants to persist the doc summary for “${question}” via write_file.`,
          },
        },
        160,
      ),
    ];

    const writePhase = (approved: boolean): Observable<BaseEvent> =>
      approved
        ? concat(
            paced({ type: EventType.STEP_STARTED, stepName: 'write' }, 250),
            paced({ type: EventType.TOOL_CALL_START, toolCallId: writeId, toolCallName: 'write_file' }, 150),
            paced(
              {
                type: EventType.TOOL_CALL_ARGS,
                toolCallId: writeId,
                delta: JSON.stringify({ path: 'docs/summary.md', content: `Summary of: ${question}` }),
              },
              150,
            ),
            paced({ type: EventType.TOOL_CALL_END, toolCallId: writeId }, 120),
            paced(
              {
                type: EventType.TOOL_CALL_RESULT,
                toolCallId: writeId,
                messageId: `result-${writeId}`,
                content: JSON.stringify({ bytes: 48 + question.length }),
              },
              120,
            ),
            paced({ type: EventType.STEP_FINISHED, stepName: 'write' }, 100),
            paced({ type: EventType.TEXT_MESSAGE_START, messageId: finalId, role: 'assistant' }, 150),
            paced(
              {
                type: EventType.TEXT_MESSAGE_CONTENT,
                messageId: finalId,
                delta: 'Done — searched the docs and wrote the summary to docs/summary.md. ',
              },
              140,
            ),
            paced(
              {
                type: EventType.TEXT_MESSAGE_CONTENT,
                messageId: finalId,
                delta: 'The write step only ran because you approved it; denying aborts the run.',
              },
              140,
            ),
            paced({ type: EventType.TEXT_MESSAGE_END, messageId: finalId }, 100),
            paced({ type: EventType.RUN_FINISHED, threadId, runId }, 80),
          )
        : of<BaseEvent>({
            type: EventType.RUN_ERROR,
            message: 'User denied the write_file tool call.',
          });

    return concat(
      ...gather,
      this.approval$.pipe(take(1), switchMap(writePhase)),
    );
  }
}

/**
 * VITE_AGUI_URL (see .env.example) swaps the scripted MockAgent for a real
 * HttpAgent that speaks the AG-UI HTTP protocol against any compatible
 * backend (LangGraph, CrewAI, Agno, Mastra, ...). The UI code does not
 * change: both are just AbstractAgent event streams.
 */
export function createAgent(): MockAgent | HttpAgent {
  const url: string | undefined = import.meta.env.VITE_AGUI_URL || undefined;
  return url ? new HttpAgent({ url }) : new MockAgent();
}
