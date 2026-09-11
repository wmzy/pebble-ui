import { render, screen } from '@testing-library/react';

import LocaleProvider from '../LocaleProvider';

import DiffViewer from './DiffViewer';

describe('DiffViewer', () => {
  it('renders unchanged lines', () => {
    render(<DiffViewer oldValue="hello" newValue="hello" />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<DiffViewer oldValue="a" newValue="b" className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('shows added lines', () => {
    const { container } = render(<DiffViewer oldValue="" newValue="new line" />);
    expect(container.querySelector('[class*="added"]')).toBeInTheDocument();
  });

  it('shows removed lines', () => {
    const { container } = render(<DiffViewer oldValue="old line" newValue="" />);
    expect(container.querySelector('[class*="removed"]')).toBeInTheDocument();
  });

  it('shows diff header', () => {
    render(<DiffViewer oldValue="a" newValue="b" />);
    expect(screen.getByText('Diff')).toBeInTheDocument();
  });

  it('renders the header from the active locale pack', () => {
    render(
      <LocaleProvider locale="ja-JP">
        <DiffViewer oldValue="a" newValue="b" />
      </LocaleProvider>
    );
    expect(screen.getByText('差分')).toBeInTheDocument();
    expect(screen.queryByText('Diff')).not.toBeInTheDocument();
  });

  it('lets a strings override reword the header', () => {
    render(
      <LocaleProvider strings={{ diffViewer: { header: 'Changes' } }}>
        <DiffViewer oldValue="a" newValue="b" />
      </LocaleProvider>
    );
    expect(screen.getByText('Changes')).toBeInTheDocument();
  });

  it('handles multiline diff', () => {
    render(<DiffViewer oldValue={'line1\nline2'} newValue={'line1\nline3'} />);
    expect(screen.getByText('line1')).toBeInTheDocument();
  });

  it('marks appended tail line as added', () => {
    render(<DiffViewer oldValue={'a\nb'} newValue={'a\nb\nc'} />);
    const addedLine = screen.getByText('c').closest('div');
    expect(addedLine?.className).toContain('added');
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('marks removed tail line as removed', () => {
    render(<DiffViewer oldValue={'a\nb\nc'} newValue={'a\nb'} />);
    const removedLine = screen.getByText('c').closest('div');
    expect(removedLine?.className).toContain('removed');
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<DiffViewer oldValue={'a\nb'} newValue={'a\nc'} />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
