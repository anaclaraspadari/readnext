import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import * as LivrosService from '@/services/livros.service';
import { prisma } from '@/lib/prisma';
import { asMock, mockLivro } from '../mocks';
import { LimiteFilaError } from '@/services/livros.service';

// Tipagem dos mocks do Prisma
const prismaMock = prisma as jest.Mocked<typeof prisma>;

const USUARIO_ID = 'user-uuid-1';

const dadosNovoLivro = {
  google_book_id: 'gb_novo',
  titulo:         'Livro Novo',
  autores:        ['Autor'],
  capa_url:       'https://capa.jpg',
  status:         'quero_ler' as const,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CT01 — Adicionar o 1º livro com sucesso', () => {
  it('cria o livro quando não há nenhum livro ativo', async () => {
    asMock(prisma.livro.findFirst as jest.Mock).mockResolvedValue(null);
    asMock(prisma.livro.count    as jest.Mock).mockResolvedValue(0);
    asMock(prisma.livro.create   as jest.Mock).mockResolvedValue(mockLivro());

    const resultado = await LivrosService.adicionarLivro(USUARIO_ID, dadosNovoLivro);

    expect(prismaMock.livro.create).toHaveBeenCalledTimes(1);
    expect(resultado.titulo).toBe('O Hobbit');
  });
});

describe('CT02 — Adicionar até 14 livro com sucesso', () => {
  it('permite adicionar quando há 14 livros ativos', async () => {
    asMock(prisma.livro.findFirst as jest.Mock).mockResolvedValue(null);
    asMock(prisma.livro.count    as jest.Mock).mockResolvedValue(14);
    asMock(prisma.livro.create   as jest.Mock).mockResolvedValue(mockLivro());

    await expect(LivrosService.adicionarLivro(USUARIO_ID, dadosNovoLivro)).resolves.toBeDefined();
  });
});

describe('CT03 — Adicionar o 15º livro com sucesso', () => {
  it('cria o livro quando há 14 livros ativos', async () => {
    asMock(prisma.livro.findFirst as jest.Mock).mockResolvedValue(null);
    asMock(prisma.livro.count    as jest.Mock).mockResolvedValue(14);
    asMock(prisma.livro.create   as jest.Mock).mockResolvedValue(mockLivro());

    const resultado = await LivrosService.adicionarLivro(USUARIO_ID, dadosNovoLivro);

    expect(prismaMock.livro.create).toHaveBeenCalledTimes(1);
    expect(resultado.titulo).toBe('O Hobbit');
  });
});

describe('CT04 — Adicionar o 16º livro com falha', () => {
  it('lança erro quando há 15 livros ativos', async () => {
    asMock(prisma.livro.findFirst as jest.Mock).mockResolvedValue(null);
    asMock(prisma.livro.count    as jest.Mock).mockResolvedValue(15);

    await expect(LivrosService.adicionarLivro(USUARIO_ID, dadosNovoLivro)).rejects.toThrow(LimiteFilaError);
    expect(prismaMock.livro.create).not.toHaveBeenCalled();
  });

  it('mensagem de erro contém número de livros pendentes', async () => {
    asMock(prisma.livro.findFirst as jest.Mock).mockResolvedValue(null);
    asMock(prisma.livro.count    as jest.Mock).mockResolvedValue(15);

    try{
      await LivrosService.adicionarLivro(USUARIO_ID, dadosNovoLivro);
    }catch (error) {
      expect(error).toBeInstanceOf(LimiteFilaError);
      expect((error as LimiteFilaError).message).toContain('15');
    }
  });
});

describe('CT05 — Resposta da API retorna 403 com mensagem amigável', () => {
  it('o erro LimiteFilaError contém mensagem legível para o usuário', async () => {
    asMock(prismaMock.livro.findFirst as jest.Mock).mockResolvedValue(null);
    asMock(prismaMock.livro.count    as jest.Mock).mockResolvedValue(15);
 
    let mensagem = '';
    try {
      await LivrosService.adicionarLivro(USUARIO_ID, dadosNovoLivro);
    } catch (err) {
      mensagem = (err as Error).message;
    }
 
    expect(mensagem).toMatch(/15/);
    expect(mensagem.length).toBeGreaterThan(10);
  });
});

describe('CT06 — Vaga aberta ao mover livro para Lido/Abandonado', () => {
  it('simula que, apos mover um livro para Lido, uma vaga é aberta', async () => {
    asMock(prismaMock.livro.findFirst as jest.Mock).mockResolvedValue(null);
    asMock(prismaMock.livro.count    as jest.Mock).mockResolvedValue(14);
    asMock(prismaMock.livro.create   as jest.Mock).mockResolvedValue(mockLivro(mockLivro()));

    await expect(LivrosService.adicionarLivro(USUARIO_ID, {...dadosNovoLivro,})).resolves.toBeDefined();
  });
});

describe('CT07 — Tentativas diretas via API respeitam o bloqueio', () => {
  it('retorna LimiteFilaError mesmo sem passar pelo Front-End', async () => {
    asMock(prismaMock.livro.findFirst as jest.Mock).mockResolvedValue(null);
    asMock(prismaMock.livro.count    as jest.Mock).mockResolvedValue(15);

    await expect(LivrosService.adicionarLivro(USUARIO_ID, dadosNovoLivro)).rejects.toThrow(LimiteFilaError);
  });
});

