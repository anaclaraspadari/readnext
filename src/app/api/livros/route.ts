import * as LivrosController from '@/controllers/livros.controller';

export const GET    = LivrosController.getAll;
export const POST   = LivrosController.create;
export const PATCH  = LivrosController.update;
export const DELETE = LivrosController.remove;