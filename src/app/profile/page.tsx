'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BaseLayout from '@/components/BaseLayout';

export default function ProfilePage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => { if (!r.ok) router.push('/login'); return r.json(); })
      .then((d) => { setNome(d.nome || ''); setEmail(d.email || ''); setLoading(false); })
      .catch(() => router.push('/login'));
  }, [router]);

  async function salvar() {
    setErro(''); setSucesso('');
    if (!nome.trim()) { setErro('O nome não pode estar vazio.'); return; }
    // Aqui chamaria PUT /api/auth/me quando implementado no backend
    setSucesso('Dados atualizados com sucesso!');
  }

  if (loading) return (
    <BaseLayout>
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando...</div>
    </BaseLayout>
  );

  return (
    <BaseLayout>
      <div style={styles.page}>
        <h2 style={styles.title}>Alterar dados</h2>

        {/* Avatar */}
        <div style={styles.avatarWrap}>
          <div style={styles.avatar}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Foto do perfil</p>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Nome do usuário</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={styles.input}
          />

          <label style={{ ...styles.label, marginTop: 20 }}>E-mail</label>
          <input
            type="email"
            value={email}
            disabled
            style={{ ...styles.input, opacity: 0.6 }}
          />
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>O e-mail não pode ser alterado.</p>

          {sucesso && <p style={styles.sucesso}>{sucesso}</p>}
          {erro && <p style={styles.erro}>{erro}</p>}

          <button onClick={salvar} style={styles.btn}>Salvar alterações</button>
        </div>
      </div>
    </BaseLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '32px 24px', maxWidth: 430, margin: '0 auto' },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 22,
    color: 'var(--brand)',
    textAlign: 'center',
    marginBottom: 24,
  },
  avatarWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    border: '2.5px solid var(--brand)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--brand-light)',
  },
  form: { display: 'flex', flexDirection: 'column' },
  label: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--brand)',
    marginBottom: 8,
  },
  input: {
    border: '1.5px solid var(--brand)',
    borderRadius: 24,
    padding: '10px 18px',
    fontSize: 15,
    outline: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    width: '100%',
  },
  btn: {
    marginTop: 28,
    background: 'var(--brand)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-btn)',
    padding: '13px',
    fontSize: 16,
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    cursor: 'pointer',
    width: '100%',
  },
  sucesso: { color: '#16a34a', fontSize: 13, textAlign: 'center', marginTop: 12 },
  erro: { color: '#dc2626', fontSize: 13, textAlign: 'center', marginTop: 12 },
};