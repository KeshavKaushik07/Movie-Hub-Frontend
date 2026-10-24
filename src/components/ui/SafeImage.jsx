import { useState, useEffect } from 'react';
import { createFallbackSvg, resolveImage } from '../../utils/formatters';
import { isSafeUrl } from '../../utils/security';

/**
 * SafeImage — Never shows a broken image icon and blocks unsafe URI schemes.
 * If `src` is null, empty, unsafe, or fails to load (`onError`), automatically switches
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

  const candidate = failed || !src ? '' : resolveImage(src, size, alt, variant);
  const resolvedSrc =
    !candidate || !isSafeUrl(candidate)
      ? createFallbackSvg(alt, variant)
      : candidate;

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
