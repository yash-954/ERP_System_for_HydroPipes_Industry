import React from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import './styles/auth.css';
import './styles/users.css';
import './styles/user-forms.css';
import './styles/dashboard.css';
import type { Metadata } from 'next';
import { AuthProvider } from './lib/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ERP-IITR System',
  description: 'Enterprise Resource Planning System for Indian Industries',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <main>{children}</main>
          <footer>
            <p>ERP-IITR © {new Date().getFullYear()}</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
} 