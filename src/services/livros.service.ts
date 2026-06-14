import * as LivrosRepository from '@/repositories/livros.repository';
import type { StatusLeitura } from '@/repositories/livros.repository';

export class LivroNaoEncontradoError extends Error {
  constructor() { super('Livro não encontrado para o usuário autenticado.'); }
}
export class LimiteFilaError extends Error {
  constructor(public readonly pendentes: number) {
    super(`Você já tem ${pendentes} livros na fila. Termine um antes de adicionar outro!`);
  }
}
export class StatusInvalidoError extends Error {
  constructor() { super('Status inválido.'); }
}
export class LivroJaNaEstanteError extends Error {
  constructor() { super('Este livro já está na sua estante.'); }
}
export async function listarLivros(usuario_id: string) {
  return LivrosRepository.findAllByUsuario(usuario_id);
}

const STATUS_VALIDOS: StatusLeitura[] = ['quero_ler', 'lendo', 'lido', 'abandonado'];
const LIMITE_FILA = 15;

export async function adicionarLivro(usuario_id: string,dados: {google_book_id: string;titulo: string;autores?: string[];capa_url?: string;status?: string;}) {
  const { google_book_id, titulo, autores, capa_url, status: statusRaw } = dados;
  const status: StatusLeitura = statusRaw && STATUS_VALIDOS.includes(statusRaw as StatusLeitura) ? (statusRaw as StatusLeitura) : 'quero_ler';

  const jaExiste = await LivrosRepository.findByGoogleBookId(google_book_id, usuario_id);
  if (jaExiste) {
    throw new LivroJaNaEstanteError()
  };
  if (status === 'quero_ler' || status === 'lendo') {
    const pendentes = await LivrosRepository.countPendentes(usuario_id);
    console.log(`[LIMITE] usuario_id=${usuario_id} pendentes=${pendentes}`);
    if (pendentes >= LIMITE_FILA) throw new LimiteFilaError(pendentes);
  }
  return LivrosRepository.create({google_book_id, titulo, autores: autores || [], capa_url, usuario_id, status,});
}

export async function atualizarStatus(usuario_id: string,livro_id: string,status: string,avaliacao?: number | null) {
  if (!STATUS_VALIDOS.includes(status as StatusLeitura)) {
    throw new StatusInvalidoError();
  }

  const livro = await LivrosRepository.findById(livro_id, usuario_id);
  if (!livro) throw new LivroNaoEncontradoError();

  if (status === 'quero_ler' || status === 'lendo') {
    const pendentes = await LivrosRepository.countPendentes(usuario_id);
    if (pendentes >= LIMITE_FILA) throw new LimiteFilaError(pendentes);
  }

  const avaliacaoValida = avaliacao != null && Number.isInteger(avaliacao) && avaliacao >= 1 && avaliacao <= 5 ? avaliacao : null;

  return LivrosRepository.update(livro_id, {status: status as StatusLeitura, avaliacao: avaliacaoValida, data_finalizacao: status === 'lido' ? new Date() : null,});
}

export async function removerLivro(usuario_id: string, livro_id: string) {
  const livro = await LivrosRepository.findById(livro_id, usuario_id);
  if (!livro) throw new LivroNaoEncontradoError();
  return LivrosRepository.remove(livro_id);
}