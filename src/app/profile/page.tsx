"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  nome: string;
  email: string;
  foto_url?: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        router.push('/login');
      }
    }

    load();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setMessage('Selecione uma imagem.');

    setLoading(true);
    setMessage(null);

    try {
      const fotoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/auth/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto: fotoBase64 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar foto');

      setUser((u) => (u ? { ...u, foto_url: data.foto_url } : u));
      setMessage('Foto atualizada.');
      setFile(null);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Carregando...</div>;

  return (
    <main style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto' }}>
      <h1>Perfil</h1>
      <p>Nome: {user.nome}</p>
      <p>E-mail: {user.email}</p>

      <div style={{ margin: '1rem 0' }}>
        <p>Foto atual:</p>
        {user.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.foto_url} alt="Foto de perfil" style={{ width: 120, height: 120, borderRadius: '50%' }} />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#e5e7eb' }} />
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
        <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Atualizar foto'}</button>
        {message && <div>{message}</div>}
      </form>
    </main>
  );
}
