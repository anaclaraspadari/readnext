import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    const googleBooksUrl = new URL('https://www.googleapis.com/books/v1/volumes');
    googleBooksUrl.searchParams.set('q', title); // Removi o intitle: para ser mais abrangente
    googleBooksUrl.searchParams.set('maxResults', '10');
    googleBooksUrl.searchParams.set('printType', 'books');
    
    // Puxa a chave do .env
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (apiKey) {
      googleBooksUrl.searchParams.set('key', apiKey);
    }

    const res = await fetch(googleBooksUrl.toString());
    const data = await res.json();
    if (data.error) {
      console.error("Erro na API do Google:", data.error.message);
      
      if (data.error.code === 429) {
        return NextResponse.json([
          {
            id: "mock_hobbit_123",
            title: "O Hobbit (Modo Offline/Quota)",
            author_name: ["J.R.R. Tolkien"],
            first_publish_year: "1937",
            isbn: "9788595084742",
            cover_url: "https://via.placeholder.com/150",
            language: "pt",
            ja_adicionado: false
          }
        ]);
      }
      throw new Error(data.error.message);
    }
    const livrosExistentes = await prisma.livro.findMany({
      select: { google_book_id: true }
    });
    const idsNaEstante = new Set(livrosExistentes.map(l => l.google_book_id));

    const formattedBooks = data.items?.map((item: GoogleBookItem) => ({
      id: item.id,
      title: item.volumeInfo.title,
      author_name: item.volumeInfo.authors || ['N/A'],
      first_publish_year: item.volumeInfo.publishedDate?.split('-')[0] || 'N/A',
      isbn: item.volumeInfo.industryIdentifiers?.find(id => id.type === "ISBN_13")?.identifier 
            || item.volumeInfo.industryIdentifiers?.[0]?.identifier 
            || 'N/A',
      cover_url: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
      language: item.volumeInfo.language || 'N/A',
      ja_adicionado: idsNaEstante.has(item.id) 
    })) || [];

    return NextResponse.json(formattedBooks);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Erro na Rota Search:", errorMessage);
    
    return NextResponse.json(
      { error: 'Erro ao processar busca', details: errorMessage }, 
      { status: 500 }
    );
  }
}