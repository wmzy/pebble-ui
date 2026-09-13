import { useState, useEffect, useCallback } from 'react';
import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type BackToTopProps = {
  threshold?: number;
  children?: React.ReactNode;
  className?: string;
};

const button = css`
  position: fixed;
  bottom: calc(var(--haze-space-6) + env(safe-area-inset-bottom));
  /* physical: pinned to the physical bottom-end screen corner — a FAB
     carries no reading-direction semantics, and the safe-area env has no
     logical counterpart. */
  right: calc(var(--haze-space-6) + env(safe-area-inset-right));
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-primary);
  color: var(--haze-color-bg);
  border: none;
  cursor: pointer;
  box-shadow: var(--haze-shadow-lg);
  font-size: var(--haze-text-lg);
  transition: opacity var(--haze-duration-normal), transform var(--haze-duration-normal);

  &:hover {
    transform: translateY(-2px);
  }
`;

const hidden = css`
  opacity: 0;
  pointer-events: none;
  transform: translateY(1rem);
`;

export default function BackToTop({ threshold = 300, children = '↑', className }: BackToTopProps) {
  const [visible, setVisible] = useState(false);
  const strings = useStrings('backToTop');

  const handleScroll = useCallback(() => {
    setVisible(window.scrollY > threshold);
  }, [threshold]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      data-slot='back-to-top'
      x-class={[button, !visible && hidden, className]}
      onClick={scrollToTop}
      aria-label={strings.label}
    >
      {children}
    </button>
  );
}

export type { BackToTopProps };
