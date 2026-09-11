/**
 * Fixture for the overlay pixel baselines (e2e/snapshots.spec.ts):
 * Tooltip, Popover, DropdownMenu and Combobox start closed and are
 * opened by the spec through their real triggers, one per test (fresh
 * page each) — several popover=auto panels cannot be open at once, the
 * browser would light-dismiss all but the last. Dialog opens from an
 * opener button for the same reason (a statically-open modal would
 * block every other section's trigger). Toast is fired with
 * duration: 0, which arms no auto-dismiss timer, so it stays mounted
 * until the screenshot is taken.
 *
 * Demo content intentionally mirrors e2e/app/main.tsx so the
 * regenerated popover/dialog/dropdown baselines stay comparable to the
 * originals. Generous vertical gaps keep open panels clear of the next
 * section's trigger, like the smoke page.
 *
 * The expansion sections add the newer overlay surfaces: the Image
 * fullscreen preview (opened by clicking its thumbnail; the SVG source
 * is an inline data URI — deterministic, no network), a DropdownMenu
 * with one expanded submenu (the spec captures the viewport: both
 * panels are top-layer popovers), the multiple Select's open listbox,
 * and a dark-theme Dialog (`darkTheme` re-declared on its wrapper — a
 * native <dialog> stays in the DOM subtree, so the top-layer panel and
 * its ::backdrop inherit the dark tokens).
 */
import type { CSSProperties } from 'react';

import { css } from '@linaria/core';
import { createRoot } from 'react-dom/client';
import { useControl } from 'react-use-control';

import { Button } from '../../src/lib/components/Button';
import { Combobox } from '../../src/lib/components/Combobox';
import { Dialog } from '../../src/lib/components/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../../src/lib/components/DropdownMenu';
import { Image } from '../../src/lib/components/Image';
import { Popover } from '../../src/lib/components/Popover';
import { Option, Select } from '../../src/lib/components/Select';
import { ToastContainer, useToast } from '../../src/lib/components/Toast';
import { Tooltip } from '../../src/lib/components/Tooltip';
import { darkTheme, lightTheme } from '../../src/lib/tokens/colors';
import { motion } from '../../src/lib/tokens/motion';
import { spacing } from '../../src/lib/tokens/spacing';
import { typography } from '../../src/lib/tokens/typography';

import './e2e-fonts.css';

// Inline style: beats the typography class's own --haze-font-mono
// declaration on this element regardless of stylesheet emission order
// (see e2e-fonts.css for why the harness pins the font).
const pinnedMono = {
  '--haze-font-mono': "'Haze E2E Mono', monospace",
} as CSSProperties;

const shell = css`
  min-height: 100vh;
  box-sizing: border-box;
  margin: 0;
  padding: 32px 48px 480px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 280px;
`;

/* Room above the tooltip trigger for the default 'top' bubble — without
   it the first screenful would flip the placement to 'bottom'. */
const tooltipRoom = css`
  margin-top: 96px;
`;

const demoBtn = css`
  padding: 6px 16px;
`;

const comboboxWidth = css`
  width: 240px;
`;

const thumbWidth = css`
  width: 320px;
`;

const selectMultiWidth = css`
  width: 280px;
`;

/* Fully inlined SVG fixture image — no network, deterministic
   rasterization, and both the thumbnail and the fullscreen preview
   decode from the same bytes. */
const PREVIEW_SRC = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400">
  <rect width="640" height="400" fill="#0f172a"/>
  <circle cx="220" cy="170" r="90" fill="#3b82f6"/>
  <rect x="360" y="90" width="180" height="160" rx="16" fill="#f59e0b"/>
  <path d="M80 330h480" stroke="#e2e8f0" stroke-width="8" stroke-linecap="round"/>
</svg>`
)}`;

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian' },
];

function ToastDemo() {
  const notify = useToast();
  return (
    // duration 0: no auto-dismiss timer is armed — the toast stays
    // mounted until the baseline capture is done.
    <button
      type="button"
      id="toast-opener"
      className={demoBtn}
      onClick={() => notify('Saved successfully', { variant: 'success', duration: 0 })}
    >
      Show toast
    </button>
  );
}

function App() {
  const [, setDialogOpen, dialogControl] = useControl(undefined, false);
  const [, setDarkDialogOpen, darkDialogControl] = useControl(undefined, false);

  return (
    <div
      className={`${shell} ${lightTheme} ${spacing} ${typography} ${motion}`}
      style={pinnedMono}
    >
      <section data-snap="tooltip" className={tooltipRoom}>
        <Tooltip content="Keyboard shortcut: Ctrl K">
          <Button variant="outline">Hover for help</Button>
        </Tooltip>
      </section>

      <section data-snap="popover">
        <Popover content="Popover body">Open popover</Popover>
      </section>

      <section data-snap="dropdown-menu">
        <DropdownMenu>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Apple</DropdownMenuItem>
            <DropdownMenuItem>Banana</DropdownMenuItem>
            <DropdownMenuItem>Cherry</DropdownMenuItem>
            <DropdownMenuItem>Durian</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Elderberry</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      <section data-snap="combobox">
        <Combobox
          value="banana"
          options={FRUITS}
          placeholder="Pick a fruit"
          className={comboboxWidth}
        />
      </section>

      <section data-snap="dialog">
        <button
          type="button"
          id="dialog-opener"
          className={demoBtn}
          onClick={() => setDialogOpen(true)}
        >
          Open dialog
        </button>
        <Dialog
          open={dialogControl}
          onClose={() => setDialogOpen(false)}
          title="Confirm action"
        >
          <p>Dialog body</p>
        </Dialog>
      </section>

      <section data-snap="imagepreview">
        <Image
          src={PREVIEW_SRC}
          alt="Fixture artwork"
          preview
          aspectRatio="8/5"
          className={thumbWidth}
        />
      </section>

      <section data-snap="submenu">
        <DropdownMenu>
          <DropdownMenuTrigger>File</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>New file</DropdownMenuItem>
            <DropdownMenuItem>Open recent…</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Copy link</DropdownMenuItem>
                <DropdownMenuItem>Embed</DropdownMenuItem>
                <DropdownMenuItem disabled>Email</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      <section data-snap="selectmultipleopen">
        <div className={selectMultiWidth}>
          <Select
            multiple
            value={['apple', 'cherry']}
            aria-label="Overlay fruits"
          >
            <Option value="apple">Apple</Option>
            <Option value="banana">Banana</Option>
            <Option value="cherry">Cherry</Option>
            <Option value="durian">Durian</Option>
          </Select>
        </div>
      </section>

      {/* Dark-theme dialog: the token classes apply to any ancestor, and
          a native <dialog> stays in the DOM subtree (no portal), so the
          top-layer panel and its ::backdrop both inherit the dark set. */}
      <section data-snap="dialogdark">
        <div className={darkTheme}>
          <button
            type="button"
            id="dark-dialog-opener"
            className={demoBtn}
            onClick={() => setDarkDialogOpen(true)}
          >
            Open dark dialog
          </button>
          <Dialog
            open={darkDialogControl}
            onClose={() => setDarkDialogOpen(false)}
            title="Confirm deletion"
          >
            <p>This permanently deletes the file.</p>
          </Dialog>
        </div>
      </section>

      <ToastContainer>
        <ToastDemo />
      </ToastContainer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
