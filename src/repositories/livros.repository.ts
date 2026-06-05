import { prisma } from '@/lib/prisma';

export type StatusLeitura = 'quero_ler' | 'lendo' | 'lido' | 'abandonado';

export interface CriarLivroDTO {
  google_book_id: string;
  titulo: string;
  autores: string[];
  capa_url?: string;
  usuario_id: string;
  status: StatusLeitura;
}

export interface AtualizarLivroDTO {
  status: StatusLeitura;
  avaliacao?: number | null;
  data_finalizacao?: Date | null;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function findAllByUsuario(usuario_id: string) {
  return prisma.livro.findMany({
    where: { usuario_id },
    orderBy: [{ data_finalizacao: 'desc' }, { data_adicionado: 'desc' }],
  });
}

export async function findById(id: string, usuario_id: string) {
  return prisma.livro.findFirst({
    where: { id, usuario_id },
  });
}

export async function findByGoogleBookId(google_book_id: string, usuario_id: string) {
  return prisma.livro.findFirst({
    where: { google_book_id, usuario_id },
  });
}

export async function countPendentes(usuario_id: string) {
  return prisma.livro.count({
    where: {
      usuario_id,
      OR: [{ status: 'quero_ler' }, { status: 'lendo' }],
    },
  });
}

// ── Commands ─────────────────────────────────────────────────────────────────

export async function create(data: CriarLivroDTO) {
  return prisma.livro.create({ data });
}

export async function update(id: string, data: AtualizarLivroDTO) {
  return prisma.livro.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.livro.delete({ where: { id } });
}