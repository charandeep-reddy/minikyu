"use client";

import { useCallback, useRef, useState } from "react";

interface BeforeAfterPreviewProps {
  originalUrl: string;
  processedUrl: string;
  originalLabel?: string;
  processedLabel?: string;
}

export default function BeforeAfterPreview({
  originalUrl,
  processedUrl,
  originalLabel = "Original",
  processedLabel = "Processed",
}: BeforeAfterPreviewProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground/80">Before / After</label>
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted/20 cursor-col-resize select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Processed (right - full background) */}
        <img
          src={processedUrl}
          alt="Processed"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />

        {/* Original (left - clipped) */}
        <img
          src={originalUrl}
          alt="Original"
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            clipPath: `inset(0 ${100 - position}% 0 0)`
          }}
          draggable={false}
        />

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
          style={{ left: `${position}%` }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg border-2 border-primary flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 4l-6 8 6 8" />
              <path d="M16 4l6 8-6 8" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm z-20">
          {originalLabel}
        </div>
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm z-20">
          {processedLabel}
        </div>
      </div>
    </div>
  );
}
