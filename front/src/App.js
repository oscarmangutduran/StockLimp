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
        {/* Login */}
        <Route path="/" element={
          !isLoggedIn ? 
          <Login onLoginSuccess={handleLoginSuccess} /> : 
          <Navigate to={(userData?.rol === 'admin' || userData?.nombre === 'Oscar Mangut') ? "/productos" : "/pedidos"} replace />
        } />

        {/* Rutas de Gestión */}
        {['/productos', '/pedidos', '/centros_trabajo', '/users'].map(path => (
          <Route key={path} path={path} element={
            isLoggedIn ? 
            <ProductManagement userData={userData} onLogout={handleLogout} /> : 
            <Navigate to="/" replace />
          } />
        ))}

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to={isLoggedIn ? ((userData?.rol === 'admin' || userData?.nombre === 'Oscar Mangut') ? "/productos" : "/pedidos") : "/"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;