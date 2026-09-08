import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import { Button } from '../Button';

import Fullscreen from './Fullscreen';

/** jsdom has no Fullscreen API — install it around the elements under test. */
let fullscreenElement: Element | null = null;

function installFullscreen(element: HTMLElement) {
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => fullscreenElement,
  });
  const request = vi.fn(() => {
    fullscreenElement = element;
    document.dispatchEvent(new Event('fullscreenchange'));
    return Promise.resolve();
  });
  element.requestFullscreen =
    request;
  document.exitFullscreen = vi.fn(() => {
    fullscreenElement = null;
    document.dispatchEvent(new Event('fullscreenchange'));
    return Promise.resolve();
  });
  return request;
}

afterEach(() => {
  fullscreenElement = null;
  const doc = document as Document & {
    fullscreenElement?: Element | null;
    exitFullscreen?: () => Promise<void>;
  };
  Reflect.deleteProperty(doc, 'fullscreenElement');
  Reflect.deleteProperty(doc, 'exitFullscreen');
  Reflect.deleteProperty(document.documentElement, 'requestFullscreen');
  document.body.innerHTML = '';
});

describe('Fullscreen', () => {
  it('toggles the document element when the trigger is clicked', async () => {
    const user = userEvent.setup();
    const request = installFullscreen(document.documentElement);
    const onChange = vi.fn();
    render(
      <Fullscreen onChange={onChange}>
        <button type="button">Maximize</button>
      </Fullscreen>
    );

    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Maximize' }));
    expect(request).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);

    // the browser exits on its own (Esc) — change reports back
    act(() => {
      void document.exitFullscreen();
    });
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('preserves the trigger’s own onClick', async () => {
    const user = userEvent.setup();
    installFullscreen(document.documentElement);
    const ownClick = vi.fn();
    render(
      <Fullscreen>
        <button type="button" onClick={ownClick}>
          Maximize
        </button>
      </Fullscreen>
    );
    await user.click(screen.getByRole('button', { name: 'Maximize' }));
    expect(ownClick).toHaveBeenCalledTimes(1);
  });

  it('shares the state with a parent through a control', async () => {
    const user = userEvent.setup();
    const request = installFullscreen(document.documentElement);
    function Controlled() {
      const [fullscreen, setFullscreen, fullscreenCtrl] = useControl(
        undefined,
        false
      );
      return (
        <div>
          <Fullscreen fullscreen={fullscreenCtrl}>
            <button type="button">Maximize</button>
          </Fullscreen>
          <output data-testid="mirror">[{String(fullscreen)}]</output>
          <button type="button" onClick={() => setFullscreen(true)}>
            force on
          </button>
        </div>
      );
    }
    render(<Controlled />);
    expect(screen.getByTestId('mirror')).toHaveTextContent('[false]');

    // external write drives the API…
    await user.click(screen.getByRole('button', { name: 'force on' }));
    expect(request).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mirror')).toHaveTextContent('[true]');

    // …and a browser-side exit writes back to the parent
    act(() => {
      void document.exitFullscreen();
    });
    expect(screen.getByTestId('mirror')).toHaveTextContent('[false]');
  });

  it('fullscreens the target element instead of the document', async () => {
    const user = userEvent.setup();
    const box = document.createElement('div');
    document.body.appendChild(box);
    const request = installFullscreen(box);
    render(
      <Fullscreen target={box}>
        <button type="button">Maximize box</button>
      </Fullscreen>
    );
    await user.click(screen.getByRole('button', { name: 'Maximize box' }));
    expect(request).toHaveBeenCalledTimes(1);
    expect(document.fullscreenElement).toBe(box);
  });

  it('stays inert when the Fullscreen API is missing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Fullscreen onChange={onChange}>
        <button type="button">Maximize</button>
      </Fullscreen>
    );
    await user.click(screen.getByRole('button', { name: 'Maximize' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Maximize' })).toBeEnabled();
  });

  it('composes with library buttons', async () => {
    const user = userEvent.setup();
    installFullscreen(document.documentElement);
    render(
      <Fullscreen>
        <Button variant="outline">Enter fullscreen</Button>
      </Fullscreen>
    );
    await user.click(screen.getByRole('button', { name: 'Enter fullscreen' }));
    expect(document.fullscreenElement).toBe(document.documentElement);
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Fullscreen>
        <button type="button">Maximize</button>
      </Fullscreen>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
