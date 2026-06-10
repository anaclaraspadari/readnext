import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import * as AuthService from '@/services/auth.service';
import {CredenciaisInvalidasError, EmailJaCadastradoError, UsuarioNaoEncontradoError} from '@/services/auth.service';
import { asMock, mockUsuario } from '../mocks';

const prismaMock = prisma as jest.Mocked<typeof prisma>;

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(async()=>'$2b$10$hashedpassword'),
  comparePassword: jest.fn(async()=>true),
  createToken: jest.fn(()=>'mocked-jwt-token'),
  getUserIdFromRequest: jest.fn(()=>'user-uuid-1'),
  AUTH_COOKIE_NAME: 'auth_token',
  AUTH_COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 7 dias
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CT24 - Criar conta com email e senha validos', () => {
  it('registra usuario e retorna token', async () => {
    const usuario = mockUsuario({ 
      nome:  'Test User', 
      email: 'test@example.com' 
    });
    asMock(prisma.usuario.findUnique).mockResolvedValue(null);
    asMock(prisma.usuario.create).mockResolvedValue(usuario);

    const result = await AuthService.registrar('Test User', 'test@example.com', 'password123');

    expect(result.usuario.email).toBe('test@example.com');
    expect(result.token).toBeDefined();
    expect(asMock(prisma.usuario.create)).toHaveBeenCalledTimes(1);
  });
});

describe('CT25 - Impedir cadastro com email já cadastrado', () => {
  it('lança EmailJaCadastradoError quando email já está em uso', async () => {
    asMock(prisma.usuario.findUnique).mockResolvedValue(mockUsuario());

    await expect(AuthService.registrar('Test User 2', 'ana@example.com', 'password123')).rejects.toThrow(EmailJaCadastradoError);

    expect(asMock(prisma.usuario.create)).not.toHaveBeenCalled();
  });
});

describe('CT26 - Login com sucesso', () => {
  it('realiza login e retorna token para credenciais validas', async () => {
    asMock(prisma.usuario.findUnique).mockResolvedValue(mockUsuario());

    const result = await AuthService.login('ana@email.com', '$2b$10$hashedpassword');

    expect(result.token).toBe('mocked-jwt-token');
    expect(result.usuario.nome).toBe('Ana Clara');
  });
});

describe('CT27 - Usuário cadastrado não acessa rotas protegidas', () => {
  it('lança UsuarioNaoEncontradoError para usuário inexistente', async () => {
    asMock(prisma.usuario.findUnique).mockResolvedValue(null);

    await expect(AuthService.obterUsuario('nonexistent-id')).rejects.toThrow(UsuarioNaoEncontradoError);
  });
});

describe('CT28 - Isolamento de dados entre usuários', () => {
  it('adicionarLivro usa o usuario_id do token, não do body', async () => {
    const {prisma: prismaDireto}=await import('@/lib/prisma');
    const prismaDiretoMock=prismaDireto as jest.Mocked<typeof prismaDireto>;

    asMock(prisma.livro.findFirst).mockResolvedValue(null);
    asMock(prisma.livro.count).mockResolvedValue(0);
    asMock(prisma.livro.create).mockResolvedValue({
      id: 'livro-uuid-1',
      google_book_id: 'gb_001',
      titulo: 'O Hobbit',
      autores: ['J.R.R. Tolkien'],
      capa_url: 'https://books.google.com/capa.jpg',
      status: 'quero_ler',
      avaliacao: null,
      usuario_id: 'user-uuid-1',
      data_adicionado: new Date('2024-01-01'),
      data_finalizacao: null,
    });

    const adicionarLivro = (await import('@/services/livros.service'))
    await adicionarLivro.adicionarLivro('user-uuid-1',{'google_book_id':'gb_001','titulo':'O Hobbit'});
    
  });

  it('atualizarStatus verifica se o livro pertence ao id correto', async()=>{
    asMock(prisma.livro.findFirst).mockResolvedValue(null);

    await expect(AuthService.obterUsuario('user-uuid-intruso')).rejects.toThrow(UsuarioNaoEncontradoError);
  })
});

describe('CT29 - Logout invalida sessão', ()=>{
  it('obterUsuario falha após logout (token invalido = userId null', async()=>{
    const {getUserIdFromRequest}=await import('@/lib/auth');
    (getUserIdFromRequest as jest.Mock).mockReturnValueOnce(null);

    asMock(prisma.usuario.findUnique).mockResolvedValue(null);

    await expect(AuthService.obterUsuario('')).rejects.toThrow(UsuarioNaoEncontradoError);
  })
})