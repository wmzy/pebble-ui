import type {ReactNode} from 'react';

import {reset} from '@/util/styles';

type Props = {
  children: ReactNode;
};

export default function NavigationMenu({children}: Props) {
  return <ul x-class={reset}>{children}</ul>;
}
