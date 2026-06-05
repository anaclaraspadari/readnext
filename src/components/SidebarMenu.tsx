'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarMenu({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<{ nome: string; email: string; foto_url?: string | null } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/auth/me')
        .then((r) => r.json())
        .then((data) => {
          if (data.nome) setUser(data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 100,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          background: 'var(--bg-card)',
          zIndex: 101,
          padding: '24px 24px 32px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          borderRadius: '0 0 var(--radius) var(--radius)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: 28,
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          ×
        </button>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '2.5px solid var(--brand)',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--brand-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {user?.foto_url ? (
            <img
              src={user.foto_url}
              alt={user.nome}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-brand)' }}>
              {user?.nome || 'Usuário'}
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{user?.email || 'usuario@email.com'}</p>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--brand)', opacity: 0.25, marginBottom: 24 }} />

        {/* Menu items */}
        {[
          { label: 'Alterar dados', href: '/profile' },
          { label: 'Ajuda', href: '#' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => { onClose(); if (item.href !== '#') router.push(item.href); }}
            style={{
              display: 'block',
              width: '100%',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              padding: '14px 0',
              textAlign: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 17,
              color: 'var(--text-brand)',
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
        <button
          onClick={handleLogout}
          style={{
            display: 'block',
            width: '100%',
            background: 'none',
            border: 'none',
            borderBottom: '1px solid var(--border)',
            padding: '14px 0',
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 17,
            color: 'var(--text-brand)',
            cursor: 'pointer',
          }}
        >
          Sair
        </button>
      </div>
    </>
  );
}