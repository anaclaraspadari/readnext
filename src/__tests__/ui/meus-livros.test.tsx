// src/__tests__/ui/meus-livros.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MeusLivrosPage from '@/app/meus-livros/page';

jest.mock('next/navigation', () => ({
  useRouter:   jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/meus-livros'),
}));

jest.mock('@/components/BaseLayout', () => {
  return function MockBaseLayout({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

// Helper — define as duas respostas que a página precisa
// (1ª chamada: /api/auth/me, 2ª chamada: /api/livros)
function setupFetch(usuario: object, livros: object[], extra: object[] = []) {
  const fn = global.fetch as jest.Mock;
  fn.mockResolvedValueOnce({ ok: true, status: 200, json: async () => usuario });
  fn.mockResolvedValueOnce({ ok: true, status: 200, json: async () => livros });
  extra.forEach((data) =>
    fn.mockResolvedValueOnce({ ok: true, status: 200, json: async () => data })
  );
}

const usuarioMock = { nome: 'Ana', email: 'ana@email.com' };

const livrosMock = [
  {
    id: '1', titulo: 'O Hobbit', autores: ['Tolkien'],
    status: 'lendo', google_book_id: 'gb_001', capa_url: null, avaliacao: null,
  },
  {
    id: '2', titulo: 'Harry Potter', autores: ['Rowling'],
    status: 'lido', google_book_id: 'gb_002', capa_url: null, avaliacao: 5,
  },
  {
    id: '3', titulo: 'Duna', autores: ['Herbert'],
    status: 'quero_ler', google_book_id: 'gb_003', capa_url: null, avaliacao: null,
  },
];

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// Renderização
// ─────────────────────────────────────────────────────────────────────────────

describe('Meus Livros — Renderização', () => {
  it('exibe o título Lista de livros', async () => {
    setupFetch(usuarioMock, livrosMock);
    render(<MeusLivrosPage />);
    expect(await screen.findByText('Lista de livros')).toBeInTheDocument();
  });

  it('renderiza os livros do usuário', async () => {
    setupFetch(usuarioMock, livrosMock);
    render(<MeusLivrosPage />);
    expect(await screen.findByText('O Hobbit')).toBeInTheDocument();
    expect(screen.getByText('Harry Potter')).toBeInTheDocument();
    expect(screen.getByText('Duna')).toBeInTheDocument();
  });

  it('exibe o status de cada livro', async () => {
    setupFetch(usuarioMock, livrosMock);
    render(<MeusLivrosPage />);
    await screen.findByText('O Hobbit');

    // Usa getAllByText pois o select de filtro também contém esses textos
    expect(screen.getAllByText(/^lendo$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^lido$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^quero ler$/i).length).toBeGreaterThan(0);
  });

  it('exibe estrelas para livros com avaliação', async () => {
    setupFetch(usuarioMock, livrosMock);
    render(<MeusLivrosPage />);
    await screen.findByText('Harry Potter');
    expect(screen.getByText('★★★★★')).toBeInTheDocument();
  });

  it('exibe mensagem quando lista está vazia', async () => {
    setupFetch(usuarioMock, []);
    render(<MeusLivrosPage />);
    expect(await screen.findByText(/nenhum livro encontrado/i)).toBeInTheDocument();
  });

  it('renderiza botão Alterar status para cada livro', async () => {
    setupFetch(usuarioMock, livrosMock);
    render(<MeusLivrosPage />);
    await screen.findByText('O Hobbit');
    const botoes = screen.getAllByRole('button', { name: /alterar status/i });
    expect(botoes).toHaveLength(livrosMock.length);
  });

  it('renderiza botão Remover para cada livro', async () => {
    setupFetch(usuarioMock, livrosMock);
    render(<MeusLivrosPage />);
    await screen.findByText('O Hobbit');
    // getAllByRole pois há múltiplos botões Remover (um por livro)
    const botoes = screen.getAllByRole('button', { name: /^remover$/i });
    expect(botoes).toHaveLength(livrosMock.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Filtro
// ─────────────────────────────────────────────────────────────────────────────

describe('Meus Livros — Filtro', () => {
  it('renderiza o select de categorias', async () => {
    setupFetch(usuarioMock, livrosMock);
    render(<MeusLivrosPage />);
    await screen.findByText('Lista de livros');
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('exibe apenas livros do status selecionado', async () => {
    setupFetch(usuarioMock, livrosMock);
    const user = userEvent.setup();
    render(<MeusLivrosPage />);

    await screen.findByText('O Hobbit');
    await user.selectOptions(screen.getByRole('combobox'), 'lido');

    expect(screen.getByText('Harry Potter')).toBeInTheDocument();
    expect(screen.queryByText('O Hobbit')).not.toBeInTheDocument();
    expect(screen.queryByText('Duna')).not.toBeInTheDocument();
  });

  it('exibe mensagem quando filtro não tem livros', async () => {
    setupFetch(usuarioMock, livrosMock);
    const user = userEvent.setup();
    render(<MeusLivrosPage />);

    await screen.findByText('O Hobbit');
    await user.selectOptions(screen.getByRole('combobox'), 'abandonado');

    expect(screen.getByText(/nenhum livro encontrado/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Modal de Status
// ─────────────────────────────────────────────────────────────────────────────

describe('Meus Livros — Modal de Status', () => {
  it('abre modal ao clicar em Alterar status', async () => {
    setupFetch(usuarioMock, livrosMock);
    const user = userEvent.setup();
    render(<MeusLivrosPage />);

    await screen.findByText('O Hobbit');
    await user.click(screen.getAllByRole('button', { name: /alterar status/i })[0]);

    expect(screen.getByText(/quantas estrelas/i)).toBeInTheDocument();
  });

  it('exibe título do livro no modal', async () => {
    setupFetch(usuarioMock, livrosMock);
    const user = userEvent.setup();
    render(<MeusLivrosPage />);

    await screen.findByText('O Hobbit');
    await user.click(screen.getAllByRole('button', { name: /alterar status/i })[0]);

    // Título aparece tanto na lista quanto no modal
    expect(screen.getAllByText('O Hobbit').length).toBeGreaterThan(1);
  });

  it('fecha modal ao clicar no backdrop', async () => {
    setupFetch(usuarioMock, livrosMock);
    const user = userEvent.setup();
    render(<MeusLivrosPage />);

    await screen.findByText('O Hobbit');
    await user.click(screen.getAllByRole('button', { name: /alterar status/i })[0]);

    expect(screen.getByText(/quantas estrelas/i)).toBeInTheDocument();

    // Clica no backdrop pelo data-testid adicionado no componente
    fireEvent.click(screen.getByTestId('modal-status-backdrop'));

    expect(screen.queryByText(/quantas estrelas/i)).not.toBeInTheDocument();
  });

  it('renderiza 5 estrelas no modal', async () => {
    setupFetch(usuarioMock, livrosMock);
    const user = userEvent.setup();
    render(<MeusLivrosPage />);

    await screen.findByText('O Hobbit');
    await user.click(screen.getAllByRole('button', { name: /alterar status/i })[0]);

    const estrelas = screen.getAllByRole('button', { name: /estrela/i });
    expect(estrelas).toHaveLength(5);
  });

  it('chama a API ao confirmar status', async () => {
    setupFetch(usuarioMock, livrosMock,
      [{ id: '1', status: 'lido' }],  // resposta do PATCH
    );
    // Recarrega a lista após salvar
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => usuarioMock })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => livrosMock });

    const user = userEvent.setup();
    render(<MeusLivrosPage />);

    await screen.findByText('O Hobbit');
    await user.click(screen.getAllByRole('button', { name: /alterar status/i })[0]);
    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/livros',
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Remoção
// ─────────────────────────────────────────────────────────────────────────────

describe('Meus Livros — Remoção', () => {
  it('abre modal de confirmação ao clicar em Remover', async () => {
    setupFetch(usuarioMock, livrosMock);
    const user = userEvent.setup();
    render(<MeusLivrosPage />);

    await screen.findByText('O Hobbit');
    await user.click(screen.getAllByRole('button', { name: /^remover$/i })[0]);

    expect(screen.getByText(/remover livro/i)).toBeInTheDocument();
  });

  it('exibe título do livro no modal de confirmação', async () => {
    setupFetch(usuarioMock, livrosMock);
    const user = userEvent.setup();
    render(<MeusLivrosPage />);

    await screen.findByText('O Hobbit');
    await user.click(screen.getAllByRole('button', { name: /^remover$/i })[0]);

    expect(screen.getAllByText('O Hobbit').length).toBeGreaterThan(1);
  });

  it('fecha modal ao clicar em Cancelar', async () => {
    setupFetch(usuarioMock, livrosMock);
    const user = userEvent.setup();
    render(<MeusLivrosPage />);

    await screen.findByText('O Hobbit');
    await user.click(screen.getAllByRole('button', { name: /^remover$/i })[0]);
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.queryByText(/remover livro/i)).not.toBeInTheDocument();
  });

  it('chama a API de remoção ao confirmar', async () => {
    setupFetch(usuarioMock, livrosMock);
    // Resposta do DELETE + reload da lista
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => usuarioMock })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => livrosMock });

    const user = userEvent.setup();
    render(<MeusLivrosPage />);

    await screen.findByText('O Hobbit');

    // Abre o modal de confirmação do primeiro livro
    await user.click(screen.getAllByRole('button', { name: /^remover$/i })[0]);

    // Pega o último botão "Remover" — é o do modal de confirmação
    const botoesRemover = screen.getAllByRole('button', { name: /^remover$/i });
    await user.click(botoesRemover[botoesRemover.length - 1]);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/livros'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});