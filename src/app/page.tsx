import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>ReadNext</h1>
      <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
        Bem-vindo ao ReadNext! Acesse o login/cadastro ou vá para a sua estante.
      </p>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <Link
          href="/login"
          style={{
            display: 'block',
            padding: '1rem 1.5rem',
            borderRadius: '0.75rem',
            backgroundColor: '#2563eb',
            color: '#fff',
            textAlign: 'center',
            textDecoration: 'none',
          }}
        >
          Entrar / Cadastrar
        </Link>

        <Link
          href="/livros"
          style={{
            display: 'block',
            padding: '1rem 1.5rem',
            borderRadius: '0.75rem',
            backgroundColor: '#111827',
            color: '#fff',
            textAlign: 'center',
            textDecoration: 'none',
          }}
        >
          Minha estante
        </Link>
      </div>

      <p style={{ marginTop: '2rem', color: '#6b7280' }}>
        Se você já estiver logado, /livros carregará sua estante automaticamente.
      </p>
    </main>
  );
}
