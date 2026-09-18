import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budget Line",
  description: "Ask what government has budgeted where you live. Every figure cited to its page.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
