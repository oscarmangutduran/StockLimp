import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import ProductManagement from './pages/ProductManagement';
import ForgotPassword from './pages/ForgotPassword';
import './css/App.css'; // Ruta hacia tu carpeta CSS

const App = () => {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('login'); 

    useEffect(() => {
        const savedUser = localStorage.getItem('session_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('session_user');
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('session_user');
        setUser(null);
        setView('login');
    };

    if (!user) {
        return (
            <div className="auth-wrapper">
                {view === 'login' ? (
                    <Login 
                        onLoginSuccess={(userData) => setUser(userData)} 
                        onForgotPassword={() => setView('forgot')} 
                    />
                ) : (
                    <ForgotPassword 
                        onBack={() => setView('login')} 
                    />
                )}
            </div>
        );
    }

    return (
        <div className="main-app">
            <header className="top-nav">
                <div className="logo-section"><h1>StockLimp</h1></div>
                <div className="user-controls">
                    <span>Bienvenido, <strong>{user.nombre}</strong></span>
                    <button className="btn-exit" onClick={handleLogout}>Cerrar Sesión</button>
                </div>
            </header>
            <main className="content-area">
                <ProductManagement />
            </main>
        </div>
    );
};

export default App;