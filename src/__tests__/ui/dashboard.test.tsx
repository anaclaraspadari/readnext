/* eslint-disable @typescript-eslint/no-require-imports */
// src/__tests__/ui/dashboard.test.tsx
import { render, screen } from '@testing-library/react';

// ─── Testes unitários das funções puras (sem fetch, sem render) ───────────────
// Importa as funções exportadas do dashboard
import { calcularMetrics, getMensagem } from '@/app/dashboard/page';

describe('calcularMetrics — lógica de métricas', () => {
  it('calcula percentual ignorando abandonados', () => {
    const livros = [
      { id: '1', status: 'lido'       },
      { id: '2', status: 'lido'       },
      { id: '3', status: 'lendo'      },
      { id: '4', status: 'quero_ler'  },
      { id: '5', status: 'abandonado' },
    ];
    const { percent, total } = calcularMetrics(livros);
    // 2 lidos de 4 ativos = 50%
    expect(percent).toBe(50);
    expect(total).toBe(4); // abandonado não conta
  });

  it('retorna 0% para estante vazia', () => {
    const { percent, total } = calcularMetrics([]);
    expect(percent).toBe(0);
    expect(total).toBe(0);
  });

  it('retorna 100% quando todos os ativos estão lidos', () => {
    const livros = [
      { id: '1', status: 'lido' },
      { id: '2', status: 'lido' },
    ];
    const { percent } = calcularMetrics(livros);
    expect(percent).toBe(100);
  });

  it('conta corretamente lendo e quero_ler', () => {
    const livros = [
      { id: '1', status: 'lendo'      },
      { id: '2', status: 'quero_ler'  },
      { id: '3', status: 'quero_ler'  },
    ];
    const { lendo, queroLer, lidos } = calcularMetrics(livros);
    expect(lendo).toBe(1);
    expect(queroLer).toBe(2);
    expect(lidos).toBe(0);
  });
});

describe('getMensagem — mensagens de progresso', () => {
  it('retorna mensagem para estante vazia', () => {
    expect(getMensagem(0, 0)).toMatch(/adicione livros/i);
  });

  it('retorna parabéns para 100%', () => {
    expect(getMensagem(100, 2)).toMatch(/parabéns/i);
  });

  it('retorna "Quase lá" para 75%', () => {
    expect(getMensagem(75, 4)).toMatch(/quase lá/i);
  });

  it('retorna "metade do caminho" para 50%', () => {
    expect(getMensagem(50, 4)).toMatch(/metade do caminho/i);
  });

  it('retorna "Continue lendo" para menos de 50%', () => {
    expect(getMensagem(25, 4)).toMatch(/continue lendo/i);
  });
});

// ─── Testes de interface do componente ───────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter:   jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/dashboard'),
}));

jest.mock('@/components/BaseLayout', () => {
  return function MockBaseLayout({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

jest.mock('@/components/CircularProgress', () => {
  return function MockCircularProgress({ percent }: { percent: number }) {
    return <div data-testid="circular-progress">{percent}%</div>;
  };
});

// Importa o componente DEPOIS dos mocks
import DashboardPage from '@/app/dashboard/page';

function setupFetch(usuario: object, livros: object[]) {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => usuario })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => livros });
}

const usuarioMock = { nome: 'Ana', email: 'ana@email.com' };

beforeEach(() => jest.clearAllMocks());

describe('Dashboard — Componente', () => {
  it('exibe nome do usuário após carregar', async () => {
    setupFetch(usuarioMock, []);
    render(<DashboardPage />);
    expect(await screen.findByText(/Ana/)).toBeInTheDocument();
  });

  it('exibe texto da meta de leitura', async () => {
    setupFetch(usuarioMock, []);
    render(<DashboardPage />);
    expect(await screen.findByText(/meta de leitura/i)).toBeInTheDocument();
  });

  it('renderiza o gráfico circular após carregar', async () => {
    setupFetch(usuarioMock, []);
    render(<DashboardPage />);
    expect(await screen.findByTestId('circular-progress')).toBeInTheDocument();
  });

  it('exibe cards de estatísticas quando há livros', async () => {
    setupFetch(usuarioMock, [
      { id: '1', status: 'lido'      },
      { id: '2', status: 'lendo'     },
      { id: '3', status: 'quero_ler' },
    ]);
    render(<DashboardPage />);
    await screen.findByTestId('circular-progress');
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Lidos')).toBeInTheDocument();
    expect(screen.getByText('Lendo')).toBeInTheDocument();
    expect(screen.getByText('Quero ler')).toBeInTheDocument();
  });

  it('redireciona para login se /api/auth/me falhar', async () => {
    const pushMock = jest.fn();
    const { useRouter } = require('next/navigation');
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, status: 401, json: async () => ({ error: 'Não autenticado.' }),
    });

    render(<DashboardPage />);
    await screen.findByText(/bem vindo/i);
    expect(pushMock).toHaveBeenCalledWith('/login');
  });
});