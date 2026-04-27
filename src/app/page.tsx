// src/app/page.tsx
'use client';

import { useState } from 'react';

interface Book {
  title: string;
  author_name: string[];
  isbn: string[];
  first_publish_year: string;
  cover_url?: string;
  language: string[];
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/search?title=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Erro no servidor: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("O servidor não retornou JSON.");
      }

      const data: Book[] = await response.json();
      setBooks(data);
    } catch (error) {
      console.error("Erro detalhado:", error);
      alert("Houve um erro na busca.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>ReadNext - Buscar Livros</h1>
      
      <form onSubmit={handleSearch} style={{ margin: '1rem 0' }}>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Digite o nome do livro..."
          className="text-black p-2 rounded border"
        />
        <button type="submit" disabled={loading} style={{ marginLeft: '10px' }}>
          {loading ? 'Buscando...' : 'Pesquisar'}
        </button>
      </form>

      <section>
        {books.length > 0 ? (
          // 2. Trocamos 'any' pelo tipo 'Book'
          books.map((book: Book, index: number) => (
            <div 
              key={index} 
              style={{ 
                display: 'flex', 
                gap: '20px', 
                borderBottom: '1px solid #444', 
                padding: '1.5rem 0',
                alignItems: 'start' 
              }}
            >
              <div style={{ minWidth: '100px' }}>
                {book.cover_url ? (
                  <img 
                    src={book.cover_url} 
                    alt={book.title}
                    style={{ width: '100px', height: 'auto', borderRadius: '4px' }}
                  />
                ) : (
                  <div style={{ width: '100px', height: '140px', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', borderRadius: '4px' }}>
                    Sem Capa
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.3rem', margin: '0 0 8px 0' }}>{book.title}</h2>
                {/* 3. Com a tipagem correta, o TS sabe que author_name é um array */}
                <p><strong>Autor:</strong> {book.author_name.join(', ')}</p>
                <p><strong>Ano:</strong> {book.first_publish_year}</p>
                <p><strong>ISBN:</strong> {book.isbn[0]}</p>
                
                <div style={{ marginTop: '10px' }}>
                  {book.language.map((lang, i) => (
                    <span key={i} style={{ fontSize: '0.75rem', backgroundColor: '#0070f3', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          !loading && <p>Pesquise um livro para começar.</p>
        )}
      </section>
    </main>
  );
}