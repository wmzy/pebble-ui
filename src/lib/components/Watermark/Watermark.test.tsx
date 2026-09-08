import { render } from '@testing-library/react';

import Watermark from './Watermark';

type DrawnContext = {
  font: string;
  fillStyle: string;
  textAlign: string;
  textBaseline: string;
};

/** Minimal 2d-context mock: records draw calls, fakes metrics + encoding. */
function mockCanvasContext() {
  const calls = {
    measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
    fillText: vi.fn(),
    toDataURL: vi.fn(() => 'data:image/png;base64,MOCK'),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
  };
  const ctx: DrawnContext & typeof calls = {
    font: '',
    fillStyle: '',
    textAlign: '',
    textBaseline: '',
    ...calls,
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(
    calls.toDataURL
  );
  return { calls, ctx };
}

const overlayOf = (container: HTMLElement) =>
  container.querySelector<HTMLDivElement>('[aria-hidden="true"]');

describe('Watermark', () => {
  it('degrades to no watermark layer when the canvas context is unavailable', () => {
    // jsdom has no 2d canvas context — quiet the not-implemented error and
    // pin the exact degraded path the component must survive.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { container } = render(
      <Watermark content="Haze UI">
        <p>Protected content</p>
      </Watermark>
    );
    expect(overlayOf(container)).toBeNull();
    expect(container.textContent).toBe('Protected content');
  });

  it('draws each content line into a repeating background tile', () => {
    const { calls } = mockCanvasContext();
    const { container } = render(
      <Watermark content={['Haze UI', 'do not copy']} rotate={-30} />
    );

    expect(calls.fillText).toHaveBeenCalledTimes(2);
    expect(calls.fillText).toHaveBeenNthCalledWith(
      1,
      'Haze UI',
      0,
      -0.5 * 14 * 1.3
    );
    expect(calls.fillText).toHaveBeenNthCalledWith(
      2,
      'do not copy',
      0,
      0.5 * 14 * 1.3
    );
    expect(calls.rotate).toHaveBeenCalledWith((-30 * Math.PI) / 180);
    // tile size = content metrics + gap: max line width 8*11=88 + 100 by
    // 2 lines * 14 * 1.3 + 100 (devicePixelRatio is 1 in jsdom)
    expect(calls.scale).toHaveBeenCalledWith(1, 1);
    expect(calls.translate).toHaveBeenCalledWith(
      (88 + 100) / 2,
      (2 * 14 * 1.3 + 100) / 2
    );

    const overlay = overlayOf(container);
    expect(overlay).not.toBeNull();
    expect(overlay?.style.backgroundImage).toContain(
      'data:image/png;base64,MOCK'
    );
  });

  it('uses the default rotation and a readable fallback color by default', () => {
    const { calls, ctx } = mockCanvasContext();
    render(<Watermark content="draft" />);
    expect(calls.rotate).toHaveBeenCalledWith((-22 * Math.PI) / 180);
    // jsdom exposes no --haze-color-text-muted, so the documented fallback
    // color is what lands on the context.
    expect(ctx.fillStyle).toBe('rgba(0, 0, 0, 0.15)');
    expect(ctx.font).toBe('400 14px sans-serif');
    expect(ctx.textAlign).toBe('center');
    expect(ctx.textBaseline).toBe('middle');
  });

  it('honors an explicit font size, color and weight', () => {
    const { calls, ctx } = mockCanvasContext();
    render(
      <Watermark
        content="v2"
        font={{ size: 20, color: 'oklch(0.7 0.1 250)', weight: 600 }}
      />
    );
    expect(calls.fillText).toHaveBeenCalledTimes(1);
    expect(ctx.font).toBe('600 20px sans-serif');
    expect(ctx.fillStyle).toBe('oklch(0.7 0.1 250)');
  });

  it('renders as a container with children beneath the overlay', () => {
    mockCanvasContext();
    const { container } = render(
      <Watermark content="confidential">
        <button type="button">Still clickable</button>
      </Watermark>
    );
    const overlay = overlayOf(container);
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute('aria-hidden')).toBe('true');
    // children come first; the overlay sits on top of them
    expect(overlay?.previousElementSibling?.tagName).toBe('BUTTON');
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('pins a fullscreen watermark to the viewport with the given z-index', () => {
    mockCanvasContext();
    const { container } = render(
      <Watermark content="draft" fullscreen zIndex={42} />
    );
    const overlay = overlayOf(container);
    expect(overlay?.style.position).toBe('fixed');
    expect(overlay?.style.zIndex).toBe('42');
  });

  it('offsets the tile grid origin', () => {
    mockCanvasContext();
    const { container } = render(
      <Watermark content="draft" offset={[12, 34]} />
    );
    expect(overlayOf(container)?.style.backgroundPosition).toBe('12px 34px');
  });

  it('applies className and forwards native props', () => {
    mockCanvasContext();
    const { container } = render(
      <Watermark content="draft" className="custom" data-testid="mark" />
    );
    expect(container.firstChild).toHaveClass('custom');
    expect(container.firstChild).toHaveAttribute('data-testid', 'mark');
  });

  it('has no axe violations', async () => {
    mockCanvasContext();
    const { axe } = await import('jest-axe');
    const { container } = render(
      <Watermark content={['haze-ui', 'internal']}>
        <p>Card content under watermark</p>
      </Watermark>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
    expect(overlayOf(container)).not.toBeNull();
  });
});
