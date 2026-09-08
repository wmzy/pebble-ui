import type { AnchorProps } from './Anchor';

import { render, screen, within, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import Anchor from './Anchor';

const SECTIONS = [
  { id: 'basics', label: 'Basics' },
  { id: 'usage', label: 'Usage' },
  { id: 'api', label: 'API' },
];

/** Anchor + the sections it targets, in one tree. */
function renderPage(props: Omit<AnchorProps, 'items'> = {}) {
  return render(
    <main>
      <Anchor items={SECTIONS} {...props} />
      <section id="basics">Basics body</section>
      <section id="usage">Usage body</section>
      <section id="api">API body</section>
    </main>
  );
}

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: (
    entries: IntersectionObserverEntry[],
    observer: IntersectionObserver
  ) => void;
  options: IntersectionObserverInit | undefined;
  observe = vi.fn((el: Element) => {
    this.observed.push(el);
  });
  unobserve = vi.fn();
  disconnect = vi.fn();
  observed: Element[] = [];

  constructor(
    callback: (
      entries: IntersectionObserverEntry[],
      observer: IntersectionObserver
    ) => void,
    options?: IntersectionObserverInit
  ) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }
}

/** jsdom has no IntersectionObserver — install the mock and clean it up. */
function useMockIO() {
  window.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
  return () => {
    Reflect.deleteProperty(window, 'IntersectionObserver');
    MockIntersectionObserver.instances = [];
  };
}

