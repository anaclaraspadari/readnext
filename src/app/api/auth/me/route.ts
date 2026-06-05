// Rota para obter os dados do usuário autenticado - GET /api/auth/me

import * as AuthController from '@/controllers/auth.controller';

export const GET = AuthController.me;