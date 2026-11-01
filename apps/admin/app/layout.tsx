import "@slopebook/skimatch/styles.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ski School Manager",
  description: "Daily operations console for ski schools. Local operational prototype.",
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
