import React, { useState, useEffect } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { userService, productService, orderService, centerService } from '../services/api';
import Modal from '../components/Modal';
import '../css/ControlPanel.css';

const ControlPanel = () => {
    const activeUser = JSON.parse(localStorage.getItem('user'));
    
    // Si no es super administrador, redirigir
    if (!activeUser || activeUser.rol !== 'super_admin') {
        return <Navigate to="/dashboard/productos" replace />;
    }

    // Intentar leer del contexto centralizado
    const context = useOutletContext();
    const usersFromContext = context?.users;
    const productsFromContext = context?.products;
    const ordersFromContext = context?.orders;
    const centersFromContext = context?.centers;
    const loadAllDataFromContext = context?.loadAllData;

    const [users, setUsers] = useState(usersFromContext || []);
    const [pendingChanges, setPendingChanges] = useState({});
    const [stats, setStats] = useState({
        usersCount: usersFromContext ? usersFromContext.length : 0,
        productsCount: productsFromContext ? productsFromContext.length : 0,
        ordersCount: ordersFromContext ? ordersFromContext.length : 0,
        centersCount: centersFromContext ? centersFromContext.length : 0
    });
    
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(6);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: 'Atención', message: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null });
    const [editModal, setEditModal] = useState({ isOpen: false, user: null });
    const [editForm, setEditForm] = useState({
        nombre: '',
        email: '',
        rol: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const showAlert = (message, title = 'Atención') => {
        setAlertModal({ isOpen: true, title, message });
    };

    // Sincronizar el estado local si el contexto cambia
    useEffect(() => {
        if (usersFromContext) {
            setUsers(usersFromContext);
            setStats({
                usersCount: usersFromContext.length,
                productsCount: productsFromContext ? productsFromContext.length : 0,
                ordersCount: ordersFromContext ? ordersFromContext.length : 0,
                centersCount: centersFromContext ? centersFromContext.length : 0
            });
        }
    }, [usersFromContext, productsFromContext, ordersFromContext, centersFromContext]);

    const loadData = async () => {
        if (loadAllDataFromContext) {
            await loadAllDataFromContext();
        } else {
            setLoading(true);
            try {
                const [usersRes, productsRes, ordersRes, centersRes] = await Promise.all([
                    userService.getAll(),
                    productService.getAll(),
                    orderService.getAll(),
                    centerService.getAll()
                ]);

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
        }
    };

    useEffect(() => {
        if (!usersFromContext) {
            loadData();
        }
    }, []);

    const handleRoleChange = (userId, newRole) => {
        setPendingChanges(prev => ({
            ...prev,
            [userId]: newRole
        }));
    };

    const handleSaveChanges = async () => {
        const changesKeys = Object.keys(pendingChanges);
        if (changesKeys.length === 0) return;

        // Validar si el Super Administrador se despromueve a sí mismo y queda 0 super admins
        let finalSuperAdminsCount = users.filter(u => u.rol === 'super_admin').length;
        changesKeys.forEach(userId => {
            const origUser = users.find(u => u.id_user === Number(userId));
            const newRole = pendingChanges[userId];
            if (origUser.rol === 'super_admin' && newRole !== 'super_admin') {
                finalSuperAdminsCount--;
            } else if (origUser.rol !== 'super_admin' && newRole === 'super_admin') {
                finalSuperAdminsCount++;
            }
        });

        if (finalSuperAdminsCount === 0) {
            showAlert("No puedes guardar los cambios porque el sistema debe tener al menos un Super Administrador activo.", "Acción Bloqueada");
            return;
        }

        setLoading(true);
        try {
            // Enviar todos los cambios en paralelo al servidor
            const promises = changesKeys.map(userId => 
                userService.updateRole(Number(userId), pendingChanges[userId])
            );

            await Promise.all(promises);

            // Si cambiamos nuestro propio rol, y ya no es super_admin, se detectará al recargar o actualizar
            const myNewRole = pendingChanges[activeUser.id_user];
            if (myNewRole && myNewRole !== activeUser.rol) {
                const updatedUser = { ...activeUser, rol: myNewRole, role: myNewRole };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                window.location.reload();
                return;
            }
            // Actualizar el estado local de usuarios con los cambios guardados
            setUsers(prevUsers => prevUsers.map(u => {
                if (pendingChanges[u.id_user] !== undefined) {
                    return { ...u, rol: pendingChanges[u.id_user] };
                }
                return u;
            }));

            setPendingChanges({});
            showAlert("Los cambios se han guardado correctamente.", "Éxito");
            loadData();
        } catch (err) {
            console.error("Error al guardar cambios de roles:", err);
            showAlert("Ocurrió un error al intentar guardar los cambios de roles en el servidor.", "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveUser = async (userId) => {
        setLoading(true);
        try {
            await userService.approve(userId);
            // Actualizar localmente el estado del usuario a activo
            setUsers(prevUsers => prevUsers.map(u => {
                if (u.id_user === userId) {
                    return { ...u, estado: 'activo' };
                }
                return u;
            }));
            showAlert("Usuario aprobado correctamente.", "Éxito");
        } catch (err) {
            console.error("Error al aprobar usuario:", err);
            showAlert("Ocurrió un error al intentar aprobar al usuario.", "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleRejectUser = async (userId) => {
        setLoading(true);
        try {
            await userService.reject(userId);
            // Actualizar localmente el estado del usuario a rechazado
            setUsers(prevUsers => prevUsers.map(u => {
                if (u.id_user === userId) {
                    return { ...u, estado: 'rechazado' };
                }
                return u;
            }));
            showAlert("Usuario rechazado correctamente.", "Éxito");
        } catch (err) {
            console.error("Error al rechazar usuario:", err);
            showAlert("Ocurrió un error al intentar rechazar al usuario.", "Error");
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteUser = (user) => {
        setConfirmModal({ isOpen: true, user });
    };

    const handleDeleteUser = async (userId) => {
        setConfirmModal({ isOpen: false, user: null });
        setLoading(true);
        try {
            const res = await userService.delete(userId);
            if (res.data && res.data.success) {
                setUsers(prevUsers => prevUsers.filter(u => u.id_user !== userId));
                showAlert("Usuario eliminado correctamente.", "Éxito");
            } else {
                showAlert(res.data.message || "No se pudo eliminar al usuario.", "Error");
            }
        } catch (err) {
            console.error("Error al eliminar usuario:", err);
            const errMsg = err.response?.data?.message || "Ocurrió un error al intentar eliminar al usuario.";
            showAlert(errMsg, "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = (user) => {
        setEditModal({ isOpen: true, user });
        setEditForm({
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            password: ''
        });
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editForm.nombre.trim() || !editForm.email.trim()) {
            showAlert("Nombre y Email son campos obligatorios.", "Advertencia");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                id_user: editModal.user.id_user,
                nombre: editForm.nombre,
                email: editForm.email,
                rol: editForm.rol
            };
            if (editForm.password) {
                payload.password = editForm.password;
            }

            const res = await userService.update(payload);
            if (res.data && res.data.success) {
                // Actualizar la lista local
                setUsers(prevUsers => prevUsers.map(u => {
                    if (u.id_user === editModal.user.id_user) {
                        return { 
                            ...u, 
                            nombre: editForm.nombre, 
                            email: editForm.email, 
                            rol: editForm.rol 
                        };
                    }
                    return u;
                }));

                // Si editamos nuestro propio usuario, actualizar localStorage
                if (editModal.user.id_user === activeUser.id_user) {
                    const updatedUser = { 
                        ...activeUser, 
                        nombre: editForm.nombre, 
                        name: editForm.nombre,
                        email: editForm.email,
                        rol: editForm.rol,
                        role: editForm.rol
                    };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    
                    // Si cambiamos nuestro propio rol a algo diferente de super_admin, recargar para redirigir
                    if (editForm.rol !== 'super_admin') {
                        window.location.reload();
                        return;
                    }
                }

                setEditModal({ isOpen: false, user: null });
                showAlert("Usuario actualizado correctamente.", "Éxito");
            } else {
                showAlert(res.data.message || "No se pudo actualizar el usuario.", "Error");
            }
        } catch (err) {
            console.error("Error al actualizar usuario:", err);
            const errMsg = err.response?.data?.message || "Ocurrió un error al intentar actualizar al usuario.";
            showAlert(errMsg, "Error");
        } finally {
            setLoading(false);
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
                    <button 
                        className="btn-save-roles" 
                        onClick={handleSaveChanges} 
                        disabled={loading || Object.keys(pendingChanges).length === 0}
                    >
                        <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                        </svg>
                        <span>Guardar Cambios</span>
                    </button>
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
                            <th>Estado</th>
                            <th>Fecha de Registro</th>
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRecords.map((u) => {
                            const currentRole = pendingChanges[u.id_user] !== undefined ? pendingChanges[u.id_user] : u.rol;
                            return (
                                <tr key={u.id_user}>
                                    <td className="cell-id"># {u.id_user}</td>
                                    <td className="cell-nombre">{u.nombre}</td>
                                    <td className="cell-email">{u.email}</td>
                                    <td className="cell-role-select">
                                        <select
                                            value={currentRole}
                                            onChange={(e) => handleRoleChange(u.id_user, e.target.value)}
                                            className={`role-select badge-role-${currentRole}`}
                                        >
                                            <option value="super_admin">Super Administrador</option>
                                            <option value="admin">Administrador</option>
                                            <option value="usuario">Usuario</option>
                                        </select>
                                    </td>
                                    <td className="cell-estado-actions">
                                        {u.estado === 'pendiente' ? (
                                            <div className="status-actions-container">
                                                <span className="badge-status badge-status-pendiente">Pendiente</span>
                                                <button 
                                                    className="btn-approve-user"
                                                    onClick={() => handleApproveUser(u.id_user)}
                                                    title="Aprobar Usuario"
                                                    disabled={loading}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    <span>Aceptar</span>
                                                </button>
                                                <button 
                                                    className="btn-reject-user"
                                                    onClick={() => handleRejectUser(u.id_user)}
                                                    title="Rechazar Usuario"
                                                    disabled={loading}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                    <span>Rechazar</span>
                                                </button>
                                            </div>
                                        ) : u.estado === 'rechazado' ? (
                                            <div className="status-actions-container">
                                                <span className="badge-status badge-status-rechazado">Rechazado</span>
                                                <button 
                                                    className="btn-approve-user"
                                                    onClick={() => handleApproveUser(u.id_user)}
                                                    title="Aprobar Usuario"
                                                    disabled={loading}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    <span>Aceptar</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="badge-status badge-status-activo">Activo</span>
                                        )}
                                    </td>
                                    <td className="cell-date">{formatDate(u.fecha_creacion)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button 
                                                className="btn-edit-user"
                                                onClick={() => handleOpenEdit(u)}
                                                title="Editar Usuario"
                                                disabled={loading}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button 
                                                className="btn-delete-user"
                                                onClick={() => confirmDeleteUser(u)}
                                                title="Eliminar Usuario"
                                                disabled={loading || u.id_user === activeUser.id_user}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {currentRecords.length === 0 && (
                            <tr>
                                <td colSpan="7" className="table-empty">
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

            {/* Modal de Confirmación de Eliminación */}
            <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, user: null })} title="Confirmar Eliminación">
                <div style={{ textAlign: 'left', padding: '10px 0' }}>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text)' }}>
                        ¿Estás seguro de que deseas eliminar al usuario <strong>{confirmModal.user?.nombre}</strong> ({confirmModal.user?.email}) del sistema? Esta acción no se puede deshacer y eliminará permanentemente la cuenta.
                    </p>
                    <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-cancel" onClick={() => setConfirmModal({ isOpen: false, user: null })} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Cancelar
                        </button>
                        <button type="button" className="btn-submit" onClick={() => handleDeleteUser(confirmModal.user?.id_user)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Edición de Usuario */}
            <Modal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, user: null })} title="Editar Usuario">
                <form onSubmit={handleUpdateUser} style={{ textAlign: 'left', padding: '10px 0' }}>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#475569', textTransform: 'uppercase' }}>Nombre Completo</label>
                        <input
                            type="text"
                            value={editForm.nombre}
                            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                            style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#475569', textTransform: 'uppercase' }}>Correo Electrónico</label>
                        <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#475569', textTransform: 'uppercase' }}>Rol Asignado</label>
                        <select
                            value={editForm.rol}
                            onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
                            style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '6px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
                            required
                        >
                            <option value="super_admin">Super Administrador</option>
                            <option value="admin">Administrador</option>
                            <option value="usuario">Usuario (Operario)</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#475569', textTransform: 'uppercase' }}>Nueva Contraseña (Opcional)</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Dejar vacío para mantener la actual"
                                value={editForm.password}
                                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                style={{ width: '100%', height: '38px', padding: '0 40px 0 12px', borderRadius: '6px', border: '1px solid var(--border)', boxSizing: 'border-box' }}
                            />
                            <span 
                                className="password-toggle-icon"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
                            >
                                {showPassword ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="form-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn-cancel" onClick={() => setEditModal({ isOpen: false, user: null })} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {loading ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ControlPanel;
