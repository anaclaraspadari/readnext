/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import * as SearchService from '@/services/search.service';
import { asMock } from '../mocks';
import { prisma } from '@/lib/prisma';

const mockFetch = (data: any) => {
  (global.fetch as any) = jest.fn<() => Promise<Partial<Response>>>().mockResolvedValueOnce({
    json: async () => data,
  });
};

beforeAll(() => {
  global.fetch = jest.fn() as unknown as typeof fetch;
});

const USUARIO_ID = 'user-uuid-1';

const googleBooksRes = {
  items: [{
    id: 'gb_001',
    volumeInfo: {
      title:   'O Hobbit',
      authors: ['J.R.R. Tolkien'],
      publishedDate: '1937-09-21',
      industryIdentifiers: [{ type: 'ISBN_13', identifier: '123-1234567890' }],
      imageLinks: { thumbnail: 'https://books.google.com/capa.jpg' },
      language: 'pt',
    },
  }],
};

beforeEach(() => {
  jest.clearAllMocks();
  asMock(prisma.livro.findMany).mockResolvedValue([]);
});

describe('CT18 — Busca por título retorna resultados corretamente', () => {
  it('retorna livros do Google Books ao buscar por título', async () => {
        mockFetch(googleBooksRes);
        const resultados = await SearchService.buscarLivros('O Hobbit', 'title', USUARIO_ID);

        expect(resultados).toHaveLength(1);
        expect(resultados[0].title).toBe('O Hobbit');
    });

    it('URL da busca por título não inclui inauthor:', async () => {
        mockFetch({ items: [] });

        await SearchService.buscarLivros('O Hobbit', 'title', USUARIO_ID);

        const urlChamada = (global.fetch as jest.Mock).mock.calls[0][0] as string;
        expect(urlChamada).not.toContain('inauthor');
    });
});

describe('CT19 - Busca por autor retorna livros do autor', () => {
    it('usa inauthor: na query quando searchType é author', async () => {
        mockFetch(googleBooksRes);
        const fetchSpy = global.fetch as jest.Mock;

        await SearchService.buscarLivros('Tolkien', 'author', USUARIO_ID);

        const urlChamada = fetchSpy.mock.calls[0][0] as string;
        expect(urlChamada).toContain('inauthor%3ATolkien');
    });
    it('retorna livros do autor corretamente', async () => {
        mockFetch(googleBooksRes);
        const resultados = await SearchService.buscarLivros('Tolkien', 'author', USUARIO_ID);
        expect(resultados).toHaveLength(1);
        expect(resultados[0].author_name).toContain('J.R.R. Tolkien');
    });
});

describe('CT20 - Nenhum resultado encontrado', () => {
    it('retorna array vazio quando a API não encontra livros', async () => {
        mockFetch({ items: [] });
        const resultados = await SearchService.buscarLivros('Livro Inexistente', 'title', USUARIO_ID);
        expect(resultados).toHaveLength(0);
    });
    it('retorna array vazio quando item é undefined', async () => {
        mockFetch({ items: undefined });
        const resultados = await SearchService.buscarLivros('Livro Inexistente', 'title', USUARIO_ID);
        expect(resultados).toHaveLength(0);
    });
});

describe('CT21 - Metadados capiturados corretamente', () => {
    it('mapeia titulo, autor, ISBN e capa corretamente', async () => {
        mockFetch(googleBooksRes);
        const resultados = await SearchService.buscarLivros('O Hobbit', 'title', USUARIO_ID);
        expect(resultados).toHaveLength(1);
        const livro = resultados[0];
        expect(livro.title).toBe('O Hobbit');
        expect(livro.author_name).toContain('J.R.R. Tolkien');
        expect(livro.isbn).toBe('123-1234567890');
        expect(livro.cover_url).toContain('https://');
    });

    it('converte URL da capa de http para https', async () => {
        mockFetch(googleBooksRes);
        const resultado = await SearchService.buscarLivros('qualquer','title');
        expect(resultado).toHaveLength(1);
        expect(resultado[0].cover_url).toMatch(/https:\/\/.*/);
    });
});

describe('CT22 - Placeholder quando livro não tem capa', () => {
    it('retorna URL undefined quando capa é ausente', async () => {
        mockFetch({items: [{
          id: 'gb_sem_capa',
          volumeInfo: {
            title:   'Livro Sem Capa',
            authors: ['Autor'],
            publishedDate: '2020',
            language: 'pt',
          },
        }] });
        const resultado = await SearchService.buscarLivros('qualquer','title');
        expect(resultado).toHaveLength(1);
        expect(resultado[0].cover_url).toBeUndefined();
    });
});

describe('CT23 - Resiliência quando a API está fora do ar', () => {
    it('lança erro quando fetch falha', async () => {
        (global.fetch as any) = jest.fn().mockImplementation(() => {
            throw new Error('Falha na API: Network error');
        });
        await expect(
            SearchService.buscarLivros('qualquer', 'title')
        ).rejects.toThrow('Falha na API: Network error');
    });

    it('lança erro quando API retorna erro interno', async () => {
        mockFetch({ error: { message: 'API quota exceeded', code: 429 } });
        await expect(
            SearchService.buscarLivros('qualquer', 'title', USUARIO_ID)
        ).rejects.toThrow('API quota exceeded');
    });
});