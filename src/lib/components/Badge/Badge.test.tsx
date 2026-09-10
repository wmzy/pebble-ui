import { render, screen } from '@testing-library/react';

import Badge from './Badge';
import {badgeVariants, badgeSizes} from './index';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders as a span', () => {
    const { container } = render(<Badge>Tag</Badge>);
    expect(container.firstChild?.nodeName).toBe('SPAN');
  });

  it('applies className', () => {
    render(<Badge className="custom">New</Badge>);
    expect(screen.getByText('New')).toHaveClass('custom');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <>
        <Badge>New</Badge>
        <Badge variant="success">Saved</Badge>
      </>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('badgeVariants / badgeSizes exports', () => {
  it('exposes the variant and size skin classes for composition', () => {
    expect(Object.keys(badgeVariants)).toEqual([
      'default',
      'success',
      'warning',
      'danger',
      'info',
    ]);
    expect(Object.keys(badgeSizes)).toEqual(['sm', 'md']);
    for (const cls of [...Object.values(badgeVariants), ...Object.values(badgeSizes)]) {
      expect(cls).toBeTruthy();
    }
  });

  it('are the exact classes Badge wears', () => {
    render(<Badge variant="success" size="sm">Saved</Badge>);
    const badge = screen.getByText('Saved');
    expect(badge).toHaveClass(badgeVariants.success);
    expect(badge).toHaveClass(badgeSizes.sm);
  });
});
