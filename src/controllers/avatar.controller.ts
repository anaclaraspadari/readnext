import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import * as AvatarService from '@/services/avatar.service';
import { FotoInvalidaError, FormatoNaoSuportadoError } from '@/services/avatar.service';

export async function updateAvatar(request: Request) {
  const usuario_id = getUserIdFromRequest(request);
  if (!usuario_id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const body       = await request.json();
    const resultado  = await AvatarService.atualizarAvatar(usuario_id, body.foto);
    return NextResponse.json(resultado);
  } catch (err) {
    if (err instanceof FotoInvalidaError || err instanceof FormatoNaoSuportadoError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Erro ao atualizar avatar:', err);
    return NextResponse.json({ error: 'Erro interno ao salvar a imagem.' }, { status: 500 });
  }
}