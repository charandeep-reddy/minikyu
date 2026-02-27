"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MAX_FILE_SIZE, ACCEPTED_TYPES, ACCEPTED_EXTENSIONS, formatFileSize } from "@/lib/utils";
import Image from "next/image";

interface UploadZoneProps {
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}

export default function UploadZone({ multiple = false, onFiles }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const isOpen = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const valid: File[] = [];

      for (const file of Array.from(fileList)) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`"${file.name}" is not a supported format. Use JPEG, PNG, WebP, or AVIF.`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`"${file.name}" exceeds 20 MB (${formatFileSize(file.size)}).`);
          continue;
        }
        valid.push(file);
      }

      if (valid.length > 0) {
        onFiles(multiple ? valid : [valid[0]]);
      }
    },
    [multiple, onFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      validateAndEmit(e.dataTransfer.files);
    },
    [validateAndEmit]
  );

  const handleClick = useCallback(() => {
    if (isOpen.current) return // ← check first!
    isOpen.current = true
    inputRef.current?.click()
  }, []);

  useEffect(() => {
    const handleFocus = (): void => {
      isOpen.current = false;
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={handleClick}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        isOpen.current = false;
        validateAndEmit(e.target.files);
        e.target.value = "";
      }}
      className={`
        relative flex flex-col items-center justify-center gap-4
        w-full min-h-[260px] rounded-2xl border-2 border-dashed
        cursor-pointer transition-all duration-300 select-none
        ${isDragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-muted-foreground/25 bg-muted/30 hover:border-primary/50 hover:bg-primary/3 dark:border-muted-foreground/15 dark:bg-muted/10 dark:hover:border-primary/40"
        }
      `}
    >
      {/* Ghost illustration */}
      <div className="text-6xl opacity-60 transition-transform duration-300 group-hover:scale-110">
        <Image src="/minikyu.webp" alt="Minikyu" width={64} height={64} />
      </div>
      <div className="text-center px-4">
        <p className="text-base font-medium text-foreground/80">
          {isDragging ? "Drop your images here…" : "Drag & drop images here"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          or <span className="text-primary font-medium underline underline-offset-2">click to browse</span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-3">
          JPEG, PNG, WebP, AVIF · Max 20 MB {multiple && "· Multiple files supported"}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          validateAndEmit(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
