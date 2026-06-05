import { NextResponse } from 'next/server';
import { getUserIdFromRequest, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/lib/auth';
import * as AuthService from '@/services/auth.service';
import {
  CredenciaisInvalidasError,
  EmailJaCadastradoError,
  UsuarioNaoEncontradoError,
} from '@/services/auth.service';

function setCookieToken(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

export async function login(request: Request) {
  try {
    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json({ error: 'Informe e-mail e senha.' }, { status: 400 });
    }

    const { usuario, token } = await AuthService.login(email, senha);
    const response = NextResponse.json(
      { id: usuario.id, nome: usuario.nome, email: usuario.email },
      { status: 200 }
    );
    setCookieToken(response, token);
    return response;
  } catch (err) {
    if (err instanceof CredenciaisInvalidasError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    const msg = err instanceof Error ? err.message : 'Erro interno.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function logout() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return response;
}

export async function me(request: Request) {
  const usuario_id = getUserIdFromRequest(request);
  if (!usuario_id) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  try {
    const usuario = await AuthService.obterUsuario(usuario_id);
    return NextResponse.json({
      id:       usuario.id,
      nome:     usuario.nome,
      email:    usuario.email,
      foto_url: usuario.foto_url ?? null,
    });
  } catch (err) {
    if (err instanceof UsuarioNaoEncontradoError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function register(request: Request) {
  try {
    const { nome, email, senha } = await request.json();

    if (!nome || !email || !senha) {
      return NextResponse.json({ error: 'Informe nome, e-mail e senha.' }, { status: 400 });
    }

    const { usuario, token } = await AuthService.registrar(nome, email, senha);
    const response = NextResponse.json(
      { id: usuario.id, nome: usuario.nome, email: usuario.email },
      { status: 201 }
    );
    setCookieToken(response, token);
    return response;
  } catch (err) {
    if (err instanceof EmailJaCadastradoError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const msg = err instanceof Error ? err.message : 'Erro interno.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}