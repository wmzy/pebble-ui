import { render, screen } from '@testing-library/react';

import { Grid, GridItem } from './index';
import { lgSpans, mdSpans, smSpans, spanClasses } from './grid-item-styles';

describe('Grid', () => {
  it('renders children', () => {
    render(<Grid><div>child</div></Grid>);
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<Grid className="custom">x</Grid>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders with default 12 columns', () => {
    const { container } = render(<Grid>z</Grid>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('marks the root with data-slot', () => {
    const { container } = render(<Grid>x</Grid>);
    expect(container.firstChild).toHaveAttribute('data-slot', 'grid');
  });

  it('keeps the default DOM unchanged when responsive is off', () => {
    const { container: plainContainer } = render(<Grid>x</Grid>);
    const plain = plainContainer.firstChild as HTMLElement;
    const plainClasses = Array.from(plain.classList);

    const { container: offContainer } = render(
      <Grid responsive={false}>x</Grid>
    );
    const off = offContainer.firstChild as HTMLElement;
    expect(off.className).toBe(plain.className);

    // responsive adds exactly one class — the container-type context
    const { container: onContainer } = render(<Grid responsive>x</Grid>);
    const on = onContainer.firstChild as HTMLElement;
    expect(on.classList.length).toBe(plainClasses.length + 1);
    for (const cls of plainClasses) {
      expect(on.classList).toContain(cls);
    }
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Grid>
        <GridItem span={6}>half</GridItem>
        <GridItem span={6}>other half</GridItem>
      </Grid>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('GridItem', () => {
  it('renders children', () => {
    render(<GridItem><div>item</div></GridItem>);
    expect(screen.getByText('item')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<GridItem className="custom">x</GridItem>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('marks the item with data-slot', () => {
    const { container } = render(<GridItem>x</GridItem>);
    expect(container.firstChild).toHaveAttribute('data-slot', 'grid-item');
  });

  it('sets gridColumn from start and span', () => {
    const { container } = render(<GridItem start={2} span={3}>placed</GridItem>);
    expect(container.firstChild).toHaveStyle({ gridColumn: '2 / span 3' });
  });

  it('omits start line when start is not given', () => {
    const { container } = render(<GridItem span={2}>flow</GridItem>);
    expect(container.firstChild).toHaveStyle({ gridColumn: 'span 2' });
  });

  it('adds no classes of its own without responsive props', () => {
    const { container } = render(<GridItem className="custom">x</GridItem>);
    expect((container.firstChild as HTMLElement).className).toBe('custom');
  });

  it('applies the fallback span class and every breakpoint span class', () => {
    const { container } = render(
      <GridItem span={2} sm={6} md={4} lg={3}>responsive</GridItem>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.classList).toContain(spanClasses[2]);
    expect(el.classList).toContain(smSpans[6]);
    expect(el.classList).toContain(mdSpans[4]);
    expect(el.classList).toContain(lgSpans[3]);
  });

  it('applies only the breakpoints that are given', () => {
    const { container } = render(<GridItem md={12}>md only</GridItem>);
    const el = container.firstChild as HTMLElement;
    expect(el.classList).toContain(mdSpans[12]);
    expect(el.classList).not.toContain(smSpans[12]);
    expect(el.classList).not.toContain(lgSpans[12]);
    // fallback below every breakpoint is the span prop (default 1)
    expect(el.classList).toContain(spanClasses[1]);
  });

  it('keeps start through an inline longhand when responsive spans are used', () => {
    const { container } = render(
      <GridItem start={2} sm={6}>startful</GridItem>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.gridColumnStart).toBe('2');
    // the span now comes from classes, not from an inline shorthand
    expect(el.style.gridColumn).toBe('');
  });

  it('falls back to the legacy inline style for spans outside the 1-12 matrix', () => {
    const { container } = render(<GridItem span={24} lg={6}>wide</GridItem>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.gridColumn).toBe('span 24');
  });

  it('has no axe violations with responsive spans', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Grid responsive columns={4}>
        <GridItem sm={12} md={6} lg={3}>quarter</GridItem>
        <GridItem sm={12} md={6} lg={3}>quarter</GridItem>
      </Grid>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
