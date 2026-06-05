import * as UsuarioRepository from '@/repositories/usuario.repository';
import { hashPassword, comparePassword, createToken } from '@/lib/auth';

// ── Erros de domínio ─────────────────────────────────────────────────────────

export class CredenciaisInvalidasError extends Error {
  constructor() { super('E-mail ou senha inválidos.'); }
}

export class EmailJaCadastradoError extends Error {
  constructor() { super('Já existe um usuário cadastrado com esse e-mail.'); }
}

export class UsuarioNaoEncontradoError extends Error {
  constructor() { super('Sessão inválida.'); }
}

// ── Use cases ────────────────────────────────────────────────────────────────

export async function registrar(nome: string, email: string, senha: string) {
  const emailNorm = email.toLowerCase();

  const existente = await UsuarioRepository.findByEmail(emailNorm);
  if (existente) throw new EmailJaCadastradoError();

  const senhaHash = await hashPassword(senha);
  const usuario   = await UsuarioRepository.create({ nome, email: emailNorm, senha: senhaHash });
  const token     = createToken(usuario.id);

  return { usuario, token };
}

export async function login(email: string, senha: string) {
  const emailNorm = email.toLowerCase();

  const usuario = await UsuarioRepository.findByEmail(emailNorm);
  if (!usuario) throw new CredenciaisInvalidasError();

  const senhaValida = await comparePassword(senha, usuario.senha);
  if (!senhaValida) throw new CredenciaisInvalidasError();

  const token = createToken(usuario.id);
  return { usuario, token };
}

export async function obterUsuario(id: string) {
  const usuario = await UsuarioRepository.findById(id);
  if (!usuario) throw new UsuarioNaoEncontradoError();
  return usuario;
}

export async function atualizarFoto(id: string, foto_url: string) {
  return UsuarioRepository.update(id, { foto_url });
}