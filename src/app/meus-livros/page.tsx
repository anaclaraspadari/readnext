'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BaseLayout from '@/components/BaseLayout';

interface Livro {
  id: string;
  titulo: string;
  autores: string[];
  capa_url?: string;
  status: string;
  avaliacao?: number;
  google_book_id: string;
}

interface DetalhesLivro {
  titulo: string;
  autores: string[];
  capa_url?: string;
  sinopse: string;
  carregando: boolean;
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
  const [livros, setLivros]               = useState<Livro[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filtro, setFiltro]               = useState('todos');

  // Modal de status
  const [modalLivro, setModalLivro]       = useState<Livro | null>(null);
  const [novoStatus, setNovoStatus]       = useState('');
  const [estrelas, setEstrelas]           = useState(0);
  const [hoverStar, setHoverStar]         = useState(0);
  const [salvando, setSalvando]           = useState(false);

  // Modal de detalhes (capa clicada)
  const [detalhes, setDetalhes]           = useState<DetalhesLivro | null>(null);

  // Confirmação de remoção
  const [livroParaRemover, setLivroParaRemover] = useState<Livro | null>(null);
  const [removendo, setRemovendoState]          = useState(false);

  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'info' | 'erro' } | null>(null);

  useEffect(() => { load(); }, []);

  function showToast(msg: string, tipo: 'ok' | 'info' | 'erro' = 'ok') {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  async function load() {
    const meRes = await fetch('/api/auth/me');
    if (!meRes.ok) { router.push('/login'); return; }
    const res = await fetch('/api/livros');
    if (res.ok) setLivros(await res.json());
    setLoading(false);
  }

  // ── Detalhes do livro via Google Books ──────────────────────────────────────
  async function abrirDetalhes(livro: Livro) {
    setDetalhes({
      titulo:     livro.titulo,
      autores:    livro.autores,
      capa_url:   livro.capa_url,
      sinopse:    '',
      carregando: true,
    });

    try {
      const res  = await fetch(
        `https://www.googleapis.com/books/v1/volumes/${livro.google_book_id}`
      );
      const data = await res.json();
      const info = data.volumeInfo ?? {};
      setDetalhes({
        titulo:     info.title    ?? livro.titulo,
        autores:    info.authors  ?? livro.autores,
        capa_url:   info.imageLinks?.thumbnail?.replace('http:', 'https:') ?? livro.capa_url,
        sinopse:    info.description
          ? info.description.replace(/<[^>]*>/g, '') // remove HTML tags
          : 'Sinopse não disponível.',
        carregando: false,
      });
    } catch {
      setDetalhes((prev) => prev
        ? { ...prev, sinopse: 'Não foi possível carregar a sinopse.', carregando: false }
        : null
      );
    }
  }

  // ── Alterar status ──────────────────────────────────────────────────────────
  async function confirmarStatus() {
    if (!modalLivro) return;
    setSalvando(true);
    const marcandoLido = novoStatus === 'lido';
    const boaAvaliacao = estrelas >= 3;

    try {
      const res = await fetch('/api/livros', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          livro_id:  modalLivro.id,
          status:    novoStatus,
          avaliacao: estrelas || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) { showToast(data.error || 'Erro ao salvar.', 'erro'); return; }

      if (marcandoLido && boaAvaliacao && data.continuacoes_adicionadas > 0) {
        const parcial = data.limite_atingido
          ? ` (limite de lista atingido, ${data.continuacoes_adicionadas} adicionado(s))`
          : '';
        showToast(`✨ ${data.continuacoes_adicionadas} continuação(ões) adicionada(s) à sua lista de desejos!${parcial}`, 'info');
      } else if (marcandoLido && boaAvaliacao && data.continuacoes_adicionadas === 0) {
        showToast('Nenhuma continuação encontrada para adicionar.', 'info');
      } else {
        showToast('Status atualizado!', 'ok');
      }

      setModalLivro(null);
      setEstrelas(0);
      load();
    } catch {
      showToast('Erro de conexão.', 'erro');
    } finally {
      setSalvando(false);
    }
  }

  // ── Remover livro ───────────────────────────────────────────────────────────
  async function confirmarRemocao() {
    if (!livroParaRemover) return;
    setRemovendoState(true);
    try {
      const res = await fetch(`/api/livros?livro_id=${livroParaRemover.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Erro ao remover.', 'erro');
        return;
      }
      showToast('Livro removido da estante.', 'ok');
      setLivroParaRemover(null);
      load();
    } catch {
      showToast('Erro de conexão.', 'erro');
    } finally {
      setRemovendoState(false);
    }
  }

  const categorias = [
    { val: 'todos',      label: 'Todas as categorias' },
    { val: 'lendo',      label: 'Lendo' },
    { val: 'lido',       label: 'Lido' },
    { val: 'quero_ler',  label: 'Quero ler' },
    { val: 'abandonado', label: 'Abandonado' },
  ];

  const livrosFiltrados =
    filtro === 'todos' ? livros : livros.filter((l) => l.status === filtro);

  const toastColor: Record<string, string> = {
    ok:   '#16a34a',
    info: 'var(--brand-dark)',
    erro: '#dc2626',
  };

  return (
    <BaseLayout>
      <div style={styles.page}>
        <h2 style={styles.title}>Lista de livros</h2>

        <div style={styles.filterWrap}>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={styles.select}>
            {categorias.map((c) => (
              <option key={c.val} value={c.val}>{c.label}</option>
            ))}
          </select>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 40 }}>
            Carregando...
          </p>
        )}

        {!loading && livrosFiltrados.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 40 }}>
            Nenhum livro encontrado. Que tal adicionar um?
          </p>
        )}

        <div style={styles.list}>
          {livrosFiltrados.map((livro) => (
            <div key={livro.id} style={styles.card}>

              {/* Capa clicável → abre detalhes */}
              <button
                onClick={() => abrirDetalhes(livro)}
                style={styles.coverBtn}
                aria-label={`Ver detalhes de ${livro.titulo}`}
                title="Ver detalhes"
              >
                {livro.capa_url ? (
                  <img
                    src={livro.capa_url}
                    alt={livro.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                  />
                ) : (
                  <span style={{ fontSize: 10, color: 'var(--brand)', textAlign: 'center', padding: 4, lineHeight: 1.3 }}>
                    Capa do livro
                  </span>
                )}
                {/* Hover overlay */}
                <div style={styles.coverOverlay}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
              </button>

              <div style={styles.info}>
                <p style={styles.bookTitle}>{livro.titulo}</p>
                <p style={styles.author}>{livro.autores?.join(', ') || 'Autor'}</p>
                {livro.avaliacao ? (
                  <p style={{ fontSize: 13, color: 'var(--brand)', marginTop: 4 }}>
                    {'★'.repeat(livro.avaliacao)}{'☆'.repeat(5 - livro.avaliacao)}
                  </p>
                ) : null}
              </div>

              <div style={styles.statusCol}>
                <p style={styles.statusText}>
                  <strong>Status: </strong>
                  {STATUS_LABELS[livro.status] || livro.status}
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
                <button
                  style={styles.removerBtn}
                  onClick={() => setLivroParaRemover(livro)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal de detalhes (capa) ── */}
      {detalhes && (
        <>
          <div
            onClick={() => setDetalhes(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }}
          />
          <div style={styles.detalhesModal}>
            <button
              onClick={() => setDetalhes(null)}
              style={styles.fecharBtn}
              aria-label="Fechar"
            >×</button>

            <div style={styles.detalhesHeader}>
              {detalhes.capa_url ? (
                <img
                  src={detalhes.capa_url}
                  alt={detalhes.titulo}
                  style={{ width: 90, height: 130, objectFit: 'cover', borderRadius: 6, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                />
              ) : (
                <div style={{ width: 90, height: 130, background: '#e7e5e4', borderRadius: 6, flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0 }}>
                <p style={styles.detalhesTitulo}>{detalhes.titulo}</p>
                <p style={styles.detalhesAutor}>{detalhes.autores?.join(', ')}</p>
              </div>
            </div>

            <div style={styles.sinopseBox}>
              {detalhes.carregando ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center' }}>
                  Carregando sinopse...
                </p>
              ) : (
                <>
                  <p style={styles.sinopseLabel}>Sinopse</p>
                  <p style={styles.sinopseTexto}>{detalhes.sinopse}</p>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Modal de alterar status ── */}
      {modalLivro && (
        <>
          <div
            onClick={() => !salvando && setModalLivro(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}
          />
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={styles.modalCover}>
                {modalLivro.capa_url
                  ? <img src={modalLivro.capa_url} alt={modalLivro.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                  : <span style={{ fontSize: 11, color: 'var(--brand)' }}>Capa</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.modalTitle}>{modalLivro.titulo}</p>
                <p style={styles.modalAuthor}>{modalLivro.autores?.join(', ')}</p>
                <p style={{ fontSize: 13, color: 'var(--brand)', marginTop: 12, fontWeight: 600 }}>
                  Alterar status:
                </p>
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

            {novoStatus === 'lido' && (
              <div style={styles.autoHint}>
                <span style={{ fontSize: 16 }}>📚</span>
                <span>Com <strong>3+ estrelas</strong>, continuações serão adicionadas automaticamente à sua lista de desejos.</span>
              </div>
            )}

            <p style={{ fontSize: 14, color: 'var(--brand)', textAlign: 'center', margin: '16px 0 8px', fontWeight: 600 }}>
              Quantas estrelas esse livro merece?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onMouseEnter={() => setHoverStar(n)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => setEstrelas(n === estrelas ? 0 : n)}
                  aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, color: n <= (hoverStar || estrelas) ? 'var(--brand)' : '#d6d3d1', transition: 'color 0.1s' }}
                >★</button>
              ))}
            </div>

            <button
              onClick={confirmarStatus}
              disabled={salvando}
              style={{ ...styles.confirmarBtn, opacity: salvando ? 0.7 : 1 }}
            >
              {salvando ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </>
      )}

      {/* ── Confirmação de remoção ── */}
      {livroParaRemover && (
        <>
          <div
            onClick={() => !removendo && setLivroParaRemover(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
          />
          <div style={styles.confirmModal}>
            <p style={styles.confirmTitulo}>Remover livro</p>
            <p style={styles.confirmTexto}>
              Tem certeza que deseja remover{' '}
              <strong style={{ color: 'var(--brand)' }}>{livroParaRemover.titulo}</strong>{' '}
              da sua estante? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setLivroParaRemover(null)}
                disabled={removendo}
                style={styles.cancelarBtn}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRemocao}
                disabled={removendo}
                style={styles.confirmarRemocaoBtn}
              >
                {removendo ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, background: toastColor[toast.tipo] }}>
          {toast.msg}
        </div>
      )}
    </BaseLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:       { padding: '24px 16px', maxWidth: 430, margin: '0 auto' },
  title:      { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--brand)', textAlign: 'center', marginBottom: 16 },
  filterWrap: { marginBottom: 16 },
  select: {
    width: '100%', border: '1.5px solid var(--brand)', borderRadius: 20,
    padding: '8px 36px 8px 16px', fontSize: 14, color: 'var(--text-secondary)',
    background: 'transparent', outline: 'none', cursor: 'pointer', appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23b45309' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 0 },
  card: { display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border)', padding: '16px 0' },

  // Capa clicável
  coverBtn: {
    width: 64, height: 88, minWidth: 64,
    background: '#e7e5e4', borderRadius: 4,
    border: 'none', padding: 0, cursor: 'pointer',
    position: 'relative' as const, overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  coverOverlay: {
    position: 'absolute' as const, inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.15s',
    // O hover é feito via CSS global — adicione ao globals.css:
    // .cover-btn:hover .cover-overlay { opacity: 1; }
    // Como estamos em inline styles, usamos sempre opacity: 0 e trocamos no hover via JS se quiser
  },

  info:       { flex: 1, minWidth: 0 },
  bookTitle:  { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--brand)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  author:     { fontSize: 12, color: 'var(--text-secondary)' },
  statusCol:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 110 },
  statusText: { fontSize: 11, color: 'var(--text-primary)', textAlign: 'right' as const },
  alterarBtn: { background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 20, padding: '5px 10px', fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer', whiteSpace: 'nowrap' as const },
  removerBtn: { background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer', whiteSpace: 'nowrap' as const },

  // Modal de detalhes
  detalhesModal: {
    position: 'fixed' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    background: 'var(--bg-card)', borderRadius: 'var(--radius)', zIndex: 201,
    padding: 24, width: 'min(92vw, 400px)', maxHeight: '80vh',
    boxShadow: '0 8px 40px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' as const, gap: 16,
  },
  fecharBtn: {
    position: 'absolute' as const, top: 12, right: 16,
    background: 'none', border: 'none', fontSize: 26, cursor: 'pointer',
    color: 'var(--text-secondary)', lineHeight: 1,
  },
  detalhesHeader: { display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 8 },
  detalhesTitulo: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--brand)', marginBottom: 4 },
  detalhesAutor:  { fontSize: 13, color: 'var(--text-secondary)' },
  sinopseBox:     { overflowY: 'auto' as const, maxHeight: 260, paddingRight: 4 },
  sinopseLabel:   { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--brand)', marginBottom: 8 },
  sinopseTexto:   { fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 },

  // Modal de status
  modal:       { position: 'fixed' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg-card)', borderRadius: 'var(--radius)', zIndex: 201, padding: 24, width: 'min(90vw, 380px)', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', gap: 16, marginBottom: 8 },
  modalCover:  { width: 80, height: 110, minWidth: 80, background: '#e7e5e4', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  modalTitle:  { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--brand)' },
  modalAuthor: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
  modalSelect: { border: '1.5px solid var(--brand)', borderRadius: 20, padding: '6px 12px', fontSize: 13, color: 'var(--text-primary)', background: 'transparent', outline: 'none', marginTop: 4, cursor: 'pointer', minWidth: 140 },
  autoHint:    { display: 'flex', alignItems: 'flex-start', gap: 8, background: 'var(--brand-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--brand-dark)', margin: '8px 0 0', lineHeight: 1.4 },
  confirmarBtn:{ width: '100%', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-btn)', padding: '12px', fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.15s' },

  // Modal de confirmação de remoção
  confirmModal: {
    position: 'fixed' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    background: 'var(--bg-card)', borderRadius: 'var(--radius)', zIndex: 201,
    padding: 28, width: 'min(90vw, 360px)', boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
  },
  confirmTitulo: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#dc2626', marginBottom: 12 },
  confirmTexto:  { fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 },
  cancelarBtn:   { flex: 1, background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-btn)', padding: '11px', fontSize: 14, fontFamily: 'var(--font-body)', cursor: 'pointer', color: 'var(--text-secondary)' },
  confirmarRemocaoBtn: { flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-btn)', padding: '11px', fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer' },

  toast: {
    position: 'fixed' as const, bottom: 80, left: '50%', transform: 'translateX(-50%)',
    color: '#fff', padding: '12px 24px', borderRadius: 'var(--radius-btn)',
    fontSize: 14, fontFamily: 'var(--font-body)', zIndex: 300,
    maxWidth: '90vw', textAlign: 'center' as const, boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
  },
};