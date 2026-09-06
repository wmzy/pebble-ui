import type { ControlOrValue } from 'react-use-control';

import { useMemo } from 'react';
import { useControl } from 'react-use-control';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp?: string;
};

type LogViewerProps = {
  logs: LogEntry[];
  filter?: ControlOrValue<LogLevel | null>;
  className?: string;
};

const wrapper = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  line-height: var(--haze-leading-relaxed);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  overflow: hidden;
`;

const toolbar = css`
  display: flex;
  gap: var(--haze-space-1);
  padding: var(--haze-space-2) var(--haze-space-3);
  background: var(--haze-color-bg-muted);
  border-bottom: 1px solid var(--haze-color-border);
`;

const filterBtn = css`
  padding: var(--haze-space-1) var(--haze-space-2);
  border: 1px solid transparent;
  border-radius: var(--haze-radius-sm);
  background: none;
  cursor: pointer;
  font-size: var(--haze-text-xs);
  font-family: var(--haze-font-mono);
  color: var(--haze-color-text-muted);
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: var(--haze-color-bg);
  }
`;

const filterActive = css`
  background: var(--haze-color-bg);
  border-color: var(--haze-color-border);
  color: var(--haze-color-text);
`;

const body = css`
  max-height: 24rem;
  overflow-y: auto;
  padding: var(--haze-space-2) 0;
`;

const entry = css`
  display: flex;
  gap: var(--haze-space-3);
  padding: var(--haze-space-0) var(--haze-space-3);
`;

const timestamp = css`
  color: var(--haze-color-text-muted);
  flex-shrink: 0;
`;

const levelBadge = css`
  flex-shrink: 0;
  width: 3rem;
  text-align: center;
  text-transform: uppercase;
  font-weight: var(--haze-weight-medium);
`;

const levelDebug = css`color: var(--haze-color-text-muted);`;
const levelInfo = css`color: var(--haze-color-primary);`;
const levelWarn = css`color: var(--haze-color-warning);`;
const levelError = css`color: var(--haze-color-danger);`;

const messageStyle = css`
  flex: 1;
  word-break: break-all;
  color: var(--haze-color-text);
`;

const levelClassMap: Record<LogLevel, string> = {
  debug: levelDebug,
  info: levelInfo,
  warn: levelWarn,
  error: levelError,
};

const ALL_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

export default function LogViewer({ logs, filter: filterControl, className }: LogViewerProps) {
  const [filter, setFilter] = useControl(filterControl, null);
  const strings = useStrings('logViewer');

  const filtered = useMemo(
    () => (filter ? logs.filter((l) => l.level === filter) : logs),
    [logs, filter],
  );

  return (
    <div x-class={[wrapper, className]}>
      <div x-class={[toolbar]}>
        <button
          x-class={[filterBtn, !filter && filterActive]}
          type="button"
          onClick={() => setFilter(null)}
        >
          {strings.all}
        </button>
        {ALL_LEVELS.map((lvl) => (
          <button
            key={lvl}
            x-class={[filterBtn, filter === lvl && filterActive]}
            type="button"
            onClick={() => setFilter(lvl)}
          >
            {lvl}
          </button>
        ))}
      </div>
      <div x-class={[body]}>
        {filtered.map((log, i) => (
          <div key={i} x-class={[entry]}>
            {log.timestamp && <span x-class={[timestamp]}>{log.timestamp}</span>}
            <span x-class={[levelBadge, levelClassMap[log.level]]}>{log.level}</span>
            <span x-class={[messageStyle]}>{log.message}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div x-class={[entry]}>
            <span x-class={[messageStyle]} style={{ color: 'var(--haze-color-text-muted)' }}>{strings.noLogs}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export type { LogViewerProps, LogEntry, LogLevel };
