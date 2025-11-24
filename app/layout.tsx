import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Plausible } from "@/components/Plausible";

export const metadata: Metadata = {
  metadataBase: new URL("https://splitter.noah.zone"),
  title: "Splitter",
  description: "Split bills with ease",
  applicationName: "Splitter",
  icons: [
    {
      url: "/images/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      url: "/images/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
  openGraph: {
    type: "website",
    url: "https://splitter.noah.zone",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        {children}

        <Plausible />
      </body>
    </html>
  );
}
