'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BaseLayout from '@/components/BaseLayout';
import CircularProgress from '@/components/CircularProgress';

interface Livro {
  id: string;
  status: string;
}

// Função pura exportada — facilita teste unitário sem renderizar o componente
export function calcularMetrics(livros: Livro[]) {
  const ativos = livros.filter((l) => l.status !== 'abandonado');
  const total  = ativos.length;
  const lidos  = ativos.filter((l) => l.status === 'lido').length;
  const lendo  = livros.filter((l) => l.status === 'lendo').length;
  const queroLer = livros.filter((l) => l.status === 'quero_ler').length;
  const percent  = total > 0 ? Math.round((lidos / total) * 100) : 0;
  return { total, lidos, lendo, queroLer, percent };
}

export function getMensagem(percent: number, total: number): string {
  if (total === 0)       return 'Adicione livros e comece sua jornada!';
  if (percent === 100)   return 'Parabéns! Você concluiu todos os livros!';
  if (percent >= 75)     return 'Quase lá! Continue assim!';
  if (percent >= 50)     return 'Você está na metade do caminho!';
  if (percent > 0)       return 'Continue lendo e cumprindo suas metas!';
  return 'Adicione livros e comece sua jornada!';
}

export default function DashboardPage() {
  const router  = useRouter();
  const [nome, setNome]     = useState('Usuário');
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) { router.push('/login'); return; }
        const me = await meRes.json();
        setNome(me.nome || 'Usuário');

        const livrosRes = await fetch('/api/livros');
        if (livrosRes.ok) {
          const data = await livrosRes.json();
          setLivros(data);
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const { total, lidos, lendo, queroLer, percent } = calcularMetrics(livros);
  const mensagem = getMensagem(percent, total);

  return (
    <BaseLayout>
      <div style={styles.page}>
        <h2 style={styles.welcome}>
          Bem vindo(a), {nome}
        </h2>
        <p style={styles.subtitle}>Sua meta de leitura atual:</p>

        {loading ? (
          <div style={styles.loadingRing} aria-label="Carregando" />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
            <CircularProgress percent={percent} size={220} stroke={22} />
          </div>
        )}

        <p style={styles.message}>{mensagem}</p>

        {!loading && total > 0 && (
          <div style={styles.stats}>
            {[
              { label: 'Total',     val: total    },
              { label: 'Lidos',     val: lidos    },
              { label: 'Lendo',     val: lendo    },
              { label: 'Quero ler', val: queroLer },
            ].map(({ label, val }) => (
              <div key={label} style={styles.stat}>
                <span style={styles.statNum}>{val}</span>
                <span style={styles.statLabel}>{label}</span>
              </div>
            ))}
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
    justifyContent: 'center',
    minHeight: 'calc(100vh - 92px - 92px)',
  },
  welcome: {
    fontFamily: 'var(--font-display)',
    fontSize: 35,
    fontWeight: 800,
    color: 'var(--brand)',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 1.15,
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