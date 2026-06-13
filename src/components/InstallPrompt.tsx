'use client';
import { useState } from 'react';

export default function InstallPrompt() {
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    return isIOS && !isStandalone;
  });

  const [dismissed, setDismissed] = useState(false);

  // Não mostra se não for iOS/já instalado, ou se o usuário dispensou
  if (!show || dismissed) return null;

  return (
    <div style={styles.wrapper}>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Fechar"
        style={styles.closeBtn}
      >
        ×
      </button>

      <div style={styles.iconWrap}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4M12 16l-4-4M12 16l4-4" />
          <path d="M20 16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3" />
        </svg>
      </div>

      <p style={styles.text}>
        Instale o <strong>ReadNext</strong> na sua tela de início: toque em{' '}
        <span role="img" aria-label="ícone de compartilhar" style={styles.icon}>⎋</span>{' '}
        e depois em <strong>&quot;Adicionar à Tela de Início&quot;</strong>{' '}
        <span role="img" aria-label="ícone de adicionar" style={styles.icon}>➕</span>.
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    bottom: 'calc(var(--nav-height) + 12px)',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)',
    maxWidth: 398,
    background: 'var(--bg-card)',
    border: '1.5px solid var(--brand)',
    borderRadius: 'var(--radius)',
    padding: '14px 36px 14px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    zIndex: 60,
  },
  iconWrap: {
    flexShrink: 0,
    marginTop: 1,
  },
  text: {
    fontSize: 13,
    lineHeight: 1.5,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
  },
  icon: {
    fontStyle: 'normal',
  },
  closeBtn: {
    position: 'absolute',
    top: 6,
    right: 8,
    background: 'none',
    border: 'none',
    fontSize: 20,
    lineHeight: 1,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 4,
  },
};