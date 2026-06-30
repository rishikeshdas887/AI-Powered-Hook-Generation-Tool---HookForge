import './globals.css';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor: '#f59e0b',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://hookforge.app'),
  title: 'HookForge - AI-Powered Viral Hook Generator',
  description: 'Generate scroll-stopping hooks for your social media content. HookForge uses AI to craft compelling hooks that capture attention and drive engagement.',
  keywords: ['AI', 'hooks', 'social media', 'TikTok', 'Instagram', 'YouTube', 'viral', 'content creation'],
  authors: [{ name: 'HookForge' }],
  creator: 'HookForge',
  publisher: 'HookForge',
  formatDetection: {
    email: false,
    telephone: false,
    url: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'HookForge - AI-Powered Viral Hook Generator',
    description: 'Generate scroll-stopping hooks for your social media content for free.',
    type: 'website',
    locale: 'en_US',
    url: 'https://hookforge.app',
    siteName: 'HookForge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HookForge - AI-Powered Viral Hook Generator',
    description: 'Generate scroll-stopping hooks for your social media content for free.',
  },
  icons: {
    icon: '/icons/icon.svg',
    shortcut: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
