/* eslint-disable @typescript-eslint/no-explicit-any */
// src/__tests__/ui/login.test.tsx
// Testes de interface para a página de Login

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';
import { mockFetch, mockFetchSequence } from './helpers';

jest.mock('next/navigation', () => ({
  useRouter:   jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  usePathname: jest.fn(() => '/login'),
}));

jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

beforeEach(() => jest.clearAllMocks());

describe('Página de Login — Renderização', () => {
  it('exibe o título ReadNext', () => {
    render(<LoginPage />);
    expect(screen.getByText('ReadNext')).toBeInTheDocument();
  });

  it('exibe o subtítulo Login', () => {
    render(<LoginPage />);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renderiza campo de E-mail', () => {
    render(<LoginPage />);
    expect(screen.getByText('E-mail')).toBeInTheDocument();
  });

  it('renderiza campo de Senha', () => {
    render(<LoginPage />);
    expect(screen.getByText('Senha')).toBeInTheDocument();
  });

  it('renderiza botão Entrar', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('renderiza link Esqueceu a senha?', () => {
    render(<LoginPage />);
    expect(screen.getByText(/esqueceu a senha/i)).toBeInTheDocument();
  });

  it('renderiza link para cadastro', () => {
    render(<LoginPage />);
    expect(screen.getByText(/cadastre-se/i)).toBeInTheDocument();
  });

  it('renderiza botões de login social (Google e Facebook)', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/login com google/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/login com facebook/i)).toBeInTheDocument();
  });
});

describe('Página de Login — Validações', () => {
  it('exibe erro quando ambos os campos estão vazios', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByText(/preencha todos/i)).toBeInTheDocument();
  });

  it('exibe erro quando apenas e-mail está preenchido', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const inputs = document.querySelectorAll('input');
    await user.type(inputs[0], 'ana@email.com');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByText(/preencha todos/i)).toBeInTheDocument();
  });

  it('exibe mensagem de credenciais inválidas', async () => {
    mockFetch({ error: 'E-mail ou senha inválidos.' }, 401);
    const user = userEvent.setup();
    render(<LoginPage />);

    const inputs = document.querySelectorAll('input');
    await user.type(inputs[0], 'ana@email.com');
    await user.type(inputs[1], 'senhaerrada');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/inválidos/i)).toBeInTheDocument();
  });
});

describe('Página de Login — Interações', () => {
  it('exibe "Entrando..." durante o carregamento', async () => {
    (global.fetch as any) = jest.fn().mockImplementation(
      () => new Promise((resolve) =>
        setTimeout(() => resolve({
          ok: true, status: 200,
          json: async () => ({ nome: 'Ana' }),
        }), 500)
      )
    );

    const user = userEvent.setup();
    render(<LoginPage />);

    const inputs = document.querySelectorAll('input');
    await user.type(inputs[0], 'ana@email.com');
    await user.type(inputs[1], 'senha123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByRole('button', { name: /entrando/i })).toBeInTheDocument();
  });

  it('chama fetch com método POST ao submeter', async () => {
    mockFetch({ id: '1', nome: 'Ana', email: 'ana@email.com' });
    const user = userEvent.setup();
    render(<LoginPage />);

    const inputs = document.querySelectorAll('input');
    await user.type(inputs[0], 'ana@email.com');
    await user.type(inputs[1], 'senha123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST' })
    );
  });
});