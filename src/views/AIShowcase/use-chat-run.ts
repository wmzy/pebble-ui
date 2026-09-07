
import type { MockModel, RunStep, ConversationScript  } from './mock-script';

import { useCallback, useEffect, useRef, useState } from 'react';

import { estimateTokens, makeGenericReply } from './mock-script';

// Items the renderer knows how to draw. One union, one id counter —
// patches are addressed by id so playback never rebuilds the list.
export type ChatItem =
  | { kind: 'message'; id: number; role: 'user' | 'assistant'; text: string }
  | {
      kind: 'thinking';
      id: number;
      phase: 'active' | 'done';
      label: string;
      reasoning: string;
      seconds: number;
    }
  | {
      kind: 'tool';
      id: number;
      name: string;
      input: string;
      output?: string;
      status: 'pending' | 'running' | 'done';
    }
  | {
      kind: 'approval';
      id: number;
      title: string;
      description: string;
      detail: string;
      status: 'pending' | 'approved' | 'denied';
    }
  | { kind: 'stream'; id: number; text: string; done: boolean }
  | { kind: 'markdown'; id: number; content: string };

export type RunStatus = 'idle' | 'running' | 'awaiting-approval' | 'done';

/** Cancellation token — one per playback; stale timers check it and die. */
type Ctl = { cancelled: boolean };

const TOKEN_TICK_MS = 180;

