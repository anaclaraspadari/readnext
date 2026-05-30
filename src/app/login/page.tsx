'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setErro('');
    if (!email || !senha) { setErro('Preencha todos os campos.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro ao entrar.'); return; }
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
      <h2 style={styles.title}>Login</h2>

      <div style={styles.form}>
        <label style={styles.label}>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          autoComplete="email"
        />

        <label style={{ ...styles.label, marginTop: 20 }}>Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={styles.input}
          autoComplete="current-password"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />

        {erro && <p style={styles.error}>{erro}</p>}

        <Link href="#" style={styles.link}>Esqueceu a senha?</Link>

        <button onClick={handleSubmit} disabled={loading} style={styles.btn}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p style={styles.divider}>Ou faça seu login por aqui</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 28 }}>
          {/* Google */}
          <button style={styles.socialBtn} aria-label="Login com Google">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </button>
          {/* Facebook */}
          <button style={styles.socialBtn} aria-label="Login com Facebook">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
          Não tem uma conta?{' '}
          <Link href="/cadastro" style={styles.link}>Cadastre-se!</Link>
        </p>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/" style={styles.linkUnderline}>Voltar</Link>
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
    marginBottom: 40,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--text-brand)',
    textAlign: 'center',
    marginBottom: 36,
  },
  form: { display: 'flex', flexDirection: 'column' },
  label: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 15,
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
    marginTop: 8,
    marginBottom: 20,
    letterSpacing: '0.5px',
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'var(--brand)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
  },
  link: {
    color: 'var(--brand)',
    textDecoration: 'underline',
    fontSize: 14,
    textAlign: 'center',
    display: 'block',
    margin: '12px 0',
    fontFamily: 'var(--font-body)',
  },
  linkUnderline: {
    color: 'var(--text-secondary)',
    textDecoration: 'underline',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
  },
  divider: {
    textAlign: 'center',
    fontSize: 14,
    color: 'var(--text-secondary)',
    marginBottom: 16,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
};