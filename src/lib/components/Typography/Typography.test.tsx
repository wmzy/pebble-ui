import { render, screen } from '@testing-library/react';

import { Title, Text, Paragraph } from './index';

describe('Title', () => {
  it('renders an h1 by default', () => {
    render(<Title>Hello</Title>);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders different levels', () => {
    render(<Title level={2}>Sub</Title>);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<Title className="custom">T</Title>);
    expect(screen.getByRole('heading')).toHaveClass('custom');
  });
});

describe('Text', () => {
  it('renders a span', () => {
    render(<Text>hello</Text>);
    expect(screen.getByText('hello').tagName).toBe('SPAN');
  });

  it('renders with different types', () => {
    render(<Text type="secondary">sec</Text>);
    expect(screen.getByText('sec')).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<Text className="custom">x</Text>);
    expect(screen.getByText('x')).toHaveClass('custom');
  });

  it('renders strong', () => {
    render(<Text strong>bold</Text>);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('renders code', () => {
    render(<Text code>npm</Text>);
    expect(screen.getByText('npm').tagName).toBe('CODE');
  });

  it('renders strong tag when both strong and code are set', () => {
    render(<Text strong code>strict</Text>);
    expect(screen.getByText('strict').tagName).toBe('STRONG');
  });

  it('renders marked text', () => {
    render(<Text mark>highlight</Text>);
    expect(screen.getByText('highlight').tagName).toBe('SPAN');
    expect(screen.getByText('highlight')).toBeInTheDocument();
  });
});

describe('Text ellipsis', () => {
  it('single line adds exactly the truncation class plus a title fallback', () => {
    const { container: plainWrap } = render(<Text>hello world</Text>);
    const { container } = render(<Text ellipsis>hello world</Text>);
    const plain = plainWrap.firstElementChild as HTMLElement;
    const clamped = container.firstElementChild as HTMLElement;
    // x-class 经 classnames 过滤 falsy 项：ellipsis 只多出截断类
    expect(clamped.classList.length).toBe(plain.classList.length + 1);
    expect(clamped).toHaveAttribute('title', 'hello world');
  });

  it('multi-line applies the line-clamp box style', () => {
    render(<Text ellipsis={{ lines: 2 }}>hello world</Text>);
    const el = screen.getByText('hello world');
    expect(el.getAttribute('style')).toContain('-webkit-line-clamp: 2');
    expect(el.getAttribute('style')).toContain('-webkit-box');
    expect(el.getAttribute('style')).toContain('overflow: hidden');
    expect(el).toHaveAttribute('title', 'hello world');
  });

  it('keeps single-line semantics for {lines: 1}', () => {
    const { container: plainWrap } = render(<Text>hello world</Text>);
    const { container } = render(<Text ellipsis={{ lines: 1 }}>hello world</Text>);
    const plain = plainWrap.firstElementChild as HTMLElement;
    const clamped = container.firstElementChild as HTMLElement;
    expect(clamped.classList.length).toBe(plain.classList.length + 1);
    expect(clamped.getAttribute('style')).toBeNull();
  });

  it('omits the title for non-string children', () => {
    render(
      <Text ellipsis>
        <em>emphasized</em>
      </Text>,
    );
    expect(screen.getByText('emphasized')).not.toHaveAttribute('title');
  });

  it('ellipsis={false} renders unclamped without a title', () => {
    const { container: plainWrap } = render(<Text>hello world</Text>);
    const { container } = render(<Text ellipsis={false}>hello world</Text>);
    const plain = plainWrap.firstElementChild as HTMLElement;
    const off = container.firstElementChild as HTMLElement;
    expect(off.classList.length).toBe(plain.classList.length);
    expect(off).not.toHaveAttribute('title');
  });
});

describe('Paragraph', () => {
  it('renders a p element', () => {
    render(<Paragraph>text</Paragraph>);
    expect(screen.getByText('text').tagName).toBe('P');
  });

  it('applies className', () => {
    render(<Paragraph className="custom">x</Paragraph>);
    expect(screen.getByText('x')).toHaveClass('custom');
  });

  it('single-line ellipsis adds the truncation class and title', () => {
    const { container: plainWrap } = render(<Paragraph>body copy</Paragraph>);
    const { container } = render(<Paragraph ellipsis>body copy</Paragraph>);
    const plain = plainWrap.firstElementChild as HTMLElement;
    const clamped = container.firstElementChild as HTMLElement;
    expect(clamped.classList.length).toBe(plain.classList.length + 1);
    expect(clamped).toHaveAttribute('title', 'body copy');
  });

  it('multi-line ellipsis applies the line-clamp style', () => {
    render(<Paragraph ellipsis={{ lines: 3 }}>body copy</Paragraph>);
    const el = screen.getByText('body copy');
    expect(el.getAttribute('style')).toContain('-webkit-line-clamp: 3');
    expect(el).toHaveAttribute('title', 'body copy');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <>
        <Title>Hello</Title>
        <Text type="secondary">secondary text</Text>
        <Text ellipsis>clamped single line</Text>
        <Paragraph>paragraph body</Paragraph>
        <Paragraph ellipsis={{ lines: 2 }}>clamped paragraph body</Paragraph>
      </>,
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
