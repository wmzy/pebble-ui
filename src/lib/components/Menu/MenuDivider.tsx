import { css } from '@linaria/core';

const divider = css`
  height: 1px;
  margin: var(--haze-space-1) 0;
  background: var(--haze-color-border);
`;

export default function MenuDivider() {
  return <div data-slot='separator' className={divider} role='separator' />;
}
