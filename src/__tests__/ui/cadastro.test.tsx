import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CadastroPage from '@/app/register/page';
import { mockFetch } from './helpers';
 
jest.mock('next/navigation', () => ({
  useRouter:   jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/register'),
}));
 
jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});
 
jest.mock('@/components/AvatarPicker', () => {
  return function MockAvatarPicker({ onChange }: { onChange: (s: string) => void }) {
    return (
      <button onClick={() => onChange('data:image/png;base64,mock')}>
        Selecionar foto
      </button>
    );
  };
});
 
beforeEach(() => jest.clearAllMocks());
 
describe('Página de Cadastro — Renderização', () => {
  it('exibe o título ReadNext', () => {
    render(<CadastroPage />);
    expect(screen.getByText('ReadNext')).toBeInTheDocument();
  });
 
  it('exibe o subtítulo Cadastre-se', () => {
    render(<CadastroPage />);
    expect(screen.getByText('Cadastre-se')).toBeInTheDocument();
  });
 
  it('renderiza campo Nome do usuário', () => {
    render(<CadastroPage />);
    expect(screen.getByText('Nome do usuário')).toBeInTheDocument();
  });
 
  it('renderiza campo E-mail', () => {
    render(<CadastroPage />);
    expect(screen.getByText('E-mail')).toBeInTheDocument();
  });
 
  it('renderiza campo Senha', () => {
    render(<CadastroPage />);
    expect(screen.getAllByText(/senha/i).length).toBeGreaterThan(0);
  });
 
  it('renderiza campo Confirmar senha', () => {
    render(<CadastroPage />);
    expect(screen.getByText('Confirmar senha')).toBeInTheDocument();
  });
 
  it('renderiza opções Sim e Não', () => {
    render(<CadastroPage />);
    expect(screen.getByText('Sim')).toBeInTheDocument();
    expect(screen.getByText('Não')).toBeInTheDocument();
  });
 
  it('renderiza botão Cadastrar', () => {
    render(<CadastroPage />);
    expect(screen.getByRole('button', { name: /cadastrar/i })).toBeInTheDocument();
  });
 
  it('renderiza link Voltar', () => {
    render(<CadastroPage />);
    expect(screen.getByText(/voltar/i)).toBeInTheDocument();
  });
});
 
describe('Página de Cadastro — Validações', () => {
  it('exibe erro quando campos estão vazios', async () => {
    const user = userEvent.setup();
    render(<CadastroPage />);
 
    await user.click(screen.getByRole('button', { name: /cadastrar/i }));
 
    expect(screen.getByText(/preencha todos/i)).toBeInTheDocument();
  });
 
  it('exibe erro quando senhas não coincidem', async () => {
    const user = userEvent.setup();
    render(<CadastroPage />);
 
    const inputs = document.querySelectorAll('input');
    await user.type(inputs[0], 'Ana Clara');
    await user.type(inputs[1], 'ana@email.com');
    await user.type(inputs[2], 'senha123');
    await user.type(inputs[3], 'senhadiferente');
    await user.click(screen.getByRole('button', { name: /cadastrar/i }));
 
    expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument();
  });
 
  it('exibe erro quando termos não são respondidos', async () => {
    const user = userEvent.setup();
    render(<CadastroPage />);
 
    const inputs = document.querySelectorAll('input');
    await user.type(inputs[0], 'Ana Clara');
    await user.type(inputs[1], 'ana@email.com');
    await user.type(inputs[2], 'senha123');
    await user.type(inputs[3], 'senha123');
    await user.click(screen.getByRole('button', { name: /cadastrar/i }));
 
    expect(screen.getByText(/indique se aceita/i)).toBeInTheDocument();
  });
 
  it('chama fetch ao submeter formulário válido', async () => {
    mockFetch({ id: '1', nome: 'Ana Clara', email: 'ana@email.com' }, 201);
    const user = userEvent.setup();
    const { container } = render(<CadastroPage />);

    const inputs = document.querySelectorAll('input');
    await user.type(inputs[0], 'Ana Clara');
    await user.type(inputs[1], 'ana@email.com');
    await user.type(inputs[2], 'senha123');
    await user.type(inputs[3], 'senha123');

    const spansSim = container.querySelectorAll('span[style*="border-radius: 50%"]');
    fireEvent.click(spansSim[0]);

    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({ method: 'POST' })
    );
  });
});
