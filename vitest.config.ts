import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: resolve(process.cwd()),
  test: {
    include: ['server/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
  },
});
