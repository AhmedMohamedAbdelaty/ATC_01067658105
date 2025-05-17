import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Event Booking System',
    description: 'Book your favorite events with ease',
    generator: 'v0.dev',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <AuthProvider>
                        <div className="flex min-h-screen flex-col">
                            <Navbar />
                            <main className="flex-1">{children}</main>
                            <Footer />
                            <Toaster />
                        </div>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
