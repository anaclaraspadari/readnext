/* eslint-disable @typescript-eslint/no-unused-vars */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { asMock, mockFetch, mockLivro, mockRequest } from '../mocks';
import { headers } from 'next/headers';
import * as LivrosController from '@/controllers/livros.controller';
import * as LivrosService from '@/services/livros.service';
 
const prismaMock = prisma as jest.Mocked<typeof prisma>;

jest.mock('@/lib/auth', () => ({
  getUserIdFromRequest: jest.fn(() => 'user-uuid-1'),
  AUTH_COOKIE_NAME:    'auth_token',
  AUTH_COOKIE_MAX_AGE: 86400,
  hashPassword:        jest.fn(async (s: string) => `hashed_${s}`),
  comparePassword:     jest.fn(async () => true),
  createToken:         jest.fn(() => 'jwt_mock'),
}));
 
beforeEach(async () => jest.clearAllMocks());
 
describe('CT35 - Títulos longos são tratados pelo serviço',()=>{
    it('salva titulo longo sem truncar no banco',async()=>{
        const tituloLongo='A'.repeat(300);
        asMock(prisma.livro.findFirst as jest.Mock).mockResolvedValue(null);
        asMock(prisma.livro.count as jest.Mock).mockResolvedValue(0);
        asMock(prisma.livro.create as jest.Mock).mockResolvedValue(mockLivro({titulo:tituloLongo}));

        const {adicionarLivro} = await import('@/services/livros.service');
        const livro=await adicionarLivro('user-uuid-1',{google_book_id:'gb_longo',titulo:tituloLongo});

        expect(livro.titulo.length).toBe(300);
    });
});

describe('CT36 - Dados persistem ao recarregar (leitura do banco)',()=>{
    it('listarLivros retorna os mesmos dados salvos no banco', async()=>{
        const listaLivros = [
            mockLivro({ id: 'l1', status: 'lendo' }),
            mockLivro({ id: 'l2', status: 'lido'  }),
        ];
        asMock(prisma.livro.findMany as jest.Mock).mockResolvedValue(listaLivros);

        const {listarLivros}=await import('@/services/livros.service');
        const result=await listarLivros('user-uuid-1');

        expect(result).toHaveLength(2);
        expect(result.find((l) => l.id === 'l1')?.status).toBe('lendo');
        expect(result.find((l) => l.id === 'l2')?.status).toBe('lido');
    });
});

describe('CT38 - Busca com query vazia é bloqueada no controller', () => {
  it('controller retorna status 400 quando query é vazia', async () => {
    jest.resetModules();
    const { search } = await import('@/controllers/search.controller');
    const req = mockRequest({}, {});
    const res  = await search(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/obrigat/i);
  });

  it('controller retorna 400 para query com apenas espaços', async () => {
    jest.resetModules();
    const { search } = await import('@/controllers/search.controller');

    mockFetch({ items: [] });

    const url = new URL('http://localhost:3000/api/search');
    url.searchParams.set('q', '   ');
    const req = { url: url.toString(), headers: new Headers() } as Request;
    const res  = await search(req);

    expect(res.status).toBe(400);
  });
});

describe('CT39 — Controller responde sem erros síncronos', () => {
  it('getAll retorna 200 com array de livros', async () => {
    asMock(prisma.livro.findMany).mockResolvedValue([mockLivro()]);

    const res  = await LivrosController.getAll(mockRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it('create retorna 201 ao adicionar livro válido', async () => {
    asMock(prisma.livro.findFirst).mockResolvedValue(null);
    asMock(prisma.livro.count).mockResolvedValue(0);
    asMock(prisma.livro.create).mockResolvedValue(mockLivro());

    const res = await LivrosController.create(mockRequest({
      google_book_id: 'gb_001',
      titulo:         'O Hobbit',
      autores:        ['Tolkien'],
    }));

    expect(res.status).toBe(201);
  });

  it('create retorna 403 quando limite de 15 é atingido',async()=>{
    asMock(prisma.livro.findFirst as jest.Mock).mockResolvedValue(null);
    asMock(prisma.livro.count as jest.Mock).mockResolvedValue(15);

    const res=await LivrosController.create(mockRequest({
      google_book_id: 'gb_001',
      titulo:         'Mais um livro',
    }));
    const body=await res.json()

    expect(res.status).toBe(403);
    expect(body.error).toBe('Alerta de Acúmulo!');
  });

  it('create retorna 409 para livro duplicado',async()=>{
    asMock(prisma.livro.findFirst as jest.Mock).mockResolvedValue(mockLivro());

    const res=await LivrosController.create(mockRequest({
      google_book_id: 'gb_001',
      titulo:         'O Hobbit',
    }));

    expect(res.status).toBe(409);
  });
});

describe('CT40 — Estado vazio quando não há livros',()=>{
  it('listarLivros retorna array vazio para usuário sem livros',async()=>{
    asMock(prisma.livro.findMany as jest.Mock).mockResolvedValue([]);

    const res=await LivrosService.listarLivros('user-uuid-1');

    expect(res).toEqual([]);
    expect(res).toHaveLength(0);
  });

  it('filtrar por status inexistente retorna array vazio',async()=>{
    const listaLivros=[mockLivro({status:'lendo'})];
    asMock(prisma.livro.findMany as jest.Mock).mockResolvedValue(listaLivros);

    const todos=await LivrosService.listarLivros('user-uuid-1');
    const soAbandonados=todos.filter((l) => l.status === 'abandonado')

    expect(soAbandonados).toHaveLength(0);
  })
})