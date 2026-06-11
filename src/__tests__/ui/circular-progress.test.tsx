import { render, screen } from '@testing-library/react';
import CircularProgress from '@/components/CircularProgress';

describe('CircularProgress', () => {
  it('exibe o percentual correto', () => {
    render(<CircularProgress percent={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('exibe 0% quando percent é zero', () => {
    render(<CircularProgress percent={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('exibe 100% quando percent é 100', () => {
    render(<CircularProgress percent={100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('limita a 100% mesmo com valor maior que 100', () => {
    render(<CircularProgress percent={150} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renderiza SVG com aria-label acessível', () => {
    render(<CircularProgress percent={50} />);
    expect(screen.getByLabelText(/50% da meta/i)).toBeInTheDocument();
  });

  it('renderiza dois círculos SVG (track e progress)', () => {
    const { container } = render(<CircularProgress percent={60} />);
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
  });

  it('arredonda percentuais decimais', () => {
    render(<CircularProgress percent={33.7} />);
    expect(screen.getByText('34%')).toBeInTheDocument();
  });
});