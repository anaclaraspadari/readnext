import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import * as LivrosService from '@/services/livros.service';
import {
  LivroNaoEncontradoError,
  LimiteFilaError,
  StatusInvalidoError,
  LivroJaNaEstanteError,
} from '@/services/livros.service';

export async function getAll(request: Request) {
  const usuario_id = getUserIdFromRequest(request);
  if (!usuario_id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  try {
    const livros = await LivrosService.listarLivros(usuario_id);
    return NextResponse.json(livros);
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function create(request: Request) {
  const usuario_id = getUserIdFromRequest(request);
  if (!usuario_id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await request.json();
  const { google_book_id, titulo, autores, capa_url, status } = body;

  if (!google_book_id || !titulo) {
    return NextResponse.json(
      { error: 'Dados insuficientes. Envie google_book_id e titulo.' },
      { status: 400 }
    );
  }

  try {
    const livro = await LivrosService.adicionarLivro(usuario_id, {
      google_book_id,
      titulo,
      autores,
      capa_url,
      status,
    });
    return NextResponse.json(livro, { status: 201 });
  } catch (err) {
    if (err instanceof LivroJaNaEstanteError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof LimiteFilaError) {
      return NextResponse.json(
        { error: 'Alerta de Acúmulo!', message: err.message },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : 'Erro interno.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function update(request: Request) {
  const usuario_id = getUserIdFromRequest(request);
  if (!usuario_id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await request.json();
  const { livro_id, status, avaliacao } = body;

  if (!livro_id || !status) {
    return NextResponse.json(
      { error: 'Dados insuficientes. Envie livro_id e status.' },
      { status: 400 }
    );
  }

  try {
    const livro = await LivrosService.atualizarStatus(usuario_id, livro_id, status, avaliacao);
    return NextResponse.json(livro);
  } catch (err) {
    if (err instanceof LivroNaoEncontradoError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof StatusInvalidoError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : 'Erro interno.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function remove(request: Request) {
  const usuario_id = getUserIdFromRequest(request);
  if (!usuario_id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const livro_id = searchParams.get('livro_id');

  if (!livro_id) {
    return NextResponse.json({ error: 'Informe o livro_id.' }, { status: 400 });
  }

  try {
    await LivrosService.removerLivro(usuario_id, livro_id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof LivroNaoEncontradoError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    const msg = err instanceof Error ? err.message : 'Erro interno.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}