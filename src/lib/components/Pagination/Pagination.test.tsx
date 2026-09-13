import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useControl } from 'react-use-control';

import Pagination from './Pagination';

describe('Pagination', () => {
  it('renders a nav element', () => {
    render(<Pagination total={100} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders page buttons', () => {
    render(<Pagination total={50} pageSize={10} />);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
  });

  it('renders prev and next buttons', () => {
    render(<Pagination total={50} pageSize={10} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('disables prev button on first page', () => {
    render(<Pagination total={50} pageSize={10} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination total={50} pageSize={10} page={5} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('calls page change on click', async () => {
    const user = userEvent.setup();
    render(<Pagination total={50} pageSize={10} />);
    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<Pagination className="custom" total={50} />);
    expect(screen.getByRole('navigation')).toHaveClass('custom');
  });

  it('keeps the default DOM free of opt-in extras', () => {
    render(<Pagination total={500} pageSize={10} page={10} />);
    const navEl = screen.getByRole('navigation');
    // prev + [1, …, 9, 10, 11, …, 50] + next — ellipsis stay plain spans
    expect(navEl.children).toHaveLength(9);
    expect(navEl.querySelectorAll('button')).toHaveLength(7);
    expect(navEl.querySelectorAll('span')).toHaveLength(2);
    expect(navEl.querySelectorAll('select, input')).toHaveLength(0);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('fires onPageChange for page, prev and next clicks', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination total={50} pageSize={10} page={2} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: '4' }));
    expect(onPageChange).toHaveBeenCalledWith(4, 10);
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenCalledWith(3, 10);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(4, 10);
  });

  it('accepts a controlled pageSize through a Control', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [, setPageSize, pageSizeCtrl] = useControl(undefined, 10);
      return (
        <>
          <Pagination total={100} pageSize={pageSizeCtrl} pageSizeOptions={[10, 25]} showSizeChanger />
          <button type="button" onClick={() => setPageSize(25)}>set page size</button>
        </>
      );
    }
    render(<Harness />);
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'set page size' }));
    expect(screen.queryByRole('button', { name: '10' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('25');
  });

  describe('showTotal', () => {
    it('renders the summary with the current page range', () => {
      render(
        <Pagination
          total={50}
          pageSize={10}
          page={2}
          showTotal={(t, [start, end]) => `${start}-${end} of ${t}`}
        />
      );
      expect(screen.getByText('11-20 of 50')).toBeInTheDocument();
    });
  });

  describe('showSizeChanger', () => {
    it('renders a labelled select with formatted options', () => {
      render(<Pagination total={100} showSizeChanger />);
      const select = screen.getByRole('combobox', { name: 'Items per page' });
      expect(select).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '20 / page' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '50 / page' })).toBeInTheDocument();
    });

    it('honours pageSizeOptions and folds in a missing current size', () => {
      render(<Pagination total={100} pageSize={15} pageSizeOptions={[5, 50]} showSizeChanger />);
      expect(screen.getByRole('combobox')).toHaveValue('15');
      expect(screen.getByRole('option', { name: '15 / page' })).toBeInTheDocument();
    });

    it('resets to page 1 and reports the new size', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <Pagination
          total={100}
          pageSize={10}
          page={4}
          showSizeChanger
          onPageChange={onPageChange}
        />
      );
      await user.selectOptions(screen.getByRole('combobox', { name: 'Items per page' }), '20');
      expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(1, 20);
      // page count follows the new size: 100 / 20 = 5 pages
      expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    });

    it('still reports the size change when already on page 1', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(<Pagination total={100} showSizeChanger onPageChange={onPageChange} />);
      await user.selectOptions(screen.getByRole('combobox'), '50');
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(1, 50);
    });
  });

  describe('showQuickJumper', () => {
    it('renders the localized prefix and a labelled input', () => {
      render(<Pagination total={100} showQuickJumper />);
      expect(screen.getByText('Go to')).toBeInTheDocument();
      expect(screen.getByText('page')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Jump to page' })).toBeInTheDocument();
    });

    it('jumps on Enter and reports the page', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(<Pagination total={100} showQuickJumper onPageChange={onPageChange} />);
      await user.type(screen.getByRole('textbox', { name: 'Jump to page' }), '3{Enter}');
      expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page');
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(3, 10);
    });

    it('clamps out-of-range jumps to the page bounds', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(<Pagination total={100} showQuickJumper onPageChange={onPageChange} />);
      const input = screen.getByRole('textbox', { name: 'Jump to page' });
      await user.type(input, '999{Enter}');
      expect(onPageChange).toHaveBeenLastCalledWith(10, 10);
      expect(screen.getByRole('button', { name: '10' })).toHaveAttribute('aria-current', 'page');
      await user.clear(input);
      await user.type(input, '0{Enter}');
      expect(onPageChange).toHaveBeenLastCalledWith(1, 10);
      expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
    });

    it('ignores non-numeric input', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(<Pagination total={100} page={2} showQuickJumper onPageChange={onPageChange} />);
      await user.type(screen.getByRole('textbox', { name: 'Jump to page' }), 'abc{Enter}');
      expect(onPageChange).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('simple mode', () => {
    it('renders an input and the page total instead of the page list', () => {
      render(<Pagination total={50} simple />);
      expect(screen.getByRole('textbox', { name: 'Jump to page' })).toHaveValue('1');
      expect(screen.getByText('/ 5')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '3' })).not.toBeInTheDocument();
    });

    it('tracks prev/next clicks in the input', async () => {
      const user = userEvent.setup();
      render(<Pagination total={50} simple />);
      const input = screen.getByRole('textbox', { name: 'Jump to page' });
      await user.click(screen.getByRole('button', { name: 'Next' }));
      expect(input).toHaveValue('2');
      await user.click(screen.getByRole('button', { name: 'Previous' }));
      expect(input).toHaveValue('1');
    });

    it('jumps on Enter and clamps beyond the last page', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(<Pagination total={50} simple onPageChange={onPageChange} />);
      const input = screen.getByRole('textbox', { name: 'Jump to page' });
      await user.clear(input);
      await user.type(input, '4{Enter}');
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(4, 10);
      expect(input).toHaveValue('4');
      await user.clear(input);
      await user.type(input, '99{Enter}');
      expect(onPageChange).toHaveBeenLastCalledWith(5, 10);
      expect(input).toHaveValue('5');
    });
  });

  describe('ellipsisJump', () => {
    it('turns ellipses into labelled jump buttons', () => {
      render(<Pagination total={500} pageSize={10} page={10} ellipsisJump />);
      expect(
        screen.getByRole('button', { name: 'Jump back 5 pages' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Jump forward 5 pages' })
      ).toBeInTheDocument();
    });

    it('jumps ±5 pages through the ellipsis buttons', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      render(
        <Pagination
          total={500}
          pageSize={10}
          page={10}
          ellipsisJump
          onPageChange={onPageChange}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Jump forward 5 pages' }));
      expect(onPageChange).toHaveBeenLastCalledWith(15, 10);
      expect(screen.getByRole('button', { name: '15' })).toHaveAttribute('aria-current', 'page');
      await user.click(screen.getByRole('button', { name: 'Jump back 5 pages' }));
      expect(onPageChange).toHaveBeenLastCalledWith(10, 10);
      expect(screen.getByRole('button', { name: '10' })).toHaveAttribute('aria-current', 'page');
    });

    it('clamps forward jumps past the last page', async () => {
      const user = userEvent.setup();
      render(<Pagination total={500} pageSize={10} page={47} ellipsisJump />);
      await user.click(screen.getByRole('button', { name: 'Jump forward 5 pages' }));
      expect(screen.getByRole('button', { name: '50' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    });

    it('clamps backward jumps past the first page', async () => {
      const user = userEvent.setup();
      render(<Pagination total={500} pageSize={10} page={4} ellipsisJump />);
      await user.click(screen.getByRole('button', { name: 'Jump back 5 pages' }));
      expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    });
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Pagination total={50} pageSize={10} />);
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations with every extra enabled', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Pagination
        total={500}
        pageSize={10}
        page={10}
        showSizeChanger
        showQuickJumper
        showTotal={(t, [start, end]) => `${start}-${end} of ${t}`}
        ellipsisJump
      />
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
