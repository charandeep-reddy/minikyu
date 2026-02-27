"use client";

import { useEffect, useRef } from "react";

interface ImageCanvasProps {
  imageUrl: string | null;
  className?: string;
}

export default function ImageCanvas({ imageUrl, className = "" }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const container = canvas.parentElement;
      const maxW = container?.clientWidth || 600;
      const maxH = 400;

      let w = img.width;
      let h = img.height;

      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  if (!imageUrl) return null;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-border/50 max-w-full"
      />
    </div>
  );
}
