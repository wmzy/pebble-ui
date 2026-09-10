import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
  it('calls onOutside for a pointerdown outside the element', async () => {
    const user = userEvent.setup();
    const onOutside = vi.fn();
    const outside = document.createElement('button');
    document.body.append(outside);

    function Probe() {
      const ref = useClickOutside<HTMLDivElement>(onOutside);
      return <div ref={ref}>inside</div>;
    }
    render(<Probe />);

    await user.click(outside);
    expect(onOutside).toHaveBeenCalledTimes(1);
    outside.remove();
  });

  it('does not call onOutside for clicks inside the element', async () => {
    const user = userEvent.setup();
    const onOutside = vi.fn();

    function Probe() {
      const ref = useClickOutside<HTMLDivElement>(onOutside);
      return (
        <div ref={ref}>
          <button>inner</button>
        </div>
      );
    }
    render(<Probe />);

    await user.click(screen.getByRole('button', { name: 'inner' }));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('skips ignored refs even when they are outside the element', async () => {
    const user = userEvent.setup();
    const onOutside = vi.fn();

    function Probe() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      const panelRef = useClickOutside<HTMLDivElement>(onOutside, {
        ignore: [triggerRef],
      });
      return (
        <>
          <button ref={triggerRef}>trigger</button>
          <div ref={panelRef}>panel</div>
        </>
      );
    }
    render(<Probe />);

    await user.click(screen.getByRole('button', { name: 'trigger' }));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('treats portaled DOM as outside (real DOM tree decides)', async () => {
    const user = userEvent.setup();
    const onOutside = vi.fn();
    // portal 宿主：真实 DOM 在目标元素子树之外；把它加进 ignore 后
    // 点击 portal 内容按约定不算外部
    const host = document.createElement('div');
    document.body.append(host);
    const hostRef = { current: host };

    function Probe() {
      const ref = useClickOutside<HTMLDivElement>(onOutside, {
        ignore: [hostRef],
      });
      return <div ref={ref}>inside</div>;
    }
    render(
      <>
        <Probe />
        {createPortal(<button>portaled</button>, host)}
      </>
    );

    await user.click(screen.getByRole('button', { name: 'portaled' }));
    expect(onOutside).not.toHaveBeenCalled();
    host.remove();
  });

  it('listens only while enabled', async () => {
    const user = userEvent.setup();
    const onOutside = vi.fn();
    const outside = document.createElement('button');
    document.body.append(outside);

    function Probe() {
      const [enabled, setEnabled] = useState(false);
      const ref = useClickOutside<HTMLDivElement>(onOutside, { enabled });
      return (
        <>
          <div ref={ref}>inside</div>
          <button onClick={() => setEnabled(!enabled)}>toggle</button>
        </>
      );
    }
    render(<Probe />);

    await user.click(outside);
    expect(onOutside).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'toggle' }));
    await user.click(outside);
    expect(onOutside).toHaveBeenCalledTimes(1);
    outside.remove();
  });
});
