import React from 'react';
import '../css/Navbar.css';

const Navbar = ({ activeTab, setActiveTab, user, onLogout }) => {
    return (
        <nav className="navbar">
            {/* Logotipo o Marca del Software */}
            <div className="navbar-brand">
                STOCKLIMP
            </div>

            {/* Menú Dinámico de Navegación (Pestañas) */}
            <ul className="navbar-menu">
                <li>
                    <button 
                        className={`navbar-item ${activeTab === 'productos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('productos')}
                    >
                        Productos
                    </button>
                </li>
                <li>
                    <button 
                        className={`navbar-item ${activeTab === 'pedidos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pedidos')}
                    >
                        Pedidos
                    </button>
                </li>
                <li>
                    <button 
                        className={`navbar-item ${activeTab === 'centros_trabajo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('centros_trabajo')}
                    >
                        Centros de Trabajo
                    </button>
                </li>
            </ul>

            {/* Información del Usuario de la sesión e interactividad */}
            <div className="navbar-user">
                <div className="user-info">
                    <span className="user-name">{user?.nombre || 'Usuario'}</span>
                    <span className="user-rol">{user?.rol || 'Operario'}</span>
                </div>
                <button className="btn-logout" onClick={onLogout}>
                    Salir
                </button>
            </div>
        </nav>
    );
};

export default Navbar; 