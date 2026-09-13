import type {ComponentType, ReactNode, SVGProps} from 'react';

import {css} from '@linaria/core';

type IconProps = {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
};

const base = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  flex-shrink: 0;

  & > svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
    stroke: currentColor;
  }
`;

const strokeOnly = css`
  & > svg {
    fill: none;
  }
`;

const sizes = {
  sm: css`
    width: 16px;
    height: 16px;
  `,
  md: css`
    width: 20px;
    height: 20px;
  `,
  lg: css`
    width: 24px;
    height: 24px;
  `,
} as const;

function hasStrokeStyle(node: ReactNode): boolean {
  if (node == null || typeof node !== 'object') return false;
  if (!('props' in node)) return false;
  const props = node.props as Record<string, unknown>;
  if (props.stroke || props.strokeWidth) return true;
  if (props.fill === 'none') return true;
  return false;
}

export default function Icon({
  icon: IconComponent,
  size = 'md',
  className,
  children,
}: IconProps) {
  const content = IconComponent ? <IconComponent /> : children;
  const isStroke = IconComponent ? true : hasStrokeStyle(content);

  return (
    <span data-slot='icon' x-class={[base, isStroke && strokeOnly, sizes[size], className]} aria-hidden='true'>
      {content}
    </span>
  );
}

export type {IconProps};
