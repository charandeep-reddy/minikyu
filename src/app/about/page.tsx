import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">
      <section className="text-center space-y-4">
        <Image
          src="/minikyu.webp"
          alt="Minikyu"
          width={64}
          height={64}
          className="mx-auto"
        />
        <h1 className="text-3xl font-bold tracking-tight">About Minikyu</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          A tiny ghost that shrinks your images — fast, free, and private.
        </p>
      </section>

      <Separator />

      <section className="space-y-6 text-sm leading-relaxed text-foreground/80">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">The Mascot</h2>
          <p>
            Meet Minikyu. Nobody knows where it came from. One day it just
            appeared — small, slightly suspicious, and holding your images like
            it owned them. 👻
          </p>
          <p>
            Minikyu has one obsession: making files smaller. Feed it a bloated
            8MB photo and it'll shrink it, convert it, flip it, resize it — all
            while looking way too pleased with itself.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">The Mission</h2>
          <p>
            Everything happens in your browser. Your images never leave your
            device. No servers, no uploads, no tracking. No sign-ups, no limits,
            no nonsense.
          </p>
          <p>
            I built this because every other image tool wants your files on
            their server. I didn't think that was necessary. Your photos are
            yours.
          </p>
        </div>
      </section>

      <Separator />

      <section className="space-y-4 text-sm leading-relaxed text-foreground/80">
        <h2 className="text-lg font-semibold text-foreground">
          Made by Psydevx
        </h2>
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
