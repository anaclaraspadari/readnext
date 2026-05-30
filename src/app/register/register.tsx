'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [aceito, setAceito] = useState<boolean | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCadastrar() {
    setErro('');
    if (!nome || !email || !senha || !confirmar) { setErro('Preencha todos os campos.'); return; }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return; }
    if (aceito === null) { setErro('Indique se aceita os termos.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro no cadastro.'); return; }
      router.push('/dashboard');
    } catch {
      setErro('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.brand}>ReadNext</h1>
      <h2 style={styles.title}>Cadastre-se</h2>

      <div style={styles.form}>
        {[
          { label: 'Nome do usuário', val: nome, set: setNome, type: 'text', auto: 'name' },
          { label: 'E-mail', val: email, set: setEmail, type: 'email', auto: 'email' },
          { label: 'Senha', val: senha, set: setSenha, type: 'password', auto: 'new-password' },
          { label: 'Confirmar senha', val: confirmar, set: setConfirmar, type: 'password', auto: 'new-password' },
        ].map(({ label, val, set, type, auto }) => (
          <div key={label} style={{ marginBottom: 20 }}>
            <label style={styles.label}>{label}</label>
            <input
              type={type}
              value={val}
              onChange={(e) => set(e.target.value)}
              autoComplete={auto}
              style={styles.input}
            />
          </div>
        ))}

        {erro && <p style={styles.error}>{erro}</p>}

        {/* Sim / Não radio */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, margin: '12px 0 20px' }}>
          {[{ label: 'Sim', val: true }, { label: 'Não', val: false }].map(({ label, val }) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                border: `2px solid ${aceito === val ? 'var(--brand)' : 'var(--text-secondary)'}`,
                background: aceito === val ? 'var(--brand)' : 'transparent',
                display: 'inline-block',
                transition: 'all 0.15s',
              }} onClick={() => setAceito(val)} />
              {label}
            </label>
          ))}
        </div>

        <button onClick={handleCadastrar} disabled={loading} style={styles.btn}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/login" style={styles.linkUnderline}>Voltar</Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    padding: '48px 32px 32px',
    maxWidth: 430,
    margin: '0 auto',
  },
  brand: {
    fontFamily: 'var(--font-display)',
    fontSize: 30,
    fontWeight: 800,
    color: 'var(--brand)',
    textAlign: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-brand)',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: { display: 'flex', flexDirection: 'column' },
  label: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--brand)',
    marginBottom: 8,
    display: 'block',
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
    background: 'var(--brand)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-btn)',
    padding: '14px',
    fontSize: 18,
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: '0.5px',
    width: '100%',
  },
  linkUnderline: {
    color: 'var(--text-secondary)',
    textDecoration: 'underline',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
};