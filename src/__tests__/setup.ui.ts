// src/__tests__/setup.ui.ts
import '@testing-library/jest-dom';

// Define o fetch global para o ambiente jsdom
// sem isso, fetch retorna undefined e causa "Cannot read properties of undefined (reading 'ok')"
global.fetch = jest.fn();