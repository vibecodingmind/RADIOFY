import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radiofy — AetherCast Broadcast OS",
  description: "Next-Generation Mission-Critical Internet Radio Hosting Platform",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Radiofy" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface min-h-screen selection:bg-primary-container selection:text-on-primary-container">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));}`,
          }}
        />
      </body>
    </html>
  );
}
