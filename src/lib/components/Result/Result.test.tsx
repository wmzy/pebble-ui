import { render, screen } from '@testing-library/react';
// vitest's expect — jest-axe's @types pollution narrows the global one
// (no message-argument overload); explicit import restores it.
import { expect } from 'vitest';

import Result from './Result';

describe('Result', () => {
  it('renders title, subTitle and extra action area', () => {
    render(
      <Result
        title='Payment successful'
        subTitle='Order 2026-09-11-0001 has been confirmed.'
        extra={<button type='button'>Back to orders</button>}
      />
    );
    expect(screen.getByText('Payment successful')).toBeInTheDocument();
    expect(
      screen.getByText('Order 2026-09-11-0001 has been confirmed.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Back to orders' })
    ).toBeInTheDocument();
  });

  it('renders a decorative svg illustration for every status', () => {
    const statuses = [
      'success',
      'error',
      'info',
      'warning',
      '403',
      '404',
      '500',
    ] as const;
    for (const status of statuses) {
      const { unmount } = render(<Result status={status} />);
      const svg = document.querySelector('svg[aria-hidden="true"]');
      expect(svg, `status "${status}" should render its illustration`).toBeInstanceOf(
        SVGSVGElement
      );
      unmount();
    }
  });

  it('renders distinct default illustrations per status', () => {
    const { container, unmount } = render(<Result status='info' />);
    const infoMarkup = container.querySelector('svg')?.innerHTML;
    unmount();
    const { container: errorContainer } = render(<Result status='error' />);
    const errorMarkup = errorContainer.querySelector('svg')?.innerHTML;
    expect(errorMarkup).not.toBe(infoMarkup);
  });

  it('renders a custom icon replacing the default illustration', () => {
    render(<Result status='success' icon={<span data-testid='custom-icon'>ok</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeNull();
  });

  it('omits title/subTitle/extra nodes when not provided', () => {
    const { container } = render(<Result />);
    expect(container.querySelectorAll('div')).toHaveLength(2);
    expect(screen.queryByText(/./)).not.toBeInTheDocument();
  });

  it('applies className and forwards native props to the container', () => {
    render(<Result className='custom' data-testid='result' role='region' />);
    expect(screen.getByTestId('result')).toHaveClass('custom');
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Result
        status='error'
        title='Submission failed'
        subTitle='The server rejected the payload.'
        extra={<button type='button'>Retry</button>}
      />
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
