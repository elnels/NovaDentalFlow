/*
 * DentalFlow - Sistema de Gestión Dental
 * Desarrollado por BillCodex - https://www.billcodex.com/
 * Copyright © 2024-${new Date().getFullYear()} BillCodex. Todos los derechos reservados.
 */

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'DentalFlow',
  description: 'Sistema de Gestión de Pacientes y Citas Dentales',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased min-h-screen bg-background flex flex-col')}>
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer con derechos de autor en todas las páginas */}
        <footer className="mt-auto py-4 text-center text-sm text-muted-foreground border-t bg-white/50">
          <p>
            Desarrollado por{" "}
            <a 
              href="https://www.billcodex.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline transition-colors font-medium"
            >
              BillCodex
            </a>
            {" "}© {new Date().getFullYear()}
          </p>
        </footer>
        
        <Toaster />
      </body>
    </html>
  );
}