export function useChatRun(
  script: ConversationScript,
  model: MockModel
): {
  items: ChatItem[];
  tokens: number;
  status: RunStatus;
  send: (text: string) => void;
  decide: (id: number, decision: 'approved' | 'denied') => void;
  markStreamDone: (id: number) => void;
  reset: () => void;
} {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [tokens, setTokens] = useState(0);
  const [status, setStatus] = useState<RunStatus>('idle');

  const idRef = useRef(0);
  const queueRef = useRef<RunStep[]>([]);
  const ctlRef = useRef<Ctl | null>(null);
  const modelRef = useRef(model);
  // Playback reads model params at step start; sync post-commit so a
  // model switch retunes only steps that have not started yet.
  useEffect(() => {
    modelRef.current = model;
  });

  const pendingApprovalRef = useRef<{
    id: number;
    approve: RunStep[];
    deny: RunStep[];
  } | null>(null);
  const tokenTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Approximate tokens already credited to the active stream; snapped to
  // the exact estimate when StreamingText reports completion.
  const streamedRef = useRef<{ id: number; est: number; added: number } | null>(
    null
  );

  const nextId = useCallback(() => ++idRef.current, []);

  const pushItem = useCallback(
    (item: ChatItem) => setItems((prev) => [...prev, item]),
    []
  );

  const patchItem = useCallback((id: number, patch: Partial<ChatItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? ({ ...it, ...patch } as ChatItem) : it))
    );
  }, []);

  const addTokens = useCallback(
    (n: number) => setTokens((prev) => prev + n),
    []
  );

  const after = useCallback((ms: number, fn: () => void) => {
    const ctl = ctlRef.current;
    if (!ctl) return;
    setTimeout(() => {
      if (!ctl.cancelled) fn();
    }, ms);
  }, []);

  const stopTokenAccrual = useCallback(() => {
    if (tokenTimerRef.current != null) {
      clearInterval(tokenTimerRef.current);
      tokenTimerRef.current = null;
    }
    streamedRef.current = null;
  }, []);

  // Recursion seam: pump schedules itself for the next step; going through
  // the ref keeps the memoized callback free of a self-reference (and the
  // compiler lint happy). Synced post-commit — timers only fire after it.
  const pumpRef = useRef<() => void>(() => {
    /* replaced by the sync effect before any timer can fire */
  });

  const pump = useCallback(() => {
    const ctl = ctlRef.current;
    if (!ctl || ctl.cancelled) return;
    const step = queueRef.current.shift();
    if (!step) {
      setStatus('done');
      return;
    }
    const m = modelRef.current;

    switch (step.t) {
      case 'think': {
        const id = nextId();
        pushItem({
          kind: 'thinking',
          id,
          phase: 'active',
          label: `Thinking · ${m.label}`,
          reasoning: step.reasoning,
          seconds: Math.round(m.thinkMs / 100) / 10,
        });
        after(m.thinkMs, () => {
          patchItem(id, { phase: 'done' });
          addTokens(estimateTokens(step.reasoning));
          pumpRef.current();
        });
        break;
      }
      case 'tool': {
        const id = nextId();
        pushItem({
          kind: 'tool',
          id,
          name: step.name,
          input: step.input,
          status: 'pending',
        });
        after(320, () => patchItem(id, { status: 'running' }));
        after(320 + m.toolMs, () => {
          patchItem(id, { status: 'done', output: step.output });
          addTokens(estimateTokens(`${step.input} ${step.output}`));
          pumpRef.current();
        });
        break;
      }
      case 'stream': {
        const id = nextId();
        pushItem({ kind: 'stream', id, text: step.text, done: false });
        // Mirror StreamingText's 1-char-per-speed cadence: credit ~1 token
        // per 4 chars as they would have been revealed.
        const est = estimateTokens(step.text);
        const perTick = Math.max(1, Math.round(TOKEN_TICK_MS / (4 * m.streamSpeed)));
        let added = 0;
        streamedRef.current = { id, est, added };
        tokenTimerRef.current = setInterval(() => {
          if (added >= est) return;
          added += perTick;
          streamedRef.current = { id, est, added };
          addTokens(perTick);
        }, TOKEN_TICK_MS);
        // Completion arrives from the renderer: StreamingText onComplete
        // → markStreamDone(id) → pump().
        break;
      }
      case 'markdown': {
        const id = nextId();
        pushItem({ kind: 'markdown', id, content: step.content });
        addTokens(estimateTokens(step.content));
        after(160, () => pumpRef.current());
        break;
      }
      case 'approval': {
        const id = nextId();
        pendingApprovalRef.current = {
          id,
          approve: step.onApprove,
          deny: step.onDeny,
        };
        pushItem({
          kind: 'approval',
          id,
          title: step.title,
          description: step.description,
          detail: step.detail,
          status: 'pending',
        });
        setStatus('awaiting-approval');
        break;
      }
    }
  }, [after, addTokens, nextId, patchItem, pushItem]);

  useEffect(() => {
    pumpRef.current = pump;
  });

  const cancel = useCallback(() => {
    if (ctlRef.current) ctlRef.current.cancelled = true;
    ctlRef.current = null;
    queueRef.current = [];
    pendingApprovalRef.current = null;
    stopTokenAccrual();
  }, [stopTokenAccrual]);

  /** Sends the scripted opener and plays `script.steps`. */
  const playScript = useCallback(() => {
    cancel();
    const ctl: Ctl = { cancelled: false };
    ctlRef.current = ctl;
    pushItem({ kind: 'message', id: nextId(), role: 'user', text: script.opener });
    addTokens(estimateTokens(script.opener));
    setStatus('running');
    queueRef.current = [...script.steps];
    pump();
  }, [addTokens, cancel, nextId, pushItem, pump, script]);

  /** Free-typed user turn — queues a scripted generic reply. */
  const send = useCallback(
    (text: string) => {
      if (status === 'running' || status === 'awaiting-approval') return;
      if (!ctlRef.current) {
        const ctl: Ctl = { cancelled: false };
        ctlRef.current = ctl;
      }
      pushItem({ kind: 'message', id: nextId(), role: 'user', text });
      addTokens(estimateTokens(text));
      setStatus('running');
      queueRef.current.push(...makeGenericReply(text));
      pump();
    },
    [addTokens, nextId, pushItem, pump, status]
  );

  const decide = useCallback(
    (id: number, decision: 'approved' | 'denied') => {
      const pending = pendingApprovalRef.current;
      if (pending?.id !== id) return; // stale click (or nothing pending)
      pendingApprovalRef.current = null;
      patchItem(id, { status: decision });
      addTokens(24); // decision round-trip
      queueRef.current.unshift(...(decision === 'approved' ? pending.approve : pending.deny));
      setStatus('running');
      pump();
    },
    [addTokens, patchItem, pump]
  );

  const markStreamDone = useCallback(
    (id: number) => {
      const ctl = ctlRef.current;
      // No live run, or a cancelled one — ignore the completion echo.
      if (ctl?.cancelled !== false) return;
      const streamed = streamedRef.current;
      if (streamed?.id !== id) return;
      stopTokenAccrual();
      patchItem(id, { done: true });
      const remainder = Math.max(0, streamed.est - streamed.added);
      if (remainder > 0) addTokens(remainder);
      pump();
    },
    [addTokens, patchItem, pump, stopTokenAccrual]
  );

  const reset = useCallback(() => {
    cancel();
    setItems([]);
    setTokens(0);
    setStatus('idle');
    if (script.autoPlay) {
      // Restart on the next tick so the cancelled playback fully drains
      // (stale item patches from the old run land before the new list).
      setTimeout(() => playScript(), 0);
    }
  }, [cancel, playScript, script.autoPlay]);

  // Auto-play scripted conversations once on mount.
  const playedRef = useRef(false);
  useEffect(() => {
    if (script.autoPlay && !playedRef.current) {
      playedRef.current = true;
      playScript();
    }
  }, [playScript, script.autoPlay]);

  // Drain everything on unmount (covers both pane teardown and HMR).
  useEffect(
    () => () => {
      if (ctlRef.current) ctlRef.current.cancelled = true;
      if (tokenTimerRef.current != null) clearInterval(tokenTimerRef.current);
    },
    []
  );

  return { items, tokens, status, send, decide, markStreamDone, reset };
}
