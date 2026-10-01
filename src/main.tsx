import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('루트 요소 #root를 찾을 수 없습니다');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
