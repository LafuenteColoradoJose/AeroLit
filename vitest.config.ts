import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Simula el navegador para que Lit pueda renderizar el DOM
    include: ['src/**/*.test.ts'], // Dónde buscar los tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/components/**/*.ts'], // Qué archivos analizar para la cobertura
      exclude: ['src/**/*.test.ts']
    },
    reporters: ['default', 'html']
  },
});
