import { useEffect, useRef, useState } from 'react';
import { css } from '@linaria/core';

import {
  Button,
  ChatMessage,
  CodeBlock,
  MarkdownRenderer,
  StreamingText,
} from '@/lib';
import { intro, page, section } from '@/views/ComponentDetail/styles';

/*
 * Screen-reader support for streaming AI output: why token-by-token
 * rendering is silent without a live region, the announcement pattern
 * StreamingText and ChatMessage ship (cue + throttled snapshots +
 * final text, aria-busy on the content area), and how to reuse the
 * pattern in custom streaming UIs.
 */

const paragraph = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-base);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-relaxed);
  margin: 0 0 var(--haze-space-4);
`;

const inlineCode = css`
  background: var(--haze-color-bg-muted);
  border-radius: var(--haze-radius-sm);
  padding: 0.15em 0.4em;
  font-family: var(--haze-font-mono);
  font-size: 0.9em;
`;

const codeMargin = css`
  margin: var(--haze-space-2) 0 var(--haze-space-4);
`;

const note = css`
  background: var(--haze-color-primary-subtle);
  border-left: 3px solid var(--haze-color-primary);
  border-radius: 0 var(--haze-radius-md) var(--haze-radius-md) 0;
  padding: var(--haze-space-3) var(--haze-space-4);
  margin: var(--haze-space-4) 0;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-normal);
`;

const demoCaption = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  margin: 0 0 var(--haze-space-6);
`;

const demoFrame = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-4);
  margin: var(--haze-space-4) 0 var(--haze-space-2);
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-3);
  font-family: var(--haze-font-sans);
  max-width: 560px;
`;

const demoBar = css`
  display: flex;
  gap: var(--haze-space-2);
  align-items: center;
`;

const tableWrap = css`
  overflow-x: auto;
  margin: var(--haze-space-2) 0 var(--haze-space-4);
`;

const strategyTable = css`
  border-collapse: collapse;
  width: 100%;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);

  th,
  td {
    border: 1px solid var(--haze-color-border);
    padding: var(--haze-space-2) var(--haze-space-3);
    text-align: start;
    vertical-align: top;
  }

  th {
    background: var(--haze-color-bg-subtle);
    font-weight: var(--haze-weight-medium);
  }

  code {
    font-family: var(--haze-font-mono);
    font-size: 0.9em;
  }
