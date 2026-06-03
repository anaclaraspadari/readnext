import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// ─── Tipos ────────────────────────────────────────────────────────────────────

const STATUS_VALUES = ['quero_ler', 'lendo', 'lido', 'abandonado'] as const;
type StatusLeitura = (typeof STATUS_VALUES)[number];

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    imageLinks?: { thumbnail?: string };
    seriesInfo?: { bookDisplayNumber?: string };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Palavras irrelevantes para identificar o prefixo/nome da série
const STOPWORDS = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das',
  'e', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'que',
  'the', 'a', 'an', 'of', 'and', 'in', 'to', 'for',
]);

/**
 * Detecta o prefixo de série no título.
 * Ex.: "O Senhor dos Anéis: A Sociedade do Anel" → "O Senhor dos Anéis"
 *      "Harry Potter e a Pedra Filosofal"         → "Harry Potter"  (sem separador)
 */
function extrairPrefixoSerie(titulo: string): string {
  // Caso 1: separador explícito (:, –, -)
  const separador = titulo.match(/^(.+?)[\:\–\-]/);
  if (separador) return separador[1].trim();

  // Caso 2: sem separador — pega as primeiras 2-3 palavras significativas
  const palavras = titulo
    .split(/\s+/)
    .filter((p) => !STOPWORDS.has(p.toLowerCase()) && p.length > 2);
  return palavras.slice(0, 2).join(' ');
}

/**
 * Busca livros da mesma série na Google Books API.
 * Estratégia dupla:
 *   1. Busca pelo prefixo da série (parte antes do ":")
 *   2. Busca por autor caso a primeira não encontre resultados suficientes
 * Filtra apenas livros cujo título compartilha o prefixo com o livro lido.
 */
async function buscarContinuacoes(
  titulo: string,
  autores: string[]
): Promise<{ id: string; titulo: string; autores: string[]; capa_url?: string }[]> {
  try {
    const autor        = autores?.[0] ?? '';
    const prefixoSerie = extrairPrefixoSerie(titulo);
    const tituloLower  = titulo.toLowerCase().trim();
    const prefixoLower = prefixoSerie.toLowerCase();

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

    async function buscarNaApi(query: string): Promise<GoogleBookItem[]> {
      const url = new URL('https://www.googleapis.com/books/v1/volumes');
      url.searchParams.set('q', query);
      url.searchParams.set('maxResults', '20');
      url.searchParams.set('printType', 'books');
      url.searchParams.set('orderBy', 'relevance');
      if (apiKey) url.searchParams.set('key', apiKey);

      const res  = await fetch(url.toString(), { next: { revalidate: 0 } });
      const data = await res.json();
      return data.items ?? [];
    }

    // Query 1: prefixo da série + autor
    const q1 = autor
      ? `intitle:"${prefixoSerie}" inauthor:"${autor}"`
      : `intitle:"${prefixoSerie}"`;

    console.log('[CONTINUAÇÕES] Título lido:', titulo);
    console.log('[CONTINUAÇÕES] Prefixo extraído:', prefixoSerie);
    console.log('[CONTINUAÇÕES] Autor:', autor);
    console.log('[CONTINUAÇÕES] Query 1:', q1);

    let itens = await buscarNaApi(q1);
    console.log('[CONTINUAÇÕES] Resultados q1:', itens.length, itens.map(i => i.volumeInfo.title));

    // Query 2 (fallback): só pelo autor se a primeira retornou poucos resultados
    if (itens.length < 3 && autor) {
      const q2   = `inauthor:"${autor}" intitle:"${prefixoSerie}"`;
      const mais = await buscarNaApi(q2);
      console.log('[CONTINUAÇÕES] Query 2:', q2, '→', mais.length, 'resultados');
      // Mescla sem duplicatas
      const idsExistentes = new Set(itens.map((i) => i.id));
      itens = [...itens, ...mais.filter((i) => !idsExistentes.has(i.id))];
    }

    console.log('[CONTINUAÇÕES] Total antes do filtro:', itens.length);
    console.log('[CONTINUAÇÕES] prefixoLower usado no filtro:', prefixoLower);

    // Filtra: mantém só livros que compartilham o prefixo da série,
    // excluindo o próprio livro lido
    const resultado = itens
      .filter((item) => {
        const t = item.volumeInfo.title?.toLowerCase().trim() ?? '';
        // Exclui o próprio livro
        if (t === tituloLower) return false;
        // Deve conter o prefixo da série no título
        const passou = t.includes(prefixoLower) || prefixoLower.split(' ').every((p) => t.includes(p));
        console.log(`[FILTRO] "${item.volumeInfo.title}" → passou: ${passou}`);
        return passou;
      })
      .map((item) => ({
        id:       item.id,
        titulo:   item.volumeInfo.title,
        autores:  item.volumeInfo.authors ?? [],
        capa_url: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
      }));

    // Remove duplicatas por id
    const vistos = new Set<string>();
    const final = resultado.filter((l) => {
      if (vistos.has(l.id)) return false;
      vistos.add(l.id);
      return true;
    });
    console.log('[CONTINUAÇÕES] Final após filtros:', final.length, final.map(l => l.titulo));
    return final;
  } catch (err) {
    console.error('Erro ao buscar continuações:', err);
    return [];
  }
}

// ─── GET /api/livros ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const usuario_id = getUserIdFromRequest(request);
  if (!usuario_id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const livros = await prisma.livro.findMany({
    where: { usuario_id },
    orderBy: [{ data_finalizacao: 'desc' }, { data_adicionado: 'desc' }],
  });

  return NextResponse.json(livros);
}

