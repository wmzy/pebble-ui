import type { UploadFileStatus, UploadHandle, UploadRequest } from '.';

import { createRef } from 'react';

import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Upload from './Upload';
import UploadCore from './UploadCore';

/** Flushes the microtask chain of the async beforeUpload gate
 * (Promise.all → single emit) inside act, so state commits settle. */
async function flushGates() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

/** Deeper flush for the upload chain: request settle → status commit →
 * list re-render (plus the value→entries→autostart effect rounds). */
async function flushUploads() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

type DeferredCall = {
  file: File;
  onProgress: (percent: number) => void;
  signal: AbortSignal;
  resolve: () => void;
  reject: (reason?: unknown) => void;
};

/** A controllable `request` mock: each call parks until the test
 * resolves/rejects it, and honors `signal` like a real transport
 * (abort → AbortError rejection). */
function makeDeferredRequest() {
  const calls: DeferredCall[] = [];
  const request: UploadRequest = (file, options) =>
    new Promise<void>((resolve, reject) => {
      const call: DeferredCall = {
        file,
        onProgress: options.onProgress,
        signal: options.signal,
        resolve,
        reject,
      };
      calls.push(call);
      options.signal.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  return { calls, request };
}

function getFileInput() {
  return document.querySelector<HTMLInputElement>('input[type="file"]')!;
}

/** Controllable XHR stand-in for `action` mode — jsdom has no real
 * upload transport. */
class FakeXHR {
  static instances: FakeXHR[] = [];
  status = 0;
  headers: Record<string, string> = {};
  openedWith: { method: string; url: string } | null = null;
  sentBody: FormData | null = null;
  upload: {
    onprogress:
      | ((event: { lengthComputable: boolean; loaded: number; total: number }) => void)
      | null;
  } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  open = vi.fn((method: string, url: string) => {
    this.openedWith = { method, url };
  });
  setRequestHeader = vi.fn((key: string, value: string) => {
    this.headers[key] = value;
  });
  send = vi.fn((body: FormData) => {
    this.sentBody = body;
  });
  abort = vi.fn(() => {
    this.status = 0;
    this.onabort?.();
  });

  constructor() {
    FakeXHR.instances.push(this);
  }

  emitProgress(loaded: number, total: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total });
  }
  respond(status: number) {
    this.status = status;
    this.onload?.();
  }
}

