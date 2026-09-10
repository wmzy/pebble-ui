import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// vitest 扩展匹配器（toHaveBeenCalledOnce）需要显式导入——jest-axe 的
// @types/jest 会污染全局 expect 类型（仓库既有结论）
import {expect} from 'vitest';

import CommandDialog from './CommandDialog';
import { CommandGroup, CommandItem, CommandList } from './Command';

beforeEach(() => {
  // jsdom does not implement showModal/close for HTMLDialogElement
  // (same mock shape as Dialog.test.tsx).
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement
  ) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
});

describe('CommandDialog', () => {
  it('opens and closes through the hotkey toggle', async () => {
    const onOpenChange = vi.fn();
    render(
      <CommandDialog hotkey='mod+k' onOpenChange={onOpenChange}>
        <CommandList>
          <CommandItem>Apple</CommandItem>
        </CommandList>
      </CommandDialog>
    );

    // jsdom on Linux resolves `mod` to ctrl.
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('open');

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });

  it('focuses the input when opened', () => {
    render(
      <CommandDialog hotkey='mod+k' placeholder='Type a command...'>
        <CommandList>
          <CommandItem>Apple</CommandItem>
        </CommandList>
      </CommandDialog>
    );
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByPlaceholderText('Type a command...')).toHaveFocus();
  });

  it('does not register a listener without a hotkey prop', () => {
    render(
      <CommandDialog open>
        <CommandList>
          <CommandItem>Apple</CommandItem>
        </CommandList>
      </CommandDialog>
    );
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    // No listener attached: the palette stays in its initial open state.
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
  });

  it('closes after selecting an item, after its own onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandDialog hotkey='mod+k' onOpenChange={onOpenChange}>
        <CommandList>
          <CommandGroup heading='Fruit'>
            <CommandItem onSelect={onSelect}>Apple</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    const dialog = screen.getByRole('dialog', { hidden: true });
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });

  it('closes on Esc through the native cancel path', async () => {
    render(
      <CommandDialog hotkey='mod+k'>
        <CommandList>
          <CommandItem>Apple</CommandItem>
        </CommandList>
      </CommandDialog>
    );
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const dialog = screen.getByRole('dialog');
    act(() => {
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    });
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });

  it('names the dialog by the title and filters inside it', async () => {
    const user = userEvent.setup();
    render(
      <CommandDialog hotkey='mod+k' title='Command Palette' placeholder='Type a command...'>
        <CommandList>
          <CommandGroup heading='Fruit'>
            <CommandItem>Apple</CommandItem>
          </CommandGroup>
          <CommandGroup heading='Vegetables'>
            <CommandItem>Carrot</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog', { name: 'Command Palette' })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Type a command...'), 'car');
    expect(screen.getByText('Carrot')).toBeInTheDocument();
    expect(screen.queryByText('Fruit')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <CommandDialog hotkey='mod+k' title='Command Palette' placeholder='Type a command...'>
        <CommandList>
          <CommandGroup heading='Fruit'>
            <CommandItem shortcut='⌘N'>New File</CommandItem>
            <CommandItem>Open File</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    );
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
