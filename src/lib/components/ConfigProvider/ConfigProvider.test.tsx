import type { ReactNode } from 'react';

import type { TooltipProps } from '../Tooltip/Tooltip';

import { expect } from 'vitest';

import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useControl } from 'react-use-control';

import { sizes as buttonSizes, squareSizes } from '../Button/styles';
import Button from '../Button/Button';
import ButtonLink from '../Button/ButtonLink';
import LocaleProvider from '../LocaleProvider/LocaleProvider';
import Pagination from '../Pagination/Pagination';
import ToastContainer, { toastPlacements } from '../Toast/ToastContainer';
import useToast from '../Toast/useToast';
import { toast } from '../Toast/toast';
import Tooltip from '../Tooltip/Tooltip';

import ConfigProvider from './ConfigProvider';

// toast() holds module-level state (pending queue + subscribers) that
// would otherwise leak across tests.
afterEach(() => {
  act(() => {
    toast.dismiss();
  });
});

/**
 * Controlled harness exposing the internal open state — jsdom applies no
 * CSS, so the hidden-class toggle is not observable directly (same shape
 * as Tooltip.test.tsx).
 */
function TooltipHarness(
  props: Omit<Partial<TooltipProps>, 'children' | 'open' | 'content'> & {
    content: ReactNode;
  }
) {
  const [open, , openCtrl] = useControl(undefined, false);
  return (
    <>
      <Tooltip {...props} open={openCtrl}>
        <button>Hover me</button>
      </Tooltip>
      <output data-testid='open-state'>{String(open)}</output>
    </>
  );
}

function hover() {
  // React synthesizes onMouseEnter from mouseover (mouseenter itself does
  // not bubble), so drive the synthetic pair.
  fireEvent.mouseOver(screen.getByText('Hover me'));
}

function openState() {
  return screen.getByTestId('open-state').textContent;
}

/** Fires one config-default toast from inside the tree. */
function ToastFire() {
  const show = useToast();
  return (
    <button
      onClick={() => {
        show('Merged');
      }}
    >
      fire
    </button>
  );
}

/** Wrapper mounting the hook caller inside provider + container. */
function withConfig(defaults: Parameters<typeof ConfigProvider>[0]['defaults']) {
  return ({ children }: { children: ReactNode }) => (
    <ConfigProvider defaults={defaults}>
      <ToastContainer>{children}</ToastContainer>
    </ConfigProvider>
  );
}

describe('ConfigProvider — Button / ButtonLink size', () => {
  it('applies the config size when the prop is omitted', () => {
    render(
      <ConfigProvider defaults={{Button: {size: 'lg'}}}>
        <Button>OK</Button>
      </ConfigProvider>
    );
    const btn = screen.getByRole('button', { name: 'OK' });
    expect(btn).toHaveClass(buttonSizes.lg);
    expect(btn).not.toHaveClass(buttonSizes.md);
  });

  it('lets an explicit size prop beat the config', () => {
    render(
      <ConfigProvider defaults={{Button: {size: 'lg'}}}>
        <Button size='sm'>OK</Button>
      </ConfigProvider>
    );
    const btn = screen.getByRole('button', { name: 'OK' });
    expect(btn).toHaveClass(buttonSizes.sm);
    expect(btn).not.toHaveClass(buttonSizes.lg);
  });

  it('routes the config size through the square sizing map', () => {
    render(
      <ConfigProvider defaults={{Button: {size: 'lg'}}}>
        <Button square aria-label='close'>
          X
        </Button>
      </ConfigProvider>
    );
    const btn = screen.getByRole('button', { name: 'close' });
    expect(btn).toHaveClass(squareSizes.lg);
    expect(btn).not.toHaveClass(squareSizes.md);
  });

  it('applies the ButtonLink config to ButtonLink, not Button', () => {
    render(
      <ConfigProvider defaults={{ButtonLink: {size: 'sm'}, Button: {size: 'lg'}}}>
        <ButtonLink href='/x'>Link</ButtonLink>
        <Button>Btn</Button>
      </ConfigProvider>
    );
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link).toHaveClass(buttonSizes.sm);
    expect(link).not.toHaveClass(buttonSizes.md);
    // sections are per exported component — Button keeps its own section
    expect(screen.getByRole('button', { name: 'Btn' })).toHaveClass(
      buttonSizes.lg
    );
  });

  it('lets an explicit ButtonLink size prop beat the config', () => {
    render(
      <ConfigProvider defaults={{ButtonLink: {size: 'sm'}}}>
        <ButtonLink href='/x' size='lg'>
          Link
        </ButtonLink>
      </ConfigProvider>
    );
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link).toHaveClass(buttonSizes.lg);
    expect(link).not.toHaveClass(buttonSizes.sm);
  });
});