describe('Upload', () => {
  it('renders dropzone', () => {
    render(<Upload />);
    expect(screen.getByText(/drag.*drop|click.*upload/i)).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<Upload className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders custom children', () => {
    render(<Upload>Custom upload area</Upload>);
    expect(screen.getByText('Custom upload area')).toBeInTheDocument();
  });

  it('opens file dialog on click', async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(vi.fn());
    render(<Upload />);
    await user.click(screen.getByText(/drag.*drop|click.*upload/i));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('calls onChange when files selected', async () => {
    const onChange = vi.fn();
    render(<Upload onChange={onChange} />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await userEvent.upload(input, file);
    expect(onChange).toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Upload />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('keeps onChange reporting only the freshly picked files across picks', async () => {
    const onChange = vi.fn();
    render(<Upload onChange={onChange} />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const first = new File(['1'], 'one.txt', { type: 'text/plain' });
    const second = new File(['2'], 'two.txt', { type: 'text/plain' });
    await userEvent.upload(input, first);
    await userEvent.upload(input, second);
    expect(onChange).toHaveBeenNthCalledWith(1, [first]);
    expect(onChange).toHaveBeenNthCalledWith(2, [second]);
  });

  it('truncates the committed list to maxCount and reports only survivors', async () => {
    const onChange = vi.fn();
    render(<Upload multiple maxCount={2} onChange={onChange} />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const a = new File(['1'], 'a.txt', { type: 'text/plain' });
    const b = new File(['2'], 'b.txt', { type: 'text/plain' });
    const c = new File(['3'], 'c.txt', { type: 'text/plain' });
    await userEvent.upload(input, [a, b, c]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([a, b]);
  });

  it('suppresses the pick entirely when beforeUpload rejects every file', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Upload multiple beforeUpload={() => false} onChange={onChange} />
    );
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const rejected = new File(['1'], 'no.txt', { type: 'text/plain' });
    await userEvent.upload(input, rejected);
    await flushGates();
    expect(onChange).not.toHaveBeenCalled();

    // value stayed empty: the next accepted pick is not masked by the ghost
    rerender(<Upload multiple beforeUpload={() => true} onChange={onChange} />);
    const accepted = new File(['2'], 'yes.txt', { type: 'text/plain' });
    await userEvent.upload(
      document.querySelector<HTMLInputElement>('input[type="file"]')!,
      accepted
    );
    await flushGates();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([accepted]);
  });

  it('ignores drops when droppable is false', () => {
    const onChange = vi.fn();
    const { container } = render(<Upload droppable={false} onChange={onChange} />);
    fireEvent.drop(container.firstChild as HTMLElement, {
      dataTransfer: { files: [new File(['1'], 'a.txt', { type: 'text/plain' })] },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('has no axe violations in click-only mode', async () => {
    const { axe } = await import('jest-axe');
    render(<Upload droppable={false} />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('UploadCore', () => {
  const fileA = new File(['1'], 'one.txt', { type: 'text/plain' });
  const fileB = new File(['2'], 'two.txt', { type: 'text/plain' });

  it('emits a replacing list for a single pick', async () => {
    const onChange = vi.fn();
    render(<UploadCore value={[fileA]} onChange={onChange} />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await userEvent.upload(input, fileB);
    expect(onChange).toHaveBeenCalledWith([fileB]);
  });

  it('emits an appending list for a multiple pick', async () => {
    const onChange = vi.fn();
    render(<UploadCore value={[fileA]} onChange={onChange} multiple />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await userEvent.upload(input, fileB);
    expect(onChange).toHaveBeenCalledWith([fileA, fileB]);
  });

  it('commits dropped files through the same value channel', () => {
    const onChange = vi.fn();
    const { container } = render(
      <UploadCore value={[fileA]} onChange={onChange} multiple />
    );
    fireEvent.drop(container.firstChild as HTMLElement, {
      dataTransfer: { files: [fileB] },
    });
    expect(onChange).toHaveBeenCalledWith([fileA, fileB]);
  });

  it('no-ops on an empty selection', () => {
    const onChange = vi.fn();
    const { container } = render(<UploadCore value={[]} onChange={onChange} />);
    fireEvent.drop(container.firstChild as HTMLElement, {
      dataTransfer: { files: [] },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('stays fully controlled: picks build on the external value', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <UploadCore value={[fileA]} onChange={onChange} multiple />
    );
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await userEvent.upload(input, fileB);
    expect(onChange).toHaveBeenLastCalledWith([fileA, fileB]);

    // parent applied the emitted value; the next pick builds on it
    rerender(<UploadCore value={[fileA, fileB]} onChange={onChange} multiple />);
    const again = new File(['3'], 'three.txt', { type: 'text/plain' });
    await userEvent.upload(input, again);
    expect(onChange).toHaveBeenLastCalledWith([fileA, fileB, again]);
  });

  it('forwards bridge props (id, aria) onto the focusable dropzone', () => {
    render(
      <UploadCore
        value={[]}
        onChange={() => undefined}
        id="attachments"
        aria-invalid
        aria-describedby="attachments-error"
      />
    );
    const dropzone = screen.getByRole('button');
    expect(dropzone).toHaveAttribute('id', 'attachments');
    expect(dropzone).toHaveAttribute('aria-invalid', 'true');
    expect(dropzone).toHaveAttribute('aria-describedby', 'attachments-error');
  });

  it('names the zone from the locale by default and honors an aria-label prop', () => {
    const { rerender } = render(<UploadCore value={[]} onChange={() => undefined} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Upload files');

    rerender(
      <UploadCore value={[]} onChange={() => undefined} aria-label="Attachments" />
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Attachments');
  });

  it('opens the picker with Enter and Space', async () => {
    const user = userEvent.setup();
    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(vi.fn());
    render(<UploadCore value={[]} onChange={() => undefined} />);
    const zone = screen.getByRole('button');
    zone.focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{ }');
    expect(clickSpy).toHaveBeenCalledTimes(2);
    clickSpy.mockRestore();
  });

  it('highlights the zone while dragging over it and clears on leave', () => {
    const { container } = render(<UploadCore value={[]} onChange={() => undefined} />);
    const zone = container.firstChild as HTMLElement;
    fireEvent.dragOver(zone);
    expect(zone).toHaveAttribute('data-dragover', 'true');
    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveAttribute('data-dragover');
  });

  it('keeps the highlight when the drag passes over child content', () => {
    const { container } = render(<UploadCore value={[]} onChange={() => undefined} />);
    const zone = container.firstChild as HTMLElement;
    fireEvent.dragOver(zone);
    // jsdom has no DragEvent, so fireEvent's init cannot carry relatedTarget
    // (the Event constructor drops it) — define it on a plain bubbling event
    const dragLeaveTo = (target: Node | null) => {
      const event = new Event('dragleave', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'relatedTarget', { value: target });
      fireEvent(zone, event);
    };
    // moving onto the icon (a child) fires dragleave with relatedTarget inside
    dragLeaveTo(zone.querySelector('svg'));
    expect(zone).toHaveAttribute('data-dragover', 'true');
    dragLeaveTo(null);
    expect(zone).not.toHaveAttribute('data-dragover');
  });

  it('clears the highlight on drop', () => {
    const { container } = render(<UploadCore value={[]} onChange={() => undefined} />);
    const zone = container.firstChild as HTMLElement;
    fireEvent.dragOver(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [fileA] } });
    expect(zone).not.toHaveAttribute('data-dragover');
  });

  it('filters dropped files by the accept grammar', () => {
    const onChange = vi.fn();
    const { container } = render(
      <UploadCore value={[]} onChange={onChange} multiple accept=".txt,image/*" />
    );
    const note = new File(['n'], 'note.txt', { type: 'text/plain' });
    const pic = new File(['p'], 'pic.png', { type: 'image/png' });
    const photo = new File(['f'], 'photo.jpg', { type: 'image/jpeg' });
    const song = new File(['s'], 'song.mp3', { type: 'audio/mpeg' });
    const extless = new File(['x'], 'readme', { type: '' });
    fireEvent.drop(container.firstChild as HTMLElement, {
      dataTransfer: { files: [note, pic, photo, song, extless] },
    });
    expect(onChange).toHaveBeenCalledWith([note, pic, photo]);
  });

  it('drops a mismatching drop silently without emitting', () => {
    const onChange = vi.fn();
    const { container } = render(
      <UploadCore value={[fileA]} onChange={onChange} accept=".pdf" />
    );
    fireEvent.drop(container.firstChild as HTMLElement, {
      dataTransfer: { files: [fileB] },
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders a click-only area when droppable is false', () => {
    const onChange = vi.fn();
    const { container } = render(
      <UploadCore value={[]} onChange={onChange} droppable={false} />
    );
    const zone = container.firstChild as HTMLElement;
    expect(screen.getByText(/click to browse/i)).toBeInTheDocument();
    fireEvent.dragOver(zone);
    expect(zone).not.toHaveAttribute('data-dragover');
    fireEvent.drop(zone, { dataTransfer: { files: [fileA] } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects files beforeUpload turns down synchronously', async () => {
    const onChange = vi.fn();
    render(
      <UploadCore
        value={[]}
        onChange={onChange}
        multiple
        beforeUpload={(file) => file.name !== 'bad.txt'}
      />
    );
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const good = new File(['1'], 'good.txt', { type: 'text/plain' });
    const bad = new File(['2'], 'bad.txt', { type: 'text/plain' });
    await userEvent.upload(input, [good, bad]);
    await flushGates();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([good]);
  });

  it('resolves async verdicts into a single onChange', async () => {
    const onChange = vi.fn();
    const seen: string[] = [];
    const { container } = render(
      <UploadCore
        value={[fileA]}
        onChange={onChange}
        multiple
        beforeUpload={async (file) => {
          await Promise.resolve();
          seen.push(file.name);
          return file.name !== 'bad.txt';
        }}
      />
    );
    const good = new File(['1'], 'good.txt', { type: 'text/plain' });
    const bad = new File(['2'], 'bad.txt', { type: 'text/plain' });
    fireEvent.drop(container.firstChild as HTMLElement, {
      dataTransfer: { files: [good, bad] },
    });
    await flushGates();
    expect(seen).toEqual(['good.txt', 'bad.txt']);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([fileA, good]);
  });

  it('never emits when every async verdict rejects', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <UploadCore
        value={[]}
        onChange={onChange}
        beforeUpload={() => Promise.resolve(false)}
      />
    );
    fireEvent.drop(container.firstChild as HTMLElement, {
      dataTransfer: { files: [fileA] },
    });
    await flushGates();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies maxCount after beforeUpload filtering', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <UploadCore
        value={[]}
        onChange={onChange}
        multiple
        maxCount={2}
        beforeUpload={(file) => file.name !== 'skip.txt'}
      />
    );
    const skip = new File(['0'], 'skip.txt', { type: 'text/plain' });
    const first = new File(['1'], 'first.txt', { type: 'text/plain' });
    const second = new File(['2'], 'second.txt', { type: 'text/plain' });
    fireEvent.drop(container.firstChild as HTMLElement, {
      dataTransfer: { files: [skip, first, second] },
    });
    await flushGates();
    // verdicts first (skip dropped, first/second survive), then the cap
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([first, second]);
  });

  it('caps an appending pick when the value already sits at maxCount', () => {
    const onChange = vi.fn();
    const { container } = render(
      <UploadCore value={[fileA, fileB]} onChange={onChange} multiple maxCount={2} />
    );
    const extra = new File(['3'], 'three.txt', { type: 'text/plain' });
    fireEvent.drop(container.firstChild as HTMLElement, {
      dataTransfer: { files: [extra] },
    });
    // existing entries win: the list is re-emitted unchanged
    expect(onChange).toHaveBeenCalledWith([fileA, fileB]);
  });
});

describe('Upload — auto upload (request mode)', () => {
  it('keeps the status machine dormant without request/action', async () => {
    const onStatusChange = vi.fn<(files: UploadFileStatus[]) => void>();
    render(<Upload onStatusChange={onStatusChange} />);
    await userEvent.upload(
      getFileInput(),
      new File(['1'], 'a.txt', { type: 'text/plain' })
    );
    await flushUploads();
    // pure collection mode: no status callbacks, no list, no requests
    expect(onStatusChange).not.toHaveBeenCalled();
    expect(document.querySelector('ul')).toBeNull();
  });

  it('walks idle → uploading → success with percent forced to 100', async () => {
    const onStatusChange = vi.fn<(files: UploadFileStatus[]) => void>();
    const { calls, request } = makeDeferredRequest();
    render(
      <Upload request={request} multiple showUploadList onStatusChange={onStatusChange} />
    );
    const a = new File(['1'], 'a.txt', { type: 'text/plain' });
    const b = new File(['2'], 'b.txt', { type: 'text/plain' });
    await userEvent.upload(getFileInput(), [a, b]);
    await flushUploads();

    // both files started immediately with the runtime handed over
    expect(calls.map((c) => c.file)).toEqual([a, b]);
    expect(calls.every((c) => c.signal instanceof AbortSignal)).toBe(true);
    const uploading = onStatusChange.mock.calls.at(-1)![0];
    expect(uploading.map((s) => s.status)).toEqual(['uploading', 'uploading']);

    calls.forEach((c) => c.resolve());
    await flushUploads();
    const done = onStatusChange.mock.calls.at(-1)![0];
    expect(done).toEqual([
      { file: a, status: 'success', percent: 100 },
      { file: b, status: 'success', percent: 100 },
    ]);
    expect(document.querySelectorAll('li[data-status="success"]')).toHaveLength(2);
  });

  it('surfaces request progress as clamped percent in the list', async () => {
    const { calls, request } = makeDeferredRequest();
    render(<Upload request={request} showUploadList />);
    await userEvent.upload(
      getFileInput(),
      new File(['1'], 'a.txt', { type: 'text/plain' })
    );
    await flushUploads();

    calls[0]!.onProgress(50);
    await flushUploads();
    expect(screen.getByText('Uploading 50%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');

    calls[0]!.onProgress(250);
    await flushUploads();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('marks the file error on rejection and retries through the list', async () => {
    const onStatusChange = vi.fn();
    const { calls, request } = makeDeferredRequest();
    render(
      <Upload request={request} showUploadList onStatusChange={onStatusChange} />
    );
    const file = new File(['1'], 'a.txt', { type: 'text/plain' });
    await userEvent.upload(getFileInput(), file);
    await flushUploads();

    calls[0]!.reject(new Error('boom'));
    await flushUploads();
    expect(document.querySelector('li')!).toHaveAttribute('data-status', 'error');
    expect(onStatusChange.mock.calls.at(-1)![0]).toEqual([
      { file, status: 'error', percent: 0 },
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'Retry upload' }));
    await flushUploads();
    expect(calls).toHaveLength(2);
    calls[1]!.resolve();
    await flushUploads();
    expect(document.querySelector('li')!).toHaveAttribute('data-status', 'success');
  });

  it('never uploads files beforeUpload refuses', async () => {
    const { calls, request } = makeDeferredRequest();
    render(
      <Upload request={request} multiple showUploadList beforeUpload={(f) => f.name !== 'bad.txt'} />
    );
    const good = new File(['1'], 'good.txt', { type: 'text/plain' });
    const bad = new File(['2'], 'bad.txt', { type: 'text/plain' });
    await userEvent.upload(getFileInput(), [good, bad]);
    await flushUploads();
    expect(calls.map((c) => c.file)).toEqual([good]);
  });

  it('caps started uploads at maxCount', async () => {
    const { calls, request } = makeDeferredRequest();
    render(<Upload request={request} multiple maxCount={2} />);
    const files = [
      new File(['1'], 'a.txt', { type: 'text/plain' }),
      new File(['2'], 'b.txt', { type: 'text/plain' }),
      new File(['3'], 'c.txt', { type: 'text/plain' }),
    ];
    await userEvent.upload(getFileInput(), files);
    await flushUploads();
    expect(calls).toHaveLength(2);
  });
});

describe('Upload — manual mode & handle', () => {
  it('picks stay idle until uploadAll() runs', async () => {
    const ref = createRef<UploadHandle>();
    const { calls, request } = makeDeferredRequest();
    render(
      <Upload ref={ref} request={request} manual multiple showUploadList />
    );
    const a = new File(['1'], 'a.txt', { type: 'text/plain' });
    const b = new File(['2'], 'b.txt', { type: 'text/plain' });
    await userEvent.upload(getFileInput(), [a, b]);
    await flushUploads();
    expect(calls).toHaveLength(0);
    expect(
      Array.from(document.querySelectorAll('li[data-status="idle"]'))
    ).toHaveLength(2);

    act(() => ref.current!.uploadAll());
    await flushUploads();
    expect(calls.map((c) => c.file)).toEqual([a, b]);
    expect(
      Array.from(document.querySelectorAll('li[data-status="uploading"]'))
    ).toHaveLength(2);
  });

  it('upload(file) starts exactly one file', async () => {
    const ref = createRef<UploadHandle>();
    const { calls, request } = makeDeferredRequest();
    render(<Upload ref={ref} request={request} manual multiple showUploadList />);
    const a = new File(['1'], 'a.txt', { type: 'text/plain' });
    const b = new File(['2'], 'b.txt', { type: 'text/plain' });
    await userEvent.upload(getFileInput(), [a, b]);
    await flushUploads();

    act(() => ref.current!.upload(b));
    await flushUploads();
    expect(calls.map((c) => c.file)).toEqual([b]);
    expect(
      Array.from(document.querySelectorAll('li[data-status="idle"]'))
    ).toHaveLength(1);
  });

  it('abort() cancels in-flight uploads back to idle', async () => {
    const ref = createRef<UploadHandle>();
    const { calls, request } = makeDeferredRequest();
    render(
      <Upload ref={ref} request={request} manual multiple showUploadList />
    );
    await userEvent.upload(getFileInput(), [
      new File(['1'], 'a.txt', { type: 'text/plain' }),
      new File(['2'], 'b.txt', { type: 'text/plain' }),
    ]);
    await flushUploads();
    act(() => ref.current!.uploadAll());
    await flushUploads();

    act(() => ref.current!.abort());
    await flushUploads();
    expect(calls.every((c) => c.signal.aborted)).toBe(true);
    expect(
      Array.from(document.querySelectorAll('li[data-status="idle"]'))
    ).toHaveLength(2);
    // files stay in the list — abort is a stop, not a remove
    expect(screen.getByText('a.txt')).toBeInTheDocument();
    expect(screen.getByText('b.txt')).toBeInTheDocument();
  });

  it('clear() aborts everything and empties the list', async () => {
    const ref = createRef<UploadHandle>();
    const { calls, request } = makeDeferredRequest();
    render(
      <Upload ref={ref} request={request} manual multiple showUploadList />
    );
    await userEvent.upload(getFileInput(), [
      new File(['1'], 'a.txt', { type: 'text/plain' }),
      new File(['2'], 'b.txt', { type: 'text/plain' }),
    ]);
    await flushUploads();
    act(() => ref.current!.uploadAll());
    await flushUploads();

    act(() => ref.current!.clear());
    await flushUploads();
    expect(calls.every((c) => c.signal.aborted)).toBe(true);
    expect(document.querySelector('ul')).toBeNull();
  });

  it('does not crash when handle methods run after unmount', () => {
    const ref = createRef<UploadHandle>();
    const { request } = makeDeferredRequest();
    const { unmount } = render(
      <Upload ref={ref} request={request} manual showUploadList />
    );
    // React nulls ref.current on unmount — the guard under test is a
    // consumer holding the handle object itself.
    const handle = ref.current!;
    unmount();
    expect(() => {
      handle.uploadAll();
      handle.abort();
      handle.clear();
    }).not.toThrow();
  });
});

describe('Upload — built-in list', () => {
  it('cancel aborts the in-flight upload and removes the file', async () => {
    const onChange = vi.fn();
    const { calls, request } = makeDeferredRequest();
    render(
      <Upload request={request} showUploadList onChange={onChange} />
    );
    const file = new File(['1'], 'a.txt', { type: 'text/plain' });
    await userEvent.upload(getFileInput(), file);
    await flushUploads();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel upload' }));
    await flushUploads();
    expect(calls[0]!.signal.aborted).toBe(true);
    expect(screen.queryByText('a.txt')).not.toBeInTheDocument();
    expect(document.querySelector('ul')).toBeNull();
    // removal is not a pick: the sugar's onChange stays silent
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('remove drops a success file from the value channel', async () => {
    const onChange = vi.fn();
    const { calls, request } = makeDeferredRequest();
    const file = new File(['1'], 'a.txt', { type: 'text/plain' });
    // fully controlled Core: removal flows through onChange verbatim
    const { rerender } = render(
      <UploadCore
        value={[file]}
        onChange={onChange}
        request={request}
        showUploadList
      />
    );
    await flushUploads();
    expect(calls).toHaveLength(1);
    calls[0]!.resolve();
    await flushUploads();
    expect(document.querySelector('li')!).toHaveAttribute('data-status', 'success');

    await userEvent.click(screen.getByRole('button', { name: 'Remove file' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    rerender(<UploadCore value={[]} onChange={onChange} request={request} showUploadList />);
    await flushUploads();
    expect(document.querySelector('ul')).toBeNull();
  });

  it('itemRender replaces the default row and receives live state', async () => {
    const { calls, request } = makeDeferredRequest();
    render(
      <Upload
        request={request}
        showUploadList={{
          itemRender: (file, status, percent, actions) => (
            <div>
              <span>{`custom:${file.name}:${status}:${percent}`}</span>
              <button type="button" onClick={actions.remove}>
                drop
              </button>
            </div>
          ),
        }}
      />
    );
    await userEvent.upload(
      getFileInput(),
      new File(['1'], 'a.txt', { type: 'text/plain' })
    );
    await flushUploads();
    expect(screen.getByText('custom:a.txt:uploading:0')).toBeInTheDocument();

    calls[0]!.resolve();
    await flushUploads();
    expect(screen.getByText('custom:a.txt:success:100')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'drop' }));
    await flushUploads();
    expect(screen.queryByText(/custom:a\.txt/)).not.toBeInTheDocument();
  });

  it('has no axe violations across mixed list states', async () => {
    const { axe } = await import('jest-axe');
    const { calls, request } = makeDeferredRequest();
    render(<Upload request={request} multiple showUploadList />);
    await userEvent.upload(getFileInput(), [
      new File(['1'], 'a.txt', { type: 'text/plain' }),
      new File(['2'], 'b.txt', { type: 'text/plain' }),
    ]);
    await flushUploads();
    calls[0]!.resolve();
    calls[1]!.reject(new Error('boom'));
    await flushUploads();
    // one success row (icon + remove), one error row (icon + retry +
    // remove + danger progress), zone included
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Upload — action mode (XHR)', () => {
  beforeEach(() => {
    FakeXHR.instances = [];
    vi.stubGlobal('XMLHttpRequest', FakeXHR);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the file as multipart FormData with method, headers and field name', async () => {
    render(
      <Upload
        action="https://up.test/files"
        method="PUT"
        name="attachment"
        headers={{ Authorization: 'Bearer t' }}
        data={{ scope: 'avatars' }}
        showUploadList
      />
    );
    const file = new File(['1'], 'a.txt', { type: 'text/plain' });
    await userEvent.upload(getFileInput(), file);
    await flushUploads();

    const xhr = FakeXHR.instances[0]!;
    expect(xhr.openedWith).toEqual({ method: 'PUT', url: 'https://up.test/files' });
    expect(xhr.headers).toEqual({ Authorization: 'Bearer t' });
    expect(xhr.sentBody!.get('attachment')).toBe(file);
    expect(xhr.sentBody!.get('scope')).toBe('avatars');
  });

  it('defaults to a POST under the file field name', async () => {
    render(<Upload action="/up" />);
    await userEvent.upload(
      getFileInput(),
      new File(['1'], 'a.txt', { type: 'text/plain' })
    );
    await flushUploads();
    const xhr = FakeXHR.instances[0]!;
    expect(xhr.openedWith).toEqual({ method: 'POST', url: '/up' });
    expect(xhr.sentBody!.get('file')).toBeInstanceOf(File);
  });

  it('maps upload progress and a 2xx response to success', async () => {
    render(<Upload action="/up" showUploadList />);
    await userEvent.upload(
      getFileInput(),
      new File(['1'], 'a.txt', { type: 'text/plain' })
    );
    await flushUploads();
    const xhr = FakeXHR.instances[0]!;

    xhr.emitProgress(25, 100);
    await flushUploads();
    expect(screen.getByText('Uploading 25%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');

    xhr.respond(204);
    await flushUploads();
    expect(document.querySelector('li')!).toHaveAttribute('data-status', 'success');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('maps a non-2xx response to error, retryable via the list', async () => {
    render(<Upload action="/up" showUploadList />);
    await userEvent.upload(
      getFileInput(),
      new File(['1'], 'a.txt', { type: 'text/plain' })
    );
    await flushUploads();

    FakeXHR.instances[0]!.respond(500);
    await flushUploads();
    expect(document.querySelector('li')!).toHaveAttribute('data-status', 'error');

    await userEvent.click(screen.getByRole('button', { name: 'Retry upload' }));
    await flushUploads();
    expect(FakeXHR.instances).toHaveLength(2);
    FakeXHR.instances[1]!.respond(200);
    await flushUploads();
    expect(document.querySelector('li')!).toHaveAttribute('data-status', 'success');
  });

  it('aborts the XHR when the handle aborts, returning the file to idle', async () => {
    const ref = createRef<UploadHandle>();
    render(<Upload ref={ref} action="/up" showUploadList />);
    await userEvent.upload(
      getFileInput(),
      new File(['1'], 'a.txt', { type: 'text/plain' })
    );
    await flushUploads();
    const xhr = FakeXHR.instances[0]!;

    act(() => ref.current!.abort());
    await flushUploads();
    expect(xhr.abort).toHaveBeenCalled();
    expect(document.querySelector('li')!).toHaveAttribute('data-status', 'idle');
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});

describe('Upload — picture-card list', () => {
  // jsdom ships no Blob URL support (URL.createObjectURL is undefined)
  // — stub the pair the thumbnail cells use.
  const createObjectURL = vi.fn(() => 'blob:card-thumb');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectURL,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectURL,
      configurable: true,
    });
  });
  afterEach(() => {
    delete (URL as { createObjectURL?: unknown }).createObjectURL;
    delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL;
  });

  it('renders an object-URL thumbnail for image files', async () => {
    const { request } = makeDeferredRequest();
    render(<Upload request={request} showUploadList listType="picture-card" />);
    const image = new File(['img'], 'photo.png', { type: 'image/png' });
    await userEvent.upload(getFileInput(), image);
    await flushUploads();
    expect(createObjectURL).toHaveBeenCalledWith(image);
    const img = document.querySelector<HTMLImageElement>('li[data-status] img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', 'blob:card-thumb');
    expect(img).toHaveAttribute('alt', 'photo.png');
  });

  it('revokes the thumbnail object URL when the component unmounts', async () => {
    const { request } = makeDeferredRequest();
    const { unmount } = render(
      <Upload request={request} showUploadList listType="picture-card" />
    );
    await userEvent.upload(
      getFileInput(),
      new File(['img'], 'a.png', { type: 'image/png' })
    );
    await flushUploads();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:card-thumb');
  });

  it('falls back to an explicitly sized type icon for non-image files', async () => {
    const { request } = makeDeferredRequest();
    render(<Upload request={request} showUploadList listType="picture-card" />);
    await userEvent.upload(
      getFileInput(),
      new File(['hi'], 'notes.txt', { type: 'text/plain' })
    );
    await flushUploads();
    const item = document.querySelector('li[data-status]')!;
    expect(item.querySelector('img')).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
    // svg without intrinsic dimensions collapses to 0×0 in flex — the
    // fallback icon must carry explicit width/height
    const icon = item.querySelector('span[role="img"] svg')!;
    expect(icon).toHaveAttribute('width', '24');
    expect(icon).toHaveAttribute('height', '24');
    expect(screen.getByTitle('notes.txt')).toBeInTheDocument();
  });

  it('masks the card with the live percent while uploading', async () => {
    const { calls, request } = makeDeferredRequest();
    render(<Upload request={request} showUploadList listType="picture-card" />);
    await userEvent.upload(
      getFileInput(),
      new File(['img'], 'a.png', { type: 'image/png' })
    );
    await flushUploads();
    calls[0]!.onProgress(60);
    await flushUploads();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
    calls[0]!.resolve();
    await flushUploads();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('reveals the remove button with an overridable label and revokes on remove', async () => {
    const onChange = vi.fn();
    const { request } = makeDeferredRequest();
    const file = new File(['img'], 'a.png', { type: 'image/png' });
    const { rerender } = render(
      <UploadCore
        value={[file]}
        onChange={onChange}
        request={request}
        showUploadList
        listType="picture-card"
      />
    );
    await flushUploads();
    expect(screen.getByRole('button', { name: 'Remove file' })).toBeInTheDocument();

    rerender(
      <UploadCore
        value={[file]}
        onChange={onChange}
        request={request}
        showUploadList
        listType="picture-card"
        removeLabel="Delete image"
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete image' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    rerender(
      <UploadCore
        value={[]}
        onChange={onChange}
        request={request}
        showUploadList
        listType="picture-card"
      />
    );
    await flushUploads();
    expect(document.querySelector('li[data-status]')).toBeNull();
    // the card left with the applied value — its blob URL went with it
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:card-thumb');
  });

  it('marks failed cards with the error state and retries in place', async () => {
    const { calls, request } = makeDeferredRequest();
    render(<Upload request={request} showUploadList listType="picture-card" />);
    await userEvent.upload(
      getFileInput(),
      new File(['img'], 'a.png', { type: 'image/png' })
    );
    await flushUploads();
    calls[0]!.reject(new Error('boom'));
    await flushUploads();
    expect(document.querySelector('li[data-status="error"]')).toBeInTheDocument();
    expect(screen.getByText('Upload failed')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry upload' }));
    await flushUploads();
    expect(calls).toHaveLength(2);
    calls[1]!.resolve();
    await flushUploads();
    expect(document.querySelector('li[data-status="success"]')).toBeInTheDocument();
  });

  it('keeps the text row structure when listType is omitted', async () => {
    const { request } = makeDeferredRequest();
    render(<Upload request={request} showUploadList />);
    await userEvent.upload(
      getFileInput(),
      new File(['img'], 'a.png', { type: 'image/png' })
    );
    await flushUploads();
    const item = document.querySelector('li[data-status]')!;
    expect(item.querySelector('img')).toBeNull();
    expect(screen.getByTitle('a.png')).toBeInTheDocument();
    expect(screen.getByText('Uploading 0%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel upload' })).toBeInTheDocument();
  });

  it('has no axe violations across mixed picture-card states', async () => {
    const { axe } = await import('jest-axe');
    const { calls, request } = makeDeferredRequest();
    render(
      <Upload request={request} multiple showUploadList listType="picture-card" />
    );
    await userEvent.upload(getFileInput(), [
      new File(['img'], 'a.png', { type: 'image/png' }),
      new File(['txt'], 'notes.txt', { type: 'text/plain' }),
    ]);
    await flushUploads();
    calls[0]!.resolve();
    calls[1]!.reject(new Error('boom'));
    await flushUploads();
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Upload — directory picking', () => {
  it('forwards the non-standard directory attributes to the input', () => {
    const { rerender } = render(<Upload directory multiple />);
    const input = getFileInput();
    expect(input).toHaveAttribute('webkitdirectory');
    expect(input).toHaveAttribute('directory');

    rerender(<Upload multiple />);
    const bare = getFileInput();
    expect(bare).not.toHaveAttribute('webkitdirectory');
    expect(bare).not.toHaveAttribute('directory');
  });
});
