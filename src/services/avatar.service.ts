import fs from 'fs';
import path from 'path';
import * as UsuarioRepository from '@/repositories/usuario.repository';

// ── Erros de domínio ─────────────────────────────────────────────────────────

export class FotoInvalidaError extends Error {
  constructor() { super('Envie a imagem em base64 no campo `foto`.'); }
}

export class FormatoNaoSuportadoError extends Error {
  constructor() { super('Formato de imagem não suportado. Use PNG, JPG ou WEBP.'); }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getExtension(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,/i);
  if (!match) return null;
  const mime = match[1];
  if (mime.includes('png'))               return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp'))              return 'webp';
  return null;
}

async function salvarImagem(dataUrl: string, filename: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const base64  = dataUrl.replace(/^data:image\/.+;base64,/, '');
  const buffer  = Buffer.from(base64, 'base64');
  const filePath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/${filename}`;
}

// ── Use cases ────────────────────────────────────────────────────────────────

export async function atualizarAvatar(usuario_id: string, foto: unknown) {
  if (!foto || typeof foto !== 'string') throw new FotoInvalidaError();

  const ext = getExtension(foto);
  if (!ext) throw new FormatoNaoSuportadoError();

  const filename = `${usuario_id}.${ext}`;
  const foto_url = await salvarImagem(foto, filename);

  const usuario = await UsuarioRepository.update(usuario_id, { foto_url });
  return { foto_url: usuario.foto_url };
}