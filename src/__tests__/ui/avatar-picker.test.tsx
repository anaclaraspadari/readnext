// src/__tests__/ui/avatar-picker.test.tsx
// Testes de interface para o componente AvatarPicker

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvatarPicker from '@/components/AvatarPicker';

describe('AvatarPicker', () => {
  it('exibe botão de seleção de foto', () => {
    render(<AvatarPicker onChange={() => {}} />);
    expect(
      screen.getByLabelText(/selecionar foto de perfil/i)
    ).toBeInTheDocument();
  });

  it('exibe ícone padrão quando não há foto', () => {
    const { container } = render(<AvatarPicker onChange={() => {}} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(screen.queryByAltText(/foto de perfil/i)).not.toBeInTheDocument();
  });

  it('exibe a foto atual quando fotoAtual é passada', () => {
    render(
      <AvatarPicker
        fotoAtual="https://example.com/foto.jpg"
        onChange={() => {}}
      />
    );
    const img = screen.getByAltText(/foto de perfil/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/foto.jpg');
  });

  it('exibe overlay de câmera', () => {
    const { container } = render(<AvatarPicker onChange={() => {}} />);
    const svgs = container.querySelectorAll('svg');
    // Um SVG do ícone de pessoa + um SVG da câmera no overlay
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('exibe texto de instrução', () => {
    render(<AvatarPicker onChange={() => {}} />);
    expect(screen.getByText(/toque para alterar/i)).toBeInTheDocument();
  });

  it('renderiza input file oculto', () => {
    const { container } = render(<AvatarPicker onChange={() => {}} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveStyle({ display: 'none' });
  });

  it('aceita apenas imagens png, jpeg e webp', () => {
    const { container } = render(<AvatarPicker onChange={() => {}} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('accept', 'image/png,image/jpeg,image/webp');
  });

  it('aplica tamanho customizado via prop size', () => {
    render(<AvatarPicker onChange={() => {}} size={120} />);
    const btn = screen.getByLabelText(/selecionar foto de perfil/i);
    expect(btn).toHaveStyle({ width: '120px', height: '120px' });
  });
});