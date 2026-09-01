import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

/**
 * Self-hosted through next/font rather than a <link> to Google Fonts: it drops
 * a render-blocking third-party request, avoids the flash of fallback text,
 * and keeps the app working on a network that cannot reach Google's CDN.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  weight: ['600', '700'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Ganesha Chaturthi — Committee Accounts',
  description: 'Donations, expenses and receipts for the Ganesha Chaturthi committee.',
};

/** The app is deliberately light-only, so it looks identical on every device
 *  regardless of the viewer's OS appearance setting. */
export const viewport: Viewport = {
  themeColor: '#fcfaf6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
