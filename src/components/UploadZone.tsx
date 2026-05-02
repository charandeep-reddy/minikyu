"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MAX_FILE_SIZE, ACCEPTED_TYPES, ACCEPTED_EXTENSIONS, formatFileSize } from "@/lib/utils";
import { Upload, FileCheck } from "lucide-react";

interface UploadZoneProps {
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}

export default function UploadZone({ multiple = false, onFiles }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hasFiles, setHasFiles] = useState(false);
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
        setHasFiles(true);
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
    if (isOpen.current) return;
    isOpen.current = true;
    inputRef.current?.click();
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
        relative flex flex-col items-center justify-center gap-3
        w-full min-h-[200px] rounded-2xl border-2 border-dashed
        cursor-pointer transition-all duration-300 select-none
        bg-background/50 backdrop-blur-sm
        ${isDragging
          ? "border-primary scale-[1.01] bg-primary/5 shadow-lg shadow-primary/10"
          : hasFiles
            ? "border-green-400/50 bg-green-500/5"
            : "border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/2 dark:border-muted-foreground/15 dark:hover:border-primary/30"
        }
      `}
    >
      {hasFiles ? (
        <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <FileCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm font-medium text-foreground/80">
            Files added &mdash; drop more or click to replace
          </p>
        </div>
      ) : (
        <>
          <div className={`transition-all duration-500 ${isDragging ? "scale-110 -translate-y-1" : ""}`}>
            <div className={`w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-300 ${isDragging ? "bg-primary/20 shadow-lg shadow-primary/20" : ""}`}>
              <Upload className={`w-6 h-6 transition-colors duration-300 ${isDragging ? "text-primary" : "text-muted-foreground/60"}`} />
            </div>
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium text-foreground/70">
              {isDragging ? "Drop your images here\u2026" : "Drag & drop images here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or{" "}
              <span className="text-primary font-medium underline underline-offset-2">
                click to browse
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground/50 mt-2.5">
              JPEG, PNG, WebP, AVIF &middot; Max 20 MB {multiple && "· Multiple files supported"}
            </p>
          </div>
        </>
      )}

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
