import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ProductManagement from './pages/ProductManagement';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleLoginSuccess = (user) => {
    setUserData(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUserData(null);
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <Routes>
        {/* 1. Ruta de Login */}
        <Route path="/" element={
          !isLoggedIn ? 
          <Login onLoginSuccess={handleLoginSuccess} /> : 
          <Navigate to="/productos" replace />
        } />

        {/* 2. Rutas de Gestión: Todas cargan ProductManagement */}
        {/* Es fundamental que existan estas tres para que la URL cambie arriba */}
        <Route path="/productos" element={
          isLoggedIn ? 
          <ProductManagement userData={userData} onLogout={handleLogout} /> : 
          <Navigate to="/" replace />
        } />

        <Route path="/pedidos" element={
          isLoggedIn ? 
          <ProductManagement userData={userData} onLogout={handleLogout} /> : 
          <Navigate to="/" replace />
        } />

        <Route path="/centros_trabajo" element={
          isLoggedIn ? 
          <ProductManagement userData={userData} onLogout={handleLogout} /> : 
          <Navigate to="/" replace />
        } />

        {/* 3. Redirección por defecto para rutas no existentes */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/productos" : "/"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;