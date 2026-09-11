import { render, screen } from '@testing-library/react';

import Descriptions from './Descriptions';

const items = [
  { key: 'name', label: 'Name', children: 'haze-ui' },
  { key: 'version', label: 'Version', children: '1.13.0' },
  { key: 'license', label: 'License', children: 'MIT' },
];

describe('Descriptions', () => {
  it('renders every label and value', () => {
    render(<Descriptions items={items} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('haze-ui')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('1.13.0')).toBeInTheDocument();
    expect(screen.getByText('License')).toBeInTheDocument();
    expect(screen.getByText('MIT')).toBeInTheDocument();
  });

  it('uses definition-list markup (dl/dt/dd pairs)', () => {
    const { container } = render(<Descriptions items={items} />);
    expect(container.querySelector('dl')).toBeInTheDocument();
    expect(container.querySelectorAll('dt')).toHaveLength(3);
    expect(container.querySelectorAll('dd')).toHaveLength(3);
    // each dt is paired with its dd inside a group wrapper
    const firstGroup = container.querySelector('dl > div');
    expect(firstGroup?.querySelector('dt')?.textContent).toBe('Name');
    expect(firstGroup?.querySelector('dd')?.textContent).toBe('haze-ui');
  });

  it('applies className to the root', () => {
    render(<Descriptions items={items} className="custom" />);
    const root = screen.getByText('Name').closest('dl')!.parentElement!;
    expect(root).toHaveClass('custom');
  });

  it('forwards native props to the root', () => {
    render(<Descriptions items={items} data-testid="desc" aria-label="Package summary" />);
    expect(screen.getByTestId('desc')).toHaveAttribute('aria-label', 'Package summary');
  });

  it('renders the title above the list', () => {
    const { container } = render(<Descriptions items={items} title="Package info" />);
    const dl = container.querySelector('dl')!;
    const title = screen.getByText('Package info');
    expect(title).toBeInTheDocument();
    // title element precedes the dl inside the root
    expect(title.compareDocumentPosition(dl)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('defaults to three description columns', () => {
    const { container } = render(<Descriptions items={items} />);
    const dl = container.querySelector('dl')!;
    expect(dl.style.gridTemplateColumns).toBe(
      'repeat(3, auto minmax(0, 1fr))'
    );
  });

  it('honours a custom column count', () => {
    const { container } = render(<Descriptions items={items} columns={4} />);
    expect(container.querySelector('dl')!.style.gridTemplateColumns).toBe(
      'repeat(4, auto minmax(0, 1fr))'
    );
  });

  it('stretches a value across its span', () => {
    const { container } = render(
      <Descriptions
        items={[{ key: 'full', label: 'Full row', children: 'spans two columns', span: 2 }]}
      />
    );
    // span 2 = the dd's own value track + one more label+value pair of tracks
    expect(container.querySelector('dd')!.style.gridColumn).toBe('span 3');
  });

  it('clamps span to the column count', () => {
    const { container } = render(
      <Descriptions
        items={[{ key: 'wide', label: 'Wide', children: 'clamped', span: 9 }]}
        columns={2}
      />
    );
    expect(container.querySelector('dd')!.style.gridColumn).toBe('span 3');
  });

  it('treats a non-positive span as one column', () => {
    const { container } = render(
      <Descriptions items={[{ key: 'x', label: 'X', children: 'y', span: 0 }]} />
    );
    expect(container.querySelector('dd')!.style.gridColumn).toBe('span 1');
  });

  it('applies the bordered variant classes', () => {
    const { container } = render(<Descriptions items={items} bordered />);
    const dl = container.querySelector('dl')!;
    expect(dl.className).toContain('listBordered');
    expect(dl.className).not.toContain('listDefault');
    expect(container.querySelector('dt')!.className).toContain('labelCellBordered');
    expect(container.querySelector('dd')!.className).toContain('valueCellBordered');
  });

  it('applies the compact size to cells', () => {
    const { container } = render(<Descriptions items={items} size="sm" />);
    expect(container.querySelector('dt')!.className).toContain('sizeSm');
    expect(container.querySelector('dd')!.className).toContain('sizeSm');
  });

  it('renders nothing but the list for empty items', () => {
    const { container } = render(<Descriptions items={[]} />);
    expect(container.querySelector('dl')).toBeInTheDocument();
    expect(container.querySelectorAll('dt')).toHaveLength(0);
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <>
        <Descriptions
          title="Package info"
          items={[
            { key: 'name', label: 'Name', children: 'haze-ui' },
            { key: 'version', label: 'Version', children: '1.13.0' },
            { key: 'desc', label: 'Description', children: 'A React UI library', span: 2 },
          ]}
        />
        <Descriptions
          bordered
          size="sm"
          items={items}
        />
      </>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
