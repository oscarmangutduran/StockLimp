import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { userService, productService, orderService, centerService } from '../services/api';
import Modal from '../components/Modal';
import '../css/ControlPanel.css';

const ControlPanel = () => {
    const activeUser = JSON.parse(localStorage.getItem('user'));
    
    // Si no es super administrador, redirigir
    if (!activeUser || activeUser.rol !== 'super_admin') {
        return <Navigate to="/dashboard/productos" replace />;
    }

    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        usersCount: 0,
        productsCount: 0,
        ordersCount: 0,
        centersCount: 0
    });
    
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(6);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: 'Atención', message: '' });
    const showAlert = (message, title = 'Atención') => {
        setAlertModal({ isOpen: true, title, message });
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const usersRes = await userService.getAll();
            const productsRes = await productService.getAll();
            const ordersRes = await orderService.getAll();
            const centersRes = await centerService.getAll();

            if (Array.isArray(usersRes.data)) {
                setUsers(usersRes.data);
                setStats({
                    usersCount: usersRes.data.length,
                    productsCount: Array.isArray(productsRes.data) ? productsRes.data.length : 0,
                    ordersCount: Array.isArray(ordersRes.data) ? ordersRes.data.length : 0,
                    centersCount: Array.isArray(centersRes.data) ? centersRes.data.length : 0
                });
            }
        } catch (err) {
            console.error("Error al cargar datos del panel:", err);
            showAlert("Ocurrió un error al cargar la información del panel.", "Error de Conexión");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            // Evitar que el Super Administrador se despromueva a sí mismo accidentalmente si es el único
            if (userId === activeUser.id_user && newRole !== 'super_admin') {
                const superAdmins = users.filter(u => u.rol === 'super_admin');
                if (superAdmins.length <= 1) {
                    showAlert("No puedes quitarte el rol de Super Administrador porque eres el único en el sistema.", "Acción Bloqueada");
                    return;
                }
            }

            const res = await userService.updateRole(userId, newRole);
            if (res.data && res.data.success) {
                // Si cambiamos nuestro propio rol, actualizar localStorage
                if (userId === activeUser.id_user) {
                    const updatedUser = { ...activeUser, rol: newRole, role: newRole };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    // Recargar página para aplicar cambios de seguridad
                    window.location.reload();
                } else {
                    loadData();
                }
            } else {
                showAlert("No se pudo actualizar el rol del usuario.", "Error");
            }
        } catch (err) {
            console.error("Error al actualizar rol:", err);
            showAlert("Ocurrió un error en el servidor al intentar cambiar el rol.", "Error");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return dateStr.split(' ')[0]; // Retorna solo YYYY-MM-DD
    };

    // Filtrado de usuarios
    const filteredUsers = users.filter(u => {
        const query = searchTerm.toLowerCase();
        return (
            u.id_user.toString().includes(query) ||
            u.nombre.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.rol.toLowerCase().includes(query)
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, recordsPerPage]);

    // Paginación
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredUsers.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredUsers.length / recordsPerPage);

    return (
        <div className="control-panel-container">
            {/* Cabecera */}
            <div className="control-panel-header">
                <h1 className="control-panel-title">PANEL DE CONTROL</h1>
                <div className="control-panel-header-actions">
                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar usuarios..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Grid de Estadísticas */}
            <div className="stats-grid">
                <div className="stat-card card-users">
                    <div className="stat-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.usersCount}</span>
                        <span className="stat-label">Usuarios Registrados</span>
                    </div>
                </div>

                <div className="stat-card card-products">
                    <div className="stat-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.productsCount}</span>
                        <span className="stat-label">Productos en Inventario</span>
                    </div>
                </div>

                <div className="stat-card card-orders">
                    <div className="stat-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.ordersCount}</span>
                        <span className="stat-label">Pedidos Realizados</span>
                    </div>
                </div>

                <div className="stat-card card-centers">
                    <div className="stat-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18" />
                            <path d="M9 21V9a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v12" />
                            <path d="M5 21V7a2 2 0 0 1 2-2h2" />
                            <path d="M19 21V5a2 2 0 0 0-2-2H7" />
                        </svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.centersCount}</span>
                        <span className="stat-label">Centros de Trabajo</span>
                    </div>
                </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="table-card">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID Usuario</th>
                            <th>Nombre Completo</th>
                            <th>Correo Electrónico</th>
                            <th>Rol Asignado</th>
                            <th>Fecha de Registro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRecords.map((u) => (
                            <tr key={u.id_user}>
                                <td className="cell-id"># {u.id_user}</td>
                                <td className="cell-nombre">{u.nombre}</td>
                                <td className="cell-email">{u.email}</td>
                                <td className="cell-role-select">
                                    <select
                                        value={u.rol}
                                        onChange={(e) => handleRoleChange(u.id_user, e.target.value)}
                                        className={`role-select badge-role-${u.rol}`}
                                    >
                                        <option value="super_admin">Super Administrador</option>
                                        <option value="admin">Administrador</option>
                                        <option value="usuario">Usuario</option>
                                    </select>
                                </td>
                                <td className="cell-date">{formatDate(u.fecha_creacion)}</td>
                            </tr>
                        ))}
                        {currentRecords.length === 0 && (
                            <tr>
                                <td colSpan="5" className="table-empty">
                                    No se encontraron usuarios en la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="pagination-container">
                <div className="pagination-limit-selector">
                    <label htmlFor="limit-select">Registros por página:</label>
                    <select 
                        id="limit-select" 
                        value={recordsPerPage} 
                        onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                        className="limit-dropdown"
                    >
                        <option value={3}>3</option>
                        <option value={6}>6</option>
                        <option value={9}>9</option>
                    </select>
                    <span className="pagination-info">
                        ({currentRecords.length} registros)
                    </span>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-pages">
                        <button 
                            className="pagination-btn" 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                        <button 
                            className="pagination-btn" 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="footer-container">
                <div className="footer-copyright">© 2026 StockLimp. Todos los derechos reservados.</div>
            </footer>

            {/* Modal de Alerta */}
            <Modal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ ...alertModal, isOpen: false })} title={alertModal.title}>
                <div style={{ textAlign: 'left', padding: '10px 0' }}>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text)' }}>
                        {alertModal.message}
                    </p>
                    <div className="form-actions" style={{ marginTop: '24px' }}>
                        <button type="button" className="btn-submit" onClick={() => setAlertModal({ ...alertModal, isOpen: false })}>
                            Aceptar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ControlPanel;
