import {reset} from '@/util/styles';
import {ReactNode} from 'react';

type Props = {
  children: ReactNode;
};

export default function NavigationMenu({children}: Props) {
  return <ul x-class={reset}>{children}</ul>;
}
