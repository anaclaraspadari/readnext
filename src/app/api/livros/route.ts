import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

const STATUS_VALUES = ['quero_ler', 'lendo', 'lido', 'abandonado'] as const;
type StatusLeitura = (typeof STATUS_VALUES)[number];

export async function GET(request: Request) {
  const usuario_id = getUserIdFromRequest(request);

  if (!usuario_id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const livros = await prisma.livro.findMany({
    where: { usuario_id },
    orderBy: [
      { data_finalizacao: 'desc' },
      { data_adicionado: 'desc' }
    ]
  });

  return NextResponse.json(livros);
}

export async function PATCH(request: Request) {
  try {
    const usuario_id = getUserIdFromRequest(request);
    const body = await request.json();
    const { livro_id, status } = body;

    if (!usuario_id) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    if (!livro_id || !status) {
      return NextResponse.json({ error: 'Dados insuficientes. Envie livro_id e status.' }, { status: 400 });
    }

    if (!STATUS_VALUES.includes(status)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    }

    const livroExistente = await prisma.livro.findFirst({
      where: {
        id: livro_id,
        usuario_id
      }
    });

    if (!livroExistente) {
      return NextResponse.json({ error: 'Livro não encontrado para o usuário autenticado.' }, { status: 404 });
    }

    const livroAtualizado = await prisma.livro.update({
      where: { id: livro_id },
      data: {
        status,
        data_finalizacao: status === 'lido' ? new Date() : null
      }
    });

    return NextResponse.json(livroAtualizado);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor';
    console.error('Erro ao atualizar status do livro:', errorMessage);
    return NextResponse.json({ error: 'Erro interno no servidor', details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const usuario_id = getUserIdFromRequest(request);
    const body = await request.json();
    const { google_book_id, titulo, autores, capa_url } = body;

    if (!usuario_id) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    if (!google_book_id || !titulo) {
      return NextResponse.json({ error: 'Dados insuficientes. Certifique-se de enviar google_book_id e titulo.' }, { status: 400 });
    }

    const livrosPendentes = await prisma.livro.count({
      where: {
        usuario_id,
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