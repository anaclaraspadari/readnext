'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import SidebarMenu from './SidebarMenu';
import InstallPrompt from './InstallPrompt';

interface Props {
  children: React.ReactNode;
}

export default function BaseLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      href: '/livros',
      label: 'Buscar',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      ),
    },
    {
      href: '/dashboard',
      label: 'Início',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: '/meus-livros',
      label: 'Meus Livros',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', maxWidth: 430, margin: '0 auto', position: 'relative' }}>
      {/* Header */}
      <header style={{
        height: 'var(--header-height)',
        background: 'var(--brand)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', flexDirection: 'column', gap: 5, padding: 4 }}
        >
          <span style={{ display: 'block', width: 22, height: 2.5, background: '#fff', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2.5, background: '#fff', borderRadius: 2 }} />
          <span style={{ display: 'block', width: 22, height: 2.5, background: '#fff', borderRadius: 2 }} />
        </button>
        <span style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
          ReadNext
        </span>
        <div style={{ width: 30 }} />
      </header>

      {/* Sidebar */}
      <SidebarMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content */}
      <main style={{ flex: 1, paddingBottom: 'calc(var(--nav-height) + 8px)', overflowY: 'auto' }}>
        {children}
      </main>

      {/* Bottom Nav */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        height: 'var(--nav-height)',
        background: 'var(--brand)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
      }}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              aria-label={item.label}
              style={{
                background: active ? '#fde68a33' : 'none',
                border: 'none',
                cursor: 'pointer',
                color: active ? 'var(--brand-light)' : '#ffffffcc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '10px 24px',
                borderRadius: 'var(--radius-sm)',
                flex: 1,
                transition: 'color 0.15s',
              }}
            >
              {item.icon}
            </button>
          );
        })}
      </nav>

      <InstallPrompt />
    </div>
  );
}