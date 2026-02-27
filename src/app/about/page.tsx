import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">
      <section className="text-center space-y-4">
        <Image src="/minikyu.png" alt="Minikyu" width={64} height={64} className="mx-auto" />
        <h1 className="text-3xl font-bold tracking-tight">About Minikyu</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          A tiny ghost that shrinks your images — fast, free, and private.
        </p>
      </section>

      <Separator />

      <section className="space-y-4 text-sm leading-relaxed text-foreground/80">
        <h2 className="text-lg font-semibold text-foreground">The Story</h2>
        <p>
          Minikyu was born from a simple frustration: why do image compression tools
          need to upload your files to a server? Your photos, screenshots, and artwork
          should stay on <em>your</em> device.
        </p>
        <p>
          So we built Minikyu — a fully client-side image tool that compresses, converts,
          resizes your images right in the browser. Nothing leaves
          your machine. No sign-ups, no limits, no tracking.
        </p>
        <p>
          The name? Minikyu (ミニキュウ) is a play on &ldquo;mini&rdquo; and the Japanese
          word for &ldquo;cute&rdquo; — because making files smaller should feel delightful,
          not dreadful. And like its ghost mascot, it works invisibly behind the scenes. 👻
        </p>
      </section>

      <Separator />

      <section className="space-y-4 text-sm leading-relaxed text-foreground/80">
        <h2 className="text-lg font-semibold text-foreground">Made by Psydevx</h2>
        <p>
          Minikyu is a{" "}
          <a
            href="https://psydevx.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline underline-offset-2"
          >
            Psydevx
          </a>{" "}
          project — we build tools that respect your privacy and just work.
        </p>
      </section>

      <div className="text-center pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline underline-offset-2"
        >
          ← Back to Minikyu
        </Link>
      </div>
    </div>
  );
}
