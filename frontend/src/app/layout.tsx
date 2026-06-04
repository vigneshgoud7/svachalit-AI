<<<<<<< HEAD
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
=======
import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Svachalit | Premium Business Automation Console',
  description: 'Automate customer messaging channels (WhatsApp, Instagram, Facebook, Voice) with secure, human-centric business memory and live agent handoff.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
      </body>
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
    </html>
  );
}
