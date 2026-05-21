import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

// Rota para atualizar a foto do usuário autenticado - POST /api/auth/avatar

function getExtensionFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,/i);
  if (!match) return null;
  const mime = match[1];
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  return null;
}

async function saveBase64Image(dataUrl: string, filename: string) {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  const base64 = dataUrl.replace(/^data:image\/.+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const filePath = path.join(uploadsDir, filename);

  await fs.promises.writeFile(filePath, buffer);

  return `/uploads/${filename}`;
}

export async function PUT(request: Request) {
  const userId = getUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { foto } = body;

    if (!foto || typeof foto !== 'string') {
      return NextResponse.json({ error: 'Envie a imagem em base64 no campo `foto`.' }, { status: 400 });
    }

    const ext = getExtensionFromDataUrl(foto) || 'png';
    const filename = `${userId}.${ext}`;

    const fotoUrl = await saveBase64Image(foto, filename);

    const user = await prisma.usuario.update({ where: { id: userId }, data: { foto_url: fotoUrl } });

    return NextResponse.json({ foto_url: user.foto_url });
  } catch (err) {
    console.error('Erro ao atualizar avatar:', err);
    return NextResponse.json({ error: 'Erro interno ao salvar a imagem.' }, { status: 500 });
  }
}
