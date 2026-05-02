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
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="3" x2="12" y2="21" />
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
        </div>
        <span className="text-sm font-medium text-foreground/80">Before / After</span>
      </div>
      <div
        ref={containerRef}
        className="relative w-full aspect-video max-sm:aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted/10 shadow-sm cursor-col-resize select-none touch-none animate-in fade-in duration-300"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <img
          src={processedUrl}
          alt="Processed"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
        <img
          src={originalUrl}
          alt="Original"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          draggable={false}
        />

        <div
          className="absolute top-0 bottom-0 w-0.5 z-10 pointer-events-none"
          style={{
            left: `${position}%`,
            background: `linear-gradient(to bottom, transparent, hsl(280, 60%, 60%), transparent)`,
          }}
        >
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 max-sm:w-7 max-sm:h-7 rounded-full bg-white shadow-lg border-2 border-primary flex items-center justify-center transition-shadow duration-200 hover:shadow-xl hover:shadow-primary/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary max-sm:hidden">
              <path d="M9 4l-6 8 6 8" />
              <path d="M15 4l6 8-6 8" />
            </svg>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-primary hidden max-sm:block">
              <path d="M9 4l-6 8 6 8" />
              <path d="M15 4l6 8-6 8" />
            </svg>
          </div>
        </div>

        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-foreground/10 backdrop-blur-md text-foreground text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-border/30 shadow-sm z-20">
          {originalLabel}
        </div>
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-foreground/10 backdrop-blur-md text-foreground text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-border/30 shadow-sm z-20">
          {processedLabel}
        </div>
      </div>
    </div>
  );
}
