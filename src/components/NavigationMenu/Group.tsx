import type {ReactNode} from 'react';

import {css} from '@linaria/core';
import { useState} from 'react';

import { reset } from '@/util/styles';

import * as Buttons from '../buttons';

type Props = {
  title: ReactNode;
  children: ReactNode;
};

export default function Group({title, children}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <Buttons.Block
        onClick={() => setOpen(!open)}
        x-class={css`
          cursor: pointer;
          &:hover {
            background: #eee;
          }
        `}
      >
        {title}
      </Buttons.Block>
      <ul
        x-class={[
          reset,
          open ||
            css`
              display: none;
            `
        ]}
      >
        {children}
      </ul>
    </li>
  );
}
