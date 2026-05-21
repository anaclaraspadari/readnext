import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, createToken, AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME } from '@/lib/auth';

// Rota de login - POST /api/auth/login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, senha } = body;
    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Informe e-mail e senha.' },
        { status: 400 }
      );
    }
    const user = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos.' },
        { status: 401 }
      );
    }
    const senhaValida = await comparePassword(senha, user.senha);
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos.' },
        { status: 401 }
      );
    }
    const token = createToken(user.id);
    const response = NextResponse.json(
      {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
      { status: 200 }
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
    const errorMessage = error instanceof Error ? error.message : 'Erro interno no servidor.';
    console.error('Erro no login:', errorMessage);
    return NextResponse.json(
      { error: 'Erro interno no servidor.', details: errorMessage },
      { status: 500 }
    );
  }
}
