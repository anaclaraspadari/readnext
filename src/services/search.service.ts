import * as LivrosRepository from '@/repositories/livros.repository';

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    industryIdentifiers?: Array<{ type: string; identifier: string }>;
    imageLinks?: { thumbnail?: string };
    language?: string;
  };
}

export async function buscarLivros(
  query: string,
  searchType: string,
  usuario_id?: string
) {
  const formattedQuery = searchType === 'author' ? `inauthor:${query}` : query;

  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', formattedQuery);
  url.searchParams.set('maxResults', '10');
  url.searchParams.set('printType', 'books');

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) url.searchParams.set('key', apiKey);

  const res  = await fetch(url.toString());
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  // Busca livros já na estante do usuário para marcar ja_adicionado
  const idsNaEstante = new Set<string>();
  if (usuario_id) {
    const livrosExistentes = await LivrosRepository.findAllByUsuario(usuario_id);
    livrosExistentes.forEach((l) => {
      if (l.google_book_id) idsNaEstante.add(l.google_book_id);
    });
  }

  return (data.items ?? []).map((item: GoogleBookItem) => ({
    id:                 item.id,
    title:              item.volumeInfo.title,
    author_name:        item.volumeInfo.authors || ['N/A'],
    first_publish_year: item.volumeInfo.publishedDate?.split('-')[0] || 'N/A',
    isbn:
      item.volumeInfo.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier ||
      item.volumeInfo.industryIdentifiers?.[0]?.identifier ||
      'N/A',
    cover_url: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
    language:  item.volumeInfo.language || 'N/A',
    ja_adicionado: idsNaEstante.has(item.id),
  }));
}