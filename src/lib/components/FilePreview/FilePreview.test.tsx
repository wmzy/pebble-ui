import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FilePreview from './FilePreview';

describe('FilePreview', () => {
  it('renders the file name', () => {
    render(<FilePreview file={{ name: 'report.pdf' }} />);
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
  });

  it('formats the size in the meta row', () => {
    render(<FilePreview file={{ name: 'a.bin', size: 1536 }} />);
    expect(screen.getByText('1.50 KB')).toBeInTheDocument();
  });

  it('renders an image thumbnail when type is image and url is set', () => {
    const { container } = render(
      <FilePreview
        file={{ name: 'pic.png', size: 2048, type: 'image/png', url: 'https://example.com/pic.png' }}
      />
    );
    // Decorative by design (alt='') — the name sits beside it — so the
    // img is queried at the DOM level rather than by role.
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', 'https://example.com/pic.png');
    expect(img).toHaveAttribute('alt', '');
    expect(screen.getByText('pic.png')).toBeInTheDocument();
  });

  it('falls back to the type icon and extension badge without an image url', () => {
    render(
      <FilePreview file={{ name: 'report.pdf', type: 'application/pdf' }} />
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('falls back to the icon when an image type has no url', () => {
    render(<FilePreview file={{ name: 'photo.jpg', type: 'image/jpeg' }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('JPG')).toBeInTheDocument();
  });

  it('omits the extension badge for extension-less names', () => {
    render(<FilePreview file={{ name: 'Makefile' }} />);
    expect(screen.queryByText('PDF')).not.toBeInTheDocument();
  });

  it('announces the default uploaded status', () => {
    render(<FilePreview file={{ name: 'a.txt' }} />);
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
  });

  describe('uploading', () => {
    it('shows the progress bar and percent', () => {
      render(
        <FilePreview file={{ name: 'a.txt' }} status='uploading' progress={45} />
      );
      const bar = screen.getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuenow', '45');
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('Uploading')).toBeInTheDocument();
    });

    it('renders without percent when progress is not provided', () => {
      render(<FilePreview file={{ name: 'a.txt' }} status='uploading' />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });

    it('clamps out-of-range progress', () => {
      render(
        <FilePreview file={{ name: 'a.txt' }} status='uploading' progress={250} />
      );
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuenow',
        '100'
      );
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('error', () => {
    it('shows the error label', () => {
      render(<FilePreview file={{ name: 'a.txt' }} status='error' />);
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });

    it('hides retry without a handler', () => {
      render(<FilePreview file={{ name: 'a.txt' }} status='error' />);
      expect(
        screen.queryByRole('button', { name: 'Retry' })
      ).not.toBeInTheDocument();
    });

    it('fires onRetry from the retry button', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(
        <FilePreview file={{ name: 'a.txt' }} status='error' onRetry={onRetry} />
      );
      await user.click(screen.getByRole('button', { name: 'Retry' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('hides retry outside the error status', () => {
      render(
        <FilePreview file={{ name: 'a.txt' }} status='uploading' onRetry={() => undefined} />
      );
      expect(
        screen.queryByRole('button', { name: 'Retry' })
      ).not.toBeInTheDocument();
    });
  });

  describe('remove', () => {
    it('hides the button without a handler', () => {
      render(<FilePreview file={{ name: 'a.txt' }} />);
      expect(
        screen.queryByRole('button', { name: 'Remove' })
      ).not.toBeInTheDocument();
    });

    it('fires onRemove with the default label', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      render(
        <FilePreview file={{ name: 'a.txt' }} onRemove={onRemove} />
      );
      await user.click(screen.getByRole('button', { name: 'Remove' }));
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('supports a custom label', () => {
      render(
        <FilePreview
          file={{ name: 'a.txt' }}
          onRemove={() => undefined}
          removeLabel='Delete file'
        />
      );
      expect(
        screen.getByRole('button', { name: 'Delete file' })
      ).toBeInTheDocument();
    });
  });

  it('applies className', () => {
    const { container } = render(
      <FilePreview file={{ name: 'a.txt' }} className='custom' />
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('forwards native props to the card', () => {
    render(<FilePreview file={{ name: 'a.txt' }} data-testid='preview' title='Attachment' />);
    expect(screen.getByTestId('preview')).toHaveAttribute(
      'title',
      'Attachment'
    );
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const { container } = render(
      <>
        <FilePreview
          file={{ name: 'pic.png', type: 'image/png', url: 'https://example.com/pic.png' }}
        />
        <FilePreview file={{ name: 'a.txt', size: 512 }} status='uploading' progress={70} />
        <FilePreview
          file={{ name: 'b.txt' }}
          status='error'
          onRetry={() => undefined}
          onRemove={() => undefined}
        />
      </>
    );
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
