import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      google_book_id, 
      titulo, 
      autores, 
      capa_url, 
      usuario_id 
    } = body;

    if (!google_book_id || !titulo || !usuario_id) {
      return NextResponse.json({ error: 'Dados insuficientes. Certifique-se de enviar google_book_id, titulo e usuario_id.' }, { status: 400 });
    }

    const livrosPendentes = await prisma.livro.count({
      where: {
        usuario_id: usuario_id,
        NOT: { status: 'lido' }
      }
    });

    const LIMITE_ALERTA = 15;

    if (livrosPendentes >= LIMITE_ALERTA) {
      return NextResponse.json({ 
        error: 'Alerta de Acúmulo!', 
        message: `Você já tem ${livrosPendentes} livros na fila. Termine um antes de adicionar outro!` 
      }, { status: 403 });
    }

    const novoLivro = await prisma.livro.create({
      data: {
        google_book_id,
        titulo,
        autores: autores || [],
        capa_url,
        usuario_id,
        status: 'quero_ler'
      }
    });

    return NextResponse.json(novoLivro, { status: 201 });

  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const prismaError = error as { code: string };
      
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Este livro já está na sua estante.' }, 
          { status: 409 }
        );
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor';
    console.error("Erro ao salvar livro:", errorMessage);

    return NextResponse.json(
      { error: 'Erro interno no servidor', details: errorMessage }, 
      { status: 500 }
    );
  }
}