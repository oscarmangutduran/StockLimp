import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { userService, productService, orderService, centerService } from '../services/api';
import '../css/Dashboard.css';

const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Obtener el usuario autenticado desde el almacenamiento local
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    // Estados centralizados para almacenar en caché
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [centers, setCenters] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadProducts = async () => {
        try {
            const res = await productService.getAll();
            if (Array.isArray(res.data)) setProducts(res.data);
        } catch (err) {
            console.error("Error al cargar productos en layout:", err);
        }
    };

    const loadOrders = async () => {
        try {
            const params = {};
            if (user && user.rol === 'usuario') {
                params.id_user = user.id_user;
            }
            const res = await orderService.getAll(params);
            if (Array.isArray(res.data)) setOrders(res.data);
        } catch (err) {
            console.error("Error al cargar pedidos en layout:", err);
        }
    };

    const loadCenters = async () => {
        try {
            const res = await centerService.getAll();
            if (Array.isArray(res.data)) setCenters(res.data);
        } catch (err) {
            console.error("Error al cargar centros en layout:", err);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await userService.getAll();
            if (Array.isArray(res.data)) setUsers(res.data);
        } catch (err) {
            console.error("Error al cargar usuarios en layout:", err);
        }
    };

    const loadAllData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const promises = [];
            
            // Siempre cargar productos y pedidos
            promises.push(loadProducts());
            promises.push(loadOrders());
            
            // Cargar centros y usuarios sólo si es admin o super_admin
            if (user.rol === 'admin' || user.rol === 'super_admin') {
                promises.push(loadCenters());
                promises.push(loadUsers());
            }
            
            await Promise.all(promises);
        } catch (err) {
            console.error("Error al precargar datos:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, [user]);

    // Redirigir a login si no hay sesión iniciada
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Redirigir a pedidos si es un usuario estándar y está intentando acceder a otra pestaña
    if (user.rol === 'usuario' && !location.pathname.includes('/pedidos')) {
        return <Navigate to="/dashboard/pedidos" replace />;
    }

    // Mapear la ruta actual al tab activo del Navbar
    let activeTab = 'productos';
    if (location.pathname.includes('/pedidos')) {
        activeTab = 'pedidos';
    } else if (location.pathname.includes('/centros')) {
        activeTab = 'centros_trabajo';
    } else if (location.pathname.includes('/alta')) {
        activeTab = 'dar_de_alta';
    } else if (location.pathname.includes('/control')) {
        activeTab = 'control_panel';
    }

    // Cambiar la ruta en lugar de usar solo estado interno
    const handleTabChange = (tab) => {
        if (tab === 'productos') {
            navigate('/dashboard/productos');
        } else if (tab === 'pedidos') {
            navigate('/dashboard/pedidos');
        } else if (tab === 'centros_trabajo') {
            navigate('/dashboard/centros');
        } else if (tab === 'dar_de_alta') {
            navigate('/dashboard/alta');
        } else if (tab === 'control_panel') {
            navigate('/dashboard/control');
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
                    <Outlet context={{
                        products,
                        orders,
                        centers,
                        users,
                        loading,
                        loadProducts,
                        loadOrders,
                        loadCenters,
                        loadUsers,
                        loadAllData
                    }} />
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
