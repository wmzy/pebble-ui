import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Tabs from './Tabs';
import TabList from './TabList';
import Tab from './Tab';
import TabPanel from './TabPanel';

function TabsFixture({ defaultValue = 'one' }: { defaultValue?: string }) {
  return (
    <Tabs value={defaultValue}>
      <TabList>
        <Tab value="one">Tab 1</Tab>
        <Tab value="two">Tab 2</Tab>
      </TabList>
      <TabPanel value="one">Panel 1</TabPanel>
      <TabPanel value="two">Panel 2</TabPanel>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('renders tabs and panels', () => {
    render(<TabsFixture />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getAllByRole('tabpanel')).toHaveLength(2);
  });

  it('shows the active panel based on initial value', () => {
    render(<TabsFixture defaultValue="one" />);
    const [tab1, tab2] = screen.getAllByRole('tab');
    expect(tab1).toHaveAttribute('aria-selected', 'true');
    expect(tab2).toHaveAttribute('aria-selected', 'false');
  });

  it('switches panel on tab click', async () => {
    const user = userEvent.setup();
    render(<TabsFixture defaultValue="one" />);
    await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'false');
  });

  it('moves between tabs with ArrowRight/ArrowLeft, activating as focus lands', async () => {
    const user = userEvent.setup();
    render(<TabsFixture />);
    const [tab1, tab2] = screen.getAllByRole('tab');
    tab1!.focus();
    await user.keyboard('{ArrowRight}');
    expect(tab2).toHaveFocus();
    expect(tab2).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel 2')).toBeVisible();
    await user.keyboard('{ArrowLeft}');
    expect(tab1!).toHaveFocus();
    expect(screen.getByText('Panel 1')).toBeVisible();
  });

  it('jumps to the ends with Home/End', async () => {
    const user = userEvent.setup();
    render(<TabsFixture />);
    const [tab1, tab2] = screen.getAllByRole('tab');
    tab1!.focus();
    await user.keyboard('{End}');
    expect(tab2).toHaveFocus();
    expect(screen.getByText('Panel 2')).toBeVisible();
    await user.keyboard('{Home}');
    expect(tab1!).toHaveFocus();
    expect(screen.getByText('Panel 1')).toBeVisible();
  });

  it('keeps exactly one tab stop: only the active tab is tabbable', () => {
    render(<TabsFixture />);
    const [tab1, tab2] = screen.getAllByRole('tab');
    expect(tab1).toHaveAttribute('tabindex', '0');
    expect(tab2).toHaveAttribute('tabindex', '-1');
  });

  it('applies className to Tabs root', () => {
    const { container } = render(
      <Tabs className="custom">
        <TabList><Tab value="a">A</Tab></TabList>
        <TabPanel value="a">Content</TabPanel>
      </Tabs>
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('applies className to TabList', () => {
    render(
      <Tabs>
        <TabList className="list-custom"><Tab value="a">A</Tab></TabList>
        <TabPanel value="a">Content</TabPanel>
      </Tabs>
    );
    expect(screen.getByRole('tablist')).toHaveClass('list-custom');
  });

  it('throws when Tab is used outside Tabs', () => {
    expect(() => render(<Tab value="a">A</Tab>)).toThrow(
      'Tabs compound components must be used within <Tabs>'
    );
  });

  it('throws when TabPanel is used outside Tabs', () => {
    expect(() => render(<TabPanel value="a">Content</TabPanel>)).toThrow(
      'Tabs compound components must be used within <Tabs>'
    );
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<TabsFixture />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations after switching to the second tab', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<TabsFixture defaultValue="one" />);
    await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