describe('Anchor', () => {
  it('renders a navigation list and highlights the first item by default', () => {
    renderPage();
    const nav = screen.getByRole('navigation');
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', '#basics');
    expect(links[0]).toHaveAttribute('aria-current', 'true');
    expect(links[1]).not.toHaveAttribute('aria-current');
    expect(links[2]).not.toHaveAttribute('aria-current');
  });

  it('scrolls the window to the section on click and reports it', async () => {
    const user = userEvent.setup();
    const scrollTo = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => undefined);
    try {
      const onClick = vi.fn();
      renderPage({ onClick, offsetTop: 40 });

      await user.click(screen.getByRole('link', { name: 'Usage' }));

      expect(scrollTo).toHaveBeenCalledTimes(1);
      // jsdom rects are all zero and scrollY is 0, so the target offset is
      // exactly -offsetTop — the offset contract under test.
      expect(scrollTo).toHaveBeenCalledWith({
        top: -40,
        behavior: 'smooth',
      });
      expect(onClick).toHaveBeenCalledWith('usage');
      expect(screen.getByRole('link', { name: 'Usage' })).toHaveAttribute(
        'aria-current',
        'true'
      );
      expect(
        screen.getByRole('link', { name: 'Basics' })
      ).not.toHaveAttribute('aria-current');
    } finally {
      scrollTo.mockRestore();
    }
  });

  it('scrolls a custom container relative to its own top', async () => {
    const user = userEvent.setup();
    const containerRef: { current: HTMLDivElement | null } = { current: null };
    let scrollTop = 0;
    const { container } = render(
      <main>
        <Anchor
          items={SECTIONS}
          offsetTop={10}
          getContainer={() => containerRef.current!}
        />
        <div
          ref={(el) => {
            containerRef.current = el;
          }}
        >
          <section id="basics">Basics body</section>
          <section id="usage">Usage body</section>
          <section id="api">API body</section>
        </div>
      </main>
    );
    const scrollBox = containerRef.current!;
    Object.defineProperty(scrollBox, 'scrollTop', {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });
    vi.spyOn(scrollBox, 'getBoundingClientRect').mockReturnValue({
      top: 100,
    } as DOMRect);
    vi.spyOn(container.querySelector('#api')!, 'getBoundingClientRect').mockReturnValue(
      { top: 350 } as DOMRect
    );

    await user.click(screen.getByRole('link', { name: 'API' }));

    // section top (350) - container top (100) + current scrollTop (0) - offset (10)
    expect(scrollTop).toBe(240);
  });

  it('shares the highlight with a parent through a control', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [activeId, setActiveId, control] = useControl(undefined, 'basics');
      return (
        <div>
          <Anchor items={SECTIONS} activeId={control} />
          <output data-testid="mirror">[{activeId}]</output>
          <button onClick={() => setActiveId('api')}>jump</button>
        </div>
      );
    }
    render(<Controlled />);
    expect(screen.getByTestId('mirror')).toHaveTextContent('[basics]');

    // external write drives the highlight…
    await user.click(screen.getByText('jump'));
    expect(screen.getByTestId('mirror')).toHaveTextContent('[api]');
    expect(screen.getByRole('link', { name: 'API' })).toHaveAttribute(
      'aria-current',
      'true'
    );

    // …and clicking a link writes back to the parent
    await user.click(screen.getByRole('link', { name: 'Usage' }));
    expect(screen.getByTestId('mirror')).toHaveTextContent('[usage]');
    expect(screen.getByRole('link', { name: 'Usage' })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('tracks the topmost visible section with IntersectionObserver', () => {
    const restore = useMockIO();
    try {
      const { unmount } = renderPage({ offsetTop: 24 });
      const observer = MockIntersectionObserver.instances.at(-1);
      expect(observer).toBeDefined();
      // window container → viewport root; offsetTop moves the activation line
      expect(observer?.options?.root).toBeNull();
      expect(observer?.options?.rootMargin).toBe('-24px 0px 0px 0px');
      expect(observer?.observed).toEqual([
        document.getElementById('basics'),
        document.getElementById('usage'),
        document.getElementById('api'),
      ]);

      // 'api' enters, 'usage' leaves → topmost visible is 'api'
      act(() => {
        observer?.callback(
          [
            { target: document.getElementById('api') as Element, isIntersecting: true },
            { target: document.getElementById('usage') as Element, isIntersecting: false },
            { target: document.getElementById('basics') as Element, isIntersecting: false },
          ] as unknown as IntersectionObserverEntry[],
          observer as unknown as IntersectionObserver
        );
      });
      expect(screen.getByRole('link', { name: 'API' })).toHaveAttribute(
        'aria-current',
        'true'
      );

      // scrolling back up: 'usage' re-enters → it wins as the topmost visible
      act(() => {
        observer?.callback(
          [
            { target: document.getElementById('usage') as Element, isIntersecting: true },
          ] as unknown as IntersectionObserverEntry[],
          observer as unknown as IntersectionObserver
        );
      });
      expect(screen.getByRole('link', { name: 'Usage' })).toHaveAttribute(
        'aria-current',
        'true'
      );

      // unmount disconnects the observer
      const disconnect = observer?.disconnect;
      unmount();
      expect(disconnect).toHaveBeenCalled();
    } finally {
      restore();
    }
  });

  it('observes a custom container as the IntersectionObserver root', () => {
    const restore = useMockIO();
    try {
      const containerRef: { current: HTMLDivElement | null } = { current: null };
      render(
        <main>
          <Anchor
            items={SECTIONS}
            getContainer={() => containerRef.current!}
          />
          <div
            ref={(el) => {
              containerRef.current = el;
            }}
          >
            <section id="basics">Basics body</section>
          </div>
        </main>
      );
      const observer = MockIntersectionObserver.instances.at(-1);
      expect(observer?.options?.root).toBe(containerRef.current);
    } finally {
      restore();
    }
  });

  it('degrades to a static list without IntersectionObserver', () => {
    // jsdom ships no IntersectionObserver — exactly the degraded path
    renderPage();
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Basics' })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('falls back to scroll-position tracking without IntersectionObserver', () => {
    renderPage({ bounds: 10 });
    const tops: Record<string, number> = { basics: 0, usage: -20, api: 400 };
    const spies = Object.entries(tops).map(([id, top]) =>
      vi
        .spyOn(document.getElementById(id) as Element, 'getBoundingClientRect')
        .mockReturnValue({ top } as DOMRect)
    );
    try {
      fireEvent.scroll(window);
      // 'usage' is the last section whose top is within the bounds line
      expect(screen.getByRole('link', { name: 'Usage' })).toHaveAttribute(
        'aria-current',
        'true'
      );
    } finally {
      spies.forEach((spy) => spy.mockRestore());
    }
  });

  it('applies className and forwards native nav props', () => {
    renderPage({ className: 'custom', 'aria-label': 'On this page' });
    const nav = screen.getByRole('navigation', { name: 'On this page' });
    expect(nav).toHaveClass('custom');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    renderPage({ 'aria-label': 'On this page' });
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
