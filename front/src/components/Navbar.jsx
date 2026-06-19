import React from 'react';
import '../css/Navbar.css';

const Navbar = ({ activeTab, setActiveTab, user, onLogout, isOpen, onClose }) => {
    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* Cabecera del Sidebar con Perfil de Usuario */}
            <div className="sidebar-profile">
                <div className="avatar-circle">
                    <svg className="avatar-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>
                <span className="profile-name">
                    {user?.nombre || user?.name || 'Usuario'}
                </span>
                <button className="sidebar-close-btn" onClick={onClose} aria-label="Cerrar menú">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* Menú de Navegación Vertical */}
            <ul className="sidebar-menu">
                {(user?.rol === 'admin' || user?.rol === 'super_admin') && (
                    <li className="menu-item-wrapper">
                        <button 
                            className={`sidebar-item ${activeTab === 'productos' ? 'active' : ''}`}
                            onClick={() => setActiveTab('productos')}
                        >
                            <span className="menu-icon icon-productos">
                                {/* Icono de Caja/Paquete */}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                    <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                            </span>
                            <span className="menu-label">Productos</span>
                        </button>
                    </li>
                )}
                <li className="menu-item-wrapper">
                    <button 
                        className={`sidebar-item ${activeTab === 'pedidos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pedidos')}
                    >
                        <span className="menu-icon icon-pedidos">
                            {/* Icono de Portapapeles/Pedidos */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                                <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
                                <path d="M9 14h6" />
                                <path d="M9 10h6" />
                                <path d="M9 18h6" />
                            </svg>
                        </span>
                        <span className="menu-label">Pedidos</span>
                    </button>
                </li>
                {(user?.rol === 'admin' || user?.rol === 'super_admin') && (
                    <li className="menu-item-wrapper">
                        <button 
                            className={`sidebar-item ${activeTab === 'centros_trabajo' ? 'active' : ''}`}
                            onClick={() => setActiveTab('centros_trabajo')}
                        >
                            <span className="menu-icon icon-centros">
                                {/* Icono de Edificio */}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 21h18" />
                                    <path d="M9 21V9a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v12" />
                                    <path d="M5 21V7a2 2 0 0 1 2-2h2" />
                                    <path d="M19 21V5a2 2 0 0 0-2-2H7" />
                                </svg>
                            </span>
                            <span className="menu-label">Centros</span>
                        </button>
                    </li>
                )}
                {(user?.rol === 'admin' || user?.rol === 'super_admin') && (
                    <li className="menu-item-wrapper">
                        <button 
                            className={`sidebar-item ${activeTab === 'dar_de_alta' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dar_de_alta')}
                        >
                            <span className="menu-icon icon-alta">
                                {/* Icono de Usuario con un + */}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="22" y1="11" x2="16" y2="11" />
                                </svg>
                            </span>
                            <span className="menu-label">Dar de alta</span>
                        </button>
                    </li>
                )}
                {user?.rol === 'super_admin' && (
                    <li className="menu-item-wrapper">
                        <button 
                            className={`sidebar-item ${activeTab === 'control_panel' ? 'active' : ''}`}
                            onClick={() => setActiveTab('control_panel')}
                        >
                            <span className="menu-icon icon-control">
                                {/* Icono de Grid/Dashboard */}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="9" />
                                    <rect x="14" y="3" width="7" height="5" />
                                    <rect x="14" y="12" width="7" height="9" />
                                    <rect x="3" y="16" width="7" height="5" />
                                </svg>
                            </span>
                            <span className="menu-label">Control</span>
                        </button>
                    </li>
                )}
            </ul>

            {/* Botón de Logout en la parte inferior */}
            <div className="sidebar-footer">
                <button className="btn-logout" onClick={onLogout}>
                    <svg className="logout-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Navbar;
 