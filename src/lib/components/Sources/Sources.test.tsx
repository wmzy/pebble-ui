import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import Sources from './Sources';

const items = [
  {
    id: 'a',
    title: 'Design tokens guide',
    url: 'https://example.com/tokens',
    snippet: 'Tokens map 1:1 to components.',
  },
  { id: 'b', title: 'Internal memo' },
  {
    id: 'c',
    title: 'Third source',
    url: 'https://example.com/third',
    snippet: 'Quoted excerpt.',
  },
];

/** Renders Sources with a controlled `expanded` and mirrors the state
 * out, so control wiring is observable. */
function ControlledHost() {
  const [expanded, , control] = useControl(undefined, [] as readonly string[]);
  return (
    <>
      <Sources items={items} expanded={control} />
      <output data-testid='mirror'>{expanded.join(',')}</output>
    </>
  );
}

describe('Sources', () => {
  it('renders a named list with every title', () => {
    render(<Sources items={items} />);
    const list = screen.getByRole('list', { name: 'Sources' });
    expect(within(list).getByText('Design tokens guide')).toBeInTheDocument();
    expect(within(list).getByText('Internal memo')).toBeInTheDocument();
    expect(within(list).getByText('Third source')).toBeInTheDocument();
  });

  it('numbers items sequentially as [1] [2] [3]', () => {
    render(<Sources items={items} />);
    expect(screen.getByText('[1]')).toBeInTheDocument();
    expect(screen.getByText('[2]')).toBeInTheDocument();
    expect(screen.getByText('[3]')).toBeInTheDocument();
  });

  it('renders url items as safe external links', () => {
    render(<Sources items={items} />);
    const link = screen.getByRole('link', { name: 'Design tokens guide' });
    expect(link).toHaveAttribute('href', 'https://example.com/tokens');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });

  it('renders url-less items as plain text, not links', () => {
    render(<Sources items={items} />);
    expect(
      screen.queryByRole('link', { name: 'Internal memo' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Internal memo')).toBeInTheDocument();
  });

  it('collapses snippets by default and expands on toggle', async () => {
    const user = userEvent.setup();
    render(<Sources items={items} />);
    const toggle = screen.getAllByRole('button', { name: 'Show excerpt' })[0]!;
    const firstItem = () => screen.getAllByRole('listitem')[0]!;

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(firstItem()).toHaveAttribute('data-state', 'collapsed');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-label', 'Hide excerpt');
    expect(firstItem()).toHaveAttribute('data-state', 'expanded');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-label', 'Show excerpt');
  });

  it('renders snippet text and wires aria-controls to it', () => {
    render(<Sources items={items} />);
    const snippet = screen.getByText('Tokens map 1:1 to components.');
    const toggle = screen.getAllByRole('button', { name: 'Show excerpt' })[0]!;
    expect(toggle).toHaveAttribute('aria-controls', snippet.id);
  });

  it('honors an initial expanded value', () => {
    render(<Sources items={items} expanded={['a']} />);
    expect(
      screen.getByRole('button', { name: 'Hide excerpt' })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('reports toggle changes through a controlled expanded', async () => {
    const user = userEvent.setup();
    render(<ControlledHost />);
    expect(screen.getByTestId('mirror')).toHaveTextContent('');

    await user.click(screen.getAllByRole('button', { name: 'Show excerpt' })[0]!);
    expect(screen.getByTestId('mirror')).toHaveTextContent('a');

    await user.click(screen.getByRole('button', { name: 'Hide excerpt' }));
    expect(screen.getByTestId('mirror')).toHaveTextContent('');
  });

  it('renders only toggle buttons for items with snippets', () => {
    render(<Sources items={items} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  describe('compact', () => {
    it('renders an inline nav of numbered badges', () => {
      render(<Sources items={items} compact />);
      const nav = screen.getByRole('navigation', { name: 'Sources' });
      expect(within(nav).getByText('[1]')).toBeInTheDocument();
      expect(within(nav).getByText('[2]')).toBeInTheDocument();
      expect(within(nav).getByText('[3]')).toBeInTheDocument();
    });

    it('links badges out and names them by title', () => {
      render(<Sources items={items} compact />);
      const link = screen.getByRole('link', { name: '1. Design tokens guide' });
      expect(link).toHaveAttribute('href', 'https://example.com/tokens');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    });

    it('renders url-less badges as non-links', () => {
      render(<Sources items={items} compact />);
      expect(
        screen.queryByRole('link', { name: 'Internal memo' })
      ).not.toBeInTheDocument();
      expect(screen.getByText('[2]')).toBeInTheDocument();
    });
  });

  it('supports a custom accessible label', () => {
    render(<Sources items={items} label='Citations' />);
    expect(screen.getByRole('list', { name: 'Citations' })).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<Sources items={items} className='custom' />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('applies className in compact form', () => {
    const { container } = render(
      <Sources items={items} compact className='custom' />
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('forwards native props to the list', () => {
    render(<Sources items={items} data-testid='sources-list' lang='en' />);
    expect(screen.getByTestId('sources-list')).toHaveAttribute('lang', 'en');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const { container } = render(
      <>
        <Sources items={items} expanded={['a']} />
        <Sources items={items} compact />
      </>
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
