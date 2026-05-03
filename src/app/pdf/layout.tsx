import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Compression — Minikyu",
  description:
    "Compress and optimize your PDFs — fast, free, and 100% in your browser. No uploads, no tracking. By Psydevx.",
};

export default function PdfLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
