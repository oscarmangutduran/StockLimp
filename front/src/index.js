import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Importamos el Router
import ProductManagement from './pages/ProductManagement';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* Envolvemos toda la App aquí */}
      <ProductManagement />
    </BrowserRouter>
  </React.StrictMode>
);