`;

/** Demo copy: replayable, long enough for several announce intervals. */
const DEMO_STREAM =
  'A live region is a plain element you promise to update. ' +
  'Screen readers do not watch DOM text by default, so a growing ' +
  'answer is just pixels moving — unless the element says otherwise.';

const DEMO_MARKDOWN_SOURCE = [
  '### Markdown while streaming',
  '',
  'Blocks finalize at **blank lines**, so only the tail block re-renders as tokens arrive.',
  '',
  '- the parser is memoized per block',
  '- code and lists stream in like any other block',
].join('\n');

/**
 * StreamingText demo: a replay button restarts the stream (a key bump
 * remounts the component, which resets both the visible text and the
 * announcement lifecycle).
 */
function StreamingDemo() {
  const [runId, setRunId] = useState(0);
  return (
    <div className={demoFrame}>
      <div className={demoBar}>
        <Button size='sm' variant='outline' onClick={() => setRunId((n) => n + 1)}>
          Replay stream
        </Button>
      </div>
      <StreamingText key={runId} text={DEMO_STREAM} speed={18} />
      <p className={demoCaption}>
        With a screen reader running you hear: the{' '}
        <em>Generating</em> cue, a fresh snapshot of the text roughly every
        1.2&nbsp;seconds while it grows, and the complete sentence once when
        the stream ends. Sighted users see the same text appear character by
        character — the announcements are a parallel channel, not a
        replacement.
      </p>
    </div>
  );
}

/**
 * ChatMessage streaming demo with markdown inside: the parent owns the
 * generation state, flips `streaming`, and lets ChatMessage handle
 * aria-busy plus the announcement lifecycle over whatever is rendered.
 */
function ChatStreamingDemo() {
  const [streaming, setStreaming] = useState(false);
  const [source, setSource] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    },
    [],
  );

  const generate = () => {
    if (streaming) return;
    const words = DEMO_MARKDOWN_SOURCE.split(/(\s+)/);
    let index = 0;
    setSource('');
    setStreaming(true);
    timerRef.current = setInterval(() => {
      index += 2;
      setSource(words.slice(0, index).join(''));
      if (index >= words.length) {
        if (timerRef.current !== null) clearInterval(timerRef.current);
        timerRef.current = null;
        setStreaming(false);
      }
    }, 90);
  };

  return (
    <div className={demoFrame}>
      <div className={demoBar}>
        <Button size='sm' variant='outline' onClick={generate} disabled={streaming}>
          Generate reply
        </Button>
      </div>
      <ChatMessage role="assistant" name="haze-bot" streaming={streaming}>
        {source ? <MarkdownRenderer content={source} /> : <em>waiting…</em>}
      </ChatMessage>
      <p className={demoCaption}>
        The bubble carries <code className={inlineCode}>aria-busy</code> while{' '}
        <code className={inlineCode}>streaming</code> is set; the hidden live
        region snapshots the rendered markdown text (headers, emphasis and
        list markers become plain announced text) and speaks the finished
        message when the flag clears.
      </p>
    </div>
  );
}

export default function StreamingA11yGuide() {
  return (
    <div className={page}>
      <h1>Screen readers &amp; streaming AI output</h1>
      <p className={intro}>
        Streaming answers arrive token by token: the DOM text grows dozens of
        times per second. Sighted users perceive that as text being typed.
        To a screen reader it is <strong>silence</strong> — and this guide is
        about why, and about the announcement pattern haze-ui ships in{' '}
        <code className={inlineCode}>StreamingText</code> and{' '}
        <code className={inlineCode}>ChatMessage</code> to fix it.
      </p>

      <div className={section}>
        <h2>Why streaming output is silent</h2>
        <p className={paragraph}>
          Screen readers announce what they are made aware of. Editing text
          inside a normal element is not something they are made aware of:
          there is no event, no semantic difference between &ldquo;the author
          wrote more&rdquo; and &ldquo;a script is mutating this node&rdquo;.
          Browsers only forward text changes to assistive technology when the
          element declares itself a <strong>live region</strong> —{' '}
          <code className={inlineCode}>aria-live</code> or a role that implies
          it, such as <code className={inlineCode}>role=&quot;status&quot;</code>{' '}
          (polite) or <code className={inlineCode}>role=&quot;alert&quot;</code>{' '}
          (assertive). Three rules matter for streaming:
        </p>
        <ul className={paragraph}>
          <li>
            <strong>Only changes announce.</strong> Content that is already
            inside the region when it appears is treated as page content, not
            as news. The region must exist <em>before</em> the text starts
            growing — mounting it pre-filled announces nothing reliably.
          </li>
          <li>
            <strong>Every mutation is an utterance.</strong> Appending one
            character restarts what the reader is saying. A 300-token answer
            streamed per-token into a live region is 300 interruptions, each
            starting the utterance over from wherever the reader&apos;s
            heuristics decide.
          </li>
          <li>
            <strong>Politeness queues.</strong>{' '}
            <code className={inlineCode}>role=&quot;status&quot;</code> waits
            for the current utterance;{' '}
            <code className={inlineCode}>role=&quot;alert&quot;</code> barges
            in. Generated prose is never urgent enough to barge — assertive
            live regions are for &ldquo;your session expired&rdquo;, not for
            paragraphs.
          </li>
        </ul>
        <p className={paragraph}>
          So the requirements pull in opposite directions: the reader must
          hear the stream (needs a live region) but must not be interrupted
          per token (needs restraint in how often the region changes).
        </p>
      </div>

      <div className={section}>
        <h2>The haze pattern</h2>
        <p className={paragraph}>
          <code className={inlineCode}>StreamingText</code> renders exactly
          what it always did — memoized chunk spans and a blinking caret —
          and adds a visually hidden{' '}
          <code className={inlineCode}>role=&quot;status&quot;</code> region
          that mirrors the stream on a <strong>throttle</strong>:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`<StreamingText
  text={answer}            // the full (still growing) answer
  speed={20}               // ms per visible character — unchanged
  announceInterval={1200}  // live-region cadence (default 1200ms)
