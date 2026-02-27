import Link from "next/link";
import Image from "next/image";


export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/minikyu.png" alt="Minikyu" width={32} height={32} />
          <span className="font-bold text-lg tracking-tight">
            Mini<span className="text-primary">kyu</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
