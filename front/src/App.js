import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import ProductManagement from './pages/ProductManagement';

const App = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('session_user');
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);

    const logout = () => {
        localStorage.removeItem('session_user');
        setUser(null);
    };

    if (!user) return <Login onLoginSuccess={setUser} />;

    return (
        <div>
            <header style={{ background: '#2c3e50', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Sesión: <strong>{user.nombre}</strong> ({user.rol})</span>
                <button onClick={logout} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                    Salir
                </button>
            </header>
            <ProductManagement />
        </div>
    );
};

export default App;