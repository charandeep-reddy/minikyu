import Link from "next/link";
import Image from "next/image";
import { Ghost, Shield, Heart, ArrowLeft, Infinity } from "lucide-react";

const features = [
  { icon: Ghost, label: "In-Browser" },
  { icon: Infinity, label: "Unlimited" },
  { icon: Shield, label: "Private" },
  { icon: Heart, label: "Free" },
];

const sections = [
  {
    icon: Ghost,
    title: "The Mascot",
    paragraphs: [
      "Meet Minikyu. Nobody knows where it came from. One day it just appeared — small, slightly suspicious, and holding your images like it owned them.",
      "Minikyu has one obsession: making files smaller. Feed it a bloated 8MB photo and it'll shrink it, convert it, flip it, resize it — all while looking way too pleased with itself.",
    ],
  },
  {
    icon: Shield,
    title: "The Mission",
    paragraphs: [
      "Everything happens in your browser. Your images never leave your device. No servers, no uploads, no tracking. No sign-ups, no limits, no nonsense.",
      "I built this because every other image tool wants your files on their server. I didn't think that was necessary. Your photos are yours.",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden -top-32">
          <div className="absolute left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <section className="relative text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Image
          src="/minikyu.webp"
          alt="Minikyu"
          width={80}
          height={80}
          className="mx-auto animate-[float_3s_ease-in-out_infinite]"
        />
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            About{" "}
            <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              Minikyu
            </span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            A tiny ghost that shrinks your images — fast, free, and private.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-primary/5 text-primary border border-primary/10 animate-in fade-in zoom-in duration-300 fill-mode-both"
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <Icon className="w-3 h-3" />
                {f.label}
              </span>
            );
          })}
        </div>
      </section>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="space-y-6">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm shadow-sm p-6 sm:p-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
                {section.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </div>
          );
        })}

        <div
          className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm shadow-sm p-6 sm:p-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              Made by Psydevx
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">
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
        </div>
      </div>

      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-350 fill-mode-both">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground px-5 py-2.5 rounded-xl border border-border/20 bg-card/50 hover:bg-card backdrop-blur-sm transition-all duration-150 active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-1" />
          Back to Minikyu
        </Link>
      </div>
    </div>
  );
}
