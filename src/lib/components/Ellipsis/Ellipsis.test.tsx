import type { ReactElement } from 'react';
import type { HazeStringsOverrides } from '../LocaleProvider';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import LocaleProvider from '../LocaleProvider';

import Ellipsis from './Ellipsis';

const LONG =
  'A rather long piece of copy that will not fit the line budget and therefore has to be clamped with an ellipsis.';

/*
 * `ellipsis` 文案 section 经 patches-wave2/TextStatPolish.md 进三个
 * locale pack（主 agent 收口时应用）。这里用 provider override 供给同
 * 值，测试不依赖 pack 落地；patch 应用后 override 与 en 包等值，语义
 * 不变。cast 是必须的：override 类型按 keyof HazeStrings 收窄，patch
 * 落地前没有 `ellipsis` 键。
 */
const ellipsisStrings = {
  ellipsis: { expand: 'Expand', collapse: 'Collapse' },
} as unknown as HazeStringsOverrides;

function renderEllipsis(ui: ReactElement) {
  return render(<LocaleProvider strings={ellipsisStrings}>{ui}</LocaleProvider>);
}

// 截断检测走 scrollHeight > clientHeight；jsdom 里两者恒 0，在
// Element.prototype 上 stub 出可配置的几何。
function installGeometry(scrollHeight: number, clientHeight: number) {
  const scroll = vi
    .spyOn(Element.prototype, 'scrollHeight', 'get')
    .mockReturnValue(scrollHeight);
  const client = vi
    .spyOn(Element.prototype, 'clientHeight', 'get')
    .mockReturnValue(clientHeight);
  return () => {
    scroll.mockRestore();
    client.mockRestore();
  };
}

describe('Ellipsis', () => {
  it('clamps to one line by default', () => {
    const restore = installGeometry(120, 40);
    try {
      renderEllipsis(<Ellipsis>{LONG}</Ellipsis>);
      expect(screen.getByText(LONG).getAttribute('style')).toContain(
        '-webkit-line-clamp: 1',
      );
    } finally {
      restore();
    }
  });

  it('clamps to the `lines` budget when given', () => {
    const restore = installGeometry(120, 40);
    try {
      renderEllipsis(<Ellipsis lines={3}>{LONG}</Ellipsis>);
      expect(screen.getByText(LONG).getAttribute('style')).toContain(
        '-webkit-line-clamp: 3',
      );
    } finally {
      restore();
    }
  });

  it('leaves the text unclamped when it fits', () => {
    const restore = installGeometry(40, 40);
    try {
      renderEllipsis(<Ellipsis lines={2} tooltip expandable>
        {LONG}
      </Ellipsis>);
      expect(screen.getByText(LONG).getAttribute('style')).toBeNull();
      // 不截断：既无 tooltip 也无展开按钮
      expect(document.querySelector('[role="tooltip"]')).toBeNull();
      expect(screen.queryByRole('button')).toBeNull();
    } finally {
      restore();
    }
  });

  it('wraps clamped text in a Tooltip when truncated and tooltip is on', () => {
    const restore = installGeometry(120, 40);
    try {
      const { container } = renderEllipsis(<Ellipsis tooltip>{LONG}</Ellipsis>);
      const panel = container.querySelector('[role="tooltip"]');
      expect(panel).not.toBeNull();
      expect(panel?.textContent).toBe(LONG);
    } finally {
      restore();
    }
  });

  it('omits the Tooltip when tooltip is off', () => {
    const restore = installGeometry(120, 40);
    try {
      const { container } = renderEllipsis(<Ellipsis>{LONG}</Ellipsis>);
      expect(container.querySelector('[role="tooltip"]')).toBeNull();
    } finally {
      restore();
    }
  });

  it('expandable: toggle reveals full text and reports onExpandChange', async () => {
    const restore = installGeometry(120, 40);
    try {
      const user = userEvent.setup();
      const onExpandChange = vi.fn();
      renderEllipsis(
        <Ellipsis lines={2} expandable onExpandChange={onExpandChange}>
          {LONG}
        </Ellipsis>,
      );

      const text = screen.getByText(LONG);
      expect(text.getAttribute('style')).toContain('-webkit-line-clamp: 2');

      await user.click(screen.getByRole('button', { name: 'Expand' }));
      expect(screen.getByText(LONG).getAttribute('style')).not.toContain('-webkit-line-clamp');
      expect(onExpandChange).toHaveBeenLastCalledWith(true);

      await user.click(screen.getByRole('button', { name: 'Collapse' }));
      expect(screen.getByText(LONG).getAttribute('style')).toContain(
        '-webkit-line-clamp: 2',
      );
      expect(onExpandChange).toHaveBeenLastCalledWith(false);
    } finally {
      restore();
    }
  });

  it('expandable is keyboard operable', async () => {
    const restore = installGeometry(120, 40);
    try {
      const user = userEvent.setup();
      renderEllipsis(<Ellipsis lines={2} expandable>{LONG}</Ellipsis>);

      const button = screen.getByRole('button', { name: 'Expand' });
      await user.tab();
      expect(button).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
      expect(screen.getByText(LONG).getAttribute('style')).not.toContain('-webkit-line-clamp');
    } finally {
      restore();
    }
  });

  it('expanded is controllable via useControl', async () => {
    function Controlled() {
      const [expanded, , ctrl] = useControl(undefined, false);
      return (
        <>
          <Ellipsis lines={2} expandable expanded={ctrl}>
            {LONG}
          </Ellipsis>
          <output data-testid='state'>{String(expanded)}</output>
        </>
      );
    }

    const restore = installGeometry(120, 40);
    try {
      const user = userEvent.setup();
      renderEllipsis(<Controlled />);
      expect(screen.getByTestId('state')).toHaveTextContent('false');
      expect(screen.getByText(LONG).getAttribute('style')).toContain(
        '-webkit-line-clamp: 2',
      );

      await user.click(screen.getByRole('button', { name: 'Expand' }));
      expect(screen.getByTestId('state')).toHaveTextContent('true');
      expect(screen.getByText(LONG).getAttribute('style')).not.toContain('-webkit-line-clamp');
    } finally {
      restore();
    }
  });

  it('merges className and forwards native props', () => {
    const restore = installGeometry(120, 40);
    try {
      renderEllipsis(
        <Ellipsis className='custom' data-testid='bio' aria-label='Biography'>
          {LONG}
        </Ellipsis>,
      );
      const root = screen.getByTestId('bio');
      expect(root).toHaveClass('custom');
      expect(root).toHaveAttribute('aria-label', 'Biography');
      expect(root.tagName).toBe('SPAN');
    } finally {
      restore();
    }
  });

  it('has no axe violations (truncated, tooltip + expandable)', async () => {
    const { axe } = await import('jest-axe');
    const restore = installGeometry(120, 40);
    try {
      const { container } = renderEllipsis(
        <>
          <Ellipsis tooltip>{LONG}</Ellipsis>
          <Ellipsis lines={2} expandable>{LONG}</Ellipsis>
        </>,
      );
      const results = await axe(container, {
        rules: { region: { enabled: false } },
      });
      expect(results.violations).toEqual([]);
    } finally {
      restore();
    }
  });
});
