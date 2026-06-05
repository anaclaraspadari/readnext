import { prisma } from '@/lib/prisma';

export interface CriarUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  foto_url?: string;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function findById(id: string) {
  return prisma.usuario.findUnique({ where: { id } });
}

export async function findByEmail(email: string) {
  return prisma.usuario.findUnique({ where: { email } });
}

// ── Commands ─────────────────────────────────────────────────────────────────

export async function create(data: CriarUsuarioDTO) {
  return prisma.usuario.create({ data });
}

export async function update(id: string, data: Partial<CriarUsuarioDTO>) {
  return prisma.usuario.update({ where: { id }, data });
}