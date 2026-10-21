import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

interface ResponsiveScalePreviewProps {
  children: React.ReactNode;
  fit?: 'width' | 'contain';
  maxScale?: number;
  className?: string;
  contentClassName?: string;
}

/** Scales fixed-size content while preserving its scaled layout height. */
export const ResponsiveScalePreview: React.FC<ResponsiveScalePreviewProps> = ({
  children,
  fit = 'width',
  maxScale = 1,
  className = '',
  contentClassName = '',
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({ scale: 1, width: 0, height: 0 });

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const contentWidth = content.scrollWidth;
    const contentHeight = content.scrollHeight;
    if (!contentWidth || !contentHeight) return;

    const widthScale = viewport.clientWidth / contentWidth;
    const heightScale = viewport.clientHeight / contentHeight;
    const nextScale = Math.min(
      maxScale,
      widthScale,
      fit === 'contain' ? heightScale : Number.POSITIVE_INFINITY,
    );
    setMetrics({
      scale: nextScale,
      width: contentWidth * nextScale,
      height: contentHeight * nextScale,
    });
  }, [fit, maxScale]);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    window.addEventListener('orientationchange', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', measure);
    };
  }, [measure, children]);

  return (
    <div ref={viewportRef} className={`min-h-0 min-w-0 ${className}`}>
      <div
        className="relative mx-auto"
        style={{ width: metrics.width || undefined, height: metrics.height || undefined }}
      >
        <div
          ref={contentRef}
          className={`absolute left-0 top-0 w-max origin-top-left ${contentClassName}`}
          style={{ transform: `scale(${metrics.scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
