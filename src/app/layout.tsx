import type { Metadata } from 'next';
import './globals.css';
 
export const metadata: Metadata = {
  title: 'ReadNext',
  description: 'Gerencie sua pilha de leitura!',
  icons: {
    icon: '/web-app-manifest-192x192.png',
  },
};
 
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
