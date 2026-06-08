export const asMock = (fn: unknown) => fn as jest.Mock;
 
export const mockLivro = (overrides = {}) => ({
  id:              'livro-uuid-1',
  google_book_id:  'gb_001',
  titulo:          'O Hobbit',
  autores:         ['J.R.R. Tolkien'],
  capa_url:        'https://books.google.com/capa.jpg',
  status:          'quero_ler' as const,
  avaliacao:       null,
  usuario_id:      'user-uuid-1',
  data_adicionado: new Date('2024-01-01'),
  data_finalizacao:null,
  ...overrides,
});
 
export const mockUsuario = (overrides = {}) => ({
  id:       'user-uuid-1',
  nome:     'Ana Clara',
  email:    'ana@email.com',
  senha:    '$2b$10$hashedpassword',
  foto_url: null,
  ...overrides,
});