describe('ConfigProvider — Toast defaults', () => {
  it('pins the container to the config placement when the prop is omitted', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: withConfig({Toast: {placement: 'top-left'}}),
    });

    act(() => {
      result.current('Placed', { duration: 0 });
    });

    const viewport = screen.getByRole('status').parentElement;
    expect(viewport).toHaveClass(toastPlacements['top-left']);
    expect(viewport).not.toHaveClass(toastPlacements['bottom-right']);
  });

  it('lets an explicit placement prop beat the config', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ConfigProvider defaults={{Toast: {placement: 'top-left'}}}>
          <ToastContainer placement='top-right'>{children}</ToastContainer>
        </ConfigProvider>
      ),
    });

    act(() => {
      result.current('Placed', { duration: 0 });
    });

    const viewport = screen.getByRole('status').parentElement;
    expect(viewport).toHaveClass(toastPlacements['top-right']);
    expect(viewport).not.toHaveClass(toastPlacements['top-left']);
  });

  it('caps the stack at the config maxCount', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: withConfig({Toast: {maxCount: 2}}),
    });

    act(() => {
      result.current('One', { duration: 0 });
      result.current('Two', { duration: 0 });
      result.current('Three', { duration: 0 });
    });

    expect(screen.queryByText('One')).not.toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Three')).toBeInTheDocument();
  });

  it('lets an explicit maxCount prop beat the config', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ConfigProvider defaults={{Toast: {maxCount: 1}}}>
          <ToastContainer maxCount={3}>{children}</ToastContainer>
        </ConfigProvider>
      ),
    });

    act(() => {
      result.current('One', { duration: 0 });
      result.current('Two', { duration: 0 });
      result.current('Three', { duration: 0 });
    });

    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Three')).toBeInTheDocument();
  });

  it('uses the config duration for useToast calls that omit one', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useToast(), {
        wrapper: withConfig({Toast: {duration: 300}}),
      });

      act(() => {
        result.current('Brief');
      });

      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'closed');
    } finally {
      vi.useRealTimers();
    }
  });

  it('lets an explicit call duration beat the config', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useToast(), {
        wrapper: withConfig({Toast: {duration: 300}}),
      });

      act(() => {
        result.current('Patient', { duration: 1000 });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
      act(() => {
        vi.advanceTimersByTime(699);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'closed');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps loading() persistent regardless of the config duration', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useToast(), {
        wrapper: withConfig({Toast: {duration: 300}}),
      });

      act(() => {
        result.current.loading('Loading…');
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the module-level toast() on its 3000ms default under config', () => {
    vi.useFakeTimers();
    try {
      render(
        <ConfigProvider defaults={{Toast: {duration: 300}}}>
          <ToastContainer>{null}</ToastContainer>
        </ConfigProvider>
      );

      act(() => {
        toast('Module channel');
      });

      // module channel runs outside the React tree — no config access
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
      act(() => {
        vi.advanceTimersByTime(2699);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'closed');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('ConfigProvider — Tooltip delay', () => {
  it('shows after the config delay', () => {
    vi.useFakeTimers();
    try {
      render(
        <ConfigProvider defaults={{Tooltip: {delay: 300}}}>
          <TooltipHarness content='Tip' />
        </ConfigProvider>
      );
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

  it('lets an explicit delay prop beat the config', () => {
    vi.useFakeTimers();
    try {
      render(
        <ConfigProvider defaults={{Tooltip: {delay: 300}}}>
          <TooltipHarness content='Tip' delay={500} />
        </ConfigProvider>
      );
      hover();
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(openState()).toBe('false');
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(openState()).toBe('true');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('ConfigProvider — nesting', () => {
  it('lets the innermost provider win per component section', () => {
    render(
      <ConfigProvider defaults={{Button: {size: 'sm'}}}>
        <Button>Outer</Button>
        <ConfigProvider defaults={{Button: {size: 'lg'}}}>
          <Button>Inner</Button>
        </ConfigProvider>
      </ConfigProvider>
    );

    expect(screen.getByRole('button', { name: 'Outer' })).toHaveClass(
      buttonSizes.sm
    );
    expect(screen.getByRole('button', { name: 'Inner' })).toHaveClass(
      buttonSizes.lg
    );
  });

  it('shallow-merges a section: untouched keys keep the outer value', () => {
    vi.useFakeTimers();
    try {
      render(
        <ConfigProvider
          defaults={{Toast: {duration: 5000}, Button: {size: 'sm'}}}
        >
          <Button>Outer</Button>
          <ConfigProvider defaults={{Toast: {placement: 'top-left'}}}>
            <ToastContainer>
              <Button>Inner</Button>
              <ToastFire />
            </ToastContainer>
          </ConfigProvider>
        </ConfigProvider>
      );

      // Button section untouched by the inner provider → outer value
      expect(screen.getByRole('button', { name: 'Inner' })).toHaveClass(
        buttonSizes.sm
      );

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'fire' }));
      });

      // placement comes from the inner provider, duration from the outer
      const viewport = screen.getByRole('status').parentElement;
      expect(viewport).toHaveClass(toastPlacements['top-left']);

      act(() => {
        vi.advanceTimersByTime(4999);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'closed');
    } finally {
      vi.useRealTimers();
    }
  });

  it('passes the outer config through a provider without defaults', () => {
    render(
      <ConfigProvider defaults={{Button: {size: 'lg'}}}>
        <ConfigProvider>
          <Button>OK</Button>
        </ConfigProvider>
      </ConfigProvider>
    );
    expect(screen.getByRole('button', { name: 'OK' })).toHaveClass(
      buttonSizes.lg
    );
  });

  it('works alongside LocaleProvider in either nesting order', () => {
    const { unmount } = render(
      <ConfigProvider defaults={{Button: {size: 'lg'}}}>
        <LocaleProvider strings={{pagination: {previous: '上一页'}}}>
          <Pagination total={20} />
          <Button>OK</Button>
        </LocaleProvider>
      </ConfigProvider>
    );
    expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toHaveClass(
      buttonSizes.lg
    );
    unmount();

    render(
      <LocaleProvider strings={{pagination: {previous: '上一页'}}}>
        <ConfigProvider defaults={{Button: {size: 'sm'}}}>
          <Pagination total={20} />
          <Button>OK</Button>
        </ConfigProvider>
      </LocaleProvider>
    );
    expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toHaveClass(
      buttonSizes.sm
    );
  });
});

// ─── No provider: byte-identical regression guards ──────────────────

describe('ConfigProvider — absent provider keeps built-in defaults', () => {
  it('keeps Button and ButtonLink at md', () => {
    render(
      <>
        <Button>OK</Button>
        <ButtonLink href='/x'>Link</ButtonLink>
      </>
    );
    expect(screen.getByRole('button', { name: 'OK' })).toHaveClass(
      buttonSizes.md
    );
    expect(screen.getByRole('link', { name: 'Link' })).toHaveClass(
      buttonSizes.md
    );
  });

  it('keeps the container at bottom-right with no maxCount', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ToastContainer>{children}</ToastContainer>
      ),
    });

    act(() => {
      result.current('One', { duration: 0 });
      result.current('Two', { duration: 0 });
      result.current('Three', { duration: 0 });
    });

    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Three')).toBeInTheDocument();
    const viewport = screen.getAllByRole('status')[0]!.parentElement;
    expect(viewport).toHaveClass(toastPlacements['bottom-right']);
  });

  it('keeps the useToast default duration at 3000', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useToast(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <ToastContainer>{children}</ToastContainer>
        ),
      });

      act(() => {
        result.current('Default');
      });

      act(() => {
        vi.advanceTimersByTime(2999);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.getByRole('status')).toHaveAttribute('data-state', 'closed');
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the Tooltip delay at 150', () => {
    vi.useFakeTimers();
    try {
      render(<TooltipHarness content='Tip' />);
      hover();
      act(() => {
        vi.advanceTimersByTime(149);
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
});

describe('ConfigProvider — a11y', () => {
  it('has no axe violations across the wired surfaces', async () => {
    const { axe } = await import('jest-axe');
    render(
      <ConfigProvider
        defaults={{
          Button: { size: 'lg' },
          ButtonLink: { size: 'sm' },
          Toast: { duration: 0, placement: 'top-left' },
          Tooltip: { delay: 300 },
        }}
      >
        <Button>Save changes</Button>
        <ButtonLink href='/docs'>Docs</ButtonLink>
        <Tooltip content='Helpful tip'>
          <button>Hover me</button>
        </Tooltip>
        <ToastContainer>{null}</ToastContainer>
      </ConfigProvider>
    );
    act(() => {
      toast.success('Saved');
    });
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
