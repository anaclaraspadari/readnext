const mockFn = () => jest.fn() as jest.Mock;

jest.mock('@/lib/prisma', () => ({
  prisma: {
    livro: {
      findMany:   mockFn(),
      findFirst:  mockFn(),
      findUnique: mockFn(),
      create:     mockFn(),
      update:     mockFn(),
      delete:     mockFn(),
      count:      mockFn(),
    },
    usuario: {
      findUnique: mockFn(),
      findFirst:  mockFn(),
      create:     mockFn(),
      update:     mockFn(),
    },
  },
}));