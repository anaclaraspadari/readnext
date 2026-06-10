/* eslint-disable @typescript-eslint/no-explicit-any */
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

export const mockFetch = (data: any) => {
  (global.fetch as any) = jest.fn().mockResolvedValueOnce({
    json: async () => data,
  });
};

export const mockFetchError = (error: Error) => {
  (global.fetch as any) = jest.fn().mockRejectedValueOnce(error);
};

export const mockRequest = (body: object = {}, searchParams: Record<string, string> = {}) => {
  const url = new URL('http://localhost:3000/api/livros');
  Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
 
  return {
    json:    async () => body,
    url:     url.toString(),
    headers: new Headers({ cookie: 'auth_token=valid_token' }),
  } as unknown as Request;
};