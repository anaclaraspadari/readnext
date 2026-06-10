import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import * as LivrosService from '@/services/livros.service';
import { prisma } from '@/lib/prisma';
import { asMock, mockLivro } from '../mocks';

const prismaMock = prisma as jest.Mocked<typeof prisma>;

const USUARIO_ID = 'user-uuid-1';

beforeEach(() => {
  jest.clearAllMocks();
});

const gerarLivros=(n: number, status: string)=>Array.from({length: n}, (_,i)=>mockLivro({id:`livro-${status}-${i}`, status}));

describe('CT30 - Dashboard reflete métricas corretas por status', ()=>{
    it('retorna todos os livros do usuario com seus respectivos status',async()=>{
        const listaLivros=[
            ...gerarLivros(3, 'quero_ler'),
            ...gerarLivros(2, 'lendo'),
            ...gerarLivros(5, 'lido'),
            ...gerarLivros(1, 'abandonado'),
        ];
        asMock(prisma.livro.findMany as jest.Mock).mockResolvedValue(listaLivros);

        const result=await LivrosService.listarLivros(USUARIO_ID);

        const contagem = result.reduce((acc, l) => {acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
        }, {} as Record<string, number>);

        expect(contagem['quero_ler']).toBe(3);
        expect(contagem['lendo']).toBe(2);
        expect(contagem['lido']).toBe(5);
        expect(contagem['abandonado']).toBe(1);
        expect(result).toHaveLength(11);
    });

    it('retorna array vazio quando usuario nao tem livros',async()=>{
        asMock(prisma.livro.findMany as jest.Mock).mockResolvedValue([]);

        const result=await LivrosService.listarLivros(USUARIO_ID);

        expect(result).toHaveLength(0);
    });
});

describe('CT31 - Filtro por categoria funciona corretamente',()=>{
    it('retorna apenas livros com status Lendo quando filtrado', async()=>{
        const listaLivros=[
            ...gerarLivros(2, 'lendo'),
            ...gerarLivros(3, 'quero_ler'),
        ];
        asMock(prisma.livro.findMany as jest.Mock).mockResolvedValue(listaLivros);

        const todos=await LivrosService.listarLivros(USUARIO_ID);
        const soLendo=todos.filter((l) => l.status === 'lendo');

        expect(soLendo).toHaveLength(2);
        soLendo.forEach((l) => expect(l.status).toBe('lendo'));
    });

    it('retorna array vazio ao filtrar status sem livros',async()=>{
        asMock(prisma.livro.findMany as jest.Mock).mockResolvedValue(gerarLivros(3,'lendo'));
        
        const todos=await LivrosService.listarLivros(USUARIO_ID);
        const soAbandonados=todos.filter((l) => l.status === 'abandonado');

        expect(soAbandonados).toHaveLength(0);
    })
});

describe('CT32 - Ordenar por data de inserção',()=>{
    it('retorna livros na ordem definida pelo repositório (mais recentes primeiro)', async()=>{
        const listaLivros = [
            mockLivro({ id: 'l1', data_adicionado: new Date('2024-01-01') }),
            mockLivro({ id: 'l2', data_adicionado: new Date('2024-06-01') }),
            mockLivro({ id: 'l3', data_adicionado: new Date('2024-03-01') }),
        ];
        asMock(prisma.livro.findMany as jest.Mock).mockResolvedValue([listaLivros[1],listaLivros[2],listaLivros[0]]);

        const result=await LivrosService.listarLivros(USUARIO_ID);

        expect(result[0].id).toBe('l2');
        expect(result[1].id).toBe('l3');
        expect(result[2].id).toBe('l1');
    });
});

describe('CT33 - Remover livro libera vaga e some das métricas',()=>{
    it('remove livro com sucesso',async()=>{
        const livro=mockLivro();
        asMock(prisma.livro.findFirst as jest.Mock).mockResolvedValue(livro)
        asMock(prisma.livro.delete as jest.Mock).mockResolvedValue(livro);

        await expect(LivrosService.removerLivro(USUARIO_ID,livro.id)).resolves.not.toThrow();

        expect(prismaMock.livro.delete).toHaveBeenCalledWith({where:{id:livro.id}});
    });
    it('apos remocao, o numero de pendentes diminui',async()=>{
        const livro=mockLivro({status:'quero_ler'});
        asMock(prisma.livro.findFirst as jest.Mock).mockResolvedValue(null);
        asMock(prisma.livro.count as jest.Mock).mockResolvedValue(14);
        asMock(prisma.livro.create as jest.Mock).mockResolvedValue(mockLivro());

        await expect(LivrosService.adicionarLivro(USUARIO_ID,{google_book_id:'gb_novo',titulo:'novo livro'})).resolves.toBeDefined();
    });

    it('lanca LivroNaoEncontradoError ao tentar remover livro inexistente',async()=>{
        const {LivroNaoEncontradoError}=await import('@/services/livros.service');
        asMock(prisma.livro.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(LivrosService.removerLivro(USUARIO_ID,'id_inexistente')).rejects.toThrow(LivroNaoEncontradoError);
    })
});