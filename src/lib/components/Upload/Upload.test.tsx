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
