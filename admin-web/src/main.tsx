import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

console.log('App starting...');

import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Failed to find the root element');
} else {
  console.log('Root element found, mounting app...');
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
