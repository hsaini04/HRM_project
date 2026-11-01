import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';
import { DemoProvider } from './context/DemoContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <DemoProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </DemoProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