/>`}
        </CodeBlock>
        <p className={paragraph}>
          The announcement lifecycle has three stages. On stream start the
          region receives a <em>Generating</em> cue (a real mutation, so it is
          announced — the region mounts empty). While the text grows, a
          snapshot of the current text replaces the region&apos;s content at
          most once per <code className={inlineCode}>announceInterval</code>{' '}
          — the reader hears the answer so far, as a whole utterance, about
          once per second. When the stream completes, the pending snapshot is
          cancelled and the complete final text is announced once; the region
          then settles and stays silent. Tune the cadence with{' '}
          <code className={inlineCode}>announceInterval</code>: shorter means
          fresher progress and more interruptions, longer the reverse. The
          default of 1200&nbsp;ms sits where most readers finish a sentence.
        </p>
        <StreamingDemo />
        <div className={note}>
          <strong>aria-busy marks the content, not the root.</strong> While
          streaming, the content area carries{' '}
          <code className={inlineCode}>aria-busy=&quot;true&quot;</code> so
          assistive tech knows the subtree is still mutating. The live region
          deliberately lives <em>outside</em> that subtree: announcements
          coming from inside an aria-busy element may be deferred until the
          flag clears, which would silence the very snapshots the region
          exists to deliver. Busy marks what is changing; the announcer sits
          beside it.
        </div>
      </div>

      <div className={section}>
        <h2>Why not announce every character</h2>
        <p className={paragraph}>
          The naive fix — pouring the stream into a live region as it
          arrives — is worse than the silence it replaces. Each mutation
          makes the reader stop and restart; users hear fragments of
          beginnings (&ldquo;The an&hellip; The ans&hellip; The answer
          is&hellip;&rdquo;), lose their place, and often disable live
          regions for the site altogether. The strategies compare like this:
        </p>
        <div className={tableWrap}>
          <table className={strategyTable}>
            <thead>
              <tr>
                <th>strategy</th>
                <th>what the reader hears</th>
                <th>verdict</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>per-token mutation of a live region</td>
                <td>hundreds of restarted fragments</td>
                <td>harmful — interruption churn</td>
              </tr>
              <tr>
                <td>
                  <code>role=&quot;status&quot;</code> + throttled snapshots
                </td>
                <td>cue, then the text so far ~once per interval, then the
                  finished answer</td>
                <td>haze&apos;s default</td>
              </tr>
              <tr>
                <td>announce only on completion</td>
                <td>one long utterance at the end</td>
                <td>calm, but a 30&nbsp;s stream is 30&nbsp;s of silence
                  first — set a large <code>announceInterval</code> if your
                  users prefer this</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={paragraph}>
          A detail that makes snapshots usable: the region re-announces the{' '}
          <em>whole</em> text so far, not the delta (the{' '}
          <code className={inlineCode}>status</code> role implies{' '}
          <code className={inlineCode}>aria-atomic</code>). The reader never
          has to reconstruct &ldquo;what came before the last 30
          characters&rdquo;.
        </p>
      </div>

      <div className={section}>
        <h2>ChatMessage: streaming with your own renderer</h2>
        <p className={paragraph}>
          <code className={inlineCode}>StreamingText</code> owns its
          typewriter effect. When you render the growing content yourself —
          plain text state, your own markdown pipeline — pass{' '}
          <code className={inlineCode}>streaming</code> to{' '}
          <code className={inlineCode}>ChatMessage</code> and it applies the
          same pattern to whatever the bubble contains: the bubble is marked{' '}
          <code className={inlineCode}>aria-busy</code>, and a hidden status
          region snapshots the <em>rendered</em> text on the same 1200&nbsp;ms
          cadence, announcing the complete message when you flip the flag
          off. User and system messages never get a region.
        </p>
        <ChatStreamingDemo />
        <div className={note}>
          <strong>Do not double up.</strong> If the bubble&apos;s children
          already announce themselves — <code>StreamingText</code> inside a{' '}
          <code>ChatMessage</code> — leave{' '}
          <code>streaming</code> false. Two live regions saying the same text
          twice is its own kind of interruption churn. Pick exactly one
          announcer per message.
        </div>
        <p className={paragraph}>
          One contract rides along: the copy action and the snapshots read
          the bubble&apos;s <em>visible</em> text. Any descendant marked{' '}
          <code className={inlineCode}>data-slot=&quot;live-region&quot;</code>{' '}
          is excluded, so announcements never leak into the clipboard and
          copied text is never doubled. Mark your own mirrors with the same
          attribute to opt into the exclusion.
        </p>
      </div>

      <div className={section}>
        <h2>Markdown + streaming</h2>
        <p className={paragraph}>
          <code className={inlineCode}>MarkdownRenderer</code> is a pure
          renderer — no timers, no announcement logic of its own; it stays
          silent and fast (blocks are memoized, so streaming re-parses only
          the growing tail block). Compose it under an announcer:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`// streaming markdown: the renderer re-parses only the tail
