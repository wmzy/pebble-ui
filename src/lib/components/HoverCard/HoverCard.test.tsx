import type { ReactNode } from 'react';

import type { HoverCardProps } from './HoverCard';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { useControl } from 'react-use-control';

import ConfigProvider from '../ConfigProvider/ConfigProvider';

import HoverCard from './HoverCard';

/**
 * Controlled harness exposing the internal open state — jsdom applies no
 * CSS, so the hidden-class toggle is not observable directly.
 */
function HoverCardHarness(
  props: Omit<Partial<HoverCardProps>, 'children' | 'open' | 'content'> & {
    content: ReactNode;
  } = { content: '' }
) {
  const [open, , openCtrl] = useControl(undefined, false);
  return (
    <>
      <HoverCard {...props} open={openCtrl}>
        <button>Hover me</button>
      </HoverCard>
      <output data-testid="open-state">{String(open)}</output>
    </>
  );
}

/** The trigger span wrapping the harness button (it holds the timers). */
function triggerSpan() {
  return screen.getByRole('button', { name: 'Hover me' }).parentElement!;
}

function panel() {
  return document.getElementById(triggerSpan().getAttribute('aria-describedby')!)!;
}

function hover() {
  // React synthesizes onMouseEnter from mouseover (mouseenter itself does
  // not bubble), so drive the synthetic pair.
  fireEvent.mouseOver(screen.getByRole('button', { name: 'Hover me' }));
}

function leave() {
  fireEvent.mouseOut(screen.getByRole('button', { name: 'Hover me' }));
}

function enterPanel() {
  fireEvent.mouseOver(panel());
}

function leavePanel() {
  fireEvent.mouseOut(panel());
}

function openState() {
  return screen.getByTestId('open-state').textContent;
}

