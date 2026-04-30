import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { ToastProvider } from '@/components/ui/toast';
import BackToTop from './components/BackToTop';
import VisitTracker from './components/VisitTracker.client';
import Providers from './components/Providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata = {
  title: "Fakultas Komputer Ma'soem University",
  description: "Website Resmi Fakultas Komputer Ma'soem University",
  metadataBase: new URL('https://pmb.masoemuniversity.com'),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          <ToastProvider>
            <VisitTracker />
            {children}
            <BackToTop />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}