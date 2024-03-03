import {reset} from '@/util/styles';
import {css} from '@linaria/core';
import {ButtonHTMLAttributes, DetailedHTMLProps} from 'react';

export default function Block({
  className,
  ...props
}: DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      type='button'
      x-class={[
        className,
        reset,
        css`
          display: block;
          border: none;
          background: none;
          &:hover {
            background: none;
          }
        `
      ]}
      {...props}
    />
  );
}
