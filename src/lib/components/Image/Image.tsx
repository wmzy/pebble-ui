import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  SyntheticEvent,
} from 'react';

import { css } from '@linaria/core';
import { useState } from 'react';
import { useControl } from 'react-use-control';

import ImagePreview from './ImagePreview';

/**
 * Preview overlay configuration: absent/false disables the preview; each
 * flag opts out of one control (default enabled), mirroring antd's
 * PreviewOperations config.
 */
type ImagePreviewConfig = {
  zoom?: boolean;
  rotate?: boolean;
};

type ImageProps = {
  src: string;
  alt: string;
  fallback?: ReactNode;
  aspectRatio?: string;
  objectFit?: CSSProperties['objectFit'];
  /**
   * Enable the fullscreen click-to-preview overlay (default `false` —
   * rendering and behavior are unchanged). `true` turns on every control;
   * an object opts out per control: `zoom: false` drops the zoom
   * buttons, wheel zoom and drag pan, `rotate: false` the rotate button.
   */
  preview?: boolean | ImagePreviewConfig;
} & Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'alt'>;

const wrapper = css`
  display: block;
  overflow: hidden;
  position: relative;
`;

const imgStyle = css`
  display: block;
  width: 100%;
  height: 100%;
`;

const fallbackStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--haze-color-bg-muted);
  color: var(--haze-color-text-muted);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
`;

const previewTrigger = css`
  cursor: zoom-in;
`;

export default function Image({
  src,
  alt,
  fallback,
  aspectRatio,
  objectFit = 'cover',
  preview = false,
  className,
  style,
  onClick,
  onError,
  ...rest
}: ImageProps) {
  const [error, setError] = useState(false);
  const previewEnabled = preview !== false;
  const previewOptions = typeof preview === 'object' ? preview : {};
  const zoomEnabled = previewEnabled && previewOptions.zoom !== false;
  const rotateEnabled = previewEnabled && previewOptions.rotate !== false;
  const [, setPreviewOpen, previewOpenCtrl] = useControl(undefined, false);

  // Compose: the fallback logic owns this handler, but a consumer's
  // onError (forwarded via the native props arm) still fires.
  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    onError?.(event);
    setError(true);
  };

  // Same composition as onError: the preview logic owns the click, a
  // consumer's forwarded onClick still fires first.
  const handleClick = (event: ReactMouseEvent<HTMLImageElement>) => {
    onClick?.(event);
    if (!previewEnabled) return;
    // The preview's focus scope returns focus to this image on close;
    // focus it now (imgs are not focusable by default, hence tabIndex -1
    // below) so that hand-back has a real target.
    event.currentTarget.focus();
    setPreviewOpen(true);
  };

  return (
    <>
      <span data-slot="image" x-class={[wrapper, className]} style={{ aspectRatio }}>
        {error && fallback ? (
          <span data-slot="error" className={fallbackStyle}>{fallback}</span>
        ) : (
          <img
            data-slot="img"
            x-class={[imgStyle, previewEnabled && previewTrigger]}
            tabIndex={previewEnabled ? -1 : undefined}
            {...rest}
            src={src}
            alt={alt}
            style={{ ...style, objectFit }}
            onError={handleError}
            onClick={handleClick}
          />
        )}
      </span>
      {previewEnabled && (
        <ImagePreview
          src={src}
          alt={alt}
          open={previewOpenCtrl}
          zoom={zoomEnabled}
          rotate={rotateEnabled}
        />
      )}
    </>
  );
}

export type { ImageProps, ImagePreviewConfig };
