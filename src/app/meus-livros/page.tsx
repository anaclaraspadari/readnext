/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BaseLayout from '@/components/BaseLayout';

interface Livro {
  id: string;
  titulo: string;
  autores: string[];
  capa_url?: string;
  status: string;
  avaliacao?: number;
}

const STATUS_LABELS: Record<string, string> = {
  quero_ler: 'Quero ler',
  lendo: 'Lendo',
  lido: 'Lido',
  abandonado: 'Abandonado',
};

const STATUS_OPTIONS = ['quero_ler', 'lendo', 'lido', 'abandonado'];

export default function MeusLivrosPage() {
  const router = useRouter();
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [modalLivro, setModalLivro] = useState<Livro | null>(null);
  const [novoStatus, setNovoStatus] = useState('');
  const [estrelas, setEstrelas] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);

  // 1. Decalaring load with useCallback BEFORE useEffect to prevent hoisting errors 
  // and avoid infinite re-renders if added to the dependency array.
  const load = useCallback(async () => {
    const meRes = await fetch('/api/auth/me');
    if (!meRes.ok) { 
      router.push('/login'); 
      return; 
    }
    const res = await fetch('/api/livros');
    if (res.ok) setLivros(await res.json());
    setLoading(false);
  }, [router]);

  // 2. useEffect now safely calls load
  useEffect(() => {
    load();
  }, [load]);

  async function confirmarStatus() {
    if (!modalLivro) return;
    await fetch('/api/livros', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        livro_id: modalLivro.id, 
        status: novoStatus,
        avaliacao: estrelas // Bugfix: Sending the stars to the API
      }),
    });
    setModalLivro(null);
    setEstrelas(0);
    load();
  }

  const categorias = [
    { val: 'todos', label: 'Todas as categorias' },
    { val: 'lendo', label: 'Lendo' },
    { val: 'quero_ler', label: 'Quero ler' },
    { val: 'lido', label: 'Lido' },
    { val: 'abandonado', label: 'Abandonado' },
  ];

  const livrosFiltrados = filtro === 'todos' ? livros : livros.filter((l) => l.status === filtro);

  return (
    <BaseLayout>
      <div style={styles.page}>
        <h2 style={styles.title}>Lista de livros</h2>

        {/* Filter */}
        <div style={styles.filterWrap}>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={styles.select}
          >
            {categorias.map((c) => (
              <option key={c.val} value={c.val}>{c.label}</option>
            ))}
          </select>
        </div>

        {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 40 }}>Carregando...</p>}

        {!loading && livrosFiltrados.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 40 }}>
            Nenhum livro encontrado. Que tal adicionar um?
          </p>
        )}

        <div style={styles.list}>
          {livrosFiltrados.map((livro) => (
            <div key={livro.id} style={styles.card}>
              <div style={styles.cover}>
                {livro.capa_url ? (
                  <img src={livro.capa_url} alt={livro.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--brand)', textAlign: 'center', padding: 4 }}>Capa do livro</span>
                )}
              </div>
              <div style={styles.info}>
                <p style={styles.bookTitle}>{livro.titulo}</p>
                <p style={styles.author}>{livro.autores?.join(', ') || 'Autor'}</p>
              </div>
              <div style={styles.statusCol}>
                <p style={styles.statusText}>
                  <strong>Status: </strong>{STATUS_LABELS[livro.status] || livro.status}
                </p>
                <button
                  style={styles.alterarBtn}
                  onClick={() => {
                    setModalLivro(livro);
                    setNovoStatus(livro.status);
                    setEstrelas(livro.avaliacao || 0);
                  }}
                >
                  Alterar status
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal / Alert */}
      {modalLivro && (
        <>
          <div
            onClick={() => setModalLivro(null)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 200,
            }}
          />
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={styles.modalCover}>
                {modalLivro.capa_url
                  ? <img src={modalLivro.capa_url} alt={modalLivro.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                  : <span style={{ fontSize: 11, color: 'var(--brand)' }}>Capa</span>}
              </div>
              <div>
                <p style={styles.modalTitle}>{modalLivro.titulo}</p>
                <p style={styles.modalAuthor}>{modalLivro.autores?.join(', ')}</p>
                <p style={{ fontSize: 13, color: 'var(--brand)', marginTop: 12, fontWeight: 600 }}>Alterar status:</p>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value)}
                  style={styles.modalSelect}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>

            <p style={{ fontSize: 14, color: 'var(--brand)', textAlign: 'center', margin: '16px 0 8px', fontWeight: 600 }}>
              Quantas estrelas esse livro merece?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onMouseEnter={() => setHoverStar(n)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => setEstrelas(n)}
                  aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, color: n <= (hoverStar || estrelas) ? 'var(--brand)' : '#d6d3d1' }}
                >
                  ★
                </button>
              ))}
            </div>

            <button onClick={confirmarStatus} style={styles.confirmarBtn}>Confirmar</button>
          </div>
        </>
      )}
    </BaseLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px 16px', maxWidth: 430, margin: '0 auto' },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 22,
    color: 'var(--brand)',
    textAlign: 'center',
    marginBottom: 16,
  },
  filterWrap: { marginBottom: 16 },
  select: {
    width: '100%',
    border: '1.5px solid var(--brand)',
    borderRadius: 20,
    padding: '8px 16px',
    fontSize: 14,
    color: 'var(--text-secondary)',
    background: 'transparent',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23b45309' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: 36,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 0 },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderTop: '1px solid var(--border)',
    padding: '16px 0',
  },
  cover: {
    width: 64,
    height: 88,
    minWidth: 64,
    background: '#e7e5e4',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  info: { flex: 1, minWidth: 0 },
  bookTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--brand)',
    marginBottom: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  author: { fontSize: 12, color: 'var(--text-secondary)' },
  statusCol: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 120 },
  statusText: { fontSize: 12, color: 'var(--text-primary)', textAlign: 'right' },
  alterarBtn: {
    background: 'var(--brand)',
    color: '#fff',
    border: 'none',
    borderRadius: 20,
    padding: '6px 12px',
    fontSize: 12,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius)',
    zIndex: 201,
    padding: 24,
    width: 'min(90vw, 380px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
  },
  modalHeader: { display: 'flex', gap: 16, marginBottom: 8 },
  modalCover: {
    width: 80,
    height: 110,
    minWidth: 80,
    background: '#e7e5e4',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  modalTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 18,
    color: 'var(--brand)',
  },
  modalAuthor: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 },
  modalSelect: {
    border: '1.5px solid var(--brand)',
    borderRadius: 20,
    padding: '6px 12px',
    fontSize: 13,
    color: 'var(--text-primary)',
    background: 'transparent',
    outline: 'none',
    marginTop: 4,
    cursor: 'pointer',
    minWidth: 140,
  },
  confirmarBtn: {
    width: '100%',
    background: 'var(--brand)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-btn)',
    padding: '12px',
    fontSize: 16,
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    cursor: 'pointer',
  },
};