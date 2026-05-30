'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BaseLayout from '@/components/BaseLayout';
import CircularProgress from '@/components/CircularProgress';

interface Livro {
  id: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [nome, setNome] = useState('Usuário');
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) { router.push('/login'); return; }
      const me = await meRes.json();
      setNome(me.nome || 'Usuário');

      const livrosRes = await fetch('/api/livros');
      if (livrosRes.ok) {
        const data = await livrosRes.json();
        setLivros(data);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const total = livros.length;
  const lidos = livros.filter((l) => l.status === 'lido').length;
  const percent = total > 0 ? Math.round((lidos / total) * 100) : 0;

  const mensagem = () => {
    if (percent === 100 && total > 0) return 'Parabéns! Você concluiu todos os livros!';
    if (percent >= 75) return 'Quase lá! Continue assim!';
    if (percent >= 50) return 'Você está na metade do caminho!';
    if (percent > 0) return 'Continue lendo e cumprindo suas metas!';
    return 'Adicione livros e comece sua jornada!';
  };

  return (
    <BaseLayout>
      <div style={styles.page}>
        <h2 style={styles.welcome}>
          Bem vindo(a), {nome}
        </h2>
        <p style={styles.subtitle}>Sua meta de leitura atual:</p>

        {loading ? (
          <div style={styles.loadingRing} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
            <CircularProgress percent={percent} size={220} stroke={22} />
          </div>
        )}

        <p style={styles.message}>{mensagem()}</p>

        {/* Stats strip */}
        {!loading && total > 0 && (
          <div style={styles.stats}>
            <div style={styles.stat}>
              <span style={styles.statNum}>{total}</span>
              <span style={styles.statLabel}>Total</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNum}>{lidos}</span>
              <span style={styles.statLabel}>Lidos</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNum}>{livros.filter((l) => l.status === 'lendo').length}</span>
              <span style={styles.statLabel}>Lendo</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNum}>{livros.filter((l) => l.status === 'quero_ler').length}</span>
              <span style={styles.statLabel}>Quero ler</span>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '32px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 'calc(100vh - 60px - 64px)',
  },
  welcome: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--brand)',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: 'var(--text-brand)',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  loadingRing: {
    width: 220,
    height: 220,
    borderRadius: '50%',
    border: '22px solid var(--brand-light)',
    margin: '12px 0',
    animation: 'spin 1.2s linear infinite',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginTop: 28,
    width: '100%',
  },
  stat: {
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    padding: '12px 4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 20,
    color: 'var(--brand)',
  },
  statLabel: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
};