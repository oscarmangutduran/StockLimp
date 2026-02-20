import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProductManagement from './pages/ProductManagement';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirección inicial al login o productos */}
        <Route path="/" element={<Navigate to="/productos" />} />
        <Route path="/productos" element={<ProductManagement />} />
        <Route path="/pedidos" element={<ProductManagement />} />
        <Route path="/centros_trabajo" element={<ProductManagement />} />
      </Routes>
    </Router>
  );
}

export default App;