import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import Signature from './Signature';
import {
  getCanvasPoint,
  normalizeStroke,
  pointDistance,
  serializeStrokes,
} from './signature-points';

const DATA_URL = 'data:image/png;base64,Zm9v';

function createContextStub() {
  return {
    scale: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
  };
}

let ctx: ReturnType<typeof createContextStub>;

beforeEach(() => {
  ctx = createContextStub();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(DATA_URL);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function drawStroke(
  canvas: HTMLCanvasElement,
  points: [number, number][],
  pointerId = 1
) {
  const [start, ...moves] = points;
  if (!start) return;
  fireEvent.pointerDown(canvas, { pointerId, clientX: start[0], clientY: start[1] });
  for (const [x, y] of moves) {
    fireEvent.pointerMove(canvas, { pointerId, clientX: x, clientY: y });
  }
  fireEvent.pointerUp(canvas, { pointerId, clientX: moves.at(-1)?.[0], clientY: moves.at(-1)?.[1] });
}

/** A canvas carries no implicit ARIA role — query the element itself. */
function getCanvas(): HTMLCanvasElement {
  const canvas = document.querySelector('canvas');
  if (!canvas) throw new Error('canvas not rendered');
  return canvas;
}

describe('Signature', () => {
  it('renders a canvas with the toolbar and default labels', () => {
    render(<Signature />);
    expect(getCanvas()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });

  it('sizes the canvas for high-DPI via devicePixelRatio', () => {
    render(<Signature width={200} height={100} />);
    const canvas = getCanvas();
    // jsdom reports devicePixelRatio 1 — backing store equals CSS size,
    // CSS box is pinned inline
    expect(canvas).toHaveAttribute('width', '200');
    expect(canvas).toHaveAttribute('height', '100');
    expect(canvas.style.width).toBe('200px');
    expect(canvas.style.height).toBe('100px');
    expect(ctx.scale).toHaveBeenCalledWith(1, 1);
  });

  it('applies className and forwards native props to the root', () => {
    render(<Signature className="custom" data-testid="pad" aria-label="Sign here" />);
    const root = screen.getByTestId('pad');
    expect(root).toHaveClass('custom');
    expect(root).toHaveAttribute('aria-label', 'Sign here');
  });

  it('degrades to a notice when the 2d context is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(<Signature />);
    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent(/not supported/i);
    expect(document.querySelector('canvas')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('commits a data URL on stroke end and enables the toolbar', () => {
    const onChange = vi.fn();
    render(<Signature onChange={onChange} />);
    const canvas = getCanvas();
    drawStroke(canvas, [
      [10, 10],
      [40, 12],
      [80, 30],
    ]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(DATA_URL);
    expect(ctx.moveTo).toHaveBeenCalledWith(10, 10);
    expect(ctx.lineTo).toHaveBeenCalledWith(80, 30);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled();
  });

  it('commits a dot for a click without movement', () => {
    const onChange = vi.fn();
    render(<Signature onChange={onChange} />);
    const canvas = getCanvas();
    drawStroke(canvas, [[25, 25]]);
    expect(onChange).toHaveBeenCalledWith(DATA_URL);
    expect(ctx.arc).toHaveBeenCalledWith(25, 25, 1, 0, Math.PI * 2);
  });

  it('undo pops strokes one at a time and commits after each', () => {
    const onChange = vi.fn();
    render(<Signature onChange={onChange} />);
    const canvas = getCanvas();
    const undo = screen.getByRole('button', { name: 'Undo' });

    drawStroke(canvas, [[5, 5], [30, 5]], 1);
    drawStroke(canvas, [[5, 30], [30, 30]], 2);
    expect(onChange).toHaveBeenCalledTimes(2);

    fireEvent.click(undo);
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenLastCalledWith(DATA_URL);
    expect(undo).toBeEnabled();

    fireEvent.click(undo);
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(undo).toBeDisabled();
  });

  it('clear wipes the drawing and commits an empty value', () => {
    const onChange = vi.fn();
    render(<Signature onChange={onChange} />);
    const canvas = getCanvas();
    drawStroke(canvas, [[5, 5], [30, 5]]);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 320, 160);
  });

  it('ignores pointer moves that do not belong to the active stroke', () => {
    const onChange = vi.fn();
    render(<Signature onChange={onChange} />);
    const canvas = getCanvas();
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
    // a second pointer joins mid-stroke — must not corrupt the drawing
    fireEvent.pointerMove(canvas, { pointerId: 2, clientX: 200, clientY: 200 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 60, clientY: 10 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 60, clientY: 10 });
    expect(ctx.lineTo).not.toHaveBeenCalledWith(200, 200);
    expect(ctx.lineTo).toHaveBeenCalledWith(60, 10);
  });

  it('locks drawing and the toolbar when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Signature disabled onChange={onChange} />);
    const canvas = getCanvas();
    expect(canvas).toHaveAttribute('data-disabled', 'true');
    drawStroke(canvas, [[10, 10], [60, 10]]);
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accepts custom toolbar labels', () => {
    render(<Signature undoLabel="Rückgängig" clearLabel="Löschen" />);
    expect(screen.getByRole('button', { name: 'Rückgängig' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('pushes commits into a controlled value', () => {
    function Controlled() {
      const [value, , control] = useControl(undefined, '');
      return (
        <>
          <Signature value={control} />
          <output data-testid="committed">{value || '(blank)'}</output>
        </>
      );
    }
    render(<Controlled />);
    const canvas = getCanvas();
    expect(screen.getByTestId('committed')).toHaveTextContent('(blank)');
    drawStroke(canvas, [[10, 10], [60, 10]]);
    expect(screen.getByTestId('committed')).toHaveTextContent(DATA_URL);
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const { container } = render(<Signature aria-label="Signature" />);
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('signature-points', () => {
  it('pointDistance measures the euclidean distance', () => {
    expect(pointDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(pointDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it('getCanvasPoint maps client coordinates into canvas space', () => {
    expect(getCanvasPoint(120, 80, { left: 100, top: 50 })).toEqual({ x: 20, y: 30 });
  });

  it('normalizeStroke drops sub-threshold moves but keeps endpoints', () => {
    const stroke = [
      { x: 0, y: 0 },
      { x: 0.2, y: 0.1 },
      { x: 5, y: 0 },
      { x: 5.1, y: 0 },
    ];
    expect(normalizeStroke(stroke, 1)).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5.1, y: 0 },
    ]);
  });

  it('normalizeStroke keeps single-point strokes intact', () => {
    const dot = [{ x: 3, y: 4 }];
    expect(normalizeStroke(dot, 1)).toEqual([{ x: 3, y: 4 }]);
  });

  it('serializeStrokes produces a deterministic compact form', () => {
    expect(
      serializeStrokes([
        [
          { x: 1.2, y: 2.4 },
          { x: 3.5, y: 4.5 },
        ],
        [{ x: 9, y: 9 }],
      ])
    ).toBe('1,2 4,5|9,9');
    expect(serializeStrokes([])).toBe('');
  });
});
