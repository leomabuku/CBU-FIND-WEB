import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CBU FIND — Campus Lost & Found",
  description: "Report, discover, and return lost property across Copperbelt University.",
  icons: {
    icon: "/cbu-find-logo.png",
    shortcut: "/cbu-find-logo.png",
  },
  openGraph: {
    title: "CBU FIND — Campus Lost & Found",
    description: "One campus. Fewer lost things.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CBU FIND — Campus Lost & Found",
    description: "One campus. Fewer lost things.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
