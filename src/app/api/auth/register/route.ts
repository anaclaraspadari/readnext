/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken, hashPassword, AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

// Rota de registro - POST /api/auth/register

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, senha, foto } = body;

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: 'Informe nome, e-mail e senha.' },
        { status: 400 }
      );
    }

    const senhaHash = await hashPassword(senha);

    const user = await prisma.usuario.create({
      data: {
        nome,
        email: email.toLowerCase(),
        senha: senhaHash,
      },
    });

    // If a base64 image was provided, save it to public/uploads and update the user
    if (foto && typeof foto === 'string') {
      const ext = getExtensionFromDataUrl(foto) || 'png';
      const filename = `${user.id}.${ext}`;
      try {
        const fotoUrl = await saveBase64Image(foto, filename);
        await prisma.usuario.update({ where: { id: user.id }, data: { foto_url: fotoUrl } });
        user.foto_url = fotoUrl as any;
      } catch (err) {
        console.error('Erro ao salvar foto:', err);
      }
    }

    const token = createToken(user.id);
    const response = NextResponse.json(
      {
        id: user.id,
        nome: user.nome,
        email: user.email,
        foto_url: (user as any).foto_url || null,
      },
      { status: 201 }
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Já existe um usuário cadastrado com esse e-mail.' },
          { status: 409 }
        );
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor.';
    console.error('Erro no cadastro:', errorMessage);

    return NextResponse.json(
      { error: 'Erro interno no servidor.', details: errorMessage },
      { status: 500 }
    );
  }
}
