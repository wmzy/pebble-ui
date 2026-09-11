import { render, screen } from '@testing-library/react';

import { create } from 'qrcode';

import QRCode from './QRCode';

// Partial mock: the spy wraps the real implementation by default, so the
// component tests exercise the real matrix encoding; individual tests
// override with a synthetic matrix via mockImplementationOnce.
vi.mock('qrcode', async (importOriginal) => {
  const actual = await importOriginal<typeof import('qrcode')>();
  return { ...actual, create: vi.fn(actual.create) };
});

const VALUE = 'https://haze-ui.dev/docs';

/** Path string the component should build from a matrix (mirrors the spec:
 *  one `M{x} {y}h1v1z` subpath per dark module, row-major). */
function expectedPath(value: string, level: 'L' | 'M' | 'Q' | 'H') {
  const { modules } = create(value, { errorCorrectionLevel: level });
  let d = '';
  for (let row = 0; row < modules.size; row += 1) {
    for (let col = 0; col < modules.size; col += 1) {
      if (modules.get(row, col)) d += `M${col} ${row}h1v1z`;
    }
  }
  return d;
}

describe('QRCode', () => {
  it('encodes a fixed value deterministically (real qrcode matrix)', () => {
    const first = create(VALUE, { errorCorrectionLevel: 'M' });
    const second = create(VALUE, { errorCorrectionLevel: 'M' });
    expect(second.modules.size).toBe(first.modules.size);
    expect([...second.modules.data]).toEqual([...first.modules.data]);

    const { container, unmount } = render(<QRCode value={VALUE} />);
    const d1 = container.querySelector('path')?.getAttribute('d');
    unmount();
    const { container: secondContainer } = render(<QRCode value={VALUE} />);
    const d2 = secondContainer.querySelector('path')?.getAttribute('d');
    expect(d2).toBe(d1);
    // the path covers exactly the dark modules of the real matrix
    const dark = [...first.modules.data].reduce((n, bit) => n + (bit ? 1 : 0), 0);
    expect(d1?.match(/M/g)).toHaveLength(dark);
    expect(d1).toBe(expectedPath(VALUE, 'M'));
    // top-left finder pattern cell is always dark
    expect(d1?.startsWith('M0 0h1v1z')).toBe(true);
  });

  it('renders one subpath per dark module (synthetic matrix)', () => {
    const matrix = [
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1],
    ];
    vi.mocked(create).mockImplementationOnce(
      () =>
        ({
          modules: {
            size: 3,
            get: (row: number, col: number): number =>
              (matrix[row] ?? [])[col] ?? 0,
          },
        }) as unknown as ReturnType<typeof create>
    );
    const { container } = render(<QRCode value='synthetic' />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 3 3');
    expect(container.querySelector('path')).toHaveAttribute(
      'd',
      'M0 0h1v1zM2 0h1v1zM1 1h1v1zM0 2h1v1zM2 2h1v1z'
    );
  });

  it('forwards value and error correction level to create', () => {
    vi.mocked(create).mockClear();
    render(<QRCode value={VALUE} level='H' size={64} />);
    expect(create).toHaveBeenCalledWith(VALUE, { errorCorrectionLevel: 'H' });
    vi.mocked(create).mockClear();
    render(<QRCode value={VALUE} />);
    expect(create).toHaveBeenCalledWith(VALUE, { errorCorrectionLevel: 'M' });
  });

  it('renders at the requested pixel size (default 128)', () => {
    const { container, unmount } = render(<QRCode value={VALUE} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '128');
    expect(svg).toHaveAttribute('height', '128');
    unmount();
    const { container: small } = render(<QRCode value={VALUE} size={200} />);
    expect(small.querySelector('svg')).toHaveAttribute('width', '200');
    expect(small.querySelector('svg')).toHaveAttribute('height', '200');
  });

  it('uses theme tokens as default fills and accepts custom colors', () => {
    const { container, unmount } = render(<QRCode value={VALUE} />);
    expect(container.querySelector('path')).toHaveAttribute(
      'fill',
      'var(--haze-color-text)'
    );
    expect(container.querySelector('rect')).toHaveAttribute(
      'fill',
      'var(--haze-color-bg)'
    );
    unmount();
    const { container: custom } = render(
      <QRCode value={VALUE} modulesColor='#123456' bgColor='#fedcba' />
    );
    expect(custom.querySelector('path')).toHaveAttribute('fill', '#123456');
    expect(custom.querySelector('rect')).toHaveAttribute('fill', '#fedcba');
  });

  it('renders with and without the bordered frame', () => {
    const bordered = render(<QRCode value={VALUE} />);
    expect(bordered.container.querySelector('svg')).toBeInTheDocument();
    bordered.unmount();
    const plain = render(<QRCode value={VALUE} bordered={false} />);
    expect(plain.container.querySelector('svg')).toBeInTheDocument();
  });

  it('exposes the encoded value as the svg image name, overridable via rest', () => {
    render(<QRCode value={VALUE} />);
    expect(screen.getByRole('img', { name: VALUE })).toBeInTheDocument();
    // rest lands on the wrapper div — aria-hidden there silences the graphic
    render(
      <QRCode value={VALUE} data-testid='silent' aria-hidden='true' />
    );
    expect(screen.getByTestId('silent')).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies className to the wrapper', () => {
    render(<QRCode value={VALUE} className='custom' data-testid='qr' />);
    expect(screen.getByTestId('qr')).toHaveClass('custom');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<QRCode value={VALUE} />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
