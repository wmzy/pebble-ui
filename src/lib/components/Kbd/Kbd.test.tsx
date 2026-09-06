import { render, screen } from '@testing-library/react';

import Kbd from './Kbd';

describe('Kbd', () => {
  it('renders children inside a kbd element', () => {
    const { container } = render(<Kbd>⌘</Kbd>);
    expect(container.firstChild?.nodeName).toBe('KBD');
    expect(screen.getByText('⌘')).toBeInTheDocument();
  });

  it('applies the size class for each size', () => {
    const { container: smContainer } = render(<Kbd size='sm'>K</Kbd>);
    const { container: mdContainer } = render(<Kbd size='md'>K</Kbd>);
    const smClasses = (smContainer.firstChild as HTMLElement).className.split(' ');
    const mdClasses = (mdContainer.firstChild as HTMLElement).className.split(' ');
    // sm and md share the base class but each contributes its own size class.
    expect(mdClasses.length).toBe(smClasses.length);
    expect(smClasses).not.toEqual(mdClasses);
  });

  it('defaults to md size', () => {
    const { container: mdContainer } = render(<Kbd size='md'>K</Kbd>);
    const { container: defaultContainer } = render(<Kbd>K</Kbd>);
    expect((defaultContainer.firstChild as HTMLElement).className).toBe(
      (mdContainer.firstChild as HTMLElement).className
    );
  });

  it('forwards native props', () => {
    render(<Kbd title='Command'>⌘</Kbd>);
    expect(screen.getByTitle('Command')).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<Kbd className='custom'>⌘</Kbd>);
    expect(screen.getByText('⌘')).toHaveClass('custom');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <>
        <Kbd>⌘</Kbd>
        <Kbd size='sm'>Shift</Kbd>
      </>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
