/**
 * Linaria classes for the TimePicker panel form (TimePicker.tsx /
 * TimePickerPanel.tsx). Lives in a sibling file — component files only
 * export components and types (react-refresh/only-export-components).
 */

import { css } from '@linaria/core';

export const wrapper = css`
  position: relative;
  display: inline-block;
`;

/** Readonly trigger input (Datepicker's trigger look). */
export const trigger = css`
  display: block;
  width: 100%;
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  padding: var(--haze-space-2) var(--haze-space-3);
  line-height: var(--haze-leading-normal);
  cursor: pointer;
  transition:
    border-color var(--haze-duration-fast),
    box-shadow var(--haze-duration-fast);
  box-sizing: border-box;
  font-variant-numeric: tabular-nums;

  &:focus {
    outline: none;
    border-color: var(--haze-color-primary);
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--haze-color-text-muted);
  }
`;

/** Panel visual skin applied on every rendering tier. */
export const panel = css`
  display: flex;
  flex-direction: column;
  padding: var(--haze-space-2);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-lg);
  background: var(--haze-color-bg);
  box-shadow: var(--haze-shadow-lg);
`;

export const columns = css`
  display: flex;
  gap: var(--haze-space-1);
`;

/**
 * One column frame: fixed height (7 option rows), the highlight band
 * behind the center row, and the scrolling list on top of it. The band
 * is where a committed selection scrolls to, so it stays put while the
 * list moves under it.
 */
export const columnWrap = css`
  position: relative;
  flex: 1;
  min-width: var(--haze-space-12);
  height: calc(var(--haze-space-8) * 7);

  &::before {
    content: '';
    position: absolute;
    inset-inline: var(--haze-space-1);
    /* One option row tall, vertically centered. */
    top: calc(50% - var(--haze-space-8) / 2);
    height: var(--haze-space-8);
    border-radius: var(--haze-radius-sm);
    background: var(--haze-color-bg-subtle);
    pointer-events: none;
  }
`;

/**
 * The scrolling option list. Padding of three rows lets the first and
 * last options center in the band like every other row. Positioned
 * above the wrap's ::before band.
 */
export const columnList = css`
  position: relative;
  z-index: 1;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  overscroll-behavior: contain;
  padding-block: calc(var(--haze-space-8) * 3);
  outline: none;

  &:focus-visible {
    box-shadow: inset 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

export const columnOption = css`
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--haze-space-8);
  border-radius: var(--haze-radius-sm);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
  font-variant-numeric: tabular-nums;
  cursor: pointer;

  &:hover {
    background: var(--haze-color-bg-subtle);
  }
`;

export const columnOptionSelected = css`
  color: var(--haze-color-primary);
  font-weight: var(--haze-weight-medium);
`;

export const columnOptionDisabled = css`
  color: var(--haze-color-text-muted);
  cursor: not-allowed;

  &:hover {
    background: transparent;
  }
`;

/** Panel footer: the "Now" action row. */
export const footer = css`
  display: flex;
  justify-content: flex-end;
  margin-block-start: var(--haze-space-2);
`;

export const nowButton = css`
  appearance: none;
  border: none;
  background: transparent;
  padding: var(--haze-space-1) var(--haze-space-2);
  border-radius: var(--haze-radius-sm);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-primary);
  cursor: pointer;

  &:hover {
    background: var(--haze-color-bg-subtle);
  }

  &:active {
    background: var(--haze-color-bg-muted);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;
