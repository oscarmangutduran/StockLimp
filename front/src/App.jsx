import React, { useState } from 'react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

function App() {
  // Estado global para almacenar los datos del usuario autenticado (id_user, nombre, rol)
  const [user, setUser] = useState(null);

  // Función que se ejecuta tras un login exitoso desde el componente Login
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  // Función para destruir la sesión local y regresar al formulario de acceso
  const handleLogout = () => {
    setUser(null);
  };

  return (
    <>
      {!user ? (
        // Si el estado 'user' es null, forzamos la vista de autenticación
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        // Si el usuario ya existe en el estado, cargamos el panel de control central
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;