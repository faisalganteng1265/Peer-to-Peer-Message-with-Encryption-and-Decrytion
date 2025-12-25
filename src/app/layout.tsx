import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "P2P Messaging App",
  description: "Secure peer-to-peer messaging application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