// block while ChatMessage handles aria-busy + announcements
<ChatMessage role="assistant" streaming={isGenerating}>
  <MarkdownRenderer content={partialMarkdown} />
</ChatMessage>

// typewriter-then-markdown: plain text streams in (announced by
// StreamingText), the formatted view replaces it once complete
{done
  ? <MarkdownRenderer content={answer} />
  : <StreamingText text={answer} speed={20} onComplete={() => setDone(true)} />}`}
        </CodeBlock>
        <p className={paragraph}>
          Either shape works. The first announces snapshots of the rendered
          text (headers and emphasis flatten to plain speech); the second
          announces the raw text while streaming and swaps in formatting
          silently at the end.
        </p>
      </div>

      <div className={section}>
        <h2>Rolling your own</h2>
        <p className={paragraph}>
          The pattern is four moves and works in any stack — a hidden status
          region mounted empty before the stream starts, a throttled mirror
          of the visible text, aria-busy on the changing content only, and a
          final full announcement:
        </p>
        <CodeBlock language='tsx' className={codeMargin}>
          {`const srOnly = \`position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); clip-path: inset(50%);
  white-space: nowrap; border: 0;\`;

function StreamedAnswer({ text, done }: { text: string; done: boolean }) {
  const [announced, setAnnounced] = useState('');

  useEffect(() => {
    if (done) {
      // final utterance: the complete text, exactly once
      setAnnounced(text);
      return;
    }
    setAnnounced('Generating');               // cue = a real mutation
    const id = setInterval(                   // trailing-edge throttle
      () => setAnnounced(text),
      1200,
    );
    return () => clearInterval(id);
  }, [done, text]);

  return (
    <>
      <span role="status" data-slot="live-region" style={srOnly}>
        {announced}
      </span>
      <div aria-busy={done ? undefined : true}>{text}</div>
    </>
  );
}`}
        </CodeBlock>
        <p className={paragraph}>
          The details that separate a working version from a broken one: the
          region exists before the first token (never mounted
          pre-filled), its mutations happen <em>outside</em> the{' '}
          <code className={inlineCode}>aria-busy</code> subtree, the cue and
          the snapshots are separate mutations so both are spoken, and the
          completion write cancels any pending snapshot so nothing is said
          twice. Mirror the{' '}
          <code className={inlineCode}>data-slot=&quot;live-region&quot;</code>{' '}
          attribute so text-extraction helpers can skip your announcer.
        </p>
      </div>

      <div className={section}>
        <h2>Edge notes</h2>
        <ul className={paragraph}>
          <li>
            <strong>Reduced motion does not apply — but check it anyway.</strong>{' '}
            <code className={inlineCode}>prefers-reduced-motion</code> governs
            animation; speech cadence is not motion, and StreamingText
            announces identically with it set (the blinking caret itself
            already collapses under reduced motion). What reduced-motion
            users may still want is a <em>calmer</em> cadence — expose your{' '}
            <code className={inlineCode}>announceInterval</code> and let app
            code widen it from a{' '}
            <code className={inlineCode}>matchMedia</code> check if you like.
          </li>
          <li>
            <strong>Spoilers.</strong> A live region reads text the moment it
            arrives — glanceable UIs (quiz answers, surprise reveals,
            spoiler-tagged chat) should not stream into announcements at
            all. Announce a neutral summary on completion instead, and keep
            the revealing text out of live regions entirely.
          </li>
          <li>
            <strong>The cue is localized.</strong> The{' '}
            <em>Generating</em> hint comes from the{' '}
            <code className={inlineCode}>streamingText</code> section of the
            locale packs — override or translate it like any other copy:
          </li>
        </ul>
        <CodeBlock language='tsx' className={codeMargin}>
          {`<LocaleProvider
  locale="fr-FR"
  strings={{ streamingText: { generating: 'Réponse en préparation' } }}
/>`}
        </CodeBlock>
      </div>
    </div>
  );
}