// ─── PATCH /api/livros ────────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  try {
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

    if (!STATUS_VALUES.includes(status as StatusLeitura)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    }

    // Valida avaliação (1–5 ou null)
    const avaliacaoValida =
      avaliacao != null && Number.isInteger(avaliacao) && avaliacao >= 1 && avaliacao <= 5
        ? avaliacao
        : null;

    const livroExistente = await prisma.livro.findFirst({
      where: { id: livro_id, usuario_id },
    });

    if (!livroExistente) {
      return NextResponse.json(
        { error: 'Livro não encontrado para o usuário autenticado.' },
        { status: 404 }
      );
    }

    // Atualiza o livro
    const livroAtualizado = await prisma.livro.update({
      where: { id: livro_id },
      data: {
        status,
        avaliacao:        avaliacaoValida,
        data_finalizacao: status === 'lido' ? new Date() : null,
      },
    });

    // ── Automação de lista de desejos ──────────────────────────────────────
    let continuacoes_adicionadas = 0;

    const marcandoLido = status === 'lido';
    const boaAvaliacao = avaliacaoValida != null && avaliacaoValida >= 3;

    if (marcandoLido && boaAvaliacao) {
      const candidatos = await buscarContinuacoes(
        livroExistente.titulo,
        livroExistente.autores as string[]
      );

      // Calcula quantas vagas ainda existem antes de começar o loop
      const pendentesAtual = await prisma.livro.count({
        where: {
          usuario_id,
          status: { in: ['quero_ler', 'lendo'] },
        },
      });
      const LIMITE = 15;
      let vagasDisponiveis = Math.max(0, LIMITE - pendentesAtual);

      for (const candidato of candidatos) {
        if (vagasDisponiveis <= 0) break;

        // Pula se já está na estante
        const jaExiste = await prisma.livro.findFirst({
          where: { usuario_id, google_book_id: candidato.id },
        });
        if (jaExiste) continue;

        try {
          await prisma.livro.create({
            data: {
              google_book_id: candidato.id,
              titulo:         candidato.titulo,
              autores:        candidato.autores,
              capa_url:       candidato.capa_url,
              usuario_id,
              status:         'quero_ler',
            },
          });
          continuacoes_adicionadas++;
          vagasDisponiveis--;
        } catch (err: unknown) {
          if (
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            (err as { code: string }).code !== 'P2002'
          ) {
            console.error('Erro ao criar continuação:', err);
          }
        }
      }
    }
    // ───────────────────────────────────────────────────────────────────────

    return NextResponse.json({ ...livroAtualizado, continuacoes_adicionadas });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno no servidor';
    console.error('Erro ao atualizar status do livro:', msg);
    return NextResponse.json({ error: 'Erro interno no servidor', details: msg }, { status: 500 });
  }
}

// ─── DELETE /api/livros ───────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const usuario_id = getUserIdFromRequest(request);
    if (!usuario_id) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const livro_id = searchParams.get('livro_id');

    if (!livro_id) {
      return NextResponse.json({ error: 'Informe o livro_id.' }, { status: 400 });
    }

    const livroExistente = await prisma.livro.findFirst({
      where: { id: livro_id, usuario_id },
    });

    if (!livroExistente) {
      return NextResponse.json(
        { error: 'Livro não encontrado para o usuário autenticado.' },
        { status: 404 }
      );
    }

    await prisma.livro.delete({ where: { id: livro_id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno no servidor';
    console.error('Erro ao remover livro:', msg);
    return NextResponse.json({ error: 'Erro interno no servidor', details: msg }, { status: 500 });
  }
}

// ─── POST /api/livros ─────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const usuario_id = getUserIdFromRequest(request);
    if (!usuario_id) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    const { google_book_id, titulo, autores, capa_url, status: statusBody } = body;

    if (!google_book_id || !titulo) {
      return NextResponse.json(
        { error: 'Dados insuficientes. Certifique-se de enviar google_book_id e titulo.' },
        { status: 400 }
      );
    }

    // Valida o status enviado — se inválido ou ausente usa quero_ler como padrão
    const statusFinal: StatusLeitura =
      statusBody && STATUS_VALUES.includes(statusBody as StatusLeitura)
        ? (statusBody as StatusLeitura)
        : 'quero_ler';

    // Só conta no limite se o novo livro vai para quero_ler ou lendo
    const contaNoLimite = statusFinal === 'quero_ler' || statusFinal === 'lendo';

    if (contaNoLimite) {
      const livrosPendentes = await prisma.livro.count({
        where: {
          usuario_id,
          status: { in: ['quero_ler', 'lendo'] },
        },
      });
      const LIMITE_ALERTA = 15;
      if (livrosPendentes >= LIMITE_ALERTA) {
        return NextResponse.json(
          {
            error:   'Alerta de Acúmulo!',
            message: `Você já tem ${livrosPendentes} livros na fila. Termine um antes de adicionar outro!`,
          },
          { status: 403 }
        );
      }
    }

    const novoLivro = await prisma.livro.create({
      data: {
        google_book_id,
        titulo,
        autores:  autores || [],
        capa_url,
        usuario_id,
        status:   statusFinal,
      },
    });

    return NextResponse.json(novoLivro, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Este livro já está na sua estante.' }, { status: 409 });
    }

    const msg = error instanceof Error ? error.message : 'Erro interno no servidor';
    console.error('Erro ao salvar livro:', msg);
    return NextResponse.json({ error: 'Erro interno no servidor', details: msg }, { status: 500 });
  }
}