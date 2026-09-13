import {css} from '@linaria/core';

/**
 * Shared FormItem skin — the layout classes the component wears, split
 * per layout mode. Living in their own module keeps the component file
 * free of style internals (react-refresh boundary) and lets tests (and
 * consumers composing custom field chrome) reference the exact classes;
 * split-css groups the emitted CSS into `haze-ui/css/form.css` with them.
 */

/** vertical (default): label stacked above the control. */
export const item = css`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--haze-space-1);
`;

/** horizontal: label column left, control column right; the control
 * column carries the error span so rows keep a shared left rail. */
export const itemHorizontal = css`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: var(--haze-space-2);
`;

/** inline: label + control + error flow on one row; the trailing
 * margin-inline-end separates sibling inline items automatically. */
export const itemInline = css`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--haze-space-2);
  margin-inline-end: var(--haze-space-4);
`;

/** horizontal only: the control + error column beside the label. */
export const controlColumn = css`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1;
  min-width: 0;
  gap: var(--haze-space-1);
`;

export const labelText = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
`;

/** horizontal only: the label as a fixed column — the width itself is a
 * runtime value (labelWidth) and rides an inline style instead. The
 * block-start padding optically aligns the label's first line with the
 * control's text (InputCore md's vertical padding). */
export const labelColumn = css`
  flex-shrink: 0;
  padding-block-start: var(--haze-space-2);
`;

export const errorText = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-danger);
`;
