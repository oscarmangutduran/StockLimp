import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../css/Dashboard.css';

const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Obtener el usuario autenticado desde el almacenamiento local
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    // Redirigir a login si no hay sesión iniciada
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Mapear la ruta actual al tab activo del Navbar
    let activeTab = 'productos';
    if (location.pathname.includes('/pedidos')) {
        activeTab = 'pedidos';
    } else if (location.pathname.includes('/centros')) {
        activeTab = 'centros_trabajo';
    }

    // Cambiar la ruta en lugar de usar solo estado interno
    const handleTabChange = (tab) => {
        if (tab === 'productos') {
            navigate('/dashboard/productos');
        } else if (tab === 'pedidos') {
            navigate('/dashboard/pedidos');
        } else if (tab === 'centros_trabajo') {
            navigate('/dashboard/centros');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="dashboard-layout">
            <Navbar 
                activeTab={activeTab} 
                setActiveTab={handleTabChange} 
                user={user} 
                onLogout={handleLogout} 
            />
            <div className="dashboard-content">
                <div className="tab-fade-in" key={location.pathname}>
                    {/* Renderiza las subrutas hijas de /dashboard */}
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
