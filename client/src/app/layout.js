import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "VoiceApp — Peer-to-Peer Voice Calling",
  description: "Make secure peer-to-peer voice calls right from your browser. Private, encrypted, and email-free calling experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
