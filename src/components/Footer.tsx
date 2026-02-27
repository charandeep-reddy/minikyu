import { Separator } from "@/components/ui/separator";
import Image from "next/image";


export default function Footer() {
  return (
    <footer className="mt-auto">
      <Separator />
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground">
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
          <Image src="/mimikyu.webp" alt="Minikyu" width={16} height={16} className="inline-block" />
        </p>
        <p className="text-xs text-muted-foreground/50">
          All processing happens in your browser. No uploads. No tracking.
        </p>
      </div>
    </footer>
  );
}
