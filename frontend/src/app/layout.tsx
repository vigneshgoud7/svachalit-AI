import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoBot Dashboard',
  description: 'Live multi-channel AI automation dashboard'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
