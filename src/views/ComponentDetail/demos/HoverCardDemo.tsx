import { useState } from 'react';

import { Button, HoverCard } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section, row, codeBlock } from '../styles';

// ─── HoverCard ─────────────────────────────────────────────────
export default function HoverCardDemo() {
  const [visits, setVisits] = useState(0);

  return (
    <>
      <h1>HoverCard</h1>
      <p className={intro}>
        Non-modal floating preview — link summaries, profile cards — that
        opens on hover or focus and stays open while the pointer rests on it.
      </p>

      <div className={section}>
        <h2>Link preview</h2>
        <div className={row}>
          <HoverCard
            content={
              <>
                <strong>haze-ui documentation</strong>
                <p>
                  A React component library built on the controllable-state
                  pattern, Linaria styling and design tokens.
                </p>
              </>
            }
          >
            <a href="https://example.com/haze-ui" target="_blank" rel="noreferrer">
              Read the docs
            </a>
          </HoverCard>
        </div>
      </div>

      <div className={section}>
        <h2>Profile card with resting zone</h2>
        <div className={row}>
          <HoverCard
            openDelay={100}
            closeDelay={300}
            content={
              <>
                <strong>Zhang San</strong>
                <p>Design systems engineer · Shanghai</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setVisits((v) => v + 1)}
                >
                  Say hello ({visits})
                </Button>
              </>
            }
          >
            <Button variant="ghost">@zhangsan</Button>
          </HoverCard>
          <span>
            Hover the handle, then move the pointer into the card — the
            closeDelay grace keeps it open mid-travel.
          </span>
        </div>
      </div>

      <div className={section}>
        <h2>Usage</h2>
        <pre className={codeBlock}>{`import { HoverCard } from 'haze-ui';

<HoverCard
  content={<ProfileCard user={user} />}
  openDelay={200}
  closeDelay={120}
  placement="bottom-span"
>
  <a href={user.url}>{user.handle}</a>
</HoverCard>`}</pre>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of="HoverCardProps" />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Trigger and panel are linked via <strong>aria-describedby</strong>
            </li>
            <li>
              Opens on <strong>hover</strong> and <strong>focus</strong> alike —
              render a focusable trigger (link, button) for keyboard access
            </li>
            <li>
              Card content stays in the DOM; <strong>Escape</strong> closes an
              open card
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
