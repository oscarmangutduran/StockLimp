import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Montaje de la aplicación en el DOM
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);