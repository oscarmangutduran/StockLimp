import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import CenterManagement from './CenterManagement';
// Dejamos preparadas las importaciones para los siguientes pasos:
// import ProductManagement from './ProductManagement';
// import OrderManagement from './OrderManagement';
import '../css/Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
    // Pestaña activa por defecto al entrar
    const [activeTab, setActiveTab] = useState('productos');

    // Función renderizadora condicional según la pestaña activa
    const renderTabContent = () => {
        switch (activeTab) {
            case 'productos':
                // Provisional hasta crear el archivo:
                return (
                    <div style={{ padding: '24px' }}>
                        <h2>Gestión de Productos</h2>
                        <p>Contenido de inventario en desarrollo...</p>
                    </div>
                );
            case 'pedidos':
                // Provisional hasta crear el archivo:
                return (
                    <div style={{ padding: '24px' }}>
                        <h2>Gestión de Pedidos</h2>
                        <p>Contenido de pedidos múltiples en desarrollo...</p>
                    </div>
                );
            case 'centros_trabajo':
                return <CenterManagement user={user} />;
            default:
                return (
                    <div style={{ padding: '24px' }}>
                        <h2>Recurso no encontrado</h2>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Barra de navegación superior compartiendo estados */}
            <Navbar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                user={user} 
                onLogout={onLogout} 
            />

            {/* Renderizado del módulo de negocio correspondiente */}
            <div className="dashboard-content">
                <div className="tab-fade-in" key={activeTab}>
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;