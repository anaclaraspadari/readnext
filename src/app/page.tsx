// src/app/page.tsx
'use client';

import { useState } from 'react';

interface Book {
  id: string;
  title: string;
  author_name: string[];
  isbn: string;
  first_publish_year: string;
  cover_url?: string;
  language: string;
  ja_adicionado?: boolean;
}

const DEFAULT_USER_ID = 'usuario-exemplo-1';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!query.trim()) {
      setMessage('Digite um título antes de pesquisar.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/search?title=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Erro no servidor: ${response.status}`);
      }

      if (!Array.isArray(data)) {
        throw new Error(data?.error || 'Resposta inesperada da API.');
      }

      setBooks(data);
      setMessage(data.length ? null : 'Nenhum resultado encontrado.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
      console.error('Erro na busca:', errorMessage);
      setMessage(`Falha na busca: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (book: Book) => {
    if (book.ja_adicionado) return;

    setAddingId(book.id);
    setMessage(null);

    try {
      const response = await fetch('/api/livros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_book_id: book.id,
          titulo: book.title,
          autores: book.author_name,
          capa_url: book.cover_url,
          usuario_id: DEFAULT_USER_ID,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `Erro no servidor: ${response.status}`);
      }

      setBooks((prev) => prev.map((item) => item.id === book.id ? { ...item, ja_adicionado: true } : item));
      setMessage(`Livro adicionado: ${book.title}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
      console.error('Erro ao adicionar livro:', errorMessage);
      setMessage(`Falha ao adicionar: ${errorMessage}`);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '980px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>ReadNext</h1>
      <p style={{ marginBottom: '1.5rem', color: '#d1d5db' }}>
        Busque livros pela API do Google e adicione-os à sua estante.
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite o título do livro..."
          className="text-black p-2 rounded border"
          style={{ flex: '1 1 280px', minWidth: '220px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '0.75rem 1rem' }}>
          {loading ? 'Buscando...' : 'Pesquisar'}
        </button>
      </form>

      {message && (
        <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '8px', backgroundColor: '#111827', color: '#f8fafc' }}>
          {message}
        </div>
      )}

      <section>
        {books.length === 0 && !loading ? (
          <p>Pesquise um livro para começar.</p>
        ) : (
          books.map((book) => (
            <article key={book.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: '1rem', padding: '1.25rem 0', borderBottom: '1px solid #374151', alignItems: 'start' }}>
              <div style={{ minWidth: '110px' }}>
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} style={{ width: '100%', borderRadius: '8px' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '0.72', backgroundColor: '#334155', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#cbd5e1', padding: '0.75rem', textAlign: 'center' }}>
                    Sem capa
                  </div>
                )}
              </div>

              <div>
                <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>{book.title}</h2>
                <p style={{ margin: '0.25rem 0' }}><strong>Autor:</strong> {book.author_name.join(', ')}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Ano:</strong> {book.first_publish_year}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Idioma:</strong> {book.language}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>ISBN:</strong> {book.isbn}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleAddBook(book)}
                  disabled={book.ja_adicionado || addingId === book.id}
                  style={{ padding: '0.75rem 1rem', borderRadius: '999px', backgroundColor: book.ja_adicionado ? '#6b7280' : '#2563eb', color: '#fff', border: 'none', cursor: book.ja_adicionado ? 'not-allowed' : 'pointer' }}
                >
                  {book.ja_adicionado ? 'Adicionado' : addingId === book.id ? 'Adicionando...' : 'Adicionar'}
                </button>
                {book.ja_adicionado && <span style={{ color: '#34d399' }}>Já na estante</span>}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}