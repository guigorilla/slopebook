import "@slopebook/skimatch/styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SkiMatch — Your mountain. Your instructor.",
  description: "Conversational ski lesson booking and instructor matching.",
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
