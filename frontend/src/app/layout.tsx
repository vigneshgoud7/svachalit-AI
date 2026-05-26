import './globals.css';
import React from 'react';

export const metadata = {
  title: 'OmniChannel Hub - Agent Dashboard',
  description: 'AI Orchestrated Unified Live Chat and Automation Console',
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
    </html>
  );
}
