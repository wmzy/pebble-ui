import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { usePrevious } from './usePrevious';

describe('usePrevious', () => {
  it('returns undefined on first render', () => {
    function Probe({ value }: { value: number }) {
      const prev = usePrevious(value);
      return <output data-testid='prev'>{prev === undefined ? '' : String(prev)}</output>;
    }
    render(<Probe value={1} />);
    expect(screen.getByTestId('prev')).toBeEmptyDOMElement();
  });

  it('tracks the previous value across renders', () => {
    const seen: (number | undefined)[] = [];
    function Probe({ value }: { value: number }) {
      const prev = usePrevious(value);
      seen.push(prev);
      return <output>{String(prev)}</output>;
    }
    const { rerender } = render(<Probe value={1} />);
    rerender(<Probe value={2} />);
    rerender(<Probe value={3} />);

    expect(seen).toEqual([undefined, 1, 2]);
  });

  it('keeps the previous reference when value identity is stable', () => {
    const first = { id: 1 };
    const second = { id: 2 };
    let prev: unknown;
    function Probe({ value }: { value: object }) {
      prev = usePrevious(value);
      return null;
    }
    const { rerender } = render(<Probe value={first} />);
    // 同一引用重渲染：prev 仍是首轮的 undefined→first 之后保持 first
    rerender(<Probe value={first} />);
    rerender(<Probe value={second} />);
    expect(prev).toBe(first);
  });

  it('works with act-driven state updates', () => {
    function Counter() {
      const [count, setCount] = useState(0);
      const prev = usePrevious(count);
      return (
        <>
          <output data-testid='prev'>{String(prev)}</output>
          <button onClick={() => setCount(count + 1)}>inc</button>
        </>
      );
    }
    render(<Counter />);
    act(() => {
      screen.getByRole('button', { name: 'inc' }).click();
    });
    expect(screen.getByTestId('prev')).toHaveTextContent('0');
  });
});
