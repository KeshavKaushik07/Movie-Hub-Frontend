import { useState, useEffect } from 'react';
import { createFallbackSvg, resolveImage } from '../../utils/formatters';

/**
 * SafeImage — Never shows a broken image icon.
 * If `src` is null, empty, or fails to load (`onError`), automatically switches
 * to a clean SVG placeholder card (`poster`, `backdrop`, or `avatar`).
 */
export default function SafeImage({
  src,
  alt = 'Movies Hub',
  size = 'w500',
  variant = 'poster',
  className = '',
  ...rest
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const resolvedSrc = failed || !src
    ? createFallbackSvg(alt, variant)
    : resolveImage(src, size, alt, variant);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      onError={() => {
        if (!failed) setFailed(true);
      }}
      className={className}
      {...rest}
    />
  );
}
