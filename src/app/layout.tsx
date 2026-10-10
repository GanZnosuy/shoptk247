import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'SHOP ACC 24/7 - Mua Bán Tài Khoản AI, Netflix, Canva, Adobe, Windows Key & Proxy Tự Động',
  description: 'Hệ thống bán tài khoản số tự động 24/7: Google AI Pro, ChatGPT Plus, Netflix 4K, Spotify, Canva Pro, Adobe CC, Key Windows 10/11, Office 365, Proxy IPv4, API Keys. Thanh toán VietQR xuất tài khoản ngay trong 5s.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased selection:bg-blue-500 selection:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
