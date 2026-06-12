/* eslint-disable @typescript-eslint/no-explicit-any */
// src/__tests__/ui/livros.test.tsx
// Testes de interface para a página de Busca de Livros

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LivrosPage from '@/app/livros/page';
import { mockFetchSequence, mockFetch } from './helpers';

jest.mock('next/navigation', () => ({
  useRouter:   jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/livros'),
}));

jest.mock('@/components/BaseLayout', () => {
  return function MockBaseLayout({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

beforeEach(() => jest.clearAllMocks());

const resultadosBuscaMock = [
  {
    id: 'gb_001',
    title: 'O Hobbit',
    author_name: ['J.R.R. Tolkien'],
    first_publish_year: '1937',
    cover_url: undefined,
    language: 'pt',
    ja_adicionado: false,
  },
  {
    id: 'gb_002',
    title: 'O Senhor dos Anéis',
    author_name: ['J.R.R. Tolkien'],
    first_publish_year: '1954',
    cover_url: undefined,
    language: 'pt',
    ja_adicionado: true,
  },
];

describe('Busca de Livros — Renderização', () => {
  it('exibe o título Adicionar novos livros', () => {
    render(<LivrosPage />);
    expect(screen.getByText('Adicionar novos livros')).toBeInTheDocument();
  });

  it('renderiza campo de pesquisa', () => {
    render(<LivrosPage />);
    expect(screen.getByPlaceholderText(/pesquisar/i)).toBeInTheDocument();
  });

  it('renderiza seletor de tipo de busca', () => {
    render(<LivrosPage />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('renderiza opções Título e Autor no seletor', () => {
    render(<LivrosPage />);
    expect(screen.getByRole('option', { name: /título/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /autor/i })).toBeInTheDocument();
  });

  it('renderiza botão Buscar', () => {
    render(<LivrosPage />);
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
  });

  it('exibe empty state quando não há resultados', () => {
    render(<LivrosPage />);
    expect(screen.getByText(/pesquise um livro/i)).toBeInTheDocument();
  });
});

describe('Busca de Livros — Validações', () => {
  it('botão Buscar está desabilitado quando campo está vazio', () => {
    render(<LivrosPage />);
    const botao = screen.getByRole('button', { name: /buscar/i });
    expect(botao).toBeDisabled();
  });

  it('botão Buscar fica habilitado após digitar no campo', async () => {
    const user = userEvent.setup();
    render(<LivrosPage />);

    await user.type(screen.getByPlaceholderText(/pesquisar/i), 'O Hobbit');

    const botao = screen.getByRole('button', { name: /buscar/i });
    expect(botao).not.toBeDisabled();
  });

  it('exibe mensagem de erro quando busca não encontra resultados', async () => {
    mockFetch([]);
    const user = userEvent.setup();
    render(<LivrosPage />);

    await user.type(screen.getByPlaceholderText(/pesquisar/i), 'xyzxyzxyz');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    expect(await screen.findByText(/nenhum livro encontrado/i)).toBeInTheDocument();
  });
});

describe('Busca de Livros — Resultados', () => {
  it('exibe livros após busca', async () => {
    mockFetch(resultadosBuscaMock);
    const user = userEvent.setup();
    render(<LivrosPage />);

    await user.type(screen.getByPlaceholderText(/pesquisar/i), 'Tolkien');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    expect(await screen.findByText('O Hobbit')).toBeInTheDocument();
    expect(await screen.findByText('O Senhor dos Anéis')).toBeInTheDocument();
  });

  it('exibe badge ✓ em livros já adicionados', async () => {
    mockFetch(resultadosBuscaMock);
    const user = userEvent.setup();
    render(<LivrosPage />);

    await user.type(screen.getByPlaceholderText(/pesquisar/i), 'Tolkien');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    await screen.findByText('O Senhor dos Anéis');
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('exibe "Buscando..." no botão durante a busca', async () => {
    (global.fetch as any) = jest.fn().mockImplementation(
      () => new Promise((resolve) =>
        setTimeout(() => resolve({
          ok: true, status: 200,
          json: async () => resultadosBuscaMock,
        }), 500)
      )
    );

    const user = userEvent.setup();
    render(<LivrosPage />);

    await user.type(screen.getByPlaceholderText(/pesquisar/i), 'Tolkien');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    expect(screen.getByRole('button', { name: /buscando/i })).toBeInTheDocument();
  });
});

describe('Busca de Livros — Bottom Sheet', () => {
  it('abre bottom sheet ao clicar nos três pontos', async () => {
    mockFetch(resultadosBuscaMock);
    const user = userEvent.setup();
    render(<LivrosPage />);

    await user.type(screen.getByPlaceholderText(/pesquisar/i), 'Tolkien');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await screen.findByText('O Hobbit');

    const botoesMenu = screen.getAllByLabelText(/opções/i);
    await user.click(botoesMenu[0]);

    expect(screen.getByText(/adicionar à estante como/i)).toBeInTheDocument();
  });

  it('exibe as 4 opções de status no bottom sheet', async () => {
    mockFetch(resultadosBuscaMock);
    const user = userEvent.setup();
    render(<LivrosPage />);

    await user.type(screen.getByPlaceholderText(/pesquisar/i), 'Tolkien');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await screen.findByText('O Hobbit');

    const botoesMenu = screen.getAllByLabelText(/opções/i);
    await user.click(botoesMenu[0]);

    expect(screen.getByText('Quero ler')).toBeInTheDocument();
    expect(screen.getByText('Lendo')).toBeInTheDocument();
    expect(screen.getByText('Lido')).toBeInTheDocument();
    expect(screen.getByText('Abandonado')).toBeInTheDocument();
  });

  it('fecha bottom sheet ao clicar em Cancelar', async () => {
    mockFetch(resultadosBuscaMock);
    const user = userEvent.setup();
    render(<LivrosPage />);

    await user.type(screen.getByPlaceholderText(/pesquisar/i), 'Tolkien');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await screen.findByText('O Hobbit');

    const botoesMenu = screen.getAllByLabelText(/opções/i);
    await user.click(botoesMenu[0]);
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.queryByText(/adicionar à estante como/i)).not.toBeInTheDocument();
  });

  it('chama API ao adicionar livro e exibe toast', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => resultadosBuscaMock, 
    }).mockResolvedValueOnce({
        ok: true, status: 201,
        json: async () => ({ id: 'novo', titulo: 'O Hobbit', status: 'quero_ler' }),
    });

    const user = userEvent.setup();
    render(<LivrosPage />);

    await user.type(screen.getByPlaceholderText(/pesquisar/i), 'Tolkien');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await screen.findByText('O Hobbit');

    const botoesMenu = screen.getAllByLabelText(/opções/i);
    await user.click(botoesMenu[0]);
    await user.click(screen.getByText('Quero ler'));

    expect(await screen.findByText(/adicionado como quero ler/i)).toBeInTheDocument();
  });
});