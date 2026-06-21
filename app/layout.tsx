import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocForge — batch document generator",
  description:
    "Upload a class list, pick a template, and generate a PDF for every student.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
