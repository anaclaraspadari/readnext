'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BaseLayout from '@/components/BaseLayout';

interface Livro {
  id: string;
  title: string;
  author_name: string[];
  first_publish_year: string;
  cover_url?: string;
  language: string;
  ja_adicionado: boolean;
}

const SEARCH_TYPES = [
  { val: 'title', label: 'Título' },
  { val: 'author', label: 'Autor' },
];

const STATUS_OPTIONS = [
  { val: 'quero_ler', label: 'Quero ler' },
  { val: 'lendo',     label: 'Lendo' },
  { val: 'lido',      label: 'Lido' },
  { val: 'abandonado',label: 'Abandonado' },
];

export default function LivrosPage() {
  const router = useRouter();
  const [query, setQuery]           = useState('');
  const [searchType, setSearchType] = useState('title');
  const [resultados, setResultados] = useState<Livro[]>([]);
  const [loading, setLoading]       = useState(false);
  const [erro, setErro]             = useState('');
  const [livroMenu, setLivroMenu]   = useState<Livro | null>(null);
  const [adicionando, setAdicionando] = useState<string | null>(null);
  const [toast, setToast]           = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const buscar = useCallback(async () => {
    if (!query.trim()) return;
    setErro('');
    setLoading(true);
    setLivroMenu(null);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&searchType=${searchType}`
      );
      if (!res.ok) {
        const data = await res.json();
        setErro(data.error || 'Erro na busca.');
        setResultados([]);
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        setErro('Nenhum resultado encontrado.');
        setResultados([]);
        return;
      }
      setResultados(data);
      if (data.length === 0) setErro('Nenhum livro encontrado para essa busca.');
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [query, searchType]);

  async function adicionarComStatus(livro: Livro, status: string) {
    setLivroMenu(null);
    setAdicionando(livro.id);
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) { router.push('/login'); return; }

      const res = await fetch('/api/livros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_book_id: livro.id,
          titulo:   livro.title,
          autores:  livro.author_name,
          capa_url: livro.cover_url,
          status,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        showToast('Este livro já está na sua estante.');
      } else if (res.status === 403) {
        showToast(data.message || 'Limite de livros atingido!');
      } else if (!res.ok) {
        showToast(data.error || 'Erro ao adicionar livro.');
      } else {
        const label = STATUS_OPTIONS.find((s) => s.val === status)?.label || status;
        showToast(`"${livro.title}" adicionado como ${label}!`);
        setResultados((prev) =>
          prev.map((l) => (l.id === livro.id ? { ...l, ja_adicionado: true } : l))
        );
      }
    } catch {
      showToast('Erro de conexão.');
    } finally {
      setAdicionando(null);
    }
  }

  return (
    <BaseLayout>
      <div style={styles.page}>
        <h2 style={styles.title}>Adicionar novos livros</h2>

        {/* Search bar */}
        <div style={styles.searchRow}>
          <input
            type="text"
            placeholder="Pesquisar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscar()}
            style={styles.searchInput}
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            style={styles.typeSelect}
          >
            {SEARCH_TYPES.map((t) => (
              <option key={t.val} value={t.val}>{t.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={buscar}
          disabled={loading || !query.trim()}
          style={{ ...styles.searchBtn, opacity: loading || !query.trim() ? 0.6 : 1 }}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>

        {erro && <p style={styles.erro}>{erro}</p>}

        {/* Results grid — sem overflow:hidden nos cards */}
        {resultados.length > 0 && (
          <div style={styles.grid}>
            {resultados.map((livro) => (
              <div key={livro.id} style={styles.card}>
                {/* Cover */}
                <div style={styles.cover}>
                  {livro.cover_url ? (
                    <img
                      src={livro.cover_url}
                      alt={livro.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                    />
                  ) : (
                    <div style={styles.coverPlaceholder}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                  )}
                  {livro.ja_adicionado && (
                    <div style={styles.addedBadge}>✓</div>
                  )}
                </div>

                {/* Footer */}
                <div style={styles.cardFooter}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.bookTitle} title={livro.title}>{livro.title}</p>
                    <p style={styles.author}>{livro.author_name?.[0] || 'Autor desconhecido'}</p>
                  </div>

                  {/* Three-dot button — abre bottom sheet */}
                  <button
                    onClick={() => setLivroMenu(livro)}
                    aria-label="Opções"
                    style={styles.menuDotBtn}
                    disabled={adicionando === livro.id}
                  >
                    {adicionando === livro.id ? (
                      <span style={{ fontSize: 10, color: 'var(--brand)' }}>...</span>
                    ) : (
                      [0, 1, 2].map((i) => (
                        <span
                          key={i}
                          style={{ display: 'block', width: 4, height: 4, borderRadius: '50%', background: 'var(--brand)' }}
                        />
                      ))
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && resultados.length === 0 && !erro && (
          <div style={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
              Pesquise um livro para adicioná-lo à sua estante
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom Sheet de status ── */}
      {livroMenu && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setLivroMenu(null)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 400,
            }}
          />

          {/* Sheet */}
          <div style={styles.sheet}>
            {/* Handle */}
            <div style={styles.sheetHandle} />

            {/* Book preview */}
            <div style={styles.sheetPreview}>
              {livroMenu.cover_url ? (
                <img
                  src={livroMenu.cover_url}
                  alt={livroMenu.title}
                  style={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 44, height: 60, background: '#e7e5e4', borderRadius: 4, flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--brand)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {livroMenu.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {livroMenu.author_name?.[0]}
                </p>
              </div>
            </div>

            <p style={styles.sheetLabel}>
              {livroMenu.ja_adicionado ? 'Já na estante — adicionar novamente?' : 'Adicionar à estante como:'}
            </p>

            {/* Status options */}
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.val}
                onClick={() => adicionarComStatus(livroMenu, opt.val)}
                style={styles.sheetOption}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brand-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={styles.sheetOptionDot} />
                {opt.label}
              </button>
            ))}

            <button
              onClick={() => setLivroMenu(null)}
              style={styles.sheetCancel}
            >
              Cancelar
            </button>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={styles.toast}>{toast}</div>
      )}
    </BaseLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px 16px', maxWidth: 430, margin: '0 auto' },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 20,
    color: 'var(--brand)',
    marginBottom: 20,
  },
  searchRow: { display: 'flex', gap: 8, marginBottom: 12 },
  searchInput: {
    flex: 1,
    border: '1.5px solid var(--brand)',
    borderRadius: 20,
    padding: '9px 16px',
    fontSize: 14,
    outline: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
  },
  typeSelect: {
    border: '1.5px solid var(--brand)',
    borderRadius: 20,
    padding: '9px 28px 9px 14px',
    fontSize: 14,
    color: 'var(--text-brand)',
    background: 'transparent',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23b45309' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    fontFamily: 'var(--font-body)',
  },
  searchBtn: {
    width: '100%',
    background: 'var(--brand)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-btn)',
    padding: '11px',
    fontSize: 15,
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 20,
    transition: 'opacity 0.15s',
  },
  erro: { color: '#dc2626', fontSize: 13, textAlign: 'center' as const, marginBottom: 16 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 16,
  },
  card: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    /* SEM overflow:hidden — era isso que cortava o dropdown */
    display: 'flex',
    flexDirection: 'column' as const,
  },
  cover: {
    width: '100%',
    aspectRatio: '2/3',
    background: '#e7e5e4',
    borderRadius: '12px 12px 0 0',
    position: 'relative' as const,
    overflow: 'hidden',    /* apenas na capa, não no card inteiro */
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addedBadge: {
    position: 'absolute' as const,
    top: 8, right: 8,
    background: 'var(--brand)',
    color: '#fff',
    borderRadius: '50%',
    width: 24, height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
  },
  cardFooter: {
    padding: '10px 8px 10px 12px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
  },
  bookTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 13,
    color: 'var(--brand)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    marginBottom: 2,
  },
  author: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  menuDotBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 3,
    padding: '4px 2px',
    alignItems: 'center',
    flexShrink: 0,
  },

  /* Bottom sheet */
  sheet: {
    position: 'fixed' as const,
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 430,
    background: 'var(--bg-card)',
    borderRadius: '20px 20px 0 0',
    zIndex: 401,
    padding: '12px 0 32px',
    boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
  },
  sheetHandle: {
    width: 40, height: 4,
    background: 'var(--border)',
    borderRadius: 4,
    margin: '0 auto 20px',
  },
  sheetPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 24px 16px',
    borderBottom: '1px solid var(--border)',
    marginBottom: 8,
  },
  sheetLabel: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    padding: '8px 24px 4px',
    fontStyle: 'italic',
  },
  sheetOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: '14px 24px',
    fontSize: 16,
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    color: 'var(--brand)',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'background 0.12s',
  },
  sheetOptionDot: {
    display: 'block',
    width: 10, height: 10,
    borderRadius: '50%',
    background: 'var(--brand)',
    flexShrink: 0,
  },
  sheetCancel: {
    display: 'block',
    width: 'calc(100% - 48px)',
    margin: '12px 24px 0',
    background: 'none',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-btn)',
    padding: '12px',
    fontSize: 15,
    fontFamily: 'var(--font-body)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },

  /* Toast */
  toast: {
    position: 'fixed' as const,
    bottom: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--brand-dark)',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 'var(--radius-btn)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    zIndex: 500,
    maxWidth: '90vw',
    textAlign: 'center' as const,
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 16px',
  },
};