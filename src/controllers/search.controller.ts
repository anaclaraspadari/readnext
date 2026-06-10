import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import * as SearchService from '@/services/search.service';

export async function search(request: Request) {
  const { searchParams } = new URL(request.url);
  const query      = searchParams.get('q');
  const searchType = searchParams.get('searchType') || 'title';

  if (!query || !query.trim()) {
    return NextResponse.json({ error: 'Termo de busca é obrigatório.' }, { status: 400 });
  }

  try {
    const usuario_id = getUserIdFromRequest(request) ?? undefined;
    const livros     = await SearchService.buscarLivros(query, searchType, usuario_id);
    return NextResponse.json(livros);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar busca.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}