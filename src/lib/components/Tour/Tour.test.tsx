import type { TourProps } from './Tour';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';


import Tour from './Tour';

// jsdom does not implement scrollIntoView (Carousel precedent); the stub
// is kept in a variable so call assertions never dereference the method.
const scrollIntoView = vi.fn();
beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
});

const steps: TourProps['steps'] = [
  { target: '#tour-a', title: 'First stop', content: 'Step one content' },
  { target: '#tour-b', content: 'Step two content', placement: 'top' },
  {
    target: () => document.getElementById('tour-c'),
    title: 'Third stop',
    content: 'Step three content',
  },
];

/** Page harness: three targets plus the tour under test. */
function renderTour(props?: Partial<TourProps>) {
  return render(
    <>
      <button id='tour-a'>A</button>
      <button id='tour-b'>B</button>
      <button id='tour-c'>C</button>
      <Tour steps={steps} open {...props} />
    </>
  );
}

describe('Tour', () => {
  it('renders nothing while closed', () => {
    render(
      <>
        <button id='tour-a'>A</button>
        <Tour steps={steps} />
      </>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Step one content')).not.toBeInTheDocument();
  });

  it('renders the first step with its title, content and stepOf copy', () => {
    renderTour();
    expect(screen.getByRole('dialog', { name: 'First stop' })).toBeInTheDocument();
    expect(screen.getByText('Step one content')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    // Title-less steps fall back to the counter as the accessible name.
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByRole('dialog', { name: 'Step 2 of 3' })).toBeInTheDocument();
  });

  it('navigates with Next and Back, Back disabled on the first step', async () => {
    const user = userEvent.setup();
    renderTour();
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step two content')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Step one content')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('closes with skip reason from the Skip button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderTour({ onClose });
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onClose).toHaveBeenCalledWith('skip');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  it('closes with skip reason on Escape', () => {
    const onClose = vi.fn();
    renderTour({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledWith('skip');
  });

  it('finishes with done reason from the Done button on the last step', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderTour({ onClose });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalledWith('done');
  });

  it('steps with ArrowRight/ArrowLeft and does not wrap past the ends', () => {
    renderTour();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('Step two content')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('Step one content')).toBeInTheDocument();
    // ArrowLeft before the first step and ArrowRight past the last are no-ops.
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('Step one content')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('Step three content')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('Step three content')).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
  });

  it('keeps arrow keys for text editing inside inputs', () => {
    render(
      <>
        <input aria-label='editable' />
        <Tour
          steps={[{ target: '#tour-a', content: 'Content with a field' }]}
          open
        />
      </>
    );
    const input = screen.getByRole('textbox', { name: 'editable' });
    input.focus();
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    // No navigation happened: still step 1 of 1.
    expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();
  });

  it('follows a controlled current', async () => {
    const user = userEvent.setup();
    function ControlledTour() {
      const [, setCurrent, currentCtrl] = useControl(0);
      return (
        <Tour
          steps={steps}
          open
          current={currentCtrl}
          onStepChange={setCurrent}
        />
      );
    }
    render(<ControlledTour />);
    expect(screen.getByText('Step one content')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step two content')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('restarts at the first step when reopened uncontrolled', async () => {
    const user = userEvent.setup();
    function ReopenableTour() {
      const [, setOpen, openCtrl] = useControl(false);
      return (
        <>
          <button id='tour-a'>A</button>
          <button onClick={() => setOpen(true)}>Start</button>
          <Tour steps={steps} open={openCtrl} onClose={() => setOpen(false)} />
        </>
      );
    }
    render(<ReopenableTour />);
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step two content')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );

    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByText('Step one content')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('degrades to a centered card when the target is missing', () => {
    render(
      <Tour
        steps={[
          { target: '#does-not-exist', title: 'Orphan', content: 'No target' },
        ]}
        open
      />
    );
    const card = screen.getByRole('dialog', { name: 'Orphan' });
    // No JS placement, no spotlight hole — a full mask instead.
    expect(card.style.top).toBe('');
    expect(card.style.left).toBe('');
    expect(document.querySelector('[data-haze-tour-spotlight]')).toBeNull();
    expect(screen.getByText('No target')).toBeInTheDocument();
  });

  it('degrades to a centered card when the target getter returns null', () => {
    render(
      <Tour
        steps={[{ target: () => null, content: 'Nowhere to anchor' }]}
        open
      />
    );
    expect(screen.getByRole('dialog', { name: 'Step 1 of 1' })).toBeVisible();
    expect(document.querySelector('[data-haze-tour-spotlight]')).toBeNull();
  });

  it('exposes mask/card aria: decorative mask, non-modal named dialog', () => {
    renderTour();
    const card = screen.getByRole('dialog', { name: 'First stop' });
    expect(card).toHaveAttribute('aria-modal', 'false');
    expect(card).toHaveAttribute('tabindex', '-1');
    // jsdom layout is zero-sized, so the full mask renders (aria-hidden).
    expect(document.querySelector('[data-haze-tour-spotlight]')).toBeNull();
    expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('does not close on mask clicks unless maskClosable', () => {
    const onClose = vi.fn();
    const { unmount } = renderTour({ onClose });
    fireEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).not.toHaveBeenCalled();
    unmount();

    renderTour({ onClose, maskClosable: true });
    fireEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledWith('skip');
  });

  it('does not close when a card click bubbles to a maskClosable overlay', () => {
    const onClose = vi.fn();
    renderTour({ onClose, maskClosable: true });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Step two content')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Geometry: spotlight rect + card placement from the target rect, and the
// resize/scroll re-placement. jsdom has no layout (all rects zero), so
// Element.prototype.getBoundingClientRect is mocked per the Popover tests.
// ---------------------------------------------------------------------------

type MockRect = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
};

// Plain object (cast at the mock's return): spreading a DOMRect-typed
// value would drop its class prototype.
const zeroRect = () =>
  ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) });

describe('Tour geometry', () => {
  // jsdom viewport: 1024 x 768. Target 80x40 at (200,100); card 320x200.
  let targetRect: MockRect = {
    top: 100,
    left: 200,
    bottom: 140,
    right: 280,
    width: 80,
    height: 40,
  };
  const cardRect: MockRect = {
    top: 0,
    left: 0,
    bottom: 200,
    right: 320,
    width: 320,
    height: 200,
  };

  /** Point card/target elements at controlled rects; jsdom layout is zero. */
  function mockRects() {
    return vi
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        if (this.getAttribute('role') === 'dialog') {
          return {...zeroRect(), ...cardRect};
        }
        if (this.id.startsWith('tour-')) {
          return {...zeroRect(), ...targetRect};
        }
        return zeroRect();
      });
  }

  it('places the spotlight and the card from the target rect', () => {
    const spy = mockRects();
    try {
      renderTour();
      const spotEl = document.querySelector<HTMLElement>(
        '[data-haze-tour-spotlight]'
      )!;
      expect(spotEl).not.toBeNull();
      // target rect padded by SPOTLIGHT_PAD (8)
      expect(spotEl.style.top).toBe('92px');
      expect(spotEl.style.left).toBe('192px');
      expect(spotEl.style.width).toBe('96px');
      expect(spotEl.style.height).toBe('56px');

      const card = screen.getByRole('dialog');
      // default 'bottom' placement: below the target, start-aligned,
      // CARD_GAP (16) clear of it
      expect(card.style.top).toBe('156px');
      expect(card.style.left).toBe('200px');
    } finally {
      spy.mockRestore();
    }
  });

  it('re-places card and spotlight on resize and scroll (rAF-throttled)', async () => {
    const spy = mockRects();
    try {
      renderTour();
      const spotEl = document.querySelector<HTMLElement>(
        '[data-haze-tour-spotlight]'
      )!;
      const card = screen.getByRole('dialog');

      targetRect = { ...targetRect, top: 300, left: 40, bottom: 340, right: 120 };
      fireEvent.resize(window);
      await waitFor(() => expect(spotEl.style.top).toBe('292px'));
      expect(spotEl.style.left).toBe('32px');
      expect(card.style.top).toBe('356px');
      expect(card.style.left).toBe('40px');

      targetRect = { ...targetRect, top: 500, left: 60, bottom: 540, right: 140 };
      fireEvent.scroll(document.getElementById('tour-a')!);
      await waitFor(() => expect(spotEl.style.top).toBe('492px'));
      expect(card.style.top).toBe('556px');
    } finally {
      spy.mockRestore();
    }
  });

  it('scrolls the target into view on each step', () => {
    const spy = mockRects();
    try {
      renderTour();
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: 'nearest',
      });
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(scrollIntoView).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('Tour axe', () => {
  it('has no axe violations while open over a target', async () => {
    const { axe } = await import('jest-axe');
    renderTour();
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
