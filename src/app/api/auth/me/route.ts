import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// Rota para obter os dados do usuário autenticado - GET /api/auth/me

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const user = await prisma.usuario.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    nome: user.nome,
    email: user.email,
  });
}
