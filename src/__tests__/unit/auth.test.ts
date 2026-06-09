import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import * as AuthService from '@/services/auth.service';
import {CredenciaisInvalidasError, EmailJaCadastradoError, UsuarioNaoEncontradoError} from '@/services/auth.service';
import { asMock, mockUsuario } from '../mocks';

const prismaMock = prisma as jest.Mocked<typeof prisma>;

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(async()=>'$2b$10$hashedpassword'),
  comparePassword: jest.fn(async()=>true),
  createToken: jest.fn(()=>'mocked-jwt-token'),
  getUserIdFromRequest: jest.fn(()=>'user-uuid-1'),
  AUTH_COOKIE_NAME: 'auth_token',
  AUTH_COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 7 dias
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CT24 - Criar conta com email e senha validos', () => {
  it('registra usuario e retorna token', async () => {
    const usuario = mockUsuario({ 
      nome:  'Test User', 
      email: 'test@example.com' 
    });
    asMock(prisma.usuario.findUnique).mockResolvedValue(null);
    asMock(prisma.usuario.create).mockResolvedValue(usuario);

    const result = await AuthService.registrar('Test User', 'test@example.com', 'password123');

    expect(result.usuario.email).toBe('test@example.com');
    expect(result.token).toBeDefined();
    expect(asMock(prisma.usuario.create)).toHaveBeenCalledTimes(1);
  });
});