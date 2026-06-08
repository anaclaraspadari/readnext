import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import * as AuthService from '@/services/auth.service';
import { mockUsuario, mockRequest } from '../mocks';

const prismaMock = prisma as jest.Mocked<typeof prisma>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
});
