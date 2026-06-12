/* eslint-disable @typescript-eslint/no-explicit-any */
// src/__tests__/ui/profile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { validarNome } from '@/app/profile/page';

describe('validarNome — validação pura', () => {
  it('retorna erro para nome vazio', () => {
    expect(validarNome('')).toMatch(/não pode estar vazio/i);
  });

  it('retorna erro para nome só com espaços', () => {
    expect(validarNome('   ')).toMatch(/não pode estar vazio/i);
  });

  it('retorna null para nome válido', () => {
    expect(validarNome('Ana Clara')).toBeNull();
  });
});

jest.mock('next/navigation', () => ({
  useRouter:   jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/profile'),
}));

jest.mock('@/components/BaseLayout', () => {
  return function MockBaseLayout({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

jest.mock('@/components/AvatarPicker', () => {
  return function MockAvatarPicker({
    onChange,
    fotoAtual,
  }: {
    onChange: (s: string) => void;
    fotoAtual?: string;
  }) {
    return (
      <div>
        {fotoAtual && <img src={fotoAtual} alt="foto de perfil" />}
        <button type="button" onClick={() => onChange('data:image/png;base64,mock')}>
          Alterar foto
        </button>
      </div>
    );
  };
});

import ProfilePage from '@/app/profile/page';

const usuarioMock = {
  id:       '1',
  nome:     'Ana Clara',
  email:    'ana@email.com',
  foto_url: null,
};

function mockFetchByUrl(routes: Record<string, { data: any; ok?: boolean }>) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    for (const pattern in routes) {
      if (url.includes(pattern)) {
        const { data, ok = true } = routes[pattern];
        return Promise.resolve({
          ok,
          status: ok ? 200 : 400,
          json: async () => data,
        });
      }
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
  });
}

beforeEach(() => jest.clearAllMocks());

describe('Perfil — Renderização', () => {
  it('exibe o título Alterar dados', async () => {
    mockFetchByUrl({ '/api/auth/me': { data: usuarioMock } });
    render(<ProfilePage />);
    expect(await screen.findByText('Alterar dados')).toBeInTheDocument();
  });

  it('exibe o nome do usuário no campo', async () => {
    mockFetchByUrl({ '/api/auth/me': { data: usuarioMock } });
    render(<ProfilePage />);
    const input = await screen.findByTestId('profile-nome-input');
    expect(input).toHaveValue('Ana Clara');
  });

  it('exibe o e-mail do usuário desabilitado', async () => {
    mockFetchByUrl({ '/api/auth/me': { data: usuarioMock } });
    render(<ProfilePage />);
    const input = await screen.findByTestId('profile-email-input');
    expect(input).toHaveValue('ana@email.com');
    expect(input).toBeDisabled();
  });

  it('exibe aviso de que e-mail não pode ser alterado', async () => {
    mockFetchByUrl({ '/api/auth/me': { data: usuarioMock } });
    render(<ProfilePage />);
    expect(await screen.findByText(/e-mail não pode ser alterado/i)).toBeInTheDocument();
  });

  it('renderiza botão Salvar alterações', async () => {
    mockFetchByUrl({ '/api/auth/me': { data: usuarioMock } });
    render(<ProfilePage />);
    expect(await screen.findByRole('button', { name: /salvar alterações/i })).toBeInTheDocument();
  });

  it('exibe estado de carregamento antes dos dados', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<ProfilePage />);
    expect(screen.getByTestId('profile-loading')).toBeInTheDocument();
  });
});

describe('Perfil — Validações', () => {
  it('exibe mensagem de sucesso após salvar sem alterar foto', async () => {
    mockFetchByUrl({ '/api/auth/me': { data: usuarioMock } });
    const user = userEvent.setup();
    render(<ProfilePage />);

    const input = await screen.findByTestId('profile-nome-input');
    expect(input).toHaveValue('Ana Clara');

    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByTestId('profile-sucesso')).toHaveTextContent('Dados updated com sucesso!');
  });
});

describe('Perfil — Foto', () => {
  it('chama API de avatar ao alterar foto e salvar', async () => {
    mockFetchByUrl({
      '/api/auth/me':     { data: usuarioMock },
      '/api/auth/avatar': { data: { foto_url: '/uploads/1.png' } },
    });

    const user = userEvent.setup();
    render(<ProfilePage />);

    const input = await screen.findByTestId('profile-nome-input');
    expect(input).toHaveValue('Ana Clara');

    await user.click(screen.getByRole('button', { name: /alterar foto/i }));
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    expect(await screen.findByTestId('profile-sucesso')).toHaveTextContent('Dados updated com sucesso!');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/avatar',
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('exibe foto atual quando usuário tem foto', async () => {
    mockFetchByUrl({
      '/api/auth/me': { data: { ...usuarioMock, foto_url: 'https://example.com/foto.jpg' } },
    });
    render(<ProfilePage />);

    const img = await screen.findByAltText(/foto de perfil/i);
    expect(img).toHaveAttribute('src', 'https://example.com/foto.jpg');
  });
});