'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type AuthMode = 'login' | 'register';

interface User {
  id: string;
  nome: string;
  email: string;
}

export default function AuthPanel() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          router.replace('/livros');
        }
      } catch {
        // Ignore errors; user stays on login page.
      }
    }

    checkSession();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      let body;

      if (authMode === 'login') {
        body = { email, senha };
      } else {
        // If a file was selected, convert to base64 data URL
        let fotoBase64: string | undefined = undefined;
        if (fotoFile) {
          fotoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(fotoFile);
          });
        }

        body = { nome, email, senha, foto: fotoBase64 };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Erro no servidor: ${response.status}`);
      }

      setEmail('');
      setSenha('');
      setNome('');
      setFotoFile(null);
      router.push('/livros');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '520px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>ReadNext</h1>
      <p style={{ marginBottom: '1.5rem', color: '#d1d5db' }}>
        Faça login ou cadastre uma conta para acessar sua estante de livros.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: authMode === 'login' ? '2px solid #2563eb' : '1px solid #d1d5db',
            background: authMode === 'login' ? '#1d4ed8' : 'transparent',
            color: authMode === 'login' ? '#fff' : '#111827',
          }}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('register')}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: authMode === 'register' ? '2px solid #2563eb' : '1px solid #d1d5db',
            background: authMode === 'register' ? '#1d4ed8' : 'transparent',
            color: authMode === 'register' ? '#fff' : '#111827',
          }}
        >
          Cadastro
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        {authMode === 'register' && (
          <>
            <label style={{ display: 'grid', gap: '0.5rem' }}>
              Nome completo
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                className="text-black p-2 rounded border"
                required={authMode === 'register'}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.5rem' }}>
              Foto de perfil (opcional)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFotoFile(e.target.files ? e.target.files[0] : null)}
                className="p-2"
              />
            </label>
          </>
        )}

        <label style={{ display: 'grid', gap: '0.5rem' }}>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="text-black p-2 rounded border"
            required
          />
        </label>

        <label style={{ display: 'grid', gap: '0.5rem' }}>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            className="text-black p-2 rounded border"
            required
            minLength={6}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem' }}
        >
          {loading ? (authMode === 'login' ? 'Entrando...' : 'Cadastrando...') : authMode === 'login' ? 'Entrar' : 'Cadastrar'}
        </button>

        {message && (
          <div style={{ color: '#f8fafc', backgroundColor: '#111827', padding: '1rem', borderRadius: '0.75rem' }}>
            {message}
          </div>
        )}
      </form>

      <div style={{ marginTop: '1.5rem', color: '#9ca3af' }}>
        <p>Já tem conta? Use o formulário acima para entrar.</p>
        <p>
          Se você já fez login, acesse sua estante em{' '}
          <Link href="/livros" style={{ color: '#60a5fa' }}>
            /livros
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
