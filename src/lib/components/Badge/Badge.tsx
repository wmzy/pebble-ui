import type { CSSProperties, ReactNode } from 'react';

// sibling module (not `styles.ts`) — Linaria derives dev class names from
// the file basename, and a shared `styles` basename collides with
// Button/styles.ts (identical `haze-styles__*` selectors cross-wire the
// two components' rules in dev AND collide in dist css)
import { base, sizes, variants } from './badge-styles';

type BadgeProps = {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export default function Badge({
  variant = 'default',
  size = 'md',
  className,
  style,
  children,
}: BadgeProps) {
  return (
    <span x-class={[base, variants[variant], sizes[size], className]} style={style}>
      {children}
    </span>
  );
}

export type { BadgeProps };
