import Image from "next/image";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto">
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-5 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground/70">Minikyu</span>{" "}
          by{" "}
          <a
            href="https://psydevx.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline underline-offset-2"
          >
            Psydevx
          </a>{" "}
          <Image src="/minikyu.webp" alt="Minikyu" width={16} height={16} className="inline-block" />
        </p>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Shield className="w-3 h-3" />
            No uploads &middot; No tracking
          </span>
        </div>
      </div>
    </footer>
  );
}
