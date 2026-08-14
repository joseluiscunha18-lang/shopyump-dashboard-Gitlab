import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Painel | Shopyump', template: '%s' },
  description: 'Painel de gestão da tua loja Shopyump.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${spaceGrotesk.variable} ${inter.variable} min-h-screen bg-[#F9F7F5] text-ink selection:bg-brand selection:text-white`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
