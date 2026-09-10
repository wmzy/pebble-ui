import { expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { Command, CommandInput, CommandList, CommandItem, CommandGroup } from './index';

describe('Command', () => {
  it('renders children', () => {
    render(
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandItem>Item 1</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(
      <Command className="custom">
        <CommandInput />
      </Command>
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('filters items on input', async () => {
    const user = userEvent.setup();
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandItem>Apple</CommandItem>
          <CommandItem>Banana</CommandItem>
        </CommandList>
      </Command>
    );
    const input = screen.getByPlaceholderText('Search');
    await user.type(input, 'App');
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('shows all items when input is empty', () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandItem>Apple</CommandItem>
          <CommandItem>Banana</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('moves focus into the list with ArrowDown from the input', async () => {
    const user = userEvent.setup();
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandItem>Apple</CommandItem>
          <CommandItem>Banana</CommandItem>
        </CommandList>
      </Command>
    );
    const input = screen.getByPlaceholderText('Search');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText('Apple')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText('Banana')).toHaveFocus();
  });

  it('activates the focused option with Enter', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandItem onSelect={onSelect}>Apple</CommandItem>
        </CommandList>
      </Command>
    );
    await user.click(screen.getByPlaceholderText('Search'));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('returns focus to the input on Escape from the list', async () => {
    const user = userEvent.setup();
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandItem>Apple</CommandItem>
        </CommandList>
      </Command>
    );
    const input = screen.getByPlaceholderText('Search');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText('Apple')).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(input).toHaveFocus();
  });

  it('filters from a consumer-provided initial query', () => {
    render(
      <Command query='App'>
        <CommandInput />
        <CommandList>
          <CommandItem>Apple</CommandItem>
          <CommandItem>Banana</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('filters by explicit value when children are not plain text', () => {
    render(
      <Command query='cher'>
        <CommandInput />
        <CommandList>
          <CommandItem value='cherry'>
            <span>🍒</span> Cherry
          </CommandItem>
          <CommandItem>Banana</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByText(/Cherry/)).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('extracts children text recursively as the default value', () => {
    render(
      <Command query='cher'>
        <CommandInput />
        <CommandList>
          <CommandItem>
            <span>🍒</span> Cherry
          </CommandItem>
          <CommandItem>Banana</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByText(/Cherry/)).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('matches items through keywords beyond their text', () => {
    render(
      <Command query='pref'>
        <CommandInput />
        <CommandList>
          <CommandItem keywords={['preferences']}>Settings</CommandItem>
          <CommandItem>Editor</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByText('Editor')).not.toBeInTheDocument();
  });

  it('shows all items and no empty row when shouldFilter is false', () => {
    render(
      <Command query='zzz' shouldFilter={false}>
        <CommandInput />
        <CommandList>
          <CommandItem>Apple</CommandItem>
          <CommandItem>Banana</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.queryByText('No results')).not.toBeInTheDocument();
  });

  it('renders the empty message when nothing matches', async () => {
    const user = userEvent.setup();
    render(
      <Command>
        <CommandInput placeholder='Search' />
        <CommandList>
          <CommandItem>Apple</CommandItem>
          <CommandItem>Banana</CommandItem>
        </CommandList>
      </Command>
    );
    await user.type(screen.getByPlaceholderText('Search'), 'zzz');
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  });

  it('renders a custom empty message', () => {
    render(
      <Command query='zzz'>
        <CommandInput />
        <CommandList empty='Nothing here'>
          <CommandItem>Apple</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders group headings and hides fully filtered groups', async () => {
    const user = userEvent.setup();
    render(
      <Command>
        <CommandInput placeholder='Search' />
        <CommandList>
          <CommandGroup heading='Fruit'>
            <CommandItem>Apple</CommandItem>
            <CommandItem>Banana</CommandItem>
          </CommandGroup>
          <CommandGroup heading='Vegetables'>
            <CommandItem>Carrot</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
    expect(screen.getByText('Fruit')).toBeInTheDocument();
    expect(screen.getByText('Vegetables')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search'), 'car');
    expect(screen.queryByText('Fruit')).not.toBeInTheDocument();
    expect(screen.getByText('Vegetables')).toBeInTheDocument();
    expect(screen.getByText('Carrot')).toBeInTheDocument();
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  });

  it('hides a group with no children at all', () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandGroup heading='Fruit'>
            <CommandItem>Apple</CommandItem>
          </CommandGroup>
          <CommandGroup heading='Empty' />
        </CommandList>
      </Command>
    );
    expect(screen.getByText('Fruit')).toBeInTheDocument();
    expect(screen.queryByText('Empty')).not.toBeInTheDocument();
  });

  it('keeps keyboard focus continuous across groups', async () => {
    const user = userEvent.setup();
    render(
      <Command>
        <CommandInput placeholder='Search' />
        <CommandList>
          <CommandGroup heading='Fruit'>
            <CommandItem>Apple</CommandItem>
            <CommandItem>Banana</CommandItem>
          </CommandGroup>
          <CommandGroup heading='Vegetables'>
            <CommandItem>Carrot</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
    await user.click(screen.getByPlaceholderText('Search'));
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(screen.getByText('Carrot')).toHaveFocus();
  });

  it('renders the shortcut badge on the item', () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandItem shortcut='⌘N'>New File</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByText('⌘N').tagName).toBe('KBD');
  });

  it('forwards CommandInput ref to the input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Command>
        <CommandInput ref={ref} placeholder='Search' />
      </Command>
    );
    expect(ref.current).toBe(screen.getByPlaceholderText('Search'));
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandItem>Apple</CommandItem>
          <CommandItem>Banana</CommandItem>
        </CommandList>
      </Command>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
