import { render, screen, act  } from '@testing-library/react';

import CodeBlock from './CodeBlock';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('CodeBlock', () => {
  it('renders code content', () => {
    render(<CodeBlock>const x = 1;</CodeBlock>);
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<CodeBlock className="custom">code</CodeBlock>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders language label', () => {
    render(<CodeBlock language="js">code</CodeBlock>);
    expect(screen.getByText('js')).toBeInTheDocument();
  });

  it('does not render language label when not provided', () => {
    const { container } = render(<CodeBlock>code</CodeBlock>);
    expect(container.querySelector('span')).not.toBeInTheDocument();
  });

  it('renders in pre > code', () => {
    const { container } = render(<CodeBlock>hello</CodeBlock>);
    expect(container.querySelector('pre > code')).toBeInTheDocument();
  });

  it('renders code as plain text without highlight prop (zero-change regression)', () => {
    const { container } = render(<CodeBlock language="js">{'const x = 1;'}</CodeBlock>);
    const code = container.querySelector('code')!;
    expect(code.textContent).toBe('const x = 1;');
    // No innerHTML injection, no extra elements.
    expect(code.childElementCount).toBe(0);
    expect(code.innerHTML).toBe('const x = 1;');
  });

  it('renders synchronous highlight HTML into the code element', () => {
    const highlight = (code: string, language: string) =>
      `<span data-lang="${language}" class="tok">tok</span> ${code}`;
    const { container } = render(
      <CodeBlock language="ts" highlight={highlight}>
        {'let x;'}
      </CodeBlock>,
    );
    // Highlighter receives raw code and language.
    expect(container.querySelector('code .tok')!.getAttribute('data-lang')).toBe('ts');
    // Full fragment injected verbatim.
    expect(container.querySelector('code')!.innerHTML).toBe(
      '<span data-lang="ts" class="tok">tok</span> let x;',
    );
  });

  it('passes empty language to the highlighter when unset', () => {
    const highlight = (_code: string, language: string) => `<b>${language}</b>`;
    const { container } = render(
      <CodeBlock highlight={highlight}>{'x'}</CodeBlock>,
    );
    expect(container.querySelector('code b')!.textContent).toBe('');
  });

  it('renders plain text first, then swaps in async highlight HTML', async () => {
    const d = deferred<string>();
    const { container } = render(
      <CodeBlock language="js" highlight={() => d.promise}>
        {'await run();'}
      </CodeBlock>,
    );
    // While pending: plain text, no loading chrome.
    expect(screen.getByText('await run();')).toBeInTheDocument();
    expect(container.querySelector('code')!.childElementCount).toBe(0);

    await act(async () => {
      await Promise.resolve();
      d.resolve('<em data-testid="hl">await</em> run();');
    });

    expect(screen.getByTestId('hl')).toBeInTheDocument();
    expect(container.querySelector('code')!.innerHTML).toBe(
      '<em data-testid="hl">await</em> run();',
    );
  });

  it('discards stale promise results when code changes', async () => {
    const d1 = deferred<string>();
    const d2 = deferred<string>();
    let call = 0;
    const highlight = () => (call++ === 0 ? d1.promise : d2.promise);
    const { container, rerender } = render(
      <CodeBlock language="js" highlight={highlight}>
        {'old code'}
      </CodeBlock>,
    );

    rerender(
      <CodeBlock language="js" highlight={highlight}>
        {'new code'}
      </CodeBlock>,
    );

    // Newer promise settles first.
    await act(async () => {
      await Promise.resolve();
      d2.resolve('<b data-testid="fresh">new</b>');
    });
    expect(screen.getByTestId('fresh')).toBeInTheDocument();

    // Older promise settling afterwards must not clobber the fresh result.
    await act(async () => {
      await Promise.resolve();
      d1.resolve('<i data-testid="stale">old</i>');
    });
    expect(screen.queryByTestId('stale')).not.toBeInTheDocument();
    expect(container.querySelector('code')!.innerHTML).toBe('<b data-testid="fresh">new</b>');
  });

  it('falls back to plain text when the highlighter rejects', async () => {
    const { container } = render(
      <CodeBlock language="js" highlight={() => Promise.reject(new Error('boom'))}>
        {'safe plain code'}
      </CodeBlock>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    const code = container.querySelector('code')!;
    expect(code.textContent).toBe('safe plain code');
    expect(code.childElementCount).toBe(0);
  });

  it('renders plain text when a synchronous highlighter throws', () => {
    const { container } = render(
      <CodeBlock language="js" highlight={() => { throw new Error('bad highlighter'); }}>
        {'plain fallback'}
      </CodeBlock>,
    );
    const code = container.querySelector('code')!;
    expect(code.textContent).toBe('plain fallback');
    expect(code.childElementCount).toBe(0);
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<CodeBlock language="js">const x = 1;</CodeBlock>);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations with injected highlight HTML', async () => {
    const { axe } = await import('jest-axe');
    render(
      <CodeBlock
        language="js"
        highlight={() => '<span style="color: var(--haze-color-primary)">const</span> x = 1;'}
      >
        {'const x = 1;'}
      </CodeBlock>,
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
