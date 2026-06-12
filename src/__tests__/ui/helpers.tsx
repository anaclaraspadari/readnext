/* eslint-disable @typescript-eslint/no-explicit-any */
// src/__tests__/ui/helpers.tsx
import React from 'react';
import { render } from '@testing-library/react';

// Mock do fetch — simula resposta bem sucedida
export const mockFetch = (data: any, status = 200) => {
  (global.fetch as any) = jest.fn().mockResolvedValue({
    ok:   status >= 200 && status < 300,
    status,
    json: async () => data,
  });
};

// Mock do fetch — simula múltiplas respostas em sequência
// Uso: mockFetchSequence({ data: usuario }, { data: livros })
export const mockFetchSequence = (...responses: Array<{ data: any; status?: number }>) => {
  const fn = jest.fn();
  responses.forEach(({ data, status = 200 }) => {
    fn.mockResolvedValueOnce({
      ok:   status >= 200 && status < 300,
      status,
      json: async () => data,
    });
  });
  (global.fetch as any) = fn;
};

// Mock do fetch — simula falha de rede
export const mockFetchError = (message = 'Network error') => {
  (global.fetch as any) = jest.fn().mockRejectedValue(new Error(message));
};

export const mockPush    = jest.fn();
export const mockReplace = jest.fn();

export function renderWithProviders(ui: React.ReactElement) {
  return render(ui);
}