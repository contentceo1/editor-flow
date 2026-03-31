import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EditorFlow — Client Dashboard",
  description: "Manage your video editing projects and keep clients in the loop.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
