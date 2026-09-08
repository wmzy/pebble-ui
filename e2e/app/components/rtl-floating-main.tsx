/**
 * RTL floating-mirror harness: a statically-open Popover (bottom-span =
 * start-aligned) and a hover-open Tooltip (inline-start placement), the
 * two placements whose RTL geometry the rtl.spec.ts mirror assertions
 * pin down on a real engine. Loaded with dir='rtl' injected before mount
 * (addInitScript in the spec), so the anchored tier resolves its logical
 * position-area values against RTL from first paint.
 *
 * The two panels never need to coexist: the spec asserts the popover
 * first, then hovers the tooltip trigger (whose showPopover light-
 * dismisses the popover — several popover=auto panels cannot coexist).
 */
import { css } from '@linaria/core';

import Popover from '../../../src/lib/components/Popover/Popover';
import Tooltip from '../../../src/lib/components/Tooltip/Tooltip';

import { mountPage } from './mount';

/* Bare span triggers get a hit area (same as collision-main.tsx). */
const trigger = css`
  padding: 6px 12px;
`;

function App() {
  return (
    <>
      <div data-testid="case-bottom">
        <Popover
          open
          content="Start-aligned panel below the trigger — under RTL the start edge is the right edge."
        >
          <span className={trigger}>Popover trigger</span>
        </Popover>
      </div>
      <div
        data-testid="case-inline-start"
        style={{marginTop: 160, marginInline: 'auto', width: 'fit-content'}}
      >
        <Tooltip position="left" content="Inline-start bubble">
          <span className={trigger}>Tooltip trigger</span>
        </Tooltip>
      </div>
    </>
  );
}

mountPage(<App />);
