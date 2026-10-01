import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
// Vitest는 기본 설정(tests/**/*.test.ts 수집, node 환경)을 그대로 쓰므로
// 여기에 별도 테스트 설정이 필요 없습니다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
