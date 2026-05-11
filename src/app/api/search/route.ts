import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface GoogleBookItem {
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    imageLinks?: {
      thumbnail?: string;
    };
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
    googleBooksUrl.searchParams.set('q', `intitle:${title}`);
    googleBooksUrl.searchParams.set('langRestrict', 'pt,en');
    googleBooksUrl.searchParams.set('maxResults', '10');
    googleBooksUrl.searchParams.set('printType', 'books');

    const res = await fetch(googleBooksUrl.toString());
    const data = await res.json();

    const formattedBooks = data.items?.map((item: GoogleBookItem) => ({
      title: item.volumeInfo.title,
      author_name: item.volumeInfo.authors || ['N/A'],
      first_publish_year: item.volumeInfo.publishedDate?.split('-')[0] || 'N/A',
      isbn: item.volumeInfo.industryIdentifiers?.map(id => id.identifier) || ['N/A'],
      cover_url: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
      language: [item.volumeInfo.language || 'N/A']
    })) || [];

    const totalNoBanco = await prisma.livro.count();
    console.log("Total de livros já salvos no banco:", totalNoBanco);

    return NextResponse.json(formattedBooks);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Erro na Rota Search:", errorMessage);
    
    return NextResponse.json(
      { error: 'Erro na operação', details: errorMessage }, 
      { status: 500 }
    );
  }
}