describe('HoverCard', () => {
  it('renders trigger and card content', () => {
    render(
      <HoverCard content="Card body">
        <button>Hover me</button>
      </HoverCard>
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    expect(panel()).toHaveTextContent('Card body');
  });

  it('links trigger to panel via aria-describedby', () => {
    render(
      <HoverCard content="Card body">
        <button>Hover me</button>
      </HoverCard>
    );
    expect(triggerSpan()).toHaveAttribute('aria-describedby', panel().id);
  });

  it('applies className to panel', () => {
    render(
      <HoverCard content="Card body" className="custom">
        <button>Hover me</button>
      </HoverCard>
    );
    expect(panel()).toHaveClass('custom');
  });

  it('opens after the hover delay', () => {
    vi.useFakeTimers();
    try {
      render(<HoverCardHarness content="Card" />);
      hover();
      expect(openState()).toBe('false');
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(openState()).toBe('true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('respects a custom openDelay', () => {
    vi.useFakeTimers();
    try {
      render(<HoverCardHarness content="Card" openDelay={300} />);
      hover();
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(openState()).toBe('false');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(openState()).toBe('true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels a pending show when the pointer leaves before the delay', () => {
    vi.useFakeTimers();
    try {
      render(<HoverCardHarness content="Card" />);
      hover();
      act(() => {
        vi.advanceTimersByTime(100);
      });
      leave();
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(openState()).toBe('false');
    } finally {
      vi.useRealTimers();
    }
  });

  it('stays open when the pointer travels from the trigger into the panel', () => {
    vi.useFakeTimers();
    try {
      render(<HoverCardHarness content="Card" closeDelay={120} />);
      hover();
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(openState()).toBe('true');
      // Leaving the trigger only arms the grace timer; stepping into the
      // panel before it fires cancels the close.
      leave();
      act(() => {
        vi.advanceTimersByTime(60);
      });
      enterPanel();
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(openState()).toBe('true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('closes after the closeDelay once the pointer leaves the panel too', () => {
    vi.useFakeTimers();
    try {
      render(<HoverCardHarness content="Card" closeDelay={120} />);
      hover();
      act(() => {
        vi.advanceTimersByTime(200);
      });
      enterPanel();
      leavePanel();
      act(() => {
        vi.advanceTimersByTime(119);
      });
      expect(openState()).toBe('true');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(openState()).toBe('false');
    } finally {
      vi.useRealTimers();
    }
  });

  it('opens on trigger focus and closes on blur after the grace period', () => {
    vi.useFakeTimers();
    try {
      render(<HoverCardHarness content="Card" />);
      fireEvent.focus(screen.getByRole('button', { name: 'Hover me' }));
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(openState()).toBe('true');
      fireEvent.blur(screen.getByRole('button', { name: 'Hover me' }));
      act(() => {
        vi.advanceTimersByTime(120);
      });
      expect(openState()).toBe('false');
    } finally {
      vi.useRealTimers();
    }
  });

  it('closes on Escape while open (fallback path)', () => {
    vi.useFakeTimers();
    try {
      render(<HoverCardHarness content="Card" />);
      hover();
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(openState()).toBe('true');
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(openState()).toBe('false');
    } finally {
      vi.useRealTimers();
    }
  });

  it('mirrors the animated lifecycle as data-state on the panel', () => {
    vi.useFakeTimers();
    try {
      render(<HoverCardHarness content="Card" />);
      expect(panel()).toHaveAttribute('data-state', 'closed');
      hover();
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(panel()).toHaveAttribute('data-state', 'open');
      leave();
      act(() => {
        vi.advanceTimersByTime(120);
      });
      // 'closed' lands immediately (it drives the fade-out); the hidden
      // handover is what waits for the exit to settle.
      expect(panel()).toHaveAttribute('data-state', 'closed');
    } finally {
      vi.useRealTimers();
    }
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <HoverCard content="Card body" open>
        <button>Hover me</button>
      </HoverCard>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// ConfigProvider priority chain: explicit prop → config default → built-in
// (200 open / 120 close). A provider that names neither delay must not
// disturb the built-ins either.
// ---------------------------------------------------------------------------

describe('HoverCard (ConfigProvider delay precedence)', () => {
  it('uses the config delays when the props are omitted', () => {
    vi.useFakeTimers();
    try {
      render(
        <ConfigProvider defaults={{HoverCard: {openDelay: 320, closeDelay: 60}}}>
          <HoverCardHarness content="Card" />
        </ConfigProvider>
      );
      hover();
      act(() => {
        vi.advanceTimersByTime(319);
      });
      expect(openState()).toBe('false');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(openState()).toBe('true');
      leave();
      act(() => {
        vi.advanceTimersByTime(60);
      });
      expect(openState()).toBe('false');
    } finally {
      vi.useRealTimers();
    }
  });

  it('lets an explicit openDelay beat the config', () => {
    vi.useFakeTimers();
    try {
      render(
        <ConfigProvider defaults={{HoverCard: {openDelay: 320}}}>
          <HoverCardHarness content="Card" openDelay={80} />
        </ConfigProvider>
      );
      hover();
      act(() => {
        vi.advanceTimersByTime(80);
      });
      expect(openState()).toBe('true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('lets an explicit closeDelay beat the config', () => {
    vi.useFakeTimers();
    try {
      render(
        <ConfigProvider defaults={{HoverCard: {openDelay: 0, closeDelay: 400}}}>
          <HoverCardHarness content="Card" closeDelay={150} />
        </ConfigProvider>
      );
      hover();
      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(openState()).toBe('true');
      leave();
      act(() => {
        vi.advanceTimersByTime(150);
      });
      expect(openState()).toBe('false');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the built-in delays when the config omits them', () => {
    vi.useFakeTimers();
    try {
      render(
        <ConfigProvider defaults={{Tooltip: {delay: 999}}}>
          <HoverCardHarness content="Card" />
        </ConfigProvider>
      );
      hover();
      act(() => {
        vi.advanceTimersByTime(199);
      });
      expect(openState()).toBe('false');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(openState()).toBe('true');
      leave();
      act(() => {
        vi.advanceTimersByTime(120);
      });
      expect(openState()).toBe('false');
    } finally {
      vi.useRealTimers();
    }
  });
});

// jsdom implements neither the Popover API nor ToggleEvent; polyfill the
// minimal surface the component relies on (same approach as Popover's
// tests) to exercise the native path.
class ToggleEventPolyfill extends Event {
  newState: string;
  constructor(type: string, init: { newState: string }) {
    super(type);
    this.newState = init.newState;
  }
}

function installNativePopover() {
  Object.defineProperty(HTMLElement.prototype, 'popover', {
    configurable: true,
    value: 'manual',
  });
  HTMLElement.prototype.showPopover = showPopoverMock;
  HTMLElement.prototype.hidePopover = hidePopoverMock;
}

const showPopoverMock = vi.fn(function (this: HTMLElement) {
  this.setAttribute('data-popover-open', '');
  this.dispatchEvent(new ToggleEventPolyfill('toggle', { newState: 'open' }));
});

const hidePopoverMock = vi.fn(function (this: HTMLElement) {
  if (!this.hasAttribute('data-popover-open')) return;
  this.removeAttribute('data-popover-open');
  this.dispatchEvent(
    new ToggleEventPolyfill('toggle', { newState: 'closed' })
  );
});

type PopoverProtoPatch = {
  popover?: unknown;
  showPopover?: () => void;
  hidePopover?: () => void;
};

function removeNativePopover() {
  const proto = HTMLElement.prototype as PopoverProtoPatch;
  delete proto.popover;
  delete proto.showPopover;
  delete proto.hidePopover;
}

describe('HoverCard (native popover API)', () => {
  beforeEach(() => {
    installNativePopover();
  });

  afterEach(() => {
    removeNativePopover();
    vi.restoreAllMocks();
  });

  it('renders the panel as a popover=auto element', () => {
    render(
      <HoverCard content="Card body">
        <button>Hover me</button>
      </HoverCard>
    );
    expect(panel()).toHaveAttribute('popover', 'auto');
  });

  it('drives showPopover from state on hover', () => {
    vi.useFakeTimers();
    try {
      render(
        <HoverCard content="Card body">
          <button>Hover me</button>
        </HoverCard>
      );
      hover();
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(showPopoverMock).toHaveBeenCalledTimes(1);
      expect(panel()).toHaveAttribute('data-state', 'open');
    } finally {
      vi.useRealTimers();
    }
  });

  it('syncs a browser-side close (Escape/light dismiss) back to state', () => {
    vi.useFakeTimers();
    try {
      render(
        <HoverCard content="Card body">
          <button>Hover me</button>
        </HoverCard>
      );
      hover();
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(panel()).toHaveAttribute('data-state', 'open');

      // Browser closes the popover without React (e.g. Escape key).
      act(() => {
        panel().dispatchEvent(
          new ToggleEventPolyfill('toggle', { newState: 'closed' })
        );
      });
      expect(panel()).toHaveAttribute('data-state', 'closed');
    } finally {
      vi.useRealTimers();
    }
  });
});
