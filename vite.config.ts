import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
// Vitest uses its sensible defaults (picks up tests/**/*.test.ts, node env),
// so no extra test config is needed here.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
