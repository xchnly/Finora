import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finora - Smart Money Management",
  description: "Kelola keuangan pribadi dengan AI, budgeting otomatis, dan insights pintar.",
  
  // Ikon untuk browser tab
  icons: {
    icon: [
      // Favicon standar
      { 
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💰</text></svg>",
        type: "image/svg+xml"
      },
      // Fallback PNG
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%233b82f6'/><text x='50' y='68' text-anchor='middle' font-size='50' fill='white'>F</text></svg>",
        type: "image/svg+xml"
      }
    ],
    apple: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%233b82f6'/><text x='50' y='68' text-anchor='middle' font-size='50' fill='white'>F</text></svg>",
        sizes: "180x180",
        type: "image/svg+xml"
      }
    ],
    shortcut: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%233b82f6'/><text x='50' y='68' text-anchor='middle' font-size='50' fill='white'>F</text></svg>",
        type: "image/svg+xml"
      }
    ]
  },
  
  // Metadata tambahan untuk SEO
  keywords: ["keuangan", "budget", "fintech", "uang", "investasi", "tabungan", "financial planning"],
  authors: [{ name: "Finora Team" }],
  creator: "Finora",
  publisher: "Finora",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.className}>
      <head>
        {/* Mobile viewport optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#3B82F6" />
        
        {/* Apple meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Finora" />
        
        {/* Microsoft meta tags */}
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Safari pinned tab icon */}
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3b82f6" />
      </head>
      <body className="antialiased">
        {children}
        
        {/* Global Toast */}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              color: '#1f2937',
              border: '1px solid #e5e7eb',
            },
          }}
        />
        
        {/* Simple icon alternatives jika mau pakai emoji atau custom SVG */}
        <style jsx global>{`
          /* Fallback untuk favicon */
          .favicon-fallback::before {
            content: "💰";
            font-size: 1.5em;
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
      </body>
    </html>
  );
}