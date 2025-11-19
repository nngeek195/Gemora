// app/layout.tsx
import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Gemora',
  description: 'Predict gem category and suggest cuts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
