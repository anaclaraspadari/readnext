'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type StatusLeitura = 'quero_ler' | 'lendo' | 'lido' | 'abandonado';

interface SearchBook {
  id: string;
  title: string;
  author_name: string[];
  isbn: string;
  first_publish_year: string;
  cover_url?: string;
  language: string;
  ja_adicionado?: boolean;
}

interface LibraryBook {
  id: string;
  google_book_id: string | null;
  titulo: string;
  autores: string[];
  capa_url?: string;
  status: StatusLeitura;
  data_adicionado: string;
  data_finalizacao?: string | null;
}

interface User {
  id: string;
  nome: string;
  email: string;
}

const STATUS_OPTIONS: Array<{ value: StatusLeitura; label: string }> = [
  { value: 'quero_ler', label: 'Quero ler' },
  { value: 'lendo', label: 'Lendo' },
  { value: 'lido', label: 'Lido' },
  { value: 'abandonado', label: 'Abandonado' },
];

const statusLabels: Record<StatusLeitura, string> = {
  quero_ler: 'Quero ler',
  lendo: 'Lendo',
  lido: 'Lido',
  abandonado: 'Abandonado',
};

export default function LibraryPanel() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'title' | 'author'>('title');
  const [books, setBooks] = useState<SearchBook[]>([]);
  const [library, setLibrary] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const addedBookIds = useMemo(
    () => new Set(library.map((book) => book.google_book_id)),
    [library]
  );

  useEffect(() => {
    async function fetchSessionAndLibrary() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser(data);
        await fetchLibrary();
      } catch {
        setUser(null);
      }
    }

    fetchSessionAndLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLibrary = async () => {
    setLibraryLoading(true);
    try {
      const response = await fetch('/api/livros');
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          throw new Error('Você precisa fazer login para acessar sua estante.');
        }

        throw new Error(data?.error || `Erro no servidor: ${response.status}`);
      }

      setLibrary(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
      setMessage(`Falha ao carregar a estante: ${errorMessage}`);
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!query.trim()) {
      const fieldName = searchType === 'author' ? 'um autor' : 'um título';
      setMessage(`Digite ${fieldName} antes de pesquisar.`);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/search?searchType=${searchType}&q=${encodeURIComponent(query)}`);
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
      setMessage(`Falha na busca: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (book: SearchBook) => {
    if (addedBookIds.has(book.id)) return;

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
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          throw new Error('Sessão expirada. Faça login novamente.');
        }

        throw new Error(data?.error || `Erro no servidor: ${response.status}`);
      }

      setLibrary((prev) => [
        ...prev,
        {
          id: data.id,
          google_book_id: data.google_book_id,
          titulo: data.titulo,
          autores: data.autores || [],
          capa_url: data.capa_url ?? undefined,
          status: data.status as StatusLeitura,
          data_adicionado: data.data_adicionado,
          data_finalizacao: data.data_finalizacao || null,
        },
      ]);
      setMessage(`Livro adicionado: ${book.title}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
      setMessage(`Falha ao adicionar: ${errorMessage}`);
    } finally {
      setAddingId(null);
    }
  };

  const handleUpdateStatus = async (livroId: string, status: StatusLeitura) => {
    setUpdatingId(livroId);
    setMessage(null);

    try {
      const response = await fetch('/api/livros', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ livro_id: livroId, status }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          throw new Error('Sessão expirada. Faça login novamente.');
        }

        throw new Error(data?.error || `Erro no servidor: ${response.status}`);
      }

      setLibrary((prev) =>
        prev.map((item) =>
          item.id === livroId
            ? {
                ...item,
                status: data.status as StatusLeitura,
                data_finalizacao: data.data_finalizacao || null,
              }
            : item
        )
      );
      setMessage(`Status atualizado para “${statusLabels[status]}”.`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
      setMessage(`Falha ao atualizar status: ${errorMessage}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const booksWithAddedFlag = books.map((book) => ({
    ...book,
    ja_adicionado: addedBookIds.has(book.id),
  }));

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setBooks([]);
      setLibrary([]);
      router.push('/login');
    }
  };

  if (user === undefined) {
    return <div style={{ padding: '2rem' }}>Carregando sessão...</div>;
  }

  if (user === null) {
    return (
      <main style={{ padding: '2rem', maxWidth: '520px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Acesso necessário</h1>
        <p style={{ color: '#d1d5db', marginBottom: '1.5rem' }}>
          Você precisa estar autenticado para ver sua estante de leitura.
        </p>
        <Link href="/login" style={{ color: '#60a5fa' }}>
          Fazer login
        </Link>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '980px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>ReadNext</h1>
          <p style={{ color: '#d1d5db' }}>
            Olá, {user.nome}. Monte sua estante de leitura e acompanhe seu progresso.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem' }}
        >
          Sair
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '8px', backgroundColor: '#111827', color: '#f8fafc' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <select
          value={searchType}
          onChange={(event) => setSearchType(event.target.value as 'title' | 'author')}
          className="text-black p-2 rounded border"
          style={{ padding: '0.5rem 0.75rem' }}
        >
          <option value="title">Título</option>
          <option value="author">Autor</option>
        </select>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchType === 'author' ? 'Digite o nome do autor...' : 'Digite o título do livro...'}
          className="text-black p-2 rounded border"
          style={{ flex: '1 1 280px', minWidth: '220px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '0.75rem 1rem' }}>
          {loading ? 'Buscando...' : 'Pesquisar'}
        </button>
      </form>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Resultados da busca</h2>
        {booksWithAddedFlag.length === 0 ? (
          <p style={{ color: '#d1d5db' }}>Nenhum livro buscado ainda. Use a pesquisa acima.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {booksWithAddedFlag.map((book) => (
              <article key={book.id} style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: '#111827', color: '#f8fafc' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <img
                    src={book.cover_url ?? 'https://via.placeholder.com/100x150?text=Sem+Capa'}
                    alt={book.title}
                    width={100}
                    height={150}
                    style={{ borderRadius: '0.5rem', objectFit: 'cover' }}
                  />
                  <div style={{ flex: '1 1 220px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{book.title}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#9ca3af' }}>{book.author_name.join(', ')}</p>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#9ca3af' }}>
                      {book.first_publish_year} • {book.language}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={book.ja_adicionado || addingId === book.id}
                    onClick={() => handleAddBook(book)}
                    style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem' }}
                  >
                    {book.ja_adicionado ? 'Já adicionado' : addingId === book.id ? 'Adicionando...' : 'Adicionar à estante'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Minha estante</h2>
        {libraryLoading ? (
          <p style={{ color: '#d1d5db' }}>Carregando estante...</p>
        ) : library.length === 0 ? (
          <p style={{ color: '#d1d5db' }}>Sua estante está vazia. Adicione livros para começar.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {library.map((livro) => (
              <article key={livro.id} style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: '#111827', color: '#f8fafc' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <strong>{livro.titulo}</strong>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#9ca3af' }}>{livro.autores.join(', ')}</p>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#9ca3af' }}>
                      Adicionado em {new Date(livro.data_adicionado).toLocaleDateString('pt-BR')}
                    </p>
                    {livro.data_finalizacao && (
                      <p style={{ margin: '0.5rem 0 0 0', color: '#9ca3af' }}>
                        Finalizado em {new Date(livro.data_finalizacao).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div style={{ minWidth: '220px', display: 'grid', gap: '0.5rem' }}>
                    <select
                      value={livro.status}
                      onChange={(event) => handleUpdateStatus(livro.id, event.target.value as StatusLeitura)}
                      disabled={updatingId === livro.id}
                      style={{ padding: '0.75rem', borderRadius: '0.75rem', background: '#f8fafc', color: '#111827' }}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(livro.id, livro.status)}
                      disabled={updatingId === livro.id}
                      style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                      {updatingId === livro.id ? 'Atualizando...' : 'Salvar status'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
