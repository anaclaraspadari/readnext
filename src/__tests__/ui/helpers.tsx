/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render } from '@testing-library/react';

export const mockFetch = (data: any, status = 200) => {
  (global.fetch as any) = jest.fn().mockResolvedValue({
    ok:   status >= 200 && status < 300,
    status,
    json: async () => data,
  });
};

export const mockFetchSequence = (...res: Array<{ data: any; status?: number }>) => {
    const fn=jest.fn();
    res.forEach(({ data, status = 200 }) => {
    fn.mockResolvedValueOnce({
      ok:   status >= 200 && status < 300,
      status,
      json: async () => data,
    });
  });
  (global.fetch as any) = fn;
}

export const mockFetchError = (msg = 'Network error') => {
  (global.fetch as any) = jest.fn().mockRejectedValue(new Error(msg));
};

export const mockPush = jest.fn();
export const mockReplace = jest.fn();

export function renderWithProviders(ui: React.ReactElement) {
  return render(ui);
}
