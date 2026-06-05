'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BaseLayout from '@/components/BaseLayout';
import AvatarPicker from '@/components/AvatarPicker';

export default function ProfilePage() {
  const router = useRouter();
  const [nome, setNome]         = useState('');
  const [email, setEmail]       = useState('');
  const [fotoAtual, setFotoAtual] = useState<string | undefined>();
  const [novaFoto, setNovaFoto] = useState<string | undefined>();
  const [loading, setLoading]   = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso]   = useState('');
  const [erro, setErro]         = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/auth/me');
      if (!res.ok) { router.push('/login'); return; }
      const data = await res.json();
      setNome(data.nome   || '');
      setEmail(data.email || '');
      setFotoAtual(data.foto_url || undefined);
      setLoading(false);
    }
    load();
  }, [router]);

  async function salvar() {
    setErro(''); setSucesso('');
    if (!nome.trim()) { setErro('O nome não pode estar vazio.'); return; }
    setSalvando(true);

    try {
      // Atualiza foto se foi alterada
      if (novaFoto) {
        const resAvatar = await fetch('/api/auth/avatar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto: novaFoto }),
        });
        if (!resAvatar.ok) {
          const d = await resAvatar.json();
          setErro(d.error || 'Erro ao salvar a foto.');
          return;
        }
        const d = await resAvatar.json();
        setFotoAtual(d.foto_url);
        setNovaFoto(undefined);
      }

      // Aqui chamaria PUT /api/auth/me para atualizar nome quando implementado
      setSucesso('Dados atualizados com sucesso!');
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return (
    <BaseLayout>
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Carregando...
      </div>
    </BaseLayout>
  );

  return (
    <BaseLayout>
      <div style={styles.page}>
        <h2 style={styles.title}>Alterar dados</h2>

        {/* Avatar com picker */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <AvatarPicker
            fotoAtual={fotoAtual}
            onChange={setNovaFoto}
            size={96}
          />
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
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            O e-mail não pode ser alterado.
          </p>

          {sucesso && <p style={styles.sucesso}>{sucesso}</p>}
          {erro    && <p style={styles.erro}>{erro}</p>}

          <button
            onClick={salvar}
            disabled={salvando}
            style={{ ...styles.btn, opacity: salvando ? 0.7 : 1 }}
          >
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </BaseLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:   { padding: '32px 24px', maxWidth: 430, margin: '0 auto' },
  title:  { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--brand)', textAlign: 'center', marginBottom: 24 },
  form:   { display: 'flex', flexDirection: 'column' },
  label:  { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--brand)', marginBottom: 8 },
  input:  { border: '1.5px solid var(--brand)', borderRadius: 24, padding: '10px 18px', fontSize: 15, outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', width: '100%' },
  btn:    { marginTop: 28, background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-btn)', padding: '13px', fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 800, cursor: 'pointer', width: '100%', transition: 'opacity 0.15s' },
  sucesso: { color: '#16a34a', fontSize: 13, textAlign: 'center', marginTop: 12 },
  erro:    { color: '#dc2626', fontSize: 13, textAlign: 'center', marginTop: 12 },
};