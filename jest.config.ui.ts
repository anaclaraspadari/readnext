// jest.config.ui.ts
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

// jest.config.ui.ts
const config: Config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts',
    '<rootDir>/src/__tests__/setup.ui.ts',
  ],
  testMatch: ['**/__tests__/ui/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },

  // ===== ADICIONE ISSO PARA GARANTIR QUE ELE FOQUE NOS COMPONENTES =====
  collectCoverage: true,
  coverageDirectory: 'coverage-ui', // <-- Nome diferente para não apagar o seu teste unitário!
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}', // Seus componentes visuais
    'src/app/**/*.{ts,tsx}',         // Suas páginas/telas do Next.js
    '!**/node_modules/**',
  ],
};

export default createJestConfig(